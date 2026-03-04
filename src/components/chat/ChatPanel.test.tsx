import { render, screen, waitFor } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';
import { vi, describe, it, expect } from 'vitest';

const mockSendMessage = vi.fn();
const mockSetMessages = vi.fn();
const mockStop = vi.fn();

// Mock dependencies
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: mockSendMessage,
    setMessages: mockSetMessages,
    status: 'ready',
    stop: mockStop,
  }),
}));

vi.mock('@/stores/graphStore', () => {
  const mockStore = Object.assign(
    vi.fn((selector) => selector({
      edges: [],
      nodes: [],
      addEdge: vi.fn(),
      addNode: vi.fn(),
    })),
    {
      getState: () => ({
        edges: [],
        nodes: [],
        addEdge: vi.fn(),
        addNode: vi.fn(),
      }),
    }
  );
  return {
    useGraphStore: mockStore,
  };
});

vi.mock('@/components/chat/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list">Conversation List</div>,
}));

vi.mock('@/components/chat/EdgeSuggestions', () => ({
  EdgeSuggestions: () => <div data-testid="edge-suggestions">Edge Suggestions</div>,
}));

vi.mock('@/lib/contexts/ConversationContext', () => ({
  useConversationContext: () => ({
    currentConversationId: null,
    setCurrentConversationId: vi.fn(),
    refreshConversations: vi.fn(),
  }),
}));

// Mock fetch for loadConversations
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ conversations: [] }),
  })
) as any;

describe('ChatPanel', () => {
  it('renders chat input', async () => {
    render(<ChatPanel />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask a question or explore an idea.../i)).toBeInTheDocument();
    });
  });
});
