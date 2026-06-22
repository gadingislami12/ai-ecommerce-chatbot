'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Loader2, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount, clearCart } = useCart();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Virtual Account');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    const payload = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      total_amount: cartTotal,
      payment_method: paymentMethod,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order. Please try again.');
      }

      // Success - clear cart and redirect to simulated payment page
      clearCart();
      router.push(`/checkout/payment/${data.orderId}`);
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during checkout.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 mb-6">
          <ShoppingBag className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Your cart is empty</h2>
        <p className="text-slate-400 text-sm max-w-sm text-center mb-8">
          Add some premium items to your cart from our shop catalog to get started with checkout.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:opacity-90"
        >
          Return to Shop
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to catalog</span>
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-7 bg-slate-900 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center space-x-2 border-b border-white/5 pb-3">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              <span>Customer & Shipping Info</span>
            </h2>

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start space-x-2.5">
                <span className="text-xs text-red-300 font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Shipping Address</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, City, Province, Postal Code..."
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'Virtual Account'
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-white/5 bg-slate-950/55 hover:bg-white/5 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="Virtual Account"
                      checked={paymentMethod === 'Virtual Account'}
                      onChange={() => setPaymentMethod('Virtual Account')}
                      className="accent-indigo-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Virtual Account</span>
                      <span className="text-[10px] text-slate-500">Bank Transfer (BCA, Mandiri, BNI)</span>
                    </div>
                  </label>

                  <label className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-white/5 bg-slate-950/55 hover:bg-white/5 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="QRIS"
                      checked={paymentMethod === 'QRIS'}
                      onChange={() => setPaymentMethod('QRIS')}
                      className="accent-indigo-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">QRIS / E-Wallet</span>
                      <span className="text-[10px] text-slate-500">GOPAY, OVO, ShopeePay, Dana</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <span>Proceed to Payment ({formatPrice(cartTotal)})</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Cart Summary Section */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col max-h-[500px]">
              <h2 className="text-base font-bold mb-4 border-b border-white/5 pb-3">
                Order Summary ({cartCount} {cartCount > 1 ? 'items' : 'item'})
              </h2>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-white/5">
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600 animate-pulse">No Image</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{formatPrice(item.product.price)}</p>
                      
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-white font-semibold font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-4 mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Shipping</span>
                  <span className="text-emerald-400 font-semibold uppercase">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white border-t border-white/5 pt-3 mt-2">
                  <span>Total</span>
                  <span className="font-mono bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
