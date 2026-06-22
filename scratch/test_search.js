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

async function testSearch(query) {
  console.log(`\nTesting search for query: "${query}"`);
  try {
    const embedding = await generateEmbedding(query);
    console.log(`Generated embedding vector. Querying match_products RPC...`);
    
    const { data: matched, error: rpcError } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      match_threshold: 0.2,
      match_count: 5,
      category_filter: 'All'
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return;
    }

    console.log(`Found ${matched.length} matched products (threshold 0.2):`);
    matched.forEach(p => {
      console.log(`- [${p.similarity.toFixed(4)}] ${p.name} (Stock: ${p.stock}, Price: ${p.price})`);
    });

    // Also run standard search
    console.log(`\nRunning standard Supabase direct query for similarity comparison:`);
    const { data: products, error: prodErr } = await supabase.from('products').select('id, name, embedding');
    if (prodErr) {
      console.error('Error fetching products:', prodErr);
      return;
    }

    // Manual distance calculation
    // Cosine similarity = 1 - Cosine Distance
    // Cosine Distance = 1 - (A . B) / (||A|| ||B||)
    // Wait, pgvector '<=>' is cosine distance.
    // So similarity is 1 - distance.
    const dotProduct = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitude = (a) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const cosineSimilarity = (a, b) => dotProduct(a, b) / (magnitude(a) * magnitude(b));

    const results = products.map(p => {
      const sim = p.embedding ? cosineSimilarity(embedding, p.embedding) : null;
      return { name: p.name, similarity: sim };
    }).sort((a, b) => b.similarity - a.similarity);

    console.log('Manual cosine similarity scores:');
    results.forEach(r => {
      console.log(`- [${r.similarity !== null ? r.similarity.toFixed(4) : 'NULL'}] ${r.name}`);
    });

  } catch (err) {
    console.error('Error in testSearch:', err);
  }
}

async function run() {
  await testSearch('leptop');
  await testSearch('laptop');
}

run();
