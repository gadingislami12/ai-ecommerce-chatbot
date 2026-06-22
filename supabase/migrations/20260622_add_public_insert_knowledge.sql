-- Allow public/anonymous inserts into chatbot_knowledge table
-- This enables storing customer Q&As for caching and RAG learning dynamically from the storefront chatbot.
DROP POLICY IF EXISTS "Allow public insert chatbot_knowledge" ON public.chatbot_knowledge;
CREATE POLICY "Allow public insert chatbot_knowledge" ON public.chatbot_knowledge
    FOR INSERT TO public WITH CHECK (true);
