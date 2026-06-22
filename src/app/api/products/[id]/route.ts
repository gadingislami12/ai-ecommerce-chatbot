import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProductService } from '@/services/productService';
import { generateEmbedding } from '@/lib/gemini';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single product
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const productService = new ProductService(supabase);

    const { data, error } = await productService.getProductById(id);

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('API Error (GET product by ID):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PUT update product (Admin protected)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const productService = new ProductService(supabase);

    // Regenerate vector embedding on update if relevant fields are modified
    if (body.name || body.description || body.category) {
      try {
        let name = body.name;
        let category = body.category;
        let description = body.description;

        if (!name || !category || !description) {
          const { data: currentProduct } = await productService.getProductById(id);
          if (currentProduct) {
            name = name || currentProduct.name;
            category = category || currentProduct.category;
            description = description || currentProduct.description;
          }
        }

        const textToEmbed = `${name} - ${category}. ${description}`;
        body.embedding = await generateEmbedding(textToEmbed);
      } catch (embedError) {
        console.warn('Could not update embedding for product:', embedError);
      }
    }

    const { data, error } = await productService.updateProduct(id, body);
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('API Error (PUT product):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// DELETE product (Admin protected)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productService = new ProductService(supabase);
    const { error } = await productService.deleteProduct(id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('API Error (DELETE product):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
