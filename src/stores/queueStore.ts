import { create } from 'zustand';

import type { KnowledgeQueueItem, QueueItemState } from '@/types/database';

type QueueSectionKey = 'inbox' | 'passive_debt' | 'resource';
type PendingMutation = 'transition' | 'delete';

type QueueStore = {
  items: KnowledgeQueueItem[];
  isLoading: boolean;
  error: string | null;
  lastLoadedAt: string | null;
  pendingById: Record<string, PendingMutation | undefined>;
  pendingCrystallizeItemId: string | null;
  groupedItems: Record<QueueSectionKey, KnowledgeQueueItem[]>;
  inboxCount: number;
  refreshQueue: () => Promise<void>;
  transitionItem: (
    id: string,
    targetState: Extract<QueueItemState, 'passive_debt' | 'resource' | 'mastered'>
  ) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  beginCrystallize: (id: string) => void;
  clearCrystallizeIntent: () => void;
};

const EMPTY_GROUPS: Record<QueueSectionKey, KnowledgeQueueItem[]> = {
  inbox: [],
  passive_debt: [],
  resource: [],
};

function deriveState(items: KnowledgeQueueItem[]) {
  const groupedItems: Record<QueueSectionKey, KnowledgeQueueItem[]> = {
    inbox: [],
    passive_debt: [],
    resource: [],
  };

  for (const item of items) {
    if (item.state === 'mastered') continue;
    groupedItems[item.state].push(item);
  }

  return {
    groupedItems,
    inboxCount: groupedItems.inbox.length,
  };
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }
  return fallback;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  lastLoadedAt: null,
  pendingById: {},
  pendingCrystallizeItemId: null,
  groupedItems: EMPTY_GROUPS,
  inboxCount: 0,

  refreshQueue: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/queue', { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getErrorMessage(payload, 'Failed to load queue'));
      }

      const payload = await response.json();
      const items = Array.isArray(payload.items) ? payload.items : [];

      set({
        items,
        isLoading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
        ...deriveState(items),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load queue',
      });
    }
  },

  transitionItem: async (id, targetState) => {
    const state = get();
    if (state.pendingById[id]) return;

    const previousItems = state.items;
    const item = previousItems.find((entry) => entry.id === id);
    if (!item) return;

    const nextItems = previousItems.map((entry) =>
      entry.id === id ? { ...entry, state: targetState, updated_at: new Date().toISOString() } : entry
    );

    set({
      items: nextItems,
      error: null,
      pendingById: {
        ...state.pendingById,
        [id]: 'transition',
      },
      ...deriveState(nextItems),
    });

    try {
      const response = await fetch(`/api/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: targetState }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getErrorMessage(payload, 'Failed to update queue item'));
      }

      const payload = await response.json();
      const confirmedItems = get().items.map((entry) =>
        entry.id === id && payload.item ? payload.item : entry
      );

      set((current) => ({
        items: confirmedItems,
        pendingById: {
          ...current.pendingById,
          [id]: undefined,
        },
        ...deriveState(confirmedItems),
      }));
    } catch (error) {
      set((current) => ({
        items: previousItems,
        error: error instanceof Error ? error.message : 'Failed to update queue item',
        pendingById: {
          ...current.pendingById,
          [id]: undefined,
        },
        ...deriveState(previousItems),
      }));
    }
  },

  deleteItem: async (id) => {
    const state = get();
    if (state.pendingById[id]) return;

    const previousItems = state.items;
    const nextItems = previousItems.filter((entry) => entry.id !== id);

    set({
      items: nextItems,
      error: null,
      pendingById: {
        ...state.pendingById,
        [id]: 'delete',
      },
      ...deriveState(nextItems),
    });

    try {
      const response = await fetch(`/api/queue/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getErrorMessage(payload, 'Failed to delete queue item'));
      }

      set((current) => ({
        pendingById: {
          ...current.pendingById,
          [id]: undefined,
        },
      }));
    } catch (error) {
      set((current) => ({
        items: previousItems,
        error: error instanceof Error ? error.message : 'Failed to delete queue item',
        pendingById: {
          ...current.pendingById,
          [id]: undefined,
        },
        ...deriveState(previousItems),
      }));
    }
  },

  beginCrystallize: (id) => set({ pendingCrystallizeItemId: id }),
  clearCrystallizeIntent: () => set({ pendingCrystallizeItemId: null }),
}));
