'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { extractFirstYouTubeUrl, isYouTubeUrl } from '@/lib/youtube';
import { useGraphStore } from '@/stores/graphStore';
import type { ConversationSummary } from '@/types/chat';

type SuggestionInput = {
  title: string;
  definition: string;
  core_insight: string;
  bloom_level: string;
};

type SuggestionToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  providerExecuted?: boolean;
  input?: SuggestionInput;
};

function isToolPartWithId(part: unknown, toolCallId: string): part is SuggestionToolPart {
  if (!part || typeof part !== 'object') return false;

  const candidate = part as { type?: unknown; toolCallId?: unknown };
  return (
    typeof candidate.type === 'string' &&
    candidate.type.startsWith('tool-') &&
    typeof candidate.toolCallId === 'string' &&
    candidate.toolCallId === toolCallId
  );
}

export function ChatPanel() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const conversationIdRef = useRef(conversationId);

  // Keep the ref in sync
  conversationIdRef.current = conversationId;

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
    onFinish: async () => {
      await loadConversations();
      // Reload current conversation to get persistent UUIDs for messages
      if (conversationIdRef.current) {
        await loadConversation(conversationIdRef.current);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat', { cache: 'no-store' });
      if (!response.ok) return;

      const payload = await response.json();
      setConversations(payload.conversations || []);
    } catch {
      // silently ignore
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

      setMessages(loadedMessages);
      setConversationId(id);
    } catch {
      // silently ignore
    }
  }, [setMessages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Extract conversation ID from the first response
  useEffect(() => {
    if (messages.length >= 2 && !conversationId) {
      loadConversations().then(() => {
        setConversations((prev) => {
          if (prev.length > 0 && !conversationIdRef.current) {
            setConversationId(prev[0].id);
          }
          return prev;
        });
      });
    }
  }, [messages.length, conversationId, loadConversations]);

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
        } catch {
        } finally {
          setIsFetchingTranscript(false);
        }
      }
    }

    sendMessage({ text: finalText });
    setInput('');
  }, [input, status, isFetchingTranscript, sendMessage]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setInput('');
  }, [setMessages]);

  const handleCrystallize = useCallback(
    async (toolCallId: string) => {
      console.log('Crystallize requested for tool call:', toolCallId);

      // 1. Find the message and tool invocation
      const message = messages.find((m) =>
        m.parts.some((part) => isToolPartWithId(part, toolCallId))
      );

      if (!message) {
        console.error('Message not found for tool call');
        return;
      }

      const part = message.parts.find((messagePart) => isToolPartWithId(messagePart, toolCallId));

      if (!part?.input) {
        console.error('Tool part or input not found');
        return;
      }

      // 2. Validate message ID (must be UUID from DB, not temporary)
      // Syncing in onFinish usually ensures this, but if the user clicks VERY fast there might be a race.
      // We assume for now it's synced or the ID format is close enough (or we'll get a 400).
      if (!conversationId) {
        console.error('No conversation ID');
        return;
      }

      const input = part.input;

      try {
        // 3. Call API
        const response = await fetch('/api/crystals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: input.title,
            definition: input.definition,
            core_insight: input.core_insight,
            bloom_level: input.bloom_level,
            source_conversation_id: conversationId,
            source_message_ids: [message.id],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to crystallize:', error);
          alert('Failed to save crystal: ' + (error.error || 'Unknown error'));
          return;
        }

        const { crystal } = await response.json();

        // 4. Update Graph Store Optimistically
        const { nodes, addNode } = useGraphStore.getState();
        const nodeCount = nodes.length;

        // Simple positioning logic similar to GraphPanel
        addNode({
          id: crystal.id,
          type: 'crystal',
          position: {
            x: 120 + (nodeCount % 4) * 220,
            y: 100 + Math.floor(nodeCount / 4) * 140,
          },
          data: {
            title: crystal.title,
            retrievability: crystal.retrievability,
          },
        });

        // 5. Update UI State (Hide card by marking as crystallized)
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            parts: msg.parts.map((p) => {
                if (
                  isToolPartWithId(p, toolCallId)
                ) {
                  return {
                    type: p.type,
                    toolCallId: p.toolCallId,
                    providerExecuted: p.providerExecuted,
                    input: p.input,
                    state: 'output-available',
                    output: { status: 'crystallized' },
                  };
              }
              return p;
            }),
          }))
        );

      } catch (error) {
        console.error('Crystallization error:', error);
        alert('An error occurred while crystallizing.');
      }
    },
    [messages, conversationId, setMessages]
  );

  const handleDismiss = useCallback((toolCallId: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            part.type.startsWith('tool-') &&
            'toolCallId' in part &&
            (part as { toolCallId: string }).toolCallId === toolCallId
          ) {
            // Explicitly construct the new part to avoid type union mismatches
            const toolPart = part as {
              type: string;
              toolCallId: string;
              input: unknown;
              providerExecuted?: boolean;
            };

            return {
              type: toolPart.type as `tool-${string}`,
              toolCallId: toolPart.toolCallId,
              providerExecuted: toolPart.providerExecuted,
              input: toolPart.input,
              state: 'output-available',
              output: { status: 'dismissed' },
            };
          }
          return part;
        }),
      }))
    );
  }, [setMessages]);

  const isLoading = status === 'streaming' || status === 'submitted' || isFetchingTranscript;

  return (
    <section className="chat-panel flex h-[calc(100vh-73px)] border-r border-neural-gray-700 bg-neural-gray-900/30">
      <aside className="hidden w-64 shrink-0 border-r border-neural-gray-700 p-3 lg:block">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-neural-light/50">Conversations</p>
          <button
            type="button"
            onClick={handleNewConversation}
            className="rounded-md border border-neural-gray-700 px-2 py-1 text-xs text-neural-light/60 transition hover:border-neural-cyan/40 hover:text-neural-cyan"
          >
            + New
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => loadConversation(conversation.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${conversationId === conversation.id
                  ? 'border-neural-cyan/50 bg-neural-cyan/10 text-neural-light'
                  : 'border-neural-gray-700 bg-neural-gray-800/40 text-neural-light/70 hover:border-neural-gray-600'
                }`}
            >
              <p className="truncate font-medium">{conversation.title}</p>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            onCrystallize={handleCrystallize}
            onDismiss={handleDismiss}
          />
        </div>

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
