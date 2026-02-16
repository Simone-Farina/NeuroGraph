'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { ConversationList } from '@/components/chat/ConversationList';
import { EdgeSuggestions } from '@/components/chat/EdgeSuggestions';
import { extractFirstYouTubeUrl, isYouTubeUrl } from '@/lib/youtube';
import { useConversations } from '@/hooks/useConversations';
import { useEdgeSuggestions } from '@/hooks/useEdgeSuggestions';
import { useCrystallization } from '@/hooks/useCrystallization';

export function ChatPanel() {
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);

  // Local refs to sync with useChat transport
  const conversationIdRef = useRef<string | null>(null);

  // 1. Edge Suggestions Hook
  const {
    edgeSuggestions,
    connectionNotice,
    showConnectionsNotice,
    clearConnectionNotice,
    clearEdgeSuggestions,
    addEdgeSuggestions,
    upsertEdgeInStore,
    handleConfirmEdgeSuggestion,
    handleDismissEdgeSuggestion,
  } = useEdgeSuggestions();

  // 2. Chat Hook
  const {
    messages,
    sendMessage,
    setMessages,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        conversationId: conversationIdRef.current ?? undefined,
      }),
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    }),
    onFinish: async ({ message }) => {
      await loadConversations();

      const hasPendingToolCalls = message.parts.some(
        (part) =>
          typeof part.type === 'string' &&
          part.type.startsWith('tool-') &&
          (!('state' in part) || part.state !== 'output-available')
      );

      if (!hasPendingToolCalls && conversationIdRef.current) {
        await loadConversation(conversationIdRef.current);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const [input, setInput] = useState('');

  // 3. Conversations Hook
  const {
    conversations,
    conversationId,
    setConversationId,
    loadConversations,
    loadConversation,
    handleNewConversation,
    handleDeleteConversation,
  } = useConversations({
    setMessages,
    setConversationId: () => {}, // unused by hook logic but required by type
    setInput,
    clearEdgeSuggestions,
    clearConnectionNotice,
  });

  // Sync ref
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // 4. Crystallization Hook
  const { handleCrystallize, handleDismiss } = useCrystallization({
    messages,
    conversationId,
    setMessages,
    showConnectionsNotice,
    upsertEdgeInStore,
    addEdgeSuggestions,
  });

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Extract conversation ID from the first response
  useEffect(() => {
    if (messages.length >= 2 && !conversationId) {
      loadConversations();
    }
  }, [messages.length, conversationId, loadConversations]);

  useEffect(() => {
    if (messages.length >= 2 && !conversationId && conversations.length > 0) {
      // Pick the most recent conversation (first one)
      // This assumes loadConversations puts the newest first, which is standard
      // We check if we are not already in a conversation (which !conversationId does)
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId, messages.length, setConversationId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || status !== 'ready' || isFetchingTranscript) return;

    let finalText = text;

    if (isYouTubeUrl(text)) {
      const youtubeUrl = extractFirstYouTubeUrl(text);

      if (youtubeUrl) {
        try {
          setIsFetchingTranscript(true);

          const response = await fetch('/api/youtube', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: youtubeUrl }),
          });

          if (response.ok) {
            const payload = (await response.json()) as {
              transcript?: unknown;
              title?: unknown;
              videoId?: unknown;
            };

            if (typeof payload.transcript === 'string' && payload.transcript.trim()) {
              const title = typeof payload.title === 'string' ? payload.title : null;
              const videoId = typeof payload.videoId === 'string' ? payload.videoId : 'unknown-video';
              const titleLine = title ? `Title: ${title}` : `Video ID: ${videoId}`;

              finalText = `[The user shared a YouTube video. Here is the transcript:\n${titleLine}\n\n${payload.transcript}\n\n]\n\nUser message: ${text}`;
            }
          }
        } catch (error) {
          console.error('Transcript extraction failed', error);
        } finally {
          setIsFetchingTranscript(false);
        }
      }
    }

    sendMessage({ text: finalText });
    setInput('');
  }, [input, status, isFetchingTranscript, sendMessage]);

  const isLoading = status === 'streaming' || status === 'submitted' || isFetchingTranscript;

  return (
    <section className="chat-panel flex h-full overflow-hidden border-r border-neural-gray-700 bg-neural-gray-900/30">
      <ConversationList
        conversations={conversations}
        selectedId={conversationId}
        onSelect={loadConversation}
        onDelete={handleDeleteConversation}
        onNew={handleNewConversation}
      />

      <div className="flex min-w-0 flex-1 flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-neural-dark/0 via-neural-dark/0 to-neural-dark/20 pointer-events-none" />
        
        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <MessageList
            messages={messages}
            onCrystallize={handleCrystallize}
            onDismiss={handleDismiss}
          />
        </div>

        {connectionNotice ? (
          <div className="mx-6 mb-4 rounded-lg border border-neural-cyan/30 bg-neural-cyan/10 px-4 py-3 text-sm text-neural-cyan flex items-center gap-2 shadow-lg shadow-neural-cyan/5 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-neural-cyan animate-pulse" />
            {connectionNotice}
          </div>
        ) : null}

        <EdgeSuggestions
          suggestions={edgeSuggestions}
          onConfirm={handleConfirmEdgeSuggestion}
          onDismiss={handleDismissEdgeSuggestion}
        />

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={isLoading}
        />
      </div>
    </section>
  );
}
