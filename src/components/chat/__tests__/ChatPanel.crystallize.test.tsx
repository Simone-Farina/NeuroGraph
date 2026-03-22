import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CrystallizeBootstrap } from '@/components/chat/CrystallizeBootstrap';
import { ChatPanel } from '@/components/chat/ChatPanel';

const mockRefreshConversations = vi.fn(async () => {});
const mockSetCurrentConversationId = vi.fn();
const mockSendMessage = vi.fn();
const mockStop = vi.fn();
const mockAddToolOutput = vi.fn();

const queueState = {
  pendingCrystallizeItemId: null as string | null,
  clearCrystallizeIntent: vi.fn(() => {
    queueState.pendingCrystallizeItemId = null;
  }),
  refreshQueue: vi.fn(async () => {}),
};

const conversationControl = {
  initialConversationId: null as string | null,
};

const fetchState = {
  conversationMode: 'seeded' as 'seeded' | 'awaiting_manual_paste',
  manualSeeded: false,
};

vi.mock('@ai-sdk/react', () => ({
  useChat: () => {
    const [messages, setMessages] = React.useState<any[]>([]);

    return {
      messages,
      setMessages,
      sendMessage: mockSendMessage,
      status: 'ready',
      stop: mockStop,
      addToolOutput: mockAddToolOutput,
    };
  },
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

vi.mock('@/stores/queueStore', () => ({
  useQueueStore: (selector: (state: typeof queueState) => unknown) => selector(queueState),
}));

vi.mock('@/lib/contexts/ConversationContext', () => ({
  useConversationContext: () => {
    const [currentConversationId, setConversationId] = React.useState<string | null>(
      conversationControl.initialConversationId
    );

    return {
      currentConversationId,
      setCurrentConversationId: (id: string | null) => {
        mockSetCurrentConversationId(id);
        setConversationId(id);
      },
      refreshConversations: mockRefreshConversations,
    };
  },
}));

vi.mock('@/components/chat/SelectionToolbar', () => ({
  SelectionToolbar: () => null,
}));

function seededMessages() {
  return {
    messages: [
      {
        id: 'msg-seeded',
        role: 'assistant',
        content:
          'Deliberate Learning Systems\nexample.com\n\nA concise briefing.\n\nQuestion: What would you test first?',
        metadata: {
          crystallize: {
            queue_item_id: 'queue-1',
            source_title: 'Deliberate Learning Systems',
            source_url: 'https://example.com/article',
            source_domain: 'example.com',
            status: 'seeded',
            notes_present: false,
          },
        },
      },
    ],
  };
}

function awaitingMessages() {
  return {
    messages: [
      {
        id: 'msg-awaiting',
        role: 'assistant',
        content:
          "Deliberate Learning Systems\nexample.com\n\nI couldn't extract enough usable source material automatically (paywall).\n\nQuestion: Paste the source text into this conversation so we can continue from the same queue item.",
        metadata: {
          crystallize: {
            queue_item_id: 'queue-1',
            source_title: 'Deliberate Learning Systems',
            source_url: 'https://example.com/article',
            source_domain: 'example.com',
            status: 'awaiting_manual_paste',
            failure_reason: 'paywall',
            notes_present: false,
          },
        },
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  queueState.pendingCrystallizeItemId = null;
  conversationControl.initialConversationId = null;
  fetchState.conversationMode = 'seeded';
  fetchState.manualSeeded = false;

  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith('/api/chat?mode=messages&conversationId=')) {
      return {
        ok: true,
        json: async () =>
          fetchState.conversationMode === 'awaiting_manual_paste' && !fetchState.manualSeeded
            ? awaitingMessages()
            : seededMessages(),
      } as Response;
    }

    if (url === '/api/crystallize/manual') {
      fetchState.manualSeeded = true;

      return {
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    }

    if (url === '/api/chat') {
      return {
        ok: true,
        json: async () => ({ conversations: [] }),
      } as Response;
    }

    throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? 'GET'}`);
  }) as typeof fetch;
});

describe('ChatPanel crystallize integration', () => {
  it('CrystallizeBootstrap starts crystallize and reports seeded success', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        conversationId: 'conv-1',
        queueItemId: 'queue-1',
        mode: 'seeded',
      }),
    })) as unknown as typeof fetch;

    const onSuccess = vi.fn();
    const onStateChange = vi.fn();
    const onError = vi.fn();

    render(
      <CrystallizeBootstrap
        pendingCrystallizeItemId="queue-1"
        onStateChange={onStateChange}
        onSuccess={onSuccess}
        onError={onError}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/crystallize',
        expect.objectContaining({ method: 'POST' })
      );
      expect(onSuccess).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        queueItemId: 'queue-1',
        mode: 'seeded',
      });
    });

    expect(onStateChange).toHaveBeenCalledWith(true);
    expect(onStateChange).toHaveBeenLastCalledWith(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('CrystallizeBootstrap surfaces restrained errors on hard failure', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Unable to prepare source right now.' }),
    })) as unknown as typeof fetch;

    const onSuccess = vi.fn();
    const onStateChange = vi.fn();
    const onError = vi.fn();

    render(
      <CrystallizeBootstrap
        pendingCrystallizeItemId="queue-1"
        onStateChange={onStateChange}
        onSuccess={onSuccess}
        onError={onError}
      />
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Unable to prepare source right now.');
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith(true);
    expect(onStateChange).toHaveBeenLastCalledWith(false);
  });

  it('ChatPanel renders the embedded composer for awaiting_manual_paste conversations', async () => {
    conversationControl.initialConversationId = 'conv-1';
    fetchState.conversationMode = 'awaiting_manual_paste';

    render(<ChatPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Paste the source text and continue\./i)).toBeInTheDocument();
    });
  });

  it('submits manual paste continuation and reloads the seeded conversation', async () => {
    conversationControl.initialConversationId = 'conv-1';
    fetchState.conversationMode = 'awaiting_manual_paste';

    render(<ChatPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Paste the source text and continue\./i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Crystallize source text/i), {
      target: { value: 'A'.repeat(520) },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/crystallize/manual',
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(/Paste the source text and continue\./i)).not.toBeInTheDocument();
      expect(screen.getByText(/A concise briefing\./i)).toBeInTheDocument();
    });
  });
});
