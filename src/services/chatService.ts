import { SupabaseClient } from '@supabase/supabase-js';
import { Conversation, Message } from '@/types';

export class ChatService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // Get all conversations
  async getAllConversations(): Promise<{ data: Conversation[] | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Get messages for a single conversation
  async getMessagesByConversationId(conversationId: string): Promise<{ data: Message[] | null; error: unknown }> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return { data, error };
  }

  // Delete a conversation log
  async deleteConversation(id: string): Promise<{ error: unknown }> {
    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    return { error };
  }
}
