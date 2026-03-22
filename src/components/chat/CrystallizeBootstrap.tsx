'use client';

import { useEffect, useRef } from 'react';

import type { StartCrystallizeResponse } from '@/lib/crystallize/types';

type CrystallizeBootstrapProps = {
  pendingCrystallizeItemId: string | null;
  onStateChange: (isLoading: boolean) => void;
  onSuccess: (response: StartCrystallizeResponse) => void | Promise<void>;
  onError: (message: string) => void;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return fallback;
}

export function CrystallizeBootstrap({
  pendingCrystallizeItemId,
  onStateChange,
  onSuccess,
  onError,
}: CrystallizeBootstrapProps) {
  const inFlightIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingCrystallizeItemId || inFlightIdRef.current === pendingCrystallizeItemId) {
      return;
    }

    let active = true;
    inFlightIdRef.current = pendingCrystallizeItemId;
    onStateChange(true);

    void (async () => {
      try {
        const response = await fetch('/api/crystallize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queueItemId: pendingCrystallizeItemId }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(getErrorMessage(payload, 'Unable to prepare source right now.'));
        }

        const payload = (await response.json()) as StartCrystallizeResponse;
        if (!active) return;
        await onSuccess(payload);
      } catch (error) {
        if (!active) return;
        onError(error instanceof Error ? error.message : 'Unable to prepare source right now.');
      } finally {
        inFlightIdRef.current = null;
        if (active) {
          onStateChange(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [onError, onStateChange, onSuccess, pendingCrystallizeItemId]);

  return null;
}
