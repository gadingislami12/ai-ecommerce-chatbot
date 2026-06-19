import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChatbotResponse } from '@/lib/gemini';

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

    // 3. Fetch all products from database to feed as context
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.error('Error fetching products catalog:', productsError);
      throw productsError;
    }

    // 4. Generate AI response using Gemini API
    const aiReply = await generateChatbotResponse(message, history || [], products || []);

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
