'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UIMessage } from 'ai';
import type { ConversationSummary } from '@/types/chat';

type ResetState = {
  setMessages: (messages: UIMessage[]) => void;
  setConversationId: (id: string | null) => void;
  setInput: (value: string) => void;
  clearEdgeSuggestions: () => void;
  clearConnectionNotice: () => void;
};

export function useConversations(resetState: ResetState) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat', { cache: 'no-store' });
      if (!response.ok) return;

      const payload = await response.json();
      setConversations(payload.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chat?mode=messages&conversationId=${id}`, {
        cache: 'no-store',
      });
      if (!response.ok) return;

      const payload = await response.json();
      const loadedMessages = (payload.messages || []).map(
        (msg: { id: string; role: string; content: string }) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: msg.content }],
          content: msg.content,
        })
      );

      resetState.setMessages(loadedMessages);
      setConversationId(id);
      resetState.clearEdgeSuggestions();
      resetState.clearConnectionNotice();
    } catch (error) {
      console.error('Failed to load conversation', error);
    }
  }, [resetState]);

  const handleNewConversation = useCallback(() => {
    resetState.setMessages([]);
    setConversationId(null);
    resetState.setInput('');
    resetState.clearConnectionNotice();
    resetState.clearEdgeSuggestions();
  }, [resetState]);

  const handleDeleteConversation = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          handleNewConversation();
        }
      } else {
        const error = await response.json();
        alert('Failed to delete conversation: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete conversation', error);
      alert('An error occurred while deleting the conversation.');
    }
  }, [conversationId, handleNewConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    conversationId,
    setConversationId,
    loadConversations,
    loadConversation,
    handleNewConversation,
    handleDeleteConversation,
  };
}
