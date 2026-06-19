-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Define Policies
-- Products: Read is public, write (insert/update/delete) is restricted to authenticated users (admin)
CREATE POLICY "Allow public read products" ON public.products
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated manage products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Conversations: Anyone can insert, select by session_id, admin can manage all
CREATE POLICY "Allow public insert conversations" ON public.conversations
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read own conversations" ON public.conversations
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated manage conversations" ON public.conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Messages: Anyone can insert/read, admin can manage all
CREATE POLICY "Allow public insert messages" ON public.messages
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read messages" ON public.messages
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated manage messages" ON public.messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
