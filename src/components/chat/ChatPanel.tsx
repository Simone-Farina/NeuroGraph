'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

import { ChatInput } from '@/components/chat/ChatInput';
import { CrystallizeBootstrap } from '@/components/chat/CrystallizeBootstrap';
import { CrystallizePasteComposer } from '@/components/chat/CrystallizePasteComposer';
import { ChatNeurogenesisPrompt } from '@/components/chat/ChatNeurogenesisPrompt';
import { MessageList } from '@/components/chat/MessageList';
import { SelectionToolbar } from '@/components/chat/SelectionToolbar';
import type { CrystallizeMetadata, StartCrystallizeResponse } from '@/lib/crystallize/types';
import { useConversationContext } from '@/lib/contexts/ConversationContext';
import { extractFirstYouTubeUrl, isYouTubeUrl } from '@/lib/youtube';
import { useQueueStore } from '@/stores/queueStore';
import { useGraphStore } from '@/stores/graphStore';

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
  const pendingHorizonSeed = useGraphStore((state) => state.pendingHorizonSeed);
  const clearHorizonLearningIntent = useGraphStore((state) => state.clearHorizonLearningIntent);
  const setBloomEval = useGraphStore((state) => state.setBloomEval);
  const setBloomPending = useGraphStore((state) => state.setBloomPending);
  const resetBloomEval = useGraphStore((state) => state.resetBloomEval);
  const bloomLevel = useGraphStore((state) => state.bloomLevel);
  const bloomConfidence = useGraphStore((state) => state.bloomConfidence);
  const isBloomPending = useGraphStore((state) => state.isBloomPending);
  const addNeurogenesisResult = useGraphStore((s) => s.addNeurogenesisResult);
  const [input, setInput] = useState('');
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [isCrystallizing, setIsCrystallizing] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [crystallizeNotice, setCrystallizeNotice] = useState<string | null>(null);
  const [activeCrystallizeSession, setActiveCrystallizeSession] =
    useState<ActiveCrystallizeSession>(null);
  const conversationIdRef = useRef(currentConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  // When true, the next useEffect trigger is skipped so loadMessages doesn't
  // race with the server-side onFinish DB write and wipe streaming messages.
  const skipNextLoadRef = useRef(false);
  // Debounce ref for bloom evaluator fire-and-forget calls
  const bloomDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Sentinel-based scroll refs
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref in sync
  conversationIdRef.current = currentConversationId;

  // Fire-and-forget bloom evaluator with 500ms debounce.
  // Must be defined before useChat so it can be referenced in onFinish.
  // Uses messagesRef to access current messages without stale closure.
  const messagesRef = useRef<UIMessage[]>([]);

  const triggerBloomEval = useCallback(() => {
    if (bloomDebounceRef.current) clearTimeout(bloomDebounceRef.current);

    bloomDebounceRef.current = setTimeout(() => {
      setBloomPending(true);

      // Extract last 6 messages (3 user + 3 assistant) for context
      const last6 = messagesRef.current.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: (m.parts ?? [])
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(' ')
          .trim(),
      }));

      fetch('/api/bloom-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: last6,
          conversationId: conversationIdRef.current ?? undefined,
        }),
      })
        .then((res) => res.json())
        .then((result: { bloom_level: string | null; confidence: number; key_phrases?: string[] }) => {
          const userMessages = messagesRef.current.filter((m) => m.role === 'user');
          const latestUserMessageId = userMessages.at(-1)?.id ?? null;
          setBloomEval(result.bloom_level, result.confidence, result.key_phrases ?? [], latestUserMessageId);
        })
        .catch(() => {
          setBloomEval(null, 0, [], null);
        });
    }, 500);
  }, [setBloomEval, setBloomPending]);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
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
      // Fire bloom evaluator in background — non-blocking, fire-and-forget
      triggerBloomEval();
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Keep messagesRef in sync for triggerBloomEval closure access
  messagesRef.current = messages;

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
      const loadedMessages = persistedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        parts: msg.content ? [{ type: 'text' as const, text: msg.content }] : [],
      })) as UIMessage[];

      console.log('[loadMessages] loaded', loadedMessages.length, 'messages, replacing useChat state');
      setMessages(loadedMessages);
      setActiveCrystallizeSession(deriveCrystallizeSession(persistedMessages));
      setCrystallizeNotice(null);
    } catch (error) {
      console.error('[loadMessages] failed to load conversation:', error);
    }
  }, [setMessages]);

  // Load messages from DB when the user navigates to a different conversation
  // (currentConversationId changes). We intentionally do NOT depend on `conversations`
  // because refreshConversations() in onFinish would trigger loadMessages before the
  // server-side onFinish DB write completes — wiping the streamed state.
  useEffect(() => {
    // Always reset Crystallize and Bloom state when switching conversations.
    // Must be unconditional — skipNextLoadRef guard would otherwise
    // let paste banner bleed into the newly-selected conversation.
    setActiveCrystallizeSession(null);
    setIsCrystallizing(false);
    setCrystallizeNotice(null);
    resetBloomEval();
    // D-06: reset stick-to-bottom state on conversation switch
    isAtBottomRef.current = true;
    setShowJumpButton(false);

    if (!currentConversationId) {
      setMessages([]);
      return;
    }

    // Skip for newly-created conversations: the SDK already has the
    // correct state from streaming. loadMessages would race with
    // the server-side onFinish DB write.
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }

    loadMessages(currentConversationId).then(() => {
      // D-06: instant scroll to bottom on conversation switch
      requestAnimationFrame(() => {
        sentinelRef.current?.scrollIntoView({ behavior: 'instant' });
      });
    });
  }, [currentConversationId, loadMessages, resetBloomEval, setMessages]);

  // Extract conversation ID from the first response (if new chat)
  useEffect(() => {
    if (messages.length >= 2 && !currentConversationId) {
      refreshConversations();
    }
  }, [messages.length, currentConversationId, refreshConversations]);

  useEffect(() => {
    if (!pendingHorizonSeed || status !== 'ready' || isFetchingTranscript || isCrystallizing) {
      return;
    }

    const newConversationId = crypto.randomUUID();
    const seedText = `I want to master ${pendingHorizonSeed.title}.

Working definition:
${pendingHorizonSeed.definition}

Let's break it down. Start by asking me one focused question.`;

    skipNextLoadRef.current = true;
    conversationIdRef.current = newConversationId;
    setCurrentConversationId(newConversationId);
    setMessages([]);
    setCrystallizeNotice(null);
    setActiveCrystallizeSession(null);
    sendMessage({ text: seedText });
    setInput('');
    clearHorizonLearningIntent();
  }, [
    clearHorizonLearningIntent,
    isCrystallizing,
    isFetchingTranscript,
    pendingHorizonSeed,
    sendMessage,
    setCurrentConversationId,
    setMessages,
    status,
  ]);

  const scrollToBottom = useCallback((instant = false) => {
    if (!isAtBottomRef.current) return;
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    if (instant) {
      sentinelRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    scrollDebounceRef.current = setTimeout(() => {
      sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 16); // 16ms debounce — within D-05's 15-20ms window
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottomRef.current = atBottom;
    setShowJumpButton(!atBottom);
  }, []);

  // Cleanup scroll debounce on unmount
  useEffect(() => {
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, []);

  const handleSend = useCallback(async () => {
    resetBloomEval();
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
  }, [input, status, isFetchingTranscript, isCrystallizing, sendMessage, currentConversationId, setCurrentConversationId, resetBloomEval]);

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

  const ANALYZE_LEVELS = ['Analyze', 'Evaluate', 'Create'];
  const isNeurogenesisReady =
    bloomLevel !== null &&
    ANALYZE_LEVELS.includes(bloomLevel) &&
    bloomConfidence >= 0.75 &&
    !isBloomPending;

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

        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            sentinelRef={sentinelRef}
          />
        </div>

        {showJumpButton && (
          <button
            type="button"
            onClick={() => {
              isAtBottomRef.current = true;
              setShowJumpButton(false);
              sentinelRef.current?.scrollIntoView({ behavior: 'instant' });
            }}
            className="absolute bottom-24 right-6 text-[11px] font-medium uppercase tracking-wider
                       text-white/50 bg-white/[0.05] border border-white/10 px-3 py-1.5
                       transition-opacity duration-300 opacity-100 hover:opacity-80 z-20"
          >
            Jump to latest
          </button>
        )}

        {isManualPasteActive && currentConversationId ? (
          <CrystallizePasteComposer
            conversationId={currentConversationId}
            queueItemId={activeCrystallizeSession.queueItemId}
            onComplete={handleManualCrystallizeComplete}
          />
        ) : null}

        {isNeurogenesisReady && currentConversationId && (
          <ChatNeurogenesisPrompt
            conversationId={currentConversationId}
            onSuccess={(neuron, synapses) => {
              addNeurogenesisResult(neuron, synapses);
              resetBloomEval();
            }}
            onDismiss={resetBloomEval}
          />
        )}
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
