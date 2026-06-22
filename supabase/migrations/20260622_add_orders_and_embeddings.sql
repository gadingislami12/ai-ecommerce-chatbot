-- 1. Enable pgvector Extension to handle vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products table (768 dimensions for Gemini text-embedding-004)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'shipped', 'completed')),
    payment_method TEXT NOT NULL,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(12, 2) NOT NULL
);

-- 5. Create Chatbot Knowledge Table
CREATE TABLE IF NOT EXISTS public.chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_question ON public.chatbot_knowledge(question);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

-- 7. Define Policies

-- Orders Policies
CREATE POLICY "Allow public insert orders" ON public.orders
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read orders" ON public.orders
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update orders" ON public.orders
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated manage orders" ON public.orders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order Items Policies
CREATE POLICY "Allow public insert order_items" ON public.order_items
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read order_items" ON public.order_items
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated manage order_items" ON public.order_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chatbot Knowledge Policies
CREATE POLICY "Allow public read chatbot_knowledge" ON public.chatbot_knowledge
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated manage chatbot_knowledge" ON public.chatbot_knowledge
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 8. Create Functions for Vector Similarity Search

-- Match Products Function
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  category_filter text default 'All'
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  stock integer,
  image_url text,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    products.id,
    products.name,
    products.description,
    products.price,
    products.category,
    products.stock,
    products.image_url,
    products.created_at,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE (category_filter = 'All' OR products.category = category_filter)
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Match Knowledge Function
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    chatbot_knowledge.id,
    chatbot_knowledge.question,
    chatbot_knowledge.answer,
    chatbot_knowledge.created_at,
    1 - (chatbot_knowledge.embedding <=> query_embedding) AS similarity
  FROM chatbot_knowledge
  WHERE 1 - (chatbot_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
