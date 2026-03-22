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
    return 'text-[11px] text-white/20 cursor-not-allowed transition-colors';
  }

  if (danger) {
    return 'text-[11px] text-white/35 transition-colors hover:text-[color:rgba(194,107,84,0.95)]';
  }

  return 'text-[11px] text-white/35 transition-colors hover:text-white/75';
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
      ? 'text-[color:rgba(194,107,84,0.92)]'
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
    <article className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/30">
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

          <h3 className="mt-2 font-serif text-xl tracking-tight text-white/88">{item.title}</h3>

          {item.notes ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{item.notes}</p>
          ) : null}

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={handleOpenUrl}
              aria-label={`Open ${item.title}`}
              aria-disabled={isPending ? 'true' : 'false'}
              className={`mt-3 inline-flex items-center gap-2 text-sm transition-colors ${
                isPending
                  ? 'pointer-events-none text-white/30'
                  : 'text-white/52 hover:text-white/82'
              }`}
            >
              <span className="truncate">{item.url}</span>
            </a>
          ) : null}
        </div>

        {ageMeta?.isRusty ? <div className="h-full w-px bg-[color:rgba(194,107,84,0.38)]" /> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
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
        <p className="mt-3 text-[11px] text-[color:rgba(194,107,84,0.88)]" aria-live="polite">
          Second click deletes this item permanently.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 text-[11px] text-[color:rgba(194,107,84,0.88)]" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
