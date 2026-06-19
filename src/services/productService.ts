import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@/types';

export class ProductService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // Get all products
  async getAllProducts(): Promise<{ data: Product[] | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  }

  // Search/Filter products
  async searchProducts(query?: string, category?: string): Promise<{ data: Product[] | null; error: unknown }> {
    let selectQuery = this.supabase.from('products').select('*');

    if (query) {
      selectQuery = selectQuery.ilike('name', `%${query}%`);
    }

    if (category && category !== 'All') {
      selectQuery = selectQuery.eq('category', category);
    }

    const { data, error } = await selectQuery.order('created_at', { ascending: false });
    return { data, error };
  }

  // Get single product
  async getProductById(id: string): Promise<{ data: Product | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  // Create product
  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<{ data: Product | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    return { data, error };
  }

  // Update product
  async updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<{ data: Product | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  // Delete product
  async deleteProduct(id: string): Promise<{ error: unknown }> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    return { error };
  }

  // Get categories list
  async getCategories(): Promise<{ data: string[] | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('products')
      .select('category');

    if (error) return { data: null, error };

    // Get unique categories
    const categories = Array.from(
      new Set((data || []).map((p) => (p as { category: string }).category))
    );
    return { data: categories, error: null };
  }
}
