'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { ShoppingBag, LayoutDashboard, LogOut, LogIn, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { cartCount } = useCart();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
              <div className="rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 text-white shadow-lg shadow-indigo-500/30">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AuraCart
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Shop
            </Link>

            {/* Cart Button */}
            <Link
              href="/checkout"
              className="relative flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>


            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center space-x-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-400 backdrop-blur-sm transition-all hover:bg-red-500/20 hover:border-red-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Admin Access</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
