const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function check() {
  try {
    const { data, error } = await supabase.from('products').select('id, name, embedding');
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    console.log('=== DIAGNOSTIC RESULTS ===');
    console.log('Total products:', data.length);
    const withEmbed = data.filter(p => p.embedding !== null);
    console.log('Products with embeddings:', withEmbed.length);
    console.log('Products without embeddings:', data.length - withEmbed.length);
    if (data.length > 0) {
      console.log('Sample product:', {
        id: data[0].id,
        name: data[0].name,
        hasEmbedding: data[0].embedding !== null
      });
    }
  } catch (err) {
    console.error('Execution error:', err);
  }
}

check();
