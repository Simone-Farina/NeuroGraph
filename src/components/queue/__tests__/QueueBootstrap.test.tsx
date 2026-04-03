import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueueBootstrap } from '../QueueBootstrap';
import { useAuth } from '@/lib/auth/AuthContext';
import { useQueueStore } from '@/stores/queueStore';
import { useGraphStore } from '@/stores/graphStore';

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/stores/queueStore', () => ({
  useQueueStore: vi.fn(),
}));

vi.mock('@/stores/graphStore', () => ({
  useGraphStore: vi.fn(),
}));

function mockQueueStore(overrides: Record<string, unknown> = {}) {
  const store = {
    refreshQueue: vi.fn(),
    ...overrides,
  };

  vi.mocked(useQueueStore).mockImplementation(((selector: any) =>
    selector ? selector(store) : store) as any);

  return store;
}

function mockGraphStore(overrides: Record<string, unknown> = {}) {
  const store = {
    leftPanelMode: 'neuron',
    ...overrides,
  };

  vi.mocked(useGraphStore).mockImplementation(((selector: any) =>
    selector ? selector(store) : store) as any);

  return store;
}

function mockAuthState(overrides: Record<string, unknown> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1', email: 'user@example.com' },
    loading: false,
    signOut: vi.fn(),
    ...overrides,
  } as any);
}

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

describe('QueueBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setVisibilityState('visible');
    mockGraphStore(); // default: leftPanelMode = 'graph'
  });

  it('refreshes once when an authenticated user becomes available', () => {
    const store = mockQueueStore();
    mockAuthState();

    render(<QueueBootstrap />);

    expect(store.refreshQueue).toHaveBeenCalledTimes(1);
  });

  it('does not refresh while auth is loading or when no user exists', () => {
    const loadingStore = mockQueueStore();
    mockAuthState({ loading: true });
    const loadingRender = render(<QueueBootstrap />);

    expect(loadingStore.refreshQueue).not.toHaveBeenCalled();

    loadingRender.unmount();

    const anonymousStore = mockQueueStore();
    mockAuthState({ user: null });
    render(<QueueBootstrap />);

    expect(anonymousStore.refreshQueue).not.toHaveBeenCalled();
  });

  it('re-syncs on focus return and when the document becomes visible again', () => {
    const store = mockQueueStore();
    mockAuthState();

    render(<QueueBootstrap />);

    expect(store.refreshQueue).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(store.refreshQueue).toHaveBeenCalledTimes(2);

    setVisibilityState('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(store.refreshQueue).toHaveBeenCalledTimes(2);

    setVisibilityState('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(store.refreshQueue).toHaveBeenCalledTimes(3);
  });

  it('does not refresh on focus when leftPanelMode is chat', () => {
    const store = mockQueueStore();
    mockAuthState();
    mockGraphStore({ leftPanelMode: 'chat' });

    render(<QueueBootstrap />);

    // Initial mount refresh still fires (first useEffect has no panel guard)
    const initialCalls = store.refreshQueue.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(store.refreshQueue).toHaveBeenCalledTimes(initialCalls);
  });

  it('does not refresh on visibility change when leftPanelMode is chat', () => {
    const store = mockQueueStore();
    mockAuthState();
    mockGraphStore({ leftPanelMode: 'chat' });

    render(<QueueBootstrap />);

    const initialCalls = store.refreshQueue.mock.calls.length;

    setVisibilityState('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(store.refreshQueue).toHaveBeenCalledTimes(initialCalls);
  });
});
