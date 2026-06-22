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
          match_threshold: 0.1, // Lower threshold to retrieve more candidate items for reranking
          match_count: 24,
          category_filter: category || 'All',
        });

        if (rpcError) throw rpcError;
        products = matched;

        // Apply hybrid fuzzy reranking and dynamic filtering
        if (products && products.length > 0) {
          const getBigrams = (str: string): Set<string> => {
            const s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
            const bigrams = new Set<string>();
            for (let i = 0; i < s.length - 1; i++) {
              bigrams.add(s.substring(i, i + 2));
            }
            return bigrams;
          };

          const calculateDiceCoefficient = (str1: string, str2: string): number => {
            const b1 = getBigrams(str1);
            const b2 = getBigrams(str2);
            if (b1.size === 0 || b2.size === 0) return 0;
            
            let intersection = 0;
            for (const val of b1) {
              if (b2.has(val)) {
                intersection++;
              }
            }
            return (2 * intersection) / (b1.size + b2.size);
          };

          const getWordFuzzyScore = (productName: string, queryStr: string): number => {
            const queryWords = queryStr.toLowerCase().split(/\s+/).filter(w => w.length > 0);
            const productWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 0);
            
            if (queryWords.length === 0 || productWords.length === 0) return 0;
            
            let totalScore = 0;
            for (const qWord of queryWords) {
              let maxWordScore = 0;
              for (const pWord of productWords) {
                const score = calculateDiceCoefficient(qWord, pWord);
                if (score > maxWordScore) {
                  maxWordScore = score;
                }
              }
              totalScore += maxWordScore;
            }
            
            return totalScore / queryWords.length;
          };

          // Calculate combined score
          products = products
            .map((p: any) => {
              const fuzzyScore = getWordFuzzyScore(p.name, query);
              const combinedScore = (p.similarity || 0) + 0.3 * fuzzyScore;
              return { ...p, combinedScore, fuzzyScore };
            })
            .sort((a: any, b: any) => b.combinedScore - a.combinedScore);

          // Apply relative threshold filtering (maxScore - 0.15)
          const maxScore = products.length > 0 ? products[0].combinedScore : 0;
          const filterThreshold = maxScore - 0.15;
          products = products.filter((p: any) => p.combinedScore >= filterThreshold);
        }
      } catch (err) {
        console.warn('Vector search failed or not configured, falling back to text search:', err);
      }
    }

    // Fallback/standard search if vector search wasn't executed, failed, or returned empty
    if (!products || products.length === 0) {
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

