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

async function test() {
  try {
    console.log('Testing gemini-embedding-2 with 768 dimensions...');
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: 'Keyboard Mechanical Keycrhon K2',
      config: {
        outputDimensionality: 768
      }
    });
    
    if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
      console.log('Success!');
      console.log('Vector length:', response.embeddings[0].values.length);
      console.log('Sample values (first 5):', response.embeddings[0].values.slice(0, 5));
    } else {
      console.error('Failed to get embeddings array:', response);
    }
  } catch (err) {
    console.error('API Error:', err);
  }
}

test();
