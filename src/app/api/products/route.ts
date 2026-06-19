import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProductService } from '@/services/productService';

// GET all products
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const productService = new ProductService(supabase);
    
    // Parse search parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;

    const { data, error } = await productService.searchProducts(query, category);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('API Error (GET products):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// POST create a product (Admin protected)
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
    
    const { data, error } = await productService.createProduct(body);
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('API Error (POST products):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
