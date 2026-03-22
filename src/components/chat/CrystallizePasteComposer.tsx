'use client';

import { useState } from 'react';

type CrystallizePasteComposerProps = {
  conversationId: string;
  queueItemId: string;
  onComplete: () => Promise<void>;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return fallback;
}

export function CrystallizePasteComposer({
  conversationId,
  queueItemId,
  onComplete,
}: CrystallizePasteComposerProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = value.trim().length >= 500 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/crystallize/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          queueItemId,
          pastedText: value,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getErrorMessage(payload, 'Unable to continue crystallization right now.'));
      }

      setValue('');
      await onComplete();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to continue crystallization right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-5 mb-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white/78">Paste the source text and continue.</p>
        <p className="text-sm text-white/52">
          We will compress it into a briefing and continue the conversation.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={8}
        placeholder="Paste the article or source text here..."
        className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-neural-dark/70 px-4 py-3 text-sm leading-relaxed text-white/86 outline-none transition placeholder:text-white/28 focus:border-white/18"
        disabled={isSubmitting}
        aria-label="Crystallize source text"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/30">
          {isSubmitting ? 'Compressing source…' : `${value.trim().length} characters`}
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-full border border-white/12 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:border-white/8 disabled:text-white/25"
        >
          Continue
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-orange-400/80">{error}</p> : null}
    </section>
  );
}
