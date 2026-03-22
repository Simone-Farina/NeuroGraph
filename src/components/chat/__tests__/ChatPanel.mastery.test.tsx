import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPanel } from '@/components/chat/ChatPanel';

const mockRefreshQueue = vi.fn(async () => {});
const mockClearCrystallizeIntent = vi.fn();
const mockAddNode = vi.fn();
const mockAddEdge = vi.fn();
const mockRefreshConversations = vi.fn(async () => {});
const mockSetCurrentConversationId = vi.fn();

const queueState = {
  pendingCrystallizeItemId: 'queue-1' as string | null,
  clearCrystallizeIntent: mockClearCrystallizeIntent,
  refreshQueue: mockRefreshQueue,
};

const fetchState = {
  masteredQueueItemId: 'queue-1' as string | undefined,
};

const toolMessage = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  role: 'assistant',
  content: '',
  parts: [
    {
      type: 'tool-suggest_neurogenesis',
      toolCallId: 'tool-1',
      input: {
        title: 'Test Neuron',
        definition: 'A test neuron definition with sufficient length.',
        core_insight: 'A core insight that is also long enough to be valid.',
        bloom_level: 'Remember',
        related_neurons: [],
      },
      state: 'input-available',
    },
  ],
};

vi.mock('@ai-sdk/react', () => ({
  useChat: () => {
    const [messages, setMessages] = React.useState<any[]>([toolMessage]);

    return {
      messages,
      setMessages,
      sendMessage: vi.fn(),
      status: 'ready',
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    };
  },
}));

vi.mock('@/stores/graphStore', () => ({
  useGraphStore: {
    getState: () => ({
      edges: [],
      addEdge: mockAddEdge,
      addNode: mockAddNode,
    }),
  },
}));

vi.mock('@/stores/queueStore', () => ({
  useQueueStore: Object.assign(
    (selector: (state: typeof queueState) => unknown) => selector(queueState),
    {
      getState: () => queueState,
    }
  ),
}));

vi.mock('@/lib/contexts/ConversationContext', () => ({
  useConversationContext: () => ({
    currentConversationId: 'conv-1',
    setCurrentConversationId: mockSetCurrentConversationId,
    refreshConversations: mockRefreshConversations,
  }),
}));

vi.mock('@/components/chat/SelectionToolbar', () => ({
  SelectionToolbar: () => null,
}));

vi.mock('@/components/chat/MessageList', () => ({
  MessageList: ({
    onNeurogenesis,
  }: {
    onNeurogenesis?: (toolCallId: string, force?: boolean) => Promise<void>;
  }) => (
    <button type="button" onClick={() => void onNeurogenesis?.('tool-1')}>
      Trigger Neurogenesis
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  queueState.pendingCrystallizeItemId = null;
  fetchState.masteredQueueItemId = 'queue-1';

  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.startsWith('/api/chat?mode=messages&conversationId=')) {
      return {
        ok: false,
        status: 500,
        json: async () => ({}),
      } as unknown as Response;
    }

    if (url.startsWith('/api/neurons')) {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          neuron: {
            id: 'neuron-1',
            title: 'Test Neuron',
            retrievability: 1,
          },
          synapses: [],
          synapse_suggestions: [],
          mastered_queue_item_id: fetchState.masteredQueueItemId,
        }),
      } as unknown as Response;
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  }) as unknown as typeof fetch;
});

describe('ChatPanel mastery integration', () => {
  it('refreshes queue state when neuron creation returns mastered_queue_item_id', async () => {
    render(<ChatPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Trigger Neurogenesis/i }));

    await waitFor(() => {
      expect(mockRefreshQueue).toHaveBeenCalled();
      expect(mockClearCrystallizeIntent).toHaveBeenCalled();
      expect(screen.getByText(/Queue item mastered/i)).toBeInTheDocument();
    });
  });

  it('does not refresh queue state when neuron creation is not crystallize-linked', async () => {
    fetchState.masteredQueueItemId = undefined;

    render(<ChatPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Trigger Neurogenesis/i }));

    await waitFor(() => {
      expect(mockAddNode).toHaveBeenCalled();
    });

    expect(mockRefreshQueue).not.toHaveBeenCalled();
    expect(mockClearCrystallizeIntent).not.toHaveBeenCalled();
  });
});
