'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { createClient } from '@/lib/supabase/client';
import { ProductService } from '@/services/productService';
import { Product } from '@/types';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Bot,
  User as UserIcon,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ChatbotWidget() {
  const { messages, loading, historyLoading, sendMessage, clearChat } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all products on mount to resolve recommendations locally
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient();
        const productService = new ProductService(supabase);
        const { data } = await productService.getAllProducts();
        if (data) {
          const map: Record<string, Product> = {};
          data.forEach((p) => {
            map[p.id] = p;
          });
          setProductsMap(map);
        }
      } catch (err) {
        console.error('Error loading products map in ChatbotWidget:', err);
      }
    };
    fetchProducts();
  }, []);

  // 2. Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    const msg = inputValue;
    setInputValue('');
    await sendMessage(msg);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion);
  };

  // 3. Helper to parse AI text response and render inline product recommendation cards
  const renderMessageContent = (text: string) => {
    // Regex matches [RecommendProduct: <uuid>]
    const regex = /\[RecommendProduct:\s*([a-fA-F0-9-]{36})\]/g;
    
    // Split the text by recommendation tags
    const parts = text.split(regex);
    if (parts.length === 1) {
      return <p className="whitespace-pre-line">{text}</p>;
    }

    const elements: React.ReactNode[] = [];
    let textIndex = 0;

    // For every match, the split array will have the text before, then the group match (UUID), then text after
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Text part
        if (parts[i]) {
          elements.push(
            <p key={`text-${textIndex++}`} className="whitespace-pre-line inline">
              {parts[i]}
            </p>
          );
        }
      } else {
        // Product UUID part
        const productId = parts[i];
        const product = productsMap[productId];

        if (product) {
          const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(product.price);

          elements.push(
            <div
              key={`prod-card-${productId}-${i}`}
              className="my-3 block overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-md hover:border-indigo-500/30 transition-all max-w-[280px]"
            >
              {/* Product Thumbnail */}
              {product.image_url && (
                <div className="relative h-28 w-full bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {/* Content */}
              <div className="p-3 space-y-1.5">
                <span className="inline-block rounded-full bg-indigo-500/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-indigo-400 border border-indigo-500/10">
                  {product.category}
                </span>
                <h4 className="text-[11px] font-bold text-white line-clamp-1">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">{formattedPrice}</span>
                  <Link
                    href={`/products/${product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        }
      }
    }

    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div className={`fixed z-50 flex flex-col items-end transition-all duration-300 ${
      isOpen 
        ? 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6' 
        : 'bottom-6 right-6'
    }`}>
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="mb-0 sm:mb-4 flex h-full sm:h-[500px] w-full sm:w-[400px] flex-col overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-white/10 bg-slate-950 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out select-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900 px-4 py-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-indigo-600/20">
                <Bot className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white">AuraBot</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400">AI Sales Advisor</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={clearChat}
                title="Clear Conversation"
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {historyLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <h3 className="text-xs font-bold text-white">AuraCart Personal Assistant</h3>
                <p className="text-[10px] text-slate-400 max-w-[240px]">
                  Hi! I&apos;m your AI shopping assistant. Ask me questions about catalog items, prices, categories, or request custom recommendations!
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2.5 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg border text-[10px] ${
                      m.role === 'user'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                    }`}
                  >
                    {m.role === 'user' ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-line">{m.content}</p>
                    ) : (
                      renderMessageContent(m.content)
                    )}
                  </div>
                </div>
              ))
            )}

            {/* AI Typing Loader */}
            {loading && (
              <div className="flex items-start space-x-2.5 max-w-[85%]">
                <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg border bg-violet-500/10 border-violet-500/20 text-violet-400 text-[10px]">
                  <Bot className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div className="rounded-2xl px-3.5 py-2.5 text-[11px] bg-slate-900 text-slate-400 border border-white/5 rounded-tl-none flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions if empty or initial conversation */}
          {messages.length < 4 && !loading && (
            <div className="px-4 py-2 border-t border-white/5 bg-slate-950/50 flex flex-wrap gap-1.5 shrink-0 select-none">
              <button
                onClick={() => handleSuggestionClick('What products do you recommend under Rp500,000?')}
                className="text-[9px] font-medium text-slate-400 hover:text-white bg-slate-900 border border-white/5 hover:border-white/10 px-2.5 py-1 rounded-full transition-all"
              >
                Under Rp500,000
              </button>
              <button
                onClick={() => handleSuggestionClick('Which products are currently in stock?')}
                className="text-[9px] font-medium text-slate-400 hover:text-white bg-slate-900 border border-white/5 hover:border-white/10 px-2.5 py-1 rounded-full transition-all"
              >
                In stock items
              </button>
              <button
                onClick={() => handleSuggestionClick('Recommend a gaming laptop.')}
                className="text-[9px] font-medium text-slate-400 hover:text-white bg-slate-900 border border-white/5 hover:border-white/10 px-2.5 py-1 rounded-full transition-all"
              >
                Gaming Laptop
              </button>
            </div>
          )}

          {/* Form Input Footer */}
          <form onSubmit={handleSend} className="border-t border-white/5 bg-slate-900/50 px-4 py-3 shrink-0 flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask AuraBot a product question..."
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 py-2 px-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:opacity-90 active:scale-[0.95] transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 group ${
          isOpen ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
