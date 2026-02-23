import { type MouseEvent, useCallback, useEffect, useState } from 'react';

import type { ConversationSummary } from '@/types/chat';

type ResetState = {
  setMessages: (messages: Array<{ id: string; role: string; parts: Array<{ type: 'text'; text: string }>; content: string }>) => void;
  setConversationId: (id: string | null) => void;
  setInput: (value: string) => void;
  clearEdgeSuggestions: () => void;
  clearConnectionNotice: () => void;
};

type ChatMessagePayload = {
  id: string;
  role: string;
  content: string;
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

  const loadConversation = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/chat?mode=messages&conversationId=${id}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;

        const payload = await response.json();
        const loadedMessages = ((payload.messages || []) as ChatMessagePayload[]).map((message) => ({
          id: message.id,
          role: message.role,
          parts: [{ type: 'text' as const, text: message.content }],
          content: message.content,
        }));

        resetState.setMessages(loadedMessages);
        setConversationId(id);
        resetState.setConversationId(id);
        resetState.clearEdgeSuggestions();
        resetState.clearConnectionNotice();
      } catch (error) {
        console.error('Failed to load conversation', error);
      }
    },
    [resetState]
  );

  const handleNewConversation = useCallback(() => {
    resetState.setMessages([]);
    setConversationId(null);
    resetState.setConversationId(null);
    resetState.setInput('');
    resetState.clearConnectionNotice();
    resetState.clearEdgeSuggestions();
  }, [resetState]);

  const handleDeleteConversation = useCallback(
    async (event: MouseEvent, id: string) => {
      event.stopPropagation();

      if (!confirm('Are you sure you want to delete this conversation?')) {
        return;
      }

      try {
        const response = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });

        if (!response.ok) {
          const error = await response.json();
          alert('Failed to delete conversation: ' + (error.error || 'Unknown error'));
          return;
        }

        setConversations((prev) => prev.filter((conversation) => conversation.id !== id));

        if (conversationId === id) {
          handleNewConversation();
        }
      } catch (error) {
        console.error('Failed to delete conversation', error);
        alert('An error occurred while deleting the conversation.');
      }
    },
    [conversationId, handleNewConversation]
  );

  useEffect(() => {
    void loadConversations();
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
