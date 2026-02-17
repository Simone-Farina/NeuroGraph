'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ConversationSummary } from '@/types/chat';

type ConversationContextType = {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  refreshConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  isLoading: boolean;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setConversations(payload.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          setCurrentConversationId(null);
        }
      } else {
        const error = await response.json();
        alert('Failed to delete conversation: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete conversation', error);
      alert('An error occurred while deleting the conversation.');
    }
  }, [currentConversationId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        setCurrentConversationId,
        refreshConversations,
        deleteConversation,
        isLoading,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
}
