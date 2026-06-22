export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'failed' | 'shipped' | 'completed';
  payment_method: string;
  payment_id?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  product?: Product | null;
}

export interface ChatbotKnowledge {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

