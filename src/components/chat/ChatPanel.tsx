'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Edge, MarkerType } from '@xyflow/react';

import { ChatInput } from '@/components/chat/ChatInput';
import { CrystallizeBootstrap } from '@/components/chat/CrystallizeBootstrap';
import { CrystallizePasteComposer } from '@/components/chat/CrystallizePasteComposer';
import { MessageList } from '@/components/chat/MessageList';
import { SelectionToolbar } from '@/components/chat/SelectionToolbar';
import type { CrystallizeMetadata, StartCrystallizeResponse } from '@/lib/crystallize/types';
import { useConversationContext } from '@/lib/contexts/ConversationContext';
import { extractFirstYouTubeUrl, isYouTubeUrl } from '@/lib/youtube';
import { useQueueStore } from '@/stores/queueStore';
import { useGraphStore } from '@/stores/graphStore';

type SuggestionInput = {
  title: string;
  definition: string;
  core_insight: string;
  bloom_level: string;
  related_neurons?: Array<{
    id: string;
    title?: string;
    relationship_type: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
  }>;
};

type RelationshipType = 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';

type SuggestionToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  providerExecuted?: boolean;
  input?: SuggestionInput;
  state?: string;
  output?: unknown;
};

type CreatedNeuronResponse = {
  neuron: {
    id: string;
    title: string;
    retrievability: number;
  };
  synapses?: Array<{
    id: string;
    source_neuron_id: string;
    target_neuron_id: string;
    type: RelationshipType;
    weight?: number;
  }>;
  synapse_suggestions?: Array<{
    source_neuron_id: string;
    target_neuron_id: string;
    target_title: string;
    type: RelationshipType;
    weight: number;
    confidence: 'medium';
    source: 'vector' | 'ai';
  }>;
};

type SynapseUpsertResponse = {
  synapse: {
    id: string;
    source_neuron_id: string;
    target_neuron_id: string;
    type: RelationshipType;
    weight: number;
  };
};

type ActiveCrystallizeSession = {
  queueItemId: string;
  status: 'seeded' | 'awaiting_manual_paste';
  failureReason?: string;
} | null;

type PersistedMessagePayload = {
  id: string;
  role: string;
  content: string;
  metadata: unknown;
};

function markerForEdge(type: RelationshipType) {
  if (type === 'RELATED') return undefined;

  return {
    type: MarkerType.ArrowClosed,
    color: type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
  };
}

function toGraphEdge(edge: {
  id: string;
  source_neuron_id: string;
  target_neuron_id: string;
  type: RelationshipType;
}): Edge {
  return {
    id: edge.id,
    source: edge.source_neuron_id,
    target: edge.target_neuron_id,
    type: 'synapseEdge',
    data: { typeLabel: edge.type },
    markerEnd: markerForEdge(edge.type),
  };
}

function edgeSuggestionKey(suggestion: {
  source_neuron_id: string;
  target_neuron_id: string;
  type: RelationshipType;
}) {
  return `${suggestion.source_neuron_id}:${suggestion.target_neuron_id}:${suggestion.type}`;
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

function isCrystallizeMetadata(value: unknown): value is CrystallizeMetadata {
  if (!value || typeof value !== 'object' || !('crystallize' in value)) {
    return false;
  }

  const crystallize = (value as { crystallize?: unknown }).crystallize;
  if (!crystallize || typeof crystallize !== 'object') {
    return false;
  }

  const candidate = crystallize as {
    queue_item_id?: unknown;
    status?: unknown;
    failure_reason?: unknown;
  };

  return (
    typeof candidate.queue_item_id === 'string' &&
    (candidate.status === 'seeded' || candidate.status === 'awaiting_manual_paste') &&
    (candidate.failure_reason === undefined || typeof candidate.failure_reason === 'string')
  );
}

function deriveCrystallizeSession(messages: PersistedMessagePayload[]): ActiveCrystallizeSession {
  let latest: ActiveCrystallizeSession = null;

  for (const message of messages) {
    if (!isCrystallizeMetadata(message.metadata)) {
      continue;
    }

    latest = {
      queueItemId: message.metadata.crystallize.queue_item_id,
      status: message.metadata.crystallize.status,
      failureReason: message.metadata.crystallize.failure_reason,
    };
  }

  return latest;
}

export function ChatPanel() {
  const { currentConversationId, setCurrentConversationId, refreshConversations } = useConversationContext();
  const pendingCrystallizeItemId = useQueueStore((state) => state.pendingCrystallizeItemId);
  const clearCrystallizeIntent = useQueueStore((state) => state.clearCrystallizeIntent);
  const [input, setInput] = useState('');
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [isCrystallizing, setIsCrystallizing] = useState(false);
  const [crystallizeNotice, setCrystallizeNotice] = useState<string | null>(null);
  const [activeCrystallizeSession, setActiveCrystallizeSession] =
    useState<ActiveCrystallizeSession>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [processingToolCalls, setProcessingToolCalls] = useState<Set<string>>(new Set());
  const processingToolCallsRef = useRef<Set<string>>(new Set());
  const [edgeSuggestions, setEdgeSuggestions] = useState<
    NonNullable<CreatedNeuronResponse['synapse_suggestions']>
  >([]);
  const conversationIdRef = useRef(currentConversationId);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // When true, the next useEffect trigger is skipped so loadMessages doesn't
  // race with the server-side onFinish DB write and wipe streaming tool parts.
  const skipNextLoadRef = useRef(false);

  // Keep the ref in sync
  conversationIdRef.current = currentConversationId;

  const showConnectionsNotice = useCallback((message: string) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    setConnectionNotice(message);
    noticeTimeoutRef.current = setTimeout(() => {
      setConnectionNotice(null);
    }, 2400);
  }, []);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    addToolOutput,
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
      // Refresh conversation list in sidebar so the new conversation appears.
      // This intentionally does NOT trigger loadMessages (conversations is not
      // in the useEffect deps) — the SDK already has the correct streamed state.
      await refreshConversations();
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Wrapper tipizzato in modo semplice per evitare la complessità generica di addToolOutput.
  // Sblocca l'AI SDK dopo la neurogenesi e triggera una risposta di conferma dell'assistente.
  const handleAddToolOutput = useCallback(
    (toolCallId: string, toolName: string, result: string) => {
      try {
        // eslint-disable-next-line
        void (addToolOutput as (opts: { tool: string; toolCallId: string; output: unknown }) => Promise<void>)({
          tool: toolName,
          toolCallId,
          output: result,
        });
      } catch {
        // addToolOutput potrebbe non funzionare se lo stream è già terminato — non è bloccante
      }
    },
    [addToolOutput]
  );

  const loadMessages = useCallback(async (id: string) => {
    console.log('[loadMessages] fetching messages for conversation:', id);
    try {
      const response = await fetch(`/api/chat?mode=messages&conversationId=${id}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        console.warn('[loadMessages] fetch failed with status:', response.status);
        return;
      }

      const payload = await response.json();
      const persistedMessages = (payload.messages || []) as PersistedMessagePayload[];
      const loadedMessages = persistedMessages.map((msg) => {
          try {
            const textParts: Array<{ type: 'text'; text: string }> = msg.content
              ? [{ type: 'text' as const, text: msg.content }]
              : [];

            const toolParts: SuggestionToolPart[] = [];
            const meta = msg.metadata as {
              tool_invocations?: Array<{ toolCallId: string; toolName: string; args: unknown }>;
            } | null;

            if (Array.isArray(meta?.tool_invocations)) {
              for (const inv of meta.tool_invocations) {
                if (typeof inv.toolCallId === 'string' && typeof inv.toolName === 'string') {
                  console.log('[loadMessages] rehydrating tool invocation:', inv.toolName, inv.toolCallId, 'args present:', !!inv.args);
                  // Use 'input-available' (the real SDK state for "input complete, awaiting
                  // user action"). Previously we used the non-existent 'call'/'result' states.
                  toolParts.push({
                    type: `tool-${inv.toolName}` as `tool-${string}`,
                    toolCallId: inv.toolCallId,
                    state: 'input-available',
                    input: inv.args as SuggestionInput,
                    providerExecuted: false,
                  });
                }
              }
            }

            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              parts: [...textParts, ...toolParts],
            };
          } catch {
            // Corrupted metadata: fall back to text-only rendering.
            console.warn('[loadMessages] failed to parse metadata for msg:', msg.id, '— falling back to text-only');
            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              parts: msg.content ? [{ type: 'text' as const, text: msg.content }] : [],
            };
          }
        }) as UIMessage[];

      console.log('[loadMessages] loaded', loadedMessages.length, 'messages, replacing useChat state');
      setMessages(loadedMessages);
      setActiveCrystallizeSession(deriveCrystallizeSession(persistedMessages));
      setEdgeSuggestions([]);
      setConnectionNotice(null);
      setCrystallizeNotice(null);
    } catch (error) {
      console.error('[loadMessages] failed to load conversation:', error);
    }
  }, [setMessages]);

  // Load messages from DB when the user navigates to a different conversation
  // (currentConversationId changes). We intentionally do NOT depend on `conversations`
  // because refreshConversations() in onFinish would trigger loadMessages before the
  // server-side onFinish DB write completes — wiping the streamed tool parts.
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      setEdgeSuggestions([]);
      setConnectionNotice(null);
      setActiveCrystallizeSession(null);
      return;
    }

    // Skip for newly-created conversations: the SDK already has the
    // correct state from streaming. loadMessages would race with
    // the server-side onFinish DB write and potentially wipe tool parts.
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }

    loadMessages(currentConversationId);
  }, [currentConversationId, loadMessages, setMessages]);

  // Extract conversation ID from the first response (if new chat)
  useEffect(() => {
    if (messages.length >= 2 && !currentConversationId) {
      refreshConversations();
    }
  }, [messages.length, currentConversationId, refreshConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, connectionNotice, edgeSuggestions]);

  const upsertEdgeInStore = useCallback(
    (edgeInput: {
      id: string;
      source_neuron_id: string;
      target_neuron_id: string;
      type: RelationshipType;
    }) => {
      const { edges: currentEdges, addEdge } = useGraphStore.getState();

      const exists = currentEdges.some((existing) => {
        const data = existing.data as { typeLabel?: RelationshipType } | undefined;
        return (
          existing.id === edgeInput.id ||
          (existing.source === edgeInput.source_neuron_id &&
            existing.target === edgeInput.target_neuron_id &&
            data?.typeLabel === edgeInput.type)
        );
      });

      if (exists) {
        return;
      }

      addEdge(toGraphEdge(edgeInput));
    },
    []
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || status !== 'ready' || isFetchingTranscript || isCrystallizing) return;

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

    // Optimistically generate conversation ID if this is the first message
    if (!currentConversationId) {
      const newId = crypto.randomUUID();
      // Flag so the useEffect does NOT call loadMessages for this new ID.
      // The SDK already has the correct state from streaming; reloading from
      // DB would race with the server-side onFinish write.
      skipNextLoadRef.current = true;
      setCurrentConversationId(newId);
      conversationIdRef.current = newId;
    }

    sendMessage({ text: finalText });
    setInput('');
  }, [input, status, isFetchingTranscript, isCrystallizing, sendMessage, currentConversationId, setCurrentConversationId]);

  const handleNeurogenesis = useCallback(
    async (toolCallId: string, force = false) => {
      console.log('[handleNeurogenesis] invoked for toolCallId:', toolCallId, 'force:', force);

      if (processingToolCallsRef.current.has(toolCallId)) {
        console.log('[handleNeurogenesis] already processing, skipping');
        return;
      }

      processingToolCallsRef.current.add(toolCallId);
      setProcessingToolCalls(new Set(processingToolCallsRef.current));

      // 1. Find the message and tool invocation
      const message = messages.find((m) =>
        m.parts.some((part) => isToolPartWithId(part, toolCallId))
      );

      if (!message) {
        console.error('[handleNeurogenesis] message not found for toolCallId:', toolCallId);
        processingToolCallsRef.current.delete(toolCallId);
        setProcessingToolCalls(new Set(processingToolCallsRef.current));
        return;
      }

      const part = message.parts.find((messagePart) => isToolPartWithId(messagePart, toolCallId));

      if (!part?.input) {
        console.error('[handleNeurogenesis] tool part or input not found for toolCallId:', toolCallId, 'part:', part);
        processingToolCallsRef.current.delete(toolCallId);
        setProcessingToolCalls(new Set(processingToolCallsRef.current));
        return;
      }

      if (!currentConversationId) {
        console.error('[handleNeurogenesis] no currentConversationId — cannot create neuron');
        processingToolCallsRef.current.delete(toolCallId);
        setProcessingToolCalls(new Set(processingToolCallsRef.current));
        return;
      }

      const input = part.input;
      const sourceMessageIds = isUuid(message.id) ? [message.id] : undefined;
      console.log('[handleNeurogenesis] POSTing to /api/neurons — title:', input.title, 'conversationId:', currentConversationId);

      try {
        // 2. Call API
        const response = await fetch(`/api/neurons${force ? '?force=true' : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: input.title,
            definition: input.definition,
            core_insight: input.core_insight,
            bloom_level: input.bloom_level,
            source_conversation_id: currentConversationId,
            source_message_ids: sourceMessageIds,
            related_neurons: input.related_neurons ?? [],
          }),
        });

        console.log('[handleNeurogenesis] /api/neurons response status:', response.status);

        if (!response.ok) {
          const errorBody = await response.json();
          console.error('[handleNeurogenesis] API error:', response.status, errorBody);
          if (response.status === 409 && errorBody.type === 'collision') {
            throw errorBody; // Throw to be caught by NeurogenesisSuggestion
          }
          return;
        }

        const { neuron, synapses, synapse_suggestions } =
          (await response.json()) as CreatedNeuronResponse;

        // 4. Update Graph Store Optimistically
        const { addNode } = useGraphStore.getState();

        // Position will be handled by GraphPanel layout
        addNode({
          id: neuron.id,
          type: 'neuron',
          // Position will be handled by GraphPanel's dagre layout
          position: { x: 0, y: 0 },
          data: {
            title: neuron.title,
            retrievability: neuron.retrievability,
          },
        });

        if (synapses && synapses.length > 0) {
          synapses.forEach((synapse) => {
            upsertEdgeInStore(synapse);
          });
        }

        if (synapse_suggestions && synapse_suggestions.length > 0) {
          setEdgeSuggestions((prev) => {
            const merged = [...synapse_suggestions, ...prev];
            const deduped = new Map<string, (typeof merged)[number]>();

            merged.forEach((suggestion) => {
              deduped.set(edgeSuggestionKey(suggestion), suggestion);
            });

            return Array.from(deduped.values()).slice(0, 8);
          });
        }

        const connectionCount = (synapses?.length ?? 0) + (synapse_suggestions?.length ?? 0);
        if (connectionCount > 0) {
          showConnectionsNotice(
            connectionCount === 1 ? 'Connections found: 1' : `Connections found: ${connectionCount}`
          );
        }

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
                  output: { status: 'generated' },
                };
              }
              return p;
            }),
          }))
        );

      } catch (error) {
        console.error('[handleNeurogenesis] unexpected error creating neuron:', error);
      } finally {
        console.log('[handleNeurogenesis] finally: clearing processing state for', toolCallId);
        processingToolCallsRef.current.delete(toolCallId);
        setProcessingToolCalls(new Set(processingToolCallsRef.current));
      }
    },
    [messages, currentConversationId, setMessages, showConnectionsNotice, upsertEdgeInStore]
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

  const handleConfirmEdgeSuggestion = useCallback(
    async (suggestion: NonNullable<CreatedNeuronResponse['synapse_suggestions']>[number]) => {
      try {
        const response = await fetch(`/api/neurons/${suggestion.source_neuron_id}/synapses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_id: suggestion.target_neuron_id,
            type: suggestion.type,
            weight: suggestion.weight,
            ai_suggested: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to confirm edge suggestion', error);
          showConnectionsNotice('Connection could not be created');
          return;
        }

        const payload = (await response.json()) as SynapseUpsertResponse;

        if (payload.synapse) {
          upsertEdgeInStore(payload.synapse);
        }

        const suggestionId = edgeSuggestionKey(suggestion);
        setEdgeSuggestions((prev) =>
          prev.filter((candidate) => edgeSuggestionKey(candidate) !== suggestionId)
        );
        showConnectionsNotice('Connection added');
      } catch (error) {
        console.error('Connection confirmation failed', error);
        showConnectionsNotice('Connection could not be created');
      }
    },
    [showConnectionsNotice, upsertEdgeInStore]
  );

  const handleDismissEdgeSuggestion = useCallback((suggestionId: string) => {
    setEdgeSuggestions((prev) => prev.filter((candidate) => edgeSuggestionKey(candidate) !== suggestionId));
  }, []);

  const handleCrystallizeSuccess = useCallback(
    async (response: StartCrystallizeResponse) => {
      skipNextLoadRef.current = false;
      conversationIdRef.current = response.conversationId;
      setCurrentConversationId(response.conversationId);
      setActiveCrystallizeSession({
        queueItemId: response.queueItemId,
        status: response.mode,
        failureReason: response.mode === 'awaiting_manual_paste' ? response.reason : undefined,
      });
      await refreshConversations();
      clearCrystallizeIntent();
    },
    [clearCrystallizeIntent, refreshConversations, setCurrentConversationId]
  );

  const handleCrystallizeError = useCallback(
    (message: string) => {
      clearCrystallizeIntent();
      setCrystallizeNotice(message);
    },
    [clearCrystallizeIntent]
  );

  const handleManualCrystallizeComplete = useCallback(async () => {
    if (!currentConversationId) {
      return;
    }

    await loadMessages(currentConversationId);
  }, [currentConversationId, loadMessages]);

  const isLoading = status === 'streaming' || status === 'submitted' || isFetchingTranscript || isCrystallizing;
  const isManualPasteActive =
    Boolean(currentConversationId) && activeCrystallizeSession?.status === 'awaiting_manual_paste';

  return (
    <section className="chat-panel flex h-full overflow-hidden border-r border-neural-gray-700 bg-neural-gray-900/30">
      <CrystallizeBootstrap
        pendingCrystallizeItemId={pendingCrystallizeItemId}
        onStateChange={setIsCrystallizing}
        onSuccess={handleCrystallizeSuccess}
        onError={handleCrystallizeError}
      />
      <SelectionToolbar />
      <div className="flex min-w-0 flex-1 flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-neural-dark/0 via-neural-dark/0 to-neural-dark/20 pointer-events-none" />

        {isCrystallizing ? (
          <div className="mx-5 mt-5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/62 backdrop-blur-sm">
            Preparing source…
          </div>
        ) : null}

        {crystallizeNotice ? (
          <div className="mx-5 mt-5 rounded-2xl border border-orange-400/15 bg-orange-500/[0.06] px-4 py-3 text-sm text-orange-300/85">
            {crystallizeNotice}
          </div>
        ) : null}

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <MessageList
            messages={messages}
            processingToolCalls={processingToolCalls}
            onNeurogenesis={handleNeurogenesis}
            onDismiss={handleDismiss}
            isLoading={isLoading}
            addToolResult={handleAddToolOutput}
          />
        </div>

        {isManualPasteActive && currentConversationId ? (
          <CrystallizePasteComposer
            conversationId={currentConversationId}
            queueItemId={activeCrystallizeSession.queueItemId}
            onComplete={handleManualCrystallizeComplete}
          />
        ) : null}

        {connectionNotice ? (
          <div className="mx-6 mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 flex items-center gap-2 backdrop-blur-md">
            <div className="h-1.5 w-1.5 rounded-full bg-white/50 animate-pulse" />
            {connectionNotice}
          </div>
        ) : null}

        {edgeSuggestions.length > 0 ? (
          <div className="mx-6 mb-4 rounded-xl border border-white/10 bg-neural-gray-900/60 p-4 backdrop-blur-md shadow-2xl">
            <p className="text-xs font-medium uppercase tracking-wider text-neural-light/50 mb-3">
              Suggested Connections
            </p>
            <div className="space-y-2">
              {edgeSuggestions.map((suggestion) => {
                const suggestionId = edgeSuggestionKey(suggestion);
                const relationshipLabel = suggestion.type.toLowerCase().replace('_', ' ');

                return (
                  <div
                    key={suggestionId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neural-light">{suggestion.target_title}</p>
                      <p className="text-xs text-neural-light/40 flex items-center gap-1.5">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${suggestion.source === 'vector' ? 'bg-white/40' : 'bg-white/60'}`} />
                        {relationshipLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleConfirmEdgeSuggestion(suggestion);
                        }}
                        className="rounded-md bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:border-white/15 hover:text-white/90"
                      >
                        Connect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissEdgeSuggestion(suggestionId)}
                        className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-neural-light/50 transition hover:bg-white/5 hover:text-neural-light/80"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          isStreaming={status === 'streaming'}
          onStop={stop}
          disabled={isLoading || isManualPasteActive}
        />
      </div>
    </section>
  );
}
