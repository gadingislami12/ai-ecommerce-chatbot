'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductService } from '@/services/productService';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Search, Filter, RefreshCw, Layers } from 'lucide-react';

export default function Storefront() {
  const supabase = createClient();
  // Memoize productService to prevent unnecessary re-creation and dependency alerts
  const productService = useMemo(() => new ProductService(supabase), [supabase]);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreData = useCallback(async (cat: string, search: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await productService.searchProducts(search, cat);
      if (fetchErr) throw fetchErr;
      setProducts(data || []);
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not load products. Please check your connection.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [productService]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await productService.getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, [productService]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStoreData(selectedCategory, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedCategory, searchQuery, fetchStoreData]);

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950 px-6 py-16 sm:py-24 lg:px-8 border-b border-white/5">
        <div className="mx-auto max-w-2xl text-center relative z-10">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-6">
            <span>✨ Welcome to AuraCart</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Elevate Your Shopping Experience
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-400">
            Browse our curated selection of high-quality products. Ask our AI Assistant below for recommendations or support at any time.
          </p>
        </div>
        {/* Decorative glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 left-1/3 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-8">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold backdrop-blur-sm transition-all ${
                selectedCategory === 'All'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Products</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="my-12 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => fetchStoreData(selectedCategory, searchQuery)}
              className="mt-4 inline-flex items-center space-x-1.5 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-5 space-y-4 animate-pulse">
                <div className="aspect-square w-full rounded-xl bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-800" />
                <div className="h-3 w-5/6 rounded bg-slate-800" />
                <div className="h-8 w-full rounded-xl bg-slate-800 pt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            {products.length === 0 ? (
              <div className="my-20 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400">
                  <Filter className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">No products found</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search terms or selecting a different category.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
