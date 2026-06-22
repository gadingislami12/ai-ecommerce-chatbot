'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductService } from '@/services/productService';
import { ChatService } from '@/services/chatService';
import { Product, Conversation, Message, Order, ChatbotKnowledge } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Package,
  Layers,
  Image as ImageIcon,
  Loader2,
  Upload,
  Calendar,
  X,
  User as UserIcon,
  Bot,
  ShoppingCart,
  BookOpen,
  Sparkles,
  Check
} from 'lucide-react';

function generateUniqueFileName(fileExt: string): string {
  return `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
}

interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  products: Product | null;
}

interface AdminOrder extends Order {
  order_items: AdminOrderItem[] | null;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const productService = new ProductService(supabase);
  const chatService = new ChatService(supabase);

  // Tabs
  const [activeTab, setActiveTab] = useState<'products' | 'conversations' | 'orders' | 'knowledge'>('products');

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null);

  // Knowledge Base State
  const [knowledge, setKnowledge] = useState<ChatbotKnowledge[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<ChatbotKnowledge | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [knowledgeSuccess, setKnowledgeSuccess] = useState(false);

  // Embedding Backfill State
  const [backfilling, setBackfilling] = useState(false);

  // Load Products
  const loadProducts = async (showLoading = false) => {
    if (showLoading) setProductLoading(true);
    const { data } = await productService.getAllProducts();
    setProducts(data || []);
    setProductLoading(false);
  };

  // Load Conversations
  const loadConversations = async (showLoading = false) => {
    if (showLoading) setConversationLoading(true);
    const { data } = await chatService.getAllConversations();
    setConversations(data || []);
    setConversationLoading(false);
  };

  // Load Messages for selected conversation
  const loadMessages = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessagesLoading(true);
    const { data } = await chatService.getMessagesByConversationId(conv.id);
    setMessages(data || []);
    setMessagesLoading(false);
  };

  // Load Orders
  const loadOrders = async (showLoading = false) => {
    if (showLoading) setOrderLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as AdminOrder[]) || []);
      
      // Sync selected order if open
      if (selectedOrder) {
        const freshSelected = data?.find((o) => o.id === selectedOrder.id);
        if (freshSelected) setSelectedOrder(freshSelected as AdminOrder);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setOrderLoading(false);
    }
  };

  // Load Knowledge
  const loadKnowledge = async (showLoading = false) => {
    if (showLoading) setKnowledgeLoading(true);
    try {
      const res = await fetch('/api/knowledge');
      if (!res.ok) throw new Error('Failed to load knowledge base');
      const data = await res.json();
      setKnowledge(data || []);
    } catch (err) {
      console.error('Error loading knowledge:', err);
    } finally {
      setKnowledgeLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadConversations();
    loadOrders();
    loadKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backfill Embeddings API call
  const handleBackfillEmbeddings = async () => {
    if (!confirm('Are you sure you want to backfill vector embeddings? This will request Gemini embedding API for products and knowledge missing vector representations.')) {
      return;
    }

    setBackfilling(true);
    try {
      const res = await fetch('/api/admin/backfill-embeddings', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to backfill embeddings');
      alert(`Success! Backfilled embeddings.\nProducts updated: ${data.productsUpdated}\nKnowledge items updated: ${data.knowledgeUpdated}`);
      loadProducts();
      loadKnowledge();
    } catch (err: any) {
      console.error(err);
      alert(`Backfill failed: ${err.message}`);
    } finally {
      setBackfilling(false);
    }
  };

  // Open Modal for Create Product
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('');
    setFormStock('');
    setFormImageUrl('');
    setFormError(null);
    setFormSuccess(false);
    setIsProductModalOpen(true);
  };

  // Open Modal for Edit Product
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormPrice(product.price.toString());
    setFormCategory(product.category);
    setFormStock(product.stock.toString());
    setFormImageUrl(product.image_url || '');
    setFormError(null);
    setFormSuccess(false);
    setIsProductModalOpen(true);
  };

  // Open Modal for Create Knowledge
  const openCreateKnowledgeModal = () => {
    setEditingKnowledge(null);
    setFormQuestion('');
    setFormAnswer('');
    setKnowledgeError(null);
    setKnowledgeSuccess(false);
    setIsKnowledgeModalOpen(true);
  };

  // Open Modal for Edit Knowledge
  const openEditKnowledgeModal = (item: ChatbotKnowledge) => {
    setEditingKnowledge(item);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setKnowledgeError(null);
    setKnowledgeSuccess(false);
    setIsKnowledgeModalOpen(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = generateUniqueFileName(fileExt);
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormImageUrl(publicUrl);
    } catch (err: any) {
      console.error('Upload image error:', err);
      setFormError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Product Form Submit (Create / Update via API route)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock);

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a valid positive number');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Stock must be a valid positive integer');
      return;
    }

    const payload = {
      name: formName,
      description: formDescription,
      price: priceNum,
      category: formCategory,
      stock: stockNum,
      image_url: formImageUrl || null,
    };

    try {
      if (editingProduct) {
        // Update via API (so embedding is generated)
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update product');
        }
      } else {
        // Create via API (so embedding is generated)
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create product');
        }
      }

      setFormSuccess(true);
      setTimeout(() => {
        setIsProductModalOpen(false);
        loadProducts();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setFormError(err.message || 'Error occurred while saving product');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      loadProducts();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  // Submit Knowledge Q&A
  const handleSubmitKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    setKnowledgeError(null);
    setKnowledgeSuccess(false);

    if (!formQuestion.trim() || !formAnswer.trim()) {
      setKnowledgeError('Both question and answer are required');
      return;
    }

    const payload = {
      question: formQuestion,
      answer: formAnswer,
    };

    try {
      if (editingKnowledge) {
        const res = await fetch('/api/knowledge', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingKnowledge.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update knowledge');
      } else {
        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create knowledge');
      }

      setKnowledgeSuccess(true);
      setTimeout(() => {
        setIsKnowledgeModalOpen(false);
        loadKnowledge();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving knowledge:', err);
      setKnowledgeError(err.message || 'Error occurred while saving knowledge');
    }
  };

  // Delete Knowledge Item
  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge item?')) return;

    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete knowledge');
      loadKnowledge();
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  // Direct copy user query from conversation log into a new Knowledge base item
  const handleAddLogToKnowledge = (questionText: string) => {
    setEditingKnowledge(null);
    setFormQuestion(questionText);
    setFormAnswer('');
    setKnowledgeError(null);
    setKnowledgeSuccess(false);
    setActiveTab('knowledge');
    setIsKnowledgeModalOpen(true);
  };

  // Update Order Status (paid, failed, shipped, completed, pending)
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    setUpdatingOrderStatus(id);
    try {
      // In simulator setting, we can just update status in Supabase.
      // But if we simulate payment 'paid', we should call the API callback route so it decrements stock properly!
      if (status === 'paid') {
        const res = await fetch(`/api/orders/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid' }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to process payment status update');
        }
      } else if (status === 'failed') {
        const res = await fetch(`/api/orders/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed' }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to process payment status update');
        }
      } else {
        // Just standard status updates (shipped, completed, pending)
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', id);

        if (error) throw error;
      }

      await loadOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  // Delete Order Record
  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order record? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      if (selectedOrder?.id === id) setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation log?')) {
      return;
    }

    const { error } = await chatService.deleteConversation(id);
    if (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      alert(`Error deleting conversation: ${errMsg}`);
    } else {
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
        setMessages([]);
      }
      loadConversations();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Control Panel
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-semibold">
              Manage product listings, audit customer order transactions, edit AI chatbot knowledge, and monitor chats.
            </p>
          </div>

          {/* Actions & Tab Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Backfill Embeddings Button */}
            <button
              onClick={handleBackfillEmbeddings}
              disabled={backfilling}
              className="flex items-center space-x-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {backfilling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Embedding...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Backfill Embeddings</span>
                </>
              )}
            </button>

            {/* Tab Selector */}
            <div className="flex bg-slate-900 border border-white/5 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'products' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Products</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'orders' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Orders</span>
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'knowledge' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Knowledge</span>
              </button>
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'conversations' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chats</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Contents: Products */}
        {activeTab === 'products' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Catalog List ({products.length})</h2>
              <button
                onClick={openCreateModal}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>

            {productLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-slate-900 p-12 text-center">
                <Package className="h-8 w-8 text-slate-500 mx-auto" />
                <h3 className="mt-4 text-base font-semibold">No products in catalog</h3>
                <p className="mt-1 text-xs text-slate-400">Get started by creating your first product listing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900 shadow-xl">
                <table className="min-w-full divide-y divide-white/5 text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 flex items-center space-x-3">
                          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-white/5">
                            {p.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">No Img</div>
                            )}
                          </div>
                          <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">{p.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-indigo-400 border border-indigo-500/10">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price)}
                        </td>
                        <td className="px-6 py-4">
                          {p.stock > 0 ? (
                            <span className="text-emerald-400 font-semibold">{p.stock} units</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">Out of Stock</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/5"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Orders */}
        {activeTab === 'orders' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Orders list */}
            <div className="lg:col-span-1 border border-white/5 bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col h-[600px]">
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b border-white/5 pb-3">
                <ShoppingCart className="h-5 w-5 text-indigo-400" />
                <span>Orders ({orders.length})</span>
              </h2>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {orderLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No orders recorded yet.</div>
                ) : (
                  orders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`group relative flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedOrder?.id === o.id
                          ? 'bg-indigo-600/10 border-indigo-500/30'
                          : 'bg-slate-950/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          ID: {o.id.substring(0, 8)}...
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          o.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          o.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-white truncate">{o.customer_name}</span>
                      
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(o.created_at).toLocaleDateString('id-ID')}
                        </span>
                        <span className="text-xs font-bold font-mono text-indigo-400">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(o.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Detail view */}
            <div className="lg:col-span-2 border border-white/5 bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col h-[600px]">
              {selectedOrder ? (
                <div className="flex flex-col h-full justify-between">
                  <div className="overflow-y-auto space-y-5 pr-1 scrollbar-thin flex-grow">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center space-x-1.5 font-mono">
                          <span>Order Details:</span>
                          <span className="text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 text-xs">
                            {selectedOrder.id}
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Received: {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Customer Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-950/45 p-4 border border-white/5 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1">Customer Details</span>
                        <p className="text-white font-semibold">{selectedOrder.customer_name}</p>
                        <p className="text-slate-400 font-mono mt-0.5">{selectedOrder.customer_email}</p>
                        {selectedOrder.customer_phone && (
                          <p className="text-slate-400 font-mono mt-0.5">{selectedOrder.customer_phone}</p>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Shipping Destination</span>
                        <p className="text-slate-300 leading-relaxed font-semibold whitespace-pre-line">
                          {selectedOrder.shipping_address}
                        </p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-950/45 p-4 border border-white/5 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1">Payment Method</span>
                        <p className="text-white font-semibold">{selectedOrder.payment_method}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Order Status Control</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <select
                            disabled={updatingOrderStatus === selectedOrder.id}
                            value={selectedOrder.status}
                            onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                          </select>
                          {updatingOrderStatus === selectedOrder.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Purchased Items List */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items Purchased</h4>
                      <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/40">
                        <table className="min-w-full divide-y divide-white/5 text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Product Name</th>
                              <th className="px-4 py-3">Price</th>
                              <th className="px-4 py-3">Qty</th>
                              <th className="px-4 py-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono">
                            {selectedOrder.order_items?.map((item) => (
                              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-white font-sans font-semibold">
                                  {item.products?.name || 'Deleted Product'}
                                </td>
                                <td className="px-4 py-3">
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                                </td>
                                <td className="px-4 py-3">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-indigo-400 font-bold">
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price * item.quantity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Total footer */}
                  <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-semibold">Grand Total:</span>
                    <span className="text-xl font-extrabold font-mono text-emerald-400">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                  <ShoppingCart className="h-8 w-8 text-slate-600" />
                  <span className="text-xs font-semibold">Select an order on the left side to view details.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Contents: Knowledge Base */}
        {activeTab === 'knowledge' && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Custom Chatbot Knowledge ({knowledge.length})</h2>
              <button
                onClick={openCreateKnowledgeModal}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Q&A Item</span>
              </button>
            </div>

            {knowledgeLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : knowledge.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-slate-900 p-12 text-center">
                <BookOpen className="h-8 w-8 text-slate-500 mx-auto" />
                <h3 className="mt-4 text-base font-semibold">No custom Q&A items</h3>
                <p className="mt-1 text-xs text-slate-400">Insert operational rules or Q&A (e.g. shipping, returns, etc.) for the bot.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900 shadow-xl">
                <table className="min-w-full divide-y divide-white/5 text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4 max-w-sm">Question</th>
                      <th className="px-6 py-4">Answer</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {knowledge.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white max-w-sm">
                          {item.question}
                        </td>
                        <td className="px-6 py-4 text-slate-400 leading-relaxed text-xs">
                          <p className="line-clamp-2 max-w-lg">{item.answer}</p>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => openEditKnowledgeModal(item)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/5"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteKnowledge(item.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Conversations (Audit chats) */}
        {activeTab === 'conversations' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1 border border-white/5 bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col h-[600px]">
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b border-white/5 pb-3">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                <span>Conversations ({conversations.length})</span>
              </h2>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {conversationLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No active chat sessions.</div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadMessages(c)}
                      className={`group relative flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedConversation?.id === c.id
                          ? 'bg-indigo-600/10 border-indigo-500/30'
                          : 'bg-slate-950/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex flex-col space-y-1 truncate pr-6">
                        <span className="text-xs font-semibold text-slate-300 font-mono truncate">
                          Session: {c.session_id}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(c.created_at).toLocaleString('id-ID')}</span>
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-7 w-7 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all absolute right-3"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Conversation Log detail view */}
            <div className="lg:col-span-2 border border-white/5 bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col h-[600px]">
              {selectedConversation ? (
                <>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-1.5 font-mono">
                        <span>Active Session ID:</span>
                        <span className="text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 text-xs">
                          {selectedConversation.session_id}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Started: {new Date(selectedConversation.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                    {messagesLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-20 text-slate-500 text-xs">This session has no messages yet.</div>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex items-start space-x-3 max-w-[85%] ${
                            m.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                          }`}
                        >
                          {/* Avatar icon */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                              m.role === 'user'
                                ? 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400'
                                : 'bg-violet-500/15 border-violet-500/20 text-violet-400'
                            }`}
                          >
                            {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>

                          {/* Message Body */}
                          <div
                            className={`rounded-2xl px-4 py-3 text-xs leading-relaxed relative group ${
                              m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-950 text-slate-200 border border-white/5 rounded-tl-none'
                            }`}
                          >
                            {/* Copy query to Knowledge base button for user queries */}
                            {m.role === 'user' && (
                              <button
                                onClick={() => handleAddLogToKnowledge(m.content)}
                                className="absolute -left-28 top-2 bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 hover:text-white border border-indigo-500/20 text-[9px] px-2 py-1 rounded transition-all opacity-0 group-hover:opacity-100 flex items-center space-x-1 shrink-0 shadow-md font-sans"
                                title="Add this customer query to Chatbot Knowledge Base"
                              >
                                <Plus className="h-2.5 w-2.5" />
                                <span>Add to Q&A</span>
                              </button>
                            )}

                            <p className="whitespace-pre-line">{m.content}</p>
                            <span className="block text-[8px] text-slate-400/80 mt-1.5 text-right font-mono">
                              {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                  <MessageSquare className="h-8 w-8 text-slate-600" />
                  <span className="text-xs">Select a conversation thread on the left side to view chat audits.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Modal (Slideover/Modal design) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin">
            
            {/* Close Button */}
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <h2 className="text-xl font-bold flex items-center space-x-2 mb-6">
              <Layers className="h-5 w-5 text-indigo-400" />
              <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
            </h2>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start space-x-2.5">
                <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-300 font-medium leading-relaxed">{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <span className="text-xs text-emerald-400 font-medium">Product saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-5">
              {/* Grid 1: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Mechanical Keyboard"
                    className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Electronics, Home, Apparel"
                    className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Grid 2: Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Price (IDR)</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 750000"
                    className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="e.g. 25"
                    className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe your product specifications and features here..."
                  className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none scrollbar-none"
                />
              </div>

              {/* Image URL / Image Upload */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Product Image</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Upload file or paste direct link</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload to Supabase Storage */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 block">File Upload</span>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 hover:border-indigo-500/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        {uploadingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                        ) : (
                          <Upload className="h-5 w-5 text-slate-400 mb-1" />
                        )}
                        <p className="text-[10px] text-slate-400">
                          {uploadingImage ? 'Uploading image...' : 'Click to upload image file'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Direct Image URL input */}
                  <div className="space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Direct URL Path</span>
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="mt-1 block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2 text-[11px] text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {formImageUrl && (
                      <div className="flex items-center space-x-2 text-[10px] text-indigo-400 font-medium font-mono">
                        <span className="truncate max-w-[150px]">Link set: {formImageUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || formSuccess}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {isKnowledgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin">
            
            {/* Close Button */}
            <button
              onClick={() => setIsKnowledgeModalOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <h2 className="text-xl font-bold flex items-center space-x-2 mb-6">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <span>{editingKnowledge ? 'Edit Q&A Item' : 'Add Q&A to Knowledge Base'}</span>
            </h2>

            {knowledgeError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start space-x-2.5">
                <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-300 font-medium leading-relaxed">{knowledgeError}</span>
              </div>
            )}

            {knowledgeSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <span className="text-xs text-emerald-400 font-medium">Knowledge Q&A saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmitKnowledge} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">User Question / Topic</label>
                <input
                  type="text"
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Apakah bisa COD (Cash on Delivery)?"
                  className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Response / Answer</label>
                <textarea
                  required
                  rows={6}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Type the detailed response that AuraBot should give when asked this question..."
                  className="block w-full rounded-xl border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none scrollbar-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsKnowledgeModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={knowledgeSuccess}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {editingKnowledge ? 'Save Changes' : 'Add to Knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
