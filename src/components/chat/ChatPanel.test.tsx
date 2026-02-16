import { render, screen, waitFor } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    setMessages: vi.fn(),
    status: 'ready',
  }),
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

vi.mock('@/components/chat/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list">Conversation List</div>,
}));

vi.mock('@/components/chat/EdgeSuggestions', () => ({
  EdgeSuggestions: () => <div data-testid="edge-suggestions">Edge Suggestions</div>,
}));

// Mock fetch for loadConversations
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ conversations: [] }),
  })
) as any;

describe('ChatPanel', () => {
  it('renders ConversationList and ChatInput', async () => {
    render(<ChatPanel />);
    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Ask a question or explore an idea.../i)).toBeInTheDocument();
  });
});
