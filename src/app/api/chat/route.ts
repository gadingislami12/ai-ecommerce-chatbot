import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChatbotResponse, generateEmbedding } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId in request' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Find or create the conversation session in Supabase
    const { data: conversation, error: convSelectError } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (convSelectError) {
      console.error('Error selecting conversation:', convSelectError);
      throw convSelectError;
    }

    let activeConversation = conversation;

    if (!activeConversation) {
      const { data: newConv, error: convInsertError } = await supabase
        .from('conversations')
        .insert([{ session_id: sessionId }])
        .select('id')
        .single();

      if (convInsertError) {
        console.error('Error inserting conversation:', convInsertError);
        throw convInsertError;
      }
      activeConversation = newConv;
    }

    const conversationId = activeConversation.id;

    // 2. Fetch previous message history
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      throw historyError;
    }

    // 3. Retrieve relevant context using Semantic Search (RAG)
    let products: any[] = [];
    let knowledge: any[] = [];
    let vectorSearchSuccess = false;
    let cachedAnswer: string | null = null;
    let userEmbedding: number[] | null = null;

    try {
      // Generate user message embedding
      userEmbedding = await generateEmbedding(message);

      // Perform semantic search for products
      const { data: rpcProducts, error: prodRpcError } = await supabase.rpc('match_products', {
        query_embedding: userEmbedding,
        match_threshold: 0.2,
        match_count: 5, // Retrieve top 5 most relevant products
        category_filter: 'All'
      });

      // Perform semantic search for custom knowledge Q&A
      const { data: rpcKnowledge, error: knowRpcError } = await supabase.rpc('match_knowledge', {
        query_embedding: userEmbedding,
        match_threshold: 0.2,
        match_count: 3 // Retrieve top 3 most relevant Q&A
      });

      if (!prodRpcError && rpcProducts) {
        products = rpcProducts;
        vectorSearchSuccess = true;
      }
      
      if (!knowRpcError && rpcKnowledge) {
        knowledge = rpcKnowledge;
        // Check for cache hit (highly similar previous user question)
        if (rpcKnowledge.length > 0 && rpcKnowledge[0].similarity >= 0.96) {
          cachedAnswer = rpcKnowledge[0].answer;
          console.log(`[Cache Hit] Similarity: ${rpcKnowledge[0].similarity.toFixed(4)}. Bypassing Gemini API.`);
        }
      }
    } catch (vectorSearchError) {
      console.warn('Vector search failed during chat. Falling back to full product catalog. Error:', vectorSearchError);
    }

    let aiReply = '';

    if (cachedAnswer) {
      aiReply = cachedAnswer;
    } else {
      // Fallback: If vector search failed or returned no products, load full product catalog (default logic)
      if (!vectorSearchSuccess || products.length === 0) {
        const { data: allProducts, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) {
          console.error('Error fetching fallback products catalog:', productsError);
          throw productsError;
        }
        products = allProducts || [];
      }

      // 4. Generate AI response using Gemini API with RAG context
      aiReply = await generateChatbotResponse(
        message,
        history || [],
        products,
        knowledge
      );

      // Save to cache (chatbot_knowledge table) for future learning if Gemini generated it
      if (userEmbedding) {
        try {
          await supabase.from('chatbot_knowledge').insert([
            {
              question: message,
              answer: aiReply,
              embedding: userEmbedding
            }
          ]);
          console.log(`[Cache Saved] Saved new Q&A to database for future chatbot learning.`);
        } catch (saveCacheErr) {
          console.warn('Failed to save learning Q&A to database:', saveCacheErr);
        }
      }
    }

    // 5. Save user message and AI response to Supabase messages table
    const { error: saveUserMsgError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message,
        },
      ]);

    if (saveUserMsgError) {
      console.error('Error saving user message:', saveUserMsgError);
    }

    const { error: saveAiMsgError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: aiReply,
        },
      ]);

    if (saveAiMsgError) {
      console.error('Error saving AI message:', saveAiMsgError);
    }

    // 6. Return response
    return NextResponse.json({ reply: aiReply });
  } catch (err: unknown) {
    console.error('API Error (POST chat):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
