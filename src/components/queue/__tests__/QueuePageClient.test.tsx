import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueuePageClient } from '../QueuePageClient';
import { useQueueStore } from '@/stores/queueStore';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/stores/queueStore', () => ({
  useQueueStore: vi.fn(),
}));

const INBOX_ITEM = {
  id: 'item-1',
  user_id: 'user-1',
  title: 'Inbox article',
  url: 'https://example.com/inbox',
  notes: null,
  state: 'inbox' as const,
  source_domain: 'example.com',
  favicon_url: null,
  estimated_read_time: null,
  created_at: '2026-03-22T12:00:00Z',
  updated_at: '2026-03-22T12:00:00Z',
};

const PASSIVE_ITEM = {
  ...INBOX_ITEM,
  id: 'item-2',
  title: 'Lingering note',
  state: 'passive_debt' as const,
};

const RESOURCE_ITEM = {
  ...INBOX_ITEM,
  id: 'item-3',
  title: 'Archived resource',
  state: 'resource' as const,
};

describe('QueuePageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueueStore).mockReturnValue({
      groupedItems: {
        inbox: [INBOX_ITEM],
        passive_debt: [PASSIVE_ITEM],
        resource: [RESOURCE_ITEM],
      },
      isLoading: false,
      error: null,
      refreshQueue: vi.fn(),
      transitionItem: vi.fn(),
      deleteItem: vi.fn(),
      beginCrystallize: vi.fn(),
    } as any);
  });

  it('refreshes on mount and renders sections in fixed order', () => {
    const refreshQueue = vi.fn();
    vi.mocked(useQueueStore).mockReturnValue({
      groupedItems: {
        inbox: [INBOX_ITEM],
        passive_debt: [PASSIVE_ITEM],
        resource: [RESOURCE_ITEM],
      },
      isLoading: false,
      error: null,
      refreshQueue,
      transitionItem: vi.fn(),
      deleteItem: vi.fn(),
      beginCrystallize: vi.fn(),
    } as any);

    render(<QueuePageClient />);

    expect(refreshQueue).toHaveBeenCalled();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)
    ).toEqual(['Inbox', 'Passive Debt', 'Resources']);
  });

  it('fires inbox auto-advance on native URL clicks', () => {
    const transitionItem = vi.fn();
    vi.mocked(useQueueStore).mockReturnValue({
      groupedItems: {
        inbox: [INBOX_ITEM],
        passive_debt: [PASSIVE_ITEM],
        resource: [RESOURCE_ITEM],
      },
      isLoading: false,
      error: null,
      refreshQueue: vi.fn(),
      transitionItem,
      deleteItem: vi.fn(),
      beginCrystallize: vi.fn(),
    } as any);

    render(<QueuePageClient />);
    fireEvent.click(screen.getByRole('link', { name: /open inbox article/i }));

    expect(transitionItem).toHaveBeenCalledWith('item-1', 'passive_debt');
  });

  it('routes crystallize back to chat after storing queue intent', () => {
    const beginCrystallize = vi.fn();
    vi.mocked(useQueueStore).mockReturnValue({
      groupedItems: {
        inbox: [INBOX_ITEM],
        passive_debt: [PASSIVE_ITEM],
        resource: [RESOURCE_ITEM],
      },
      isLoading: false,
      error: null,
      refreshQueue: vi.fn(),
      transitionItem: vi.fn(),
      deleteItem: vi.fn(),
      beginCrystallize,
    } as any);

    render(<QueuePageClient />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Crystallize' })[0]);

    expect(beginCrystallize).toHaveBeenCalledWith('item-1');
    expect(mockPush).toHaveBeenCalledWith('/app');
  });
});
