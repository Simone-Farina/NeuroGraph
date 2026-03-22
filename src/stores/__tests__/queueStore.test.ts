import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQueueStore } from '../queueStore';
import { useGraphStore } from '../graphStore';

const ITEMS = [
  {
    id: 'item-1',
    user_id: 'user-1',
    title: 'Inbox newest',
    url: 'https://example.com/one',
    notes: null,
    state: 'inbox' as const,
    source_domain: 'example.com',
    favicon_url: null,
    estimated_read_time: null,
    created_at: '2026-03-22T12:00:00Z',
    updated_at: '2026-03-22T12:00:00Z',
  },
  {
    id: 'item-2',
    user_id: 'user-1',
    title: 'Passive debt',
    url: 'https://example.com/two',
    notes: null,
    state: 'passive_debt' as const,
    source_domain: 'example.com',
    favicon_url: null,
    estimated_read_time: null,
    created_at: '2026-03-21T12:00:00Z',
    updated_at: '2026-03-21T12:00:00Z',
  },
  {
    id: 'item-3',
    user_id: 'user-1',
    title: 'Resource',
    url: 'https://example.com/three',
    notes: null,
    state: 'resource' as const,
    source_domain: 'example.com',
    favicon_url: null,
    estimated_read_time: null,
    created_at: '2026-03-20T12:00:00Z',
    updated_at: '2026-03-20T12:00:00Z',
  },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('queueStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
    useGraphStore.setState({
      nodes: [],
      edges: [],
      leftPanelMode: 'chat',
      activeNeuronId: null,
    });
    global.fetch = vi.fn();
  });

  it('refreshQueue loads items, derives groupedItems, and counts inbox only', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: ITEMS }),
    } as Response);

    await useQueueStore.getState().refreshQueue();

    const state = useQueueStore.getState();
    expect(state.items).toEqual(ITEMS);
    expect(state.groupedItems.inbox.map((item) => item.id)).toEqual(['item-1']);
    expect(state.groupedItems.passive_debt.map((item) => item.id)).toEqual(['item-2']);
    expect(state.groupedItems.resource.map((item) => item.id)).toEqual(['item-3']);
    expect(state.inboxCount).toBe(1);
  });

  it('transitionItem applies optimistic updates and clears pending state on success', async () => {
    useQueueStore.setState({
      items: ITEMS,
      groupedItems: {
        inbox: [ITEMS[0]],
        passive_debt: [ITEMS[1]],
        resource: [ITEMS[2]],
      },
      inboxCount: 1,
    });

    const pending = deferred<Response>();
    vi.mocked(fetch).mockReturnValue(pending.promise as Promise<Response>);

    const transitionPromise = useQueueStore.getState().transitionItem('item-1', 'passive_debt');

    expect(useQueueStore.getState().pendingById['item-1']).toBe('transition');
    expect(useQueueStore.getState().groupedItems.inbox).toHaveLength(0);
    expect(useQueueStore.getState().groupedItems.passive_debt.map((item) => item.id)).toEqual([
      'item-1',
      'item-2',
    ]);

    pending.resolve({
      ok: true,
      json: async () => ({ item: { ...ITEMS[0], state: 'passive_debt' } }),
    } as Response);
    await transitionPromise;

    expect(useQueueStore.getState().pendingById['item-1']).toBeUndefined();
    expect(useQueueStore.getState().inboxCount).toBe(0);
  });

  it('transitionItem rolls back on non-2xx response and blocks duplicate in-flight actions', async () => {
    useQueueStore.setState({
      items: ITEMS,
      groupedItems: {
        inbox: [ITEMS[0]],
        passive_debt: [ITEMS[1]],
        resource: [ITEMS[2]],
      },
      inboxCount: 1,
    });

    const pending = deferred<Response>();
    vi.mocked(fetch).mockReturnValue(pending.promise as Promise<Response>);

    const transitionPromise = useQueueStore.getState().transitionItem('item-1', 'passive_debt');
    const duplicatePromise = useQueueStore.getState().transitionItem('item-1', 'resource');

    expect(fetch).toHaveBeenCalledTimes(1);

    pending.resolve({
      ok: false,
      json: async () => ({ error: 'Nope' }),
    } as Response);

    await Promise.all([transitionPromise, duplicatePromise]);

    expect(useQueueStore.getState().groupedItems.inbox.map((item) => item.id)).toEqual(['item-1']);
    expect(useQueueStore.getState().pendingById['item-1']).toBeUndefined();
  });

  it('deleteItem removes locally first, restores on failure, and does not mutate graphStore', async () => {
    useQueueStore.setState({
      items: ITEMS,
      groupedItems: {
        inbox: [ITEMS[0]],
        passive_debt: [ITEMS[1]],
        resource: [ITEMS[2]],
      },
      inboxCount: 1,
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Delete failed' }),
    } as Response);

    await useQueueStore.getState().deleteItem('item-1');

    expect(useQueueStore.getState().items.map((item) => item.id)).toEqual([
      'item-1',
      'item-2',
      'item-3',
    ]);
    expect(useGraphStore.getState().leftPanelMode).toBe('chat');
  });

  it('beginCrystallize and clearCrystallizeIntent only update queue-local handoff state', () => {
    useQueueStore.getState().beginCrystallize('item-2');
    expect(useQueueStore.getState().pendingCrystallizeItemId).toBe('item-2');

    useQueueStore.getState().clearCrystallizeIntent();
    expect(useQueueStore.getState().pendingCrystallizeItemId).toBeNull();
    expect(useGraphStore.getState().leftPanelMode).toBe('chat');
  });
});
