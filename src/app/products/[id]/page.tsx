import { createClient } from '@/lib/supabase/server';
import { ProductService } from '@/services/productService';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Tag, Package } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  const productService = new ProductService(supabase);
  const { data: product, error } = await productService.getProductById(id);

  if (error || !product) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to products</span>
        </Link>

        {/* Product Details Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-900 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Product Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500 text-lg">
                No Image Available
              </div>
            )}
          </div>

          {/* Product Specifications */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category Badge */}
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Tag className="h-3 w-3" />
                <span>{product.category}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {formattedPrice}
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 w-full my-4" />

              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Inventory Status & Actions */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Inventory Status:</span>
                </div>
                {product.stock > 0 ? (
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>In Stock ({product.stock} units available)</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-rose-500 font-semibold text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                {product.stock > 0 ? (
                  <button className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all">
                    Purchase Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-slate-800 py-3.5 text-sm font-semibold text-slate-500 cursor-not-allowed border border-white/5"
                  >
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
