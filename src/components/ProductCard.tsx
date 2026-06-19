import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Format price to IDR
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500 text-sm">
            No Image
          </div>
        )}
        <div className="absolute top-3 left-3 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
          {product.category}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 flex-1">
          {product.description}
        </p>
        
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Price</span>
            <span className="text-base font-bold text-white">{formattedPrice}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Stock</span>
            {product.stock > 0 ? (
              <span className="text-xs font-semibold text-emerald-400">{product.stock} left</span>
            ) : (
              <span className="text-xs font-semibold text-rose-500">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
