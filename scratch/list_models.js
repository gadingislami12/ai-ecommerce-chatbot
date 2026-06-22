const fs = require('fs');
const path = require('path');
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

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

async function run() {
  try {
    console.log('Listing available models for API key...');
    const response = await ai.models.list();
    console.log('=== RAW RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

run();
