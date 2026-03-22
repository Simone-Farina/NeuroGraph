'use client';

import type { KnowledgeQueueItem } from '@/types/database';
import { getQueueAgeMeta } from '@/lib/queue/age';

type QueueItemCardProps = {
  item: KnowledgeQueueItem;
  onOpenUrl?: (item: KnowledgeQueueItem) => void;
  onMarkPassiveDebt?: (item: KnowledgeQueueItem) => void;
  onArchiveResource?: (item: KnowledgeQueueItem) => void;
  onCrystallize?: (item: KnowledgeQueueItem) => void;
  onDelete?: (item: KnowledgeQueueItem) => void;
};

function actionClassName() {
  return 'text-[11px] text-white/35 transition-colors hover:text-white/75';
}

export function QueueItemCard({
  item,
  onOpenUrl,
  onMarkPassiveDebt,
  onArchiveResource,
  onCrystallize,
  onDelete,
}: QueueItemCardProps) {
  const ageMeta = item.state === 'passive_debt' ? getQueueAgeMeta(item.created_at) : null;
  const ageClassName =
    ageMeta?.isRusty
      ? 'text-orange-400/80'
      : 'text-white/30';

  const showArchive = item.state === 'inbox';
  const showMarkPassiveDebt = item.state === 'inbox' || item.state === 'resource';
  const showCrystallize = item.state !== 'resource';

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
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
              onClick={() => onOpenUrl?.(item)}
              aria-label={`Open ${item.title}`}
              className="mt-3 inline-flex items-center gap-2 text-sm text-white/52 transition-colors hover:text-white/82"
            >
              <span className="truncate">{item.url}</span>
            </a>
          ) : null}
        </div>

        {ageMeta?.isRusty ? <div className="h-full w-px bg-orange-400/40" /> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {showMarkPassiveDebt ? (
          <button
            type="button"
            onClick={() => onMarkPassiveDebt?.(item)}
            className={actionClassName()}
          >
            {item.state === 'resource' ? 'Return to Debt' : 'Mark Read'}
          </button>
        ) : null}

        {showArchive ? (
          <button
            type="button"
            onClick={() => onArchiveResource?.(item)}
            className={actionClassName()}
          >
            Archive
          </button>
        ) : null}

        {showCrystallize ? (
          <button
            type="button"
            onClick={() => onCrystallize?.(item)}
            className={actionClassName()}
          >
            Crystallize
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onDelete?.(item)}
          className={actionClassName()}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
