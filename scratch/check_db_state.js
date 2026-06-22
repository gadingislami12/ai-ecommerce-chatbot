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

async function checkDatabaseState() {
  console.log('Checking remote Supabase database tables and schemas...');
  
  // Check orders table
  const { data: orders, error: ordersErr } = await supabase.from('orders').select('id').limit(1);
  if (ordersErr) {
    console.log('❌ "orders" table does not exist or error occurred:', ordersErr.message);
  } else {
    console.log('✅ "orders" table exists!');
  }

  // Check chatbot_knowledge table
  const { data: knowledge, error: knowErr } = await supabase.from('chatbot_knowledge').select('id').limit(1);
  if (knowErr) {
    console.log('❌ "chatbot_knowledge" table does not exist or error occurred:', knowErr.message);
  } else {
    console.log('✅ "chatbot_knowledge" table exists!');
  }

  // Let's check trigger by testing if we can see functions
  // Standard select on pg_trigger using RPC is usually not available to public.
  // But we can check if orders can be inserted/selected safely.
}

checkDatabaseState();
