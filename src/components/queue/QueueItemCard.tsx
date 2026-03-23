'use client';

import { useEffect, useState } from 'react';

import type { KnowledgeQueueItem } from '@/types/database';
import { getQueueAgeMeta } from '@/lib/queue/age';

type QueueItemCardProps = {
  item: KnowledgeQueueItem;
  pendingState?: 'transition' | 'delete';
  errorMessage?: string | null;
  onOpenUrl?: (item: KnowledgeQueueItem) => void;
  onMarkPassiveDebt?: (item: KnowledgeQueueItem) => void;
  onArchiveResource?: (item: KnowledgeQueueItem) => void;
  onCrystallize?: (item: KnowledgeQueueItem) => void;
  onDelete?: (item: KnowledgeQueueItem) => void;
};

function actionClassName(disabled = false, danger = false) {
  if (disabled) {
    return 'text-[12px] text-white/20 cursor-not-allowed transition-colors';
  }

  if (danger) {
    return 'text-[12px] text-semantic-terracotta transition-colors hover:text-semantic-terracotta/80';
  }

  return 'text-[12px] text-white/40 transition-colors hover:text-white/80';
}

export function QueueItemCard({
  item,
  pendingState,
  errorMessage,
  onOpenUrl,
  onMarkPassiveDebt,
  onArchiveResource,
  onCrystallize,
  onDelete,
}: QueueItemCardProps) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const ageMeta = item.state === 'passive_debt' ? getQueueAgeMeta(item.created_at) : null;
  const ageClassName =
    ageMeta?.isRusty
      ? 'text-semantic-terracotta'
      : 'text-white/30';
  const isPending = Boolean(pendingState);

  const showArchive = item.state === 'inbox';
  const showMarkPassiveDebt = item.state === 'inbox' || item.state === 'resource';
  const showCrystallize = item.state !== 'resource';

  useEffect(() => {
    if (!deleteArmed) return;

    const timer = window.setTimeout(() => {
      setDeleteArmed(false);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [deleteArmed]);

  useEffect(() => {
    if (pendingState === 'delete') {
      setDeleteArmed(false);
    }
  }, [pendingState]);

  const handleDeleteClick = () => {
    if (isPending) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }

    onDelete?.(item);
  };

  const handleOpenUrl = () => {
    if (isPending) return;
    onOpenUrl?.(item);
  };

  return (
    <article className="group relative border-b border-white/[0.04] py-6 last:border-0 hover:bg-white/[0.01] transition-colors rounded-lg -mx-4 px-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium tracking-wide uppercase text-white/30 mb-2">
            {item.source_domain ? <span>{item.source_domain}</span> : null}
            {item.estimated_read_time ? <span>{item.estimated_read_time} min read</span> : null}
            {ageMeta ? (
              <span
                className={ageClassName}
                data-rusty={ageMeta.isRusty ? 'true' : 'false'}
              >
                {ageMeta.label}
              </span>
            ) : null}
            {isPending ? (
              <span className="text-white/30" aria-live="polite">
                {pendingState === 'delete' ? 'Removing...' : 'Updating...'}
              </span>
            ) : null}
          </div>

          <h3 className="font-serif text-xl tracking-tight text-white/90">{item.title}</h3>

          {item.notes ? (
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-white/60 font-serif">{item.notes}</p>
          ) : null}

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={handleOpenUrl}
              aria-label={`Open ${item.title}`}
              aria-disabled={isPending ? 'true' : 'false'}
              className={`mt-3 inline-flex items-center gap-2 text-[13px] transition-colors max-w-full ${
                isPending
                  ? 'pointer-events-none text-white/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="truncate">{item.url}</span>
            </a>
          ) : null}
        </div>

        {ageMeta?.isRusty ? <div className="absolute left-0 top-6 bottom-6 w-[2px] rounded-full bg-semantic-terracotta/40" /> : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        {showMarkPassiveDebt ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onMarkPassiveDebt?.(item)}
            className={actionClassName(isPending)}
          >
            {item.state === 'resource' ? 'Return to Passive Debt' : 'Mark as Read'}
          </button>
        ) : null}

        {showArchive ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onArchiveResource?.(item)}
            className={actionClassName(isPending)}
          >
            Archive as Resource
          </button>
        ) : null}

        {showCrystallize ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onCrystallize?.(item)}
            className={actionClassName(isPending)}
          >
            Crystallize
          </button>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          onClick={handleDeleteClick}
          className={actionClassName(isPending, deleteArmed)}
        >
          {deleteArmed ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>

      {deleteArmed && !isPending ? (
        <p className="mt-3 text-[12px] text-semantic-terracotta" aria-live="polite">
          Second click deletes this item permanently.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 text-[12px] text-semantic-terracotta" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
