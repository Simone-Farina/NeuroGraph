'use client';

import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useQueueStore } from '@/stores/queueStore';
import { useGraphStore } from '@/stores/graphStore';

export function QueueBootstrap() {
  const { user, loading } = useAuth();
  const refreshQueue = useQueueStore((state) => state.refreshQueue);
  const userId = user?.id ?? null;
  const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

  useEffect(() => {
    if (loading || !userId) return;
    void refreshQueue();
  }, [loading, refreshQueue, userId]);

  useEffect(() => {
    if (loading || !userId) return;

    const handleFocus = () => {
      if (leftPanelMode === 'chat') return;
      void refreshQueue();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && leftPanelMode !== 'chat') {
        void refreshQueue();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, refreshQueue, userId, leftPanelMode]);

  return null;
}
