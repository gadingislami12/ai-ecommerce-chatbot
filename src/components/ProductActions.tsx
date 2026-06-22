'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types';
import { ShoppingCart, Check, CreditCard } from 'lucide-react';

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handlePurchaseNow = () => {
    addToCart(product);
    router.push('/checkout');
  };

  if (product.stock <= 0) {
    return (
      <button
        disabled
        className="w-full rounded-2xl bg-slate-800 py-3.5 text-sm font-semibold text-slate-500 cursor-not-allowed border border-white/5"
      >
        Unavailable (Out of Stock)
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <button
        onClick={handleAddToCart}
        className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.99] flex items-center justify-center space-x-2"
      >
        {added ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">Added to Cart!</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 text-indigo-400" />
            <span>Add to Cart</span>
          </>
        )}
      </button>
      
      <button
        onClick={handlePurchaseNow}
        className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
      >
        <CreditCard className="h-4 w-4" />
        <span>Purchase Now</span>
      </button>
    </div>
  );
}
