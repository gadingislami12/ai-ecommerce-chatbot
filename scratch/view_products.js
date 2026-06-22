const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function run() {
  const { data: products, error } = await supabase.from('products').select('name, category, description');
  if (error) {
    console.error(error);
    return;
  }
  products.forEach((p, idx) => {
    console.log(`\nProduct #${idx + 1}:`);
    console.log(`Name:        ${p.name}`);
    console.log(`Category:    ${p.category}`);
    console.log(`Description: ${p.description}`);
  });
}

run();
