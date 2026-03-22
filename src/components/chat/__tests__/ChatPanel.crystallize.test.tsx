import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { UIMessage } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { ConversationProvider } from '@/lib/contexts/ConversationContext';
import { useQueueStore } from '@/stores/queueStore';

const fetchMock = vi.fn();
const mockSendMessage = vi.fn();
const mockStop = vi.fn();
const mockAddToolOutput = vi.fn();

const chatState = {
  initialMessages: [] as UIMessage[],
  status: 'ready' as 'ready' | 'submitted' | 'streaming',
};

global.fetch = fetchMock as typeof fetch;

vi.mock('@ai-sdk/react', async () => {
  const ReactModule = await import('react');

  return {
    useChat: () => {
      const [messages, setMessages] = ReactModule.useState<UIMessage[]>(chatState.initialMessages);

      return {
        messages,
        sendMessage: mockSendMessage,
        setMessages,
        status: chatState.status,
        stop: mockStop,
        addToolOutput: mockAddToolOutput,
      };
    },
  };
});

vi.mock('@/components/chat/SelectionToolbar', () => ({
  SelectionToolbar: () => null,
}));

vi.mock('@/stores/graphStore', () => ({
  useGraphStore: {
    getState: () => ({
      edges: [],
      addEdge: vi.fn(),
      addNode: vi.fn(),
    }),
  },
}));

function createJsonResponse(payload: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

function createDeferredResponse() {
  let resolve: ((value: ReturnType<typeof createJsonResponse> extends Promise<infer T> ? T : never) => void) | null =
    null;

  const promise = new Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>((innerResolve) => {
    resolve = innerResolve;
  });

  return {
    promise,
    resolve(payload: unknown, status = 200) {
      resolve?.({
        ok: status >= 200 && status < 300,
        status,
        json: async () => payload,
      });
    },
  };
}

function renderChatPanel() {
  return render(
    <ConversationProvider>
      <ChatPanel />
    </ConversationProvider>
  );
}

describe('ChatPanel crystallize flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatState.initialMessages = [];
    chatState.status = 'ready';

    useQueueStore.setState({
      items: [],
      isLoading: false,
      error: null,
      lastLoadedAt: null,
      pendingById: {},
      pendingCrystallizeItemId: null,
      groupedItems: {
        inbox: [],
        passive_debt: [],
        resource: [],
      },
      inboxCount: 0,
    });
  });

  it('starts crystallize from queue intent, shows calm loading, and loads the seeded conversation', async () => {
    const crystallizeRequest = createDeferredResponse();

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/chat') {
        return createJsonResponse({ conversations: [] });
      }

      if (url === '/api/crystallize') {
        return crystallizeRequest.promise;
      }

      if (url === '/api/chat?mode=messages&conversationId=conv-seeded') {
        return createJsonResponse({
          messages: [
            {
              id: 'assistant-1',
              role: 'assistant',
              content: 'Seeded briefing',
              metadata: {
                crystallize: {
                  queue_item_id: 'queue-1',
                  status: 'seeded',
                },
              },
            },
          ],
        });
      }

      throw new Error(`Unhandled fetch: ${url}`);
    });

    useQueueStore.getState().beginCrystallize('queue-1');

    renderChatPanel();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/crystallize',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(screen.getByText('Preparing source...')).toBeInTheDocument();

    crystallizeRequest.resolve({
      conversationId: 'conv-seeded',
      queueItemId: 'queue-1',
      mode: 'seeded',
    });

    await waitFor(() => {
      expect(screen.getByText('Seeded briefing')).toBeInTheDocument();
    });

    expect(useQueueStore.getState().pendingCrystallizeItemId).toBeNull();
  });

  it('loads the returned conversation even when crystallize falls back to awaiting manual paste', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/chat') {
        return createJsonResponse({ conversations: [] });
      }

      if (url === '/api/crystallize') {
        return createJsonResponse({
          conversationId: 'conv-manual',
          queueItemId: 'queue-2',
          mode: 'awaiting_manual_paste',
          reason: 'timeout',
        });
      }

      if (url === '/api/chat?mode=messages&conversationId=conv-manual') {
        return createJsonResponse({
          messages: [
            {
              id: 'assistant-2',
              role: 'assistant',
              content: 'Paste the source text and continue.',
              metadata: {
                crystallize: {
                  queue_item_id: 'queue-2',
                  status: 'awaiting_manual_paste',
                  failure_reason: 'timeout',
                },
              },
            },
          ],
        });
      }

      throw new Error(`Unhandled fetch: ${url}`);
    });

    useQueueStore.getState().beginCrystallize('queue-2');

    renderChatPanel();

    await waitFor(() => {
      expect(screen.getByText('Paste the source text and continue.')).toBeInTheDocument();
    });

    expect(useQueueStore.getState().pendingCrystallizeItemId).toBeNull();
  });

  it('clears queue intent and shows restrained inline feedback when crystallize cannot start', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/chat') {
        return createJsonResponse({ conversations: [] });
      }

      if (url === '/api/crystallize') {
        return createJsonResponse({ error: 'boom' }, 500);
      }

      throw new Error(`Unhandled fetch: ${url}`);
    });

    useQueueStore.getState().beginCrystallize('queue-3');

    renderChatPanel();

    await waitFor(() => {
      expect(screen.getByText('Could not prepare the source. Try again.')).toBeInTheDocument();
    });

    expect(useQueueStore.getState().pendingCrystallizeItemId).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.skip('renders an embedded paste composer, submits manual text, and reloads the conversation', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/chat') {
        return createJsonResponse({ conversations: [] });
      }

      if (url === '/api/chat?mode=messages&conversationId=conv-awaiting') {
        return createJsonResponse({
          messages: [
            {
              id: 'assistant-awaiting',
              role: 'assistant',
              content: 'Manual paste needed.',
              metadata: {
                crystallize: {
                  queue_item_id: 'queue-4',
                  status: 'awaiting_manual_paste',
                  failure_reason: 'timeout',
                },
              },
            },
          ],
        });
      }

      if (url === '/api/crystallize/manual') {
        expect(init?.method).toBe('POST');
        expect(init?.body).toContain('conversationId');
        expect(init?.body).toContain('queue-4');
        return createJsonResponse({ success: true });
      }

      if (url === '/api/chat?mode=messages&conversationId=conv-seeded-after-paste') {
        return createJsonResponse({
          messages: [
            {
              id: 'assistant-seeded',
              role: 'assistant',
              content: 'Seeded after paste',
              metadata: {
                crystallize: {
                  queue_item_id: 'queue-4',
                  status: 'seeded',
                },
              },
            },
          ],
        });
      }

      throw new Error(`Unhandled fetch: ${url}`);
    });

    render(
      <ConversationProvider>
        <ChatPanel />
      </ConversationProvider>
    );

    fireEvent.change(screen.getByLabelText('Manual source text'), {
      target: { value: 'x'.repeat(600) },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Seeded after paste')).toBeInTheDocument();
    });

    expect(screen.queryByText('Paste the source text and continue.')).not.toBeInTheDocument();
  });
});
