import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini';

// GET all knowledge items
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chatbot_knowledge')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('API Error (GET knowledge):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// POST create a knowledge item
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    let embedding = null;
    try {
      embedding = await generateEmbedding(question);
    } catch (embedError) {
      console.warn('Could not generate embedding for knowledge item:', embedError);
    }

    const { data, error } = await supabase
      .from('chatbot_knowledge')
      .insert([{ question, answer, embedding }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('API Error (POST knowledge):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PUT update a knowledge item
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, question, answer } = body;

    if (!id || !question || !answer) {
      return NextResponse.json({ error: 'ID, question, and answer are required' }, { status: 400 });
    }

    let embedding = null;
    try {
      embedding = await generateEmbedding(question);
    } catch (embedError) {
      console.warn('Could not regenerate embedding for knowledge item:', embedError);
    }

    const { data, error } = await supabase
      .from('chatbot_knowledge')
      .update({ question, answer, embedding })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('API Error (PUT knowledge):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// DELETE a knowledge item
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('chatbot_knowledge')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('API Error (DELETE knowledge):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
