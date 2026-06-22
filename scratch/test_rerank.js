const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

// Parse env variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

async function generateEmbedding(text) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768
    }
  });
  return response.embeddings[0].values;
}

function getBigrams(str) {
  const s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bigrams = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.substring(i, i + 2));
  }
  return bigrams;
}

function calculateDiceCoefficient(str1, str2) {
  const b1 = getBigrams(str1);
  const b2 = getBigrams(str2);
  if (b1.size === 0 || b2.size === 0) return 0;
  
  let intersection = 0;
  for (const val of b1) {
    if (b2.has(val)) {
      intersection++;
    }
  }
  return (2 * intersection) / (b1.size + b2.size);
}

function getWordFuzzyScore(productName, query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const productWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length === 0 || productWords.length === 0) return 0;
  
  // Calculate average max score for each query word
  let totalScore = 0;
  for (const qWord of queryWords) {
    let maxWordScore = 0;
    for (const pWord of productWords) {
      const score = calculateDiceCoefficient(qWord, pWord);
      if (score > maxWordScore) {
        maxWordScore = score;
      }
    }
    totalScore += maxWordScore;
  }
  
  return totalScore / queryWords.length;
}

async function testRerank(query) {
  console.log(`\n=== Testing Reranking for: "${query}" ===`);
  const embedding = await generateEmbedding(query);
  
  const { data: matched, error } = await supabase.rpc('match_products', {
    query_embedding: embedding,
    match_threshold: 0.1, // retrieve more items to rerank
    match_count: 10,
    category_filter: 'All'
  });

  if (error) {
    console.error('RPC Error:', error);
    return;
  }

  const reranked = matched.map(p => {
    const fuzzy = getWordFuzzyScore(p.name, query);
    const combined = p.similarity + 0.3 * fuzzy;
    return {
      name: p.name,
      similarity: p.similarity,
      fuzzy: fuzzy,
      combined: combined
    };
  });

  // Sort by combined score descending
  reranked.sort((a, b) => b.combined - a.combined);

  const maxScore = reranked.length > 0 ? reranked[0].combined : 0;
  const filterThreshold = maxScore - 0.15;

  console.log(`Results (Sorted by Combined Score, maxScore: ${maxScore.toFixed(4)}, filterThreshold: ${filterThreshold.toFixed(4)}):`);
  reranked.forEach((p, idx) => {
    const isKept = p.combined >= filterThreshold;
    console.log(`${idx + 1}. [${isKept ? 'KEPT' : 'FILTERED'}] [Combined: ${p.combined.toFixed(4)}] ${p.name}`);
    console.log(`   - Vector Similarity: ${p.similarity.toFixed(4)}`);
    console.log(`   - Word Fuzzy Score:  ${p.fuzzy.toFixed(4)}`);
  });
}

async function run() {
  await testRerank('leptop');
  await testRerank('meja');
  await testRerank('perangkat mengetik');
}

run();
