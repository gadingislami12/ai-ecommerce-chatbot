'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

const LOCAL_STORAGE_KEY = 'auracart-cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage once on mount and listen for updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing cart items', e);
        }
      }
    }

    const handleCartUpdate = () => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing updated cart', e);
        }
      } else {
        setCart([]);
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;
    
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const newCart = [...cart];

    if (existingIndex > -1) {
      const newQty = newCart[existingIndex].quantity + quantity;
      // Cap at stock limit
      newCart[existingIndex].quantity = Math.min(newQty, product.stock);
    } else {
      newCart.push({ product, quantity: Math.min(quantity, product.stock) });
    }

    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.product.id !== productId);
    saveCart(newCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === productId);
    if (existingIndex > -1) {
      const product = cart[existingIndex].product;
      const newCart = [...cart];
      newCart[existingIndex].quantity = Math.min(quantity, product.stock);
      saveCart(newCart);
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
  };
}
