'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChatInput } from '@/components/chat/ChatInput';
import { CrystallizationSuggestion } from '@/components/chat/CrystallizationSuggestion';
import { MessageList } from '@/components/chat/MessageList';
import type { ChatMessage, ConversationSummary, CrystallizationSuggestion as Suggestion } from '@/types/chat';

function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function buildSuggestion(content: string): Suggestion {
  const titleWords = content.trim().split(/\s+/).slice(0, 7);
  const title = titleWords.length ? titleWords.join(' ') : 'New Insight';
  const definition = content.trim().length > 180 ? `${content.trim().slice(0, 177)}...` : content.trim();

  return {
    title,
    definition,
    bloomLevel: content.length > 180 ? 'Analyze' : 'Understand',
  };
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const canSend = useMemo(() => !loading && input.trim().length > 0, [input, loading]);

  const loadConversations = useCallback(async () => {
    const response = await fetch('/api/chat?mode=conversations', { cache: 'no-store' });
    if (!response.ok) return;

    const payload = await response.json();
    setConversations(payload.conversations || []);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const response = await fetch(`/api/chat?mode=messages&conversationId=${id}`, { cache: 'no-store' });
    if (!response.ok) return;

    const payload = await response.json();
    setMessages(payload.messages || []);
    setConversationId(id);
    setSuggestion(null);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const sendMessage = useCallback(async () => {
    if (!canSend) return;

    const userMessage = createMessage('user', input.trim());
    const assistantMessage = createMessage('assistant', '');
    const nextMessages = [...messages, userMessage];

    setMessages([...nextMessages, assistantMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          messages: nextMessages,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(payload.error || 'Failed to send message');
      }

      const returnedConversationId = response.headers.get('X-Conversation-Id');
      if (returnedConversationId) {
        setConversationId(returnedConversationId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAssistantResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullAssistantResponse += decoder.decode(value, { stream: true });
        setMessages((current) => {
          const copy = [...current];
          const lastMessage = copy[copy.length - 1];
          if (lastMessage?.role === 'assistant') {
            copy[copy.length - 1] = { ...lastMessage, content: fullAssistantResponse };
          }
          return copy;
        });
      }

      if (userMessage.content.length > 140 || /insight|therefore|because|means/i.test(userMessage.content)) {
        setSuggestion(buildSuggestion(userMessage.content));
      } else {
        setSuggestion(null);
      }

      await loadConversations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
    } finally {
      setLoading(false);
    }
  }, [canSend, conversationId, input, loadConversations, messages]);

  return (
    <section className="chat-panel flex h-[calc(100vh-73px)] border-r border-neural-gray-700 bg-neural-gray-900/30">
      <aside className="hidden w-64 shrink-0 border-r border-neural-gray-700 p-3 lg:block">
        <p className="mb-3 text-xs uppercase tracking-wide text-neural-light/50">Conversations</p>
        <div className="space-y-2 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => loadConversation(conversation.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                conversationId === conversation.id
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
          <MessageList messages={messages} />
        </div>

        {suggestion && (
          <CrystallizationSuggestion
            suggestion={suggestion}
            onCrystallize={() => setSuggestion(null)}
            onDismiss={() => setSuggestion(null)}
          />
        )}

        {error && <p className="px-5 pb-3 text-sm text-red-400">{error}</p>}

        <ChatInput value={input} onChange={setInput} onSubmit={sendMessage} disabled={loading} />
      </div>
    </section>
  );
}
