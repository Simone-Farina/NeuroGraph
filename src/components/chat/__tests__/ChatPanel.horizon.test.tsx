import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPanel } from '@/components/chat/ChatPanel';

const mockSendMessage = vi.fn();
const mockStop = vi.fn();
const mockAddToolOutput = vi.fn();
const mockRefreshConversations = vi.fn(async () => {});
const mockSetCurrentConversationId = vi.fn();

const graphState = {
  pendingHorizonSeed: {
    title: 'Embeddings',
    definition: 'Dense vector representations that encode semantic meaning.',
  } as { title: string; definition: string } | null,
  clearHorizonLearningIntent: vi.fn(() => {
    graphState.pendingHorizonSeed = null;
  }),
};

const queueState = {
  pendingCrystallizeItemId: null as string | null,
  clearCrystallizeIntent: vi.fn(),
  refreshQueue: vi.fn(async () => {}),
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

vi.mock('@/stores/graphStore', () => {
  const useGraphStore = (selector: (state: typeof graphState) => unknown) => selector(graphState);
  useGraphStore.getState = () => ({
    edges: [],
    addEdge: vi.fn(),
    addNode: vi.fn(),
  });

  return { useGraphStore };
});

vi.mock('@/stores/queueStore', () => ({
  useQueueStore: (selector: (state: typeof queueState) => unknown) => selector(queueState),
}));

vi.mock('@/lib/contexts/ConversationContext', () => ({
  useConversationContext: () => ({
    currentConversationId: null,
    setCurrentConversationId: mockSetCurrentConversationId,
    refreshConversations: mockRefreshConversations,
  }),
}));

vi.mock('@/components/chat/SelectionToolbar', () => ({
  SelectionToolbar: () => null,
}));

vi.mock('@/components/chat/CrystallizeBootstrap', () => ({
  CrystallizeBootstrap: () => null,
}));

vi.mock('@/components/chat/CrystallizePasteComposer', () => ({
  CrystallizePasteComposer: () => null,
}));

vi.mock('@/components/chat/MessageList', () => ({
  MessageList: () => <div>messages</div>,
}));

vi.mock('@/components/chat/ChatInput', () => ({
  ChatInput: () => <div>input</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  graphState.pendingHorizonSeed = {
    title: 'Embeddings',
    definition: 'Dense vector representations that encode semantic meaning.',
  };
  vi.stubGlobal('crypto', {
    randomUUID: () => 'conv-seeded-from-horizon',
  });
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ conversations: [] }),
  })) as unknown as typeof fetch;
});

describe('ChatPanel horizon handoff', () => {
  it('starts a fresh seeded conversation from the pending horizon intent', async () => {
    render(<ChatPanel />);

    await waitFor(() => {
      expect(mockSetCurrentConversationId).toHaveBeenCalledWith('conv-seeded-from-horizon');
    });

    expect(mockSendMessage).toHaveBeenCalledWith({
      text: expect.stringContaining('I want to master Embeddings.'),
    });
    expect(mockSendMessage).toHaveBeenCalledWith({
      text: expect.stringContaining('Dense vector representations that encode semantic meaning.'),
    });
    expect(graphState.clearHorizonLearningIntent).toHaveBeenCalled();
  });
});
