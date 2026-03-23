'use client';

import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useQueueStore } from '@/stores/queueStore';

export function QueueBootstrap() {
  const { user, loading } = useAuth();
  const refreshQueue = useQueueStore((state) => state.refreshQueue);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (loading || !userId) return;
    void refreshQueue();
  }, [loading, refreshQueue, userId]);

  useEffect(() => {
    if (loading || !userId) return;

    const handleFocus = () => {
      void refreshQueue();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshQueue();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, refreshQueue, userId]);

  return null;
}
