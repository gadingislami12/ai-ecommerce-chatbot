import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProductService } from '@/services/productService';
import { generateEmbedding } from '@/lib/gemini';

// GET all products (with optional vector search)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const productService = new ProductService(supabase);
    
    // Parse search parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;

    let products = null;
    let error = null;

    if (query) {
      try {
        // Try Vector Search (Semantic Search)
        const embedding = await generateEmbedding(query);
        const { data: matched, error: rpcError } = await supabase.rpc('match_products', {
          query_embedding: embedding,
          match_threshold: 0.2,
          match_count: 24,
          category_filter: category || 'All',
        });

        if (rpcError) throw rpcError;
        products = matched;
      } catch (err) {
        console.warn('Vector search failed or not configured, falling back to text search:', err);
      }
    }

    // Fallback/standard search if vector search wasn't executed, failed, or returned empty
    if (!products) {
      const { data, error: fetchErr } = await productService.searchProducts(query, category);
      if (fetchErr) throw fetchErr;
      products = data;
      error = fetchErr;
    }

    return NextResponse.json(products);
  } catch (err: unknown) {
    console.error('API Error (GET products):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// POST create a product (Admin protected, generate embedding)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const productService = new ProductService(supabase);
    
    // Auto-generate vector embedding on creation
    try {
      const textToEmbed = `${body.name} - ${body.category}. ${body.description}`;
      body.embedding = await generateEmbedding(textToEmbed);
    } catch (embedError) {
      console.warn('Could not generate embedding for new product:', embedError);
    }

    const { data, error } = await productService.createProduct(body);
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('API Error (POST products):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

