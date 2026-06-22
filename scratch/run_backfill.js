const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

// Parse .env.local manually
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
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text,
      config: {
        outputDimensionality: 768
      }
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error('Failed to generate embedding: empty values returned.');
    }

    return response.embeddings[0].values;
  } catch (err) {
    console.error(`Gemini API Error for text "${text.substring(0, 30)}...":`, err.message);
    throw err;
  }
}

async function run() {
  console.log('Starting backfill...');
  
  // 1. Fetch products
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*');

  if (prodErr) {
    console.error('Error fetching products:', prodErr);
    return;
  }

  console.log(`Fetched ${products.length} products. Checking embeddings...`);
  
  let productsUpdatedCount = 0;
  for (const product of products) {
    if (!product.embedding) {
      console.log(`Generating embedding for: ${product.name}`);
      try {
        const textToEmbed = `${product.name} - ${product.category}. ${product.description}`;
        const embedding = await generateEmbedding(textToEmbed);
        
        console.log(`Vektor generated (${embedding.length} dimensions). Saving to DB...`);
        const { error: updateErr } = await supabase
          .from('products')
          .update({ embedding })
          .eq('id', product.id);

        if (updateErr) {
          console.error(`Failed to save embedding in DB for "${product.name}":`, updateErr.message || updateErr);
        } else {
          console.log(`Successfully saved embedding for: ${product.name}`);
          productsUpdatedCount++;
        }
      } catch (err) {
        console.error(`Skipping "${product.name}" due to error.`);
      }
    } else {
      console.log(`Product "${product.name}" already has embedding.`);
    }
  }

  console.log(`\nBackfill complete! Updated ${productsUpdatedCount} products.`);
}

run();
