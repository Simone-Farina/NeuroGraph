'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { KnowledgeQueueItem } from '@/types/database';
import { useQueueStore } from '@/stores/queueStore';
import { QueueItemCard } from './QueueItemCard';
import { QueueSection } from './QueueSection';

export function QueuePageClient() {
  const router = useRouter();
  const {
    groupedItems,
    isLoading,
    error,
    refreshQueue,
    transitionItem,
    deleteItem,
    beginCrystallize,
  } = useQueueStore();

  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  const sections = [
    {
      key: 'inbox' as const,
      title: 'Inbox',
      subtitle: 'Fresh captures waiting to be consciously opened.',
      emptyMessage: 'No fresh captures. The inbox is quiet for now.',
      items: groupedItems.inbox,
    },
    {
      key: 'passive_debt' as const,
      title: 'Passive Debt',
      subtitle: 'Consumed, but not yet turned into understanding.',
      emptyMessage: 'No lingering debt. Nothing is quietly rusting at the moment.',
      items: groupedItems.passive_debt,
    },
    {
      key: 'resource' as const,
      title: 'Resources',
      subtitle: 'Set aside intentionally, without urgency.',
      emptyMessage: 'No archived resources yet.',
      items: groupedItems.resource,
    },
  ];

  const handleOpenUrl = (item: KnowledgeQueueItem) => {
    if (item.state === 'inbox' && item.url) {
      void transitionItem(item.id, 'passive_debt');
    }
  };

  const handleMarkPassiveDebt = (item: KnowledgeQueueItem) => {
    if (item.state === 'inbox' || item.state === 'resource') {
      void transitionItem(item.id, 'passive_debt');
    }
  };

  const handleArchiveResource = (item: KnowledgeQueueItem) => {
    if (item.state === 'inbox') {
      void transitionItem(item.id, 'resource');
    }
  };

  const handleCrystallize = (item: KnowledgeQueueItem) => {
    beginCrystallize(item.id);
    router.push('/app');
  };

  const handleDelete = (item: KnowledgeQueueItem) => {
    void deleteItem(item.id);
  };

  if (isLoading && sections.every((section) => section.items.length === 0)) {
    return (
      <div className="min-h-full px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/25">
          Staging Area
        </p>
        <p className="mt-4 text-sm text-white/45">Gathering the queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full px-6 py-8">
      <header className="mb-8 border-b border-white/5 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/25">
          Staging Area
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-white/90">Queue</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
          A calm index of what you have captured, what is quietly lingering, and what has been set aside.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">
          {error}
        </div>
      ) : null}

      <div className="space-y-8">
        {sections.map((section) => (
          <QueueSection
            key={section.key}
            title={section.title}
            subtitle={section.subtitle}
            count={section.items.length}
            emptyMessage={section.emptyMessage}
          >
            {section.items.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onOpenUrl={handleOpenUrl}
                onMarkPassiveDebt={handleMarkPassiveDebt}
                onArchiveResource={handleArchiveResource}
                onCrystallize={handleCrystallize}
                onDelete={handleDelete}
              />
            ))}
          </QueueSection>
        ))}
      </div>
    </div>
  );
}
