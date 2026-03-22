import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppSidebar } from '../AppSidebar';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOnboarding } from '@/components/onboarding/OnboardingTour';
import { useConversationContext } from '@/lib/contexts/ConversationContext';
import { useQueueStore } from '@/stores/queueStore';

const fetchMock = vi.fn();
const mockPush = vi.fn();
let mockPathname = '/app';

global.fetch = fetchMock as any;

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, initial: _initial, animate: _animate, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/onboarding/OnboardingTour', () => ({
  useOnboarding: vi.fn(),
}));

vi.mock('@/lib/contexts/ConversationContext', () => ({
  useConversationContext: vi.fn(),
}));

vi.mock('@/stores/queueStore', () => ({
  useQueueStore: vi.fn(),
}));

function mockQueueState(overrides: Record<string, unknown> = {}) {
  const store = {
    inboxCount: 0,
    ...overrides,
  };

  vi.mocked(useQueueStore).mockImplementation((selector?: (state: typeof store) => unknown) =>
    selector ? selector(store) : store
  );

  return store;
}

describe('AppSidebar queue integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/app';
    fetchMock.mockResolvedValue({
      json: async () => ({ key: null }),
    });

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
      signOut: vi.fn(),
    } as any);
    vi.mocked(useOnboarding).mockReturnValue({ startTour: vi.fn() } as any);
    vi.mocked(useConversationContext).mockReturnValue({
      conversations: [],
      currentConversationId: null,
      setCurrentConversationId: vi.fn(),
      deleteConversation: vi.fn(),
    } as any);
  });

  it('renders a Queue nav link to /app/queue with an inbox-only badge', async () => {
    mockQueueState({ inboxCount: 4 });

    render(<AppSidebar />);

    const queueLink = screen.getByRole('link', { name: /queue/i });
    expect(queueLink).toHaveAttribute('href', '/app/queue');

    await waitFor(() => {
      expect(screen.getByLabelText('Queue unread count: 4')).toBeInTheDocument();
    });
  });

  it('marks the Queue route as active when pathname is /app/queue', async () => {
    mockPathname = '/app/queue';
    mockQueueState({ inboxCount: 2 });

    render(<AppSidebar />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/keys');
    });

    const queueLink = screen.getByRole('link', { name: /queue/i });
    expect(queueLink.className).toContain('bg-white/[0.06]');
    expect(queueLink.className).toContain('text-white/90');
  });

  it('hides the badge completely when the inbox count is zero', async () => {
    mockQueueState({ inboxCount: 0 });

    render(<AppSidebar />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/keys');
    });

    expect(screen.queryByLabelText(/Queue unread count:/i)).not.toBeInTheDocument();
  });

  it('keeps the Queue route discoverable when the sidebar is collapsed', async () => {
    mockQueueState({ inboxCount: 3 });

    render(<AppSidebar />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/keys');
    });
    fireEvent.click(screen.getByTitle('Collapse Sidebar'));

    const collapsedQueueLink = screen.getByTitle('Queue');
    expect(collapsedQueueLink).toHaveAttribute('href', '/app/queue');
    expect(screen.queryByText('Queue')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Queue unread count: 3')).toBeInTheDocument();
  });
});
