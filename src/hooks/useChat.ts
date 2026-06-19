'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types';

export function useChat() {
  const supabase = createClient();
  
  // Initialize state directly from localStorage if in client context
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    let storedSessionId = localStorage.getItem('auracart-session-id');
    if (!storedSessionId) {
      storedSessionId = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem('auracart-session-id', storedSessionId);
    }
    return storedSessionId;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  // Load message history from Supabase on mount/session creation
  useEffect(() => {
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistoryLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        // Find conversation first
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (convError) throw convError;

        if (conversation) {
          // Fetch messages
          const { data: msgs, error: msgsError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          if (msgsError) throw msgsError;
          setMessages(msgs || []);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [supabase, sessionId]);

  // Send new message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return;

    setLoading(true);

    // Optimistically add user message to list
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: 'temp',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send message:', response.statusText);
        const errorMsg: Message = {
          id: `err_${Date.now()}`,
          conversation_id: 'temp',
          role: 'assistant',
          content: 'Sorry, I encountered an issue sending your message. Please try again.',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Add actual assistant response to state
      const tempAiMsg: Message = {
        id: `temp_ai_${Date.now()}`,
        conversation_id: 'temp',
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempAiMsg]);
    } catch (err) {
      console.warn('Error sending message:', err);
      // Add system error message
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        conversation_id: 'temp',
        role: 'assistant',
        content: 'Sorry, I encountered an issue sending your message. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (typeof window === 'undefined') return;
    const newSessionId = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    localStorage.setItem('auracart-session-id', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
  };

  return {
    messages,
    loading,
    historyLoading,
    sendMessage,
    clearChat,
  };
}
