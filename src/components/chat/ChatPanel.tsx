'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Edge, MarkerType } from '@xyflow/react';

import { ChatInput } from '@/components/chat/ChatInput';
import { ConversationList } from '@/components/chat/ConversationList';
import { EdgeSuggestions } from '@/components/chat/EdgeSuggestions';
import { MessageList } from '@/components/chat/MessageList';
import { extractFirstYouTubeUrl, isYouTubeUrl } from '@/lib/youtube';
import { useGraphStore } from '@/stores/graphStore';
import type {
  ConversationSummary,
  CreatedCrystalResponse,
  EdgeUpsertResponse,
  RelationshipType,
  SuggestionInput,
  SuggestionToolPart,
} from '@/types/chat';
import { edgeSuggestionKey, useEdgeSuggestions } from '@/hooks/useEdgeSuggestions';

function markerForEdge(type: RelationshipType) {
  if (type === 'RELATED') return undefined;

  return {
    type: MarkerType.ArrowClosed,
    color: type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
  };
}

function toGraphEdge(edge: {
  id: string;
  source_crystal_id: string;
  target_crystal_id: string;
  type: RelationshipType;
}): Edge {
  return {
    id: edge.id,
    source: edge.source_crystal_id,
    target: edge.target_crystal_id,
    type: 'crystalEdge',
    data: { typeLabel: edge.type },
    markerEnd: markerForEdge(edge.type),
  };
}


function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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

  const {
    edgeSuggestions,
    connectionNotice,
    showConnectionsNotice,
    clearConnectionNotice,
    clearEdgeSuggestions,
    addEdgeSuggestions,
    handleConfirmEdgeSuggestion,
    handleDismissEdgeSuggestion,
  } = useEdgeSuggestions();

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

      setMessages(loadedMessages);
      setConversationId(id);
      clearEdgeSuggestions();
      clearConnectionNotice();
    } catch (error) {
      console.error('Failed to load conversation', error);
    }
  }, [setMessages, clearEdgeSuggestions, clearConnectionNotice]);

  const handleNewConversation = useCallback(() => {
    clearConnectionNotice();

    setMessages([]);
    setConversationId(null);
    setInput('');
    clearEdgeSuggestions();
  }, [setMessages, clearConnectionNotice, clearEdgeSuggestions]);

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

  const upsertEdgesInStore = useCallback(
    (
      edgesInput: Array<{
        id: string;
        source_crystal_id: string;
        target_crystal_id: string;
        type: RelationshipType;
      }>
    ) => {
      // Get current state once to avoid unnecessary re-renders or subscriptions
      const { edges: currentEdges, addEdges } = useGraphStore.getState();

      const existingIds = new Set(currentEdges.map((e) => e.id));
      const existingKeys = new Set(
        currentEdges.map((e) => {
          const data = e.data as { typeLabel?: RelationshipType } | undefined;
          return `${e.source}:${e.target}:${data?.typeLabel}`;
        })
      );

      const newEdges: typeof edgesInput = [];

      for (const edgeInput of edgesInput) {
        if (existingIds.has(edgeInput.id)) {
          continue;
        }

        const key = `${edgeInput.source_crystal_id}:${edgeInput.target_crystal_id}:${edgeInput.type}`;
        if (existingKeys.has(key)) {
          continue;
        }

        newEdges.push(edgeInput);

        // Add to sets to prevent duplicates within the batch
        existingIds.add(edgeInput.id);
        existingKeys.add(key);
      }

      if (newEdges.length === 0) {
        return;
      }

      addEdges(newEdges.map(toGraphEdge));
    },
    []
  );

  const upsertEdgeInStore = useCallback(
    (edgeInput: {
      id: string;
      source_crystal_id: string;
      target_crystal_id: string;
      type: RelationshipType;
    }) => {
      upsertEdgesInStore([edgeInput]);
    },
    [upsertEdgesInStore]
  );
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

  const handleCrystallize = useCallback(
    async (toolCallId: string) => {

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
      const sourceMessageIds = isUuid(message.id) ? [message.id] : undefined;

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
            source_message_ids: sourceMessageIds,
            related_crystals: input.related_crystals ?? [],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to crystallize:', error);
          alert('Failed to save crystal: ' + (error.error || 'Unknown error'));
          return;
        }

        const { crystal, edges, edge_suggestions } = (await response.json()) as CreatedCrystalResponse;

        // 4. Update Graph Store Optimistically
        const { addNode } = useGraphStore.getState();

        // Position will be handled by GraphPanel layout
        addNode({
          id: crystal.id,
          type: 'crystal',
          // Position will be handled by GraphPanel's dagre layout
          position: { x: 0, y: 0 },
          data: {
            title: crystal.title,
            retrievability: crystal.retrievability,
          },
        });

        if (edges && edges.length > 0) {
          upsertEdgesInStore(edges);
        }

        if (edge_suggestions && edge_suggestions.length > 0) {
          addEdgeSuggestions(edge_suggestions);
        }

        const connectionCount = (edges?.length ?? 0) + (edge_suggestions?.length ?? 0);
        if (connectionCount > 0) {
          showConnectionsNotice(
            connectionCount === 1 ? 'Connections found: 1' : `Connections found: ${connectionCount}`
          );
        }

        // 5. Update UI State (Hide card by marking as crystallized)
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            parts: msg.parts.map((p) => {
                if (isToolPartWithId(p, toolCallId)) {
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
    [messages, conversationId, setMessages, showConnectionsNotice, upsertEdgesInStore, addEdgeSuggestions]
  );

  const handleDismiss = useCallback((toolCallId: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (isToolPartWithId(part, toolCallId)) {
            return {
              type: part.type,
              toolCallId: part.toolCallId,
              providerExecuted: part.providerExecuted,
              input: part.input,
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
    <section className="chat-panel flex h-full overflow-hidden border-r border-neural-gray-700 bg-neural-gray-900/30">
      <ConversationList
        conversations={conversations}
        currentId={conversationId}
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
