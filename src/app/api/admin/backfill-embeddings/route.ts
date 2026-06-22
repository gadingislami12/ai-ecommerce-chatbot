import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini';
import { ProductService } from '@/services/productService';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productService = new ProductService(supabase);
    
    // 1. Backfill Products
    const { data: products, error: prodErr } = await productService.getAllProducts();
    if (prodErr) throw prodErr;

    let productsUpdatedCount = 0;
    if (products) {
      for (const product of products) {
        const productWithEmbed = product as { id: string; name: string; category: string; description: string; embedding?: number[] | null };
        // Generate embedding if missing
        if (!productWithEmbed.embedding) {
          try {
            const textToEmbed = `${product.name} - ${product.category}. ${product.description}`;
            const embedding = await generateEmbedding(textToEmbed);
            
            const { error: updateErr } = await supabase
              .from('products')
              .update({ embedding })
              .eq('id', product.id);

            if (updateErr) {
              console.error(`Failed to save embedding for product ${product.id}:`, updateErr);
            } else {
              productsUpdatedCount++;
            }
          } catch (embedError) {
            console.error(`Failed to embed product ${product.id}:`, embedError);
          }
        }
      }
    }

    // 2. Backfill Chatbot Knowledge
    const { data: knowledgeItems, error: knowErr } = await supabase
      .from('chatbot_knowledge')
      .select('*');

    if (knowErr) throw knowErr;

    let knowledgeUpdatedCount = 0;
    if (knowledgeItems) {
      for (const item of knowledgeItems) {
        const itemWithEmbed = item as { id: string; question: string; embedding?: number[] | null };
        if (!itemWithEmbed.embedding) {
          try {
            const embedding = await generateEmbedding(item.question);
            
            const { error: updateErr } = await supabase
              .from('chatbot_knowledge')
              .update({ embedding })
              .eq('id', item.id);

            if (updateErr) {
              console.error(`Failed to save embedding for knowledge item ${item.id}:`, updateErr);
            } else {
              knowledgeUpdatedCount++;
            }
          } catch (embedError) {
            console.error(`Failed to embed knowledge item ${item.id}:`, embedError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Embedding backfill completed successfully',
      productsUpdated: productsUpdatedCount,
      knowledgeUpdated: knowledgeUpdatedCount,
    });
  } catch (err: unknown) {
    console.error('API Error (POST backfill-embeddings):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
