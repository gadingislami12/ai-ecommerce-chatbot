import { GoogleGenAI } from '@google/genai';
import { Product, Message } from '@/types';

export async function generateChatbotResponse(
  userQuestion: string,
  history: Message[],
  products: Product[],
  knowledge: any[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return a graceful error message during builds or if config is missing
    console.warn('GEMINI_API_KEY environment variable is not defined.');
    return 'Sorry, my AI features are currently offline because the API key is not configured.';
  }

  // Initialize the Gemini API client inside the function
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  // 1. Format product catalog as a clean context block
  const productCatalogText = products
    .map(
      (p) =>
        `- ID: ${p.id}
  Name: ${p.name}
  Description: ${p.description}
  Price: Rp${p.price.toLocaleString('id-ID')}
  Category: ${p.category}
  Stock: ${p.stock > 0 ? `${p.stock} items` : 'OUT OF STOCK'}
  Image Link: ${p.image_url || 'No Image'}`
    )
    .join('\n\n');

  // Format custom knowledge Q&A context block
  const knowledgeContext = knowledge && knowledge.length > 0
    ? knowledge.map((k) => `- Question: ${k.question}\n  Answer: ${k.answer}`).join('\n\n')
    : 'No additional general store policies/information provided.';

  // 2. Define the system instructions for strict behavior
  const systemInstruction = `You are "AuraBot", the AI Sales Assistant for AuraCart.
Your job is to answer customer questions and recommend products based on the product database and store policies/information provided below.

Product Database:
${productCatalogText}

General Store Information (Custom Q&A Policies):
${knowledgeContext}

Rules:
1. Base your answer STRICTLY on the products in the database above and the General Store Information. If a customer asks a general question (e.g. shipping, payment methods like COD, store location, opening hours), use the General Store Information to answer.
2. If the user asks for a product not in the database, politely state that we don't have it in stock and recommend similar items from the list if possible.
3. NEVER make up products, features, prices, or details not present in the database.
4. When recommending products, specify their UUIDs in this format: [RecommendProduct: <uuid>]. Do not put spaces inside the tag. E.g., [RecommendProduct: ${products[0]?.id || 'uuid-here'}]. This is crucial for rendering interactive product cards in our UI.
5. If the user asks for products under/above a certain price, parse the price carefully (especially in Indonesian where 'juta' means million, e.g., '10 juta' = 10,000,000; and 'rb' means thousand, e.g., '500rb' = 500,000). Compare these values numerically with the product prices in the database to recommend matching products.
6. Provide helpful, conversational responses. Keep answers concise.
7. If the user asks a greeting (like hello, hi, how are you), greet them politely and ask how you can help them find products today.`;

  // 3. Map database messages history to Gemini SDK format
  const contents = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userQuestion }],
  });

  try {
    // 4. Generate response using gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature to prevent hallucinations
      },
    });

    const replyText = response.text || '';
    return replyText;
  } catch (err: unknown) {
    console.error('Error generating content from Gemini API:', err);
    throw err;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not defined.');
    throw new Error('GEMINI_API_KEY is not defined.');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error('Failed to generate embedding: empty values returned.');
    }

    return response.embeddings[0].values;
  } catch (err: unknown) {
    console.error('Error generating embedding from Gemini API:', err);
    throw err;
  }
}

