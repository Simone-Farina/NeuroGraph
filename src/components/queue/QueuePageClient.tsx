'use client';

import { useEffect, useState } from 'react';
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
    pendingById,
    refreshQueue,
    transitionItem,
    deleteItem,
    beginCrystallize,
  } = useQueueStore();
  const [feedbackItemId, setFeedbackItemId] = useState<string | null>(null);

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
      setFeedbackItemId(item.id);
      void transitionItem(item.id, 'passive_debt');
    }
  };

  const handleMarkPassiveDebt = (item: KnowledgeQueueItem) => {
    if (item.state === 'inbox' || item.state === 'resource') {
      setFeedbackItemId(item.id);
      void transitionItem(item.id, 'passive_debt');
    }
  };

  const handleArchiveResource = (item: KnowledgeQueueItem) => {
    if (item.state === 'inbox') {
      setFeedbackItemId(item.id);
      void transitionItem(item.id, 'resource');
    }
  };

  const handleCrystallize = (item: KnowledgeQueueItem) => {
    beginCrystallize(item.id);
    router.push('/app');
  };

  const handleDelete = (item: KnowledgeQueueItem) => {
    setFeedbackItemId(item.id);
    void deleteItem(item.id);
  };

  if (isLoading && sections.every((section) => section.items.length === 0)) {
    return (
      <div className="min-h-full px-6 py-10 md:px-12">
        <p className="text-[13px] font-medium tracking-wide text-white/30 uppercase">
          Staging Area
        </p>
        <p className="mt-4 text-sm text-white/45">Gathering the queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full px-6 py-8 md:px-12">
      <header className="mb-10 pb-6 border-b border-white/[0.04]">
        <p className="text-[11px] font-medium tracking-widest text-white/30 uppercase mb-2">
          Staging Area
        </p>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-white/90">Queue</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/45 font-serif">
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
                pendingState={pendingById[item.id]}
                errorMessage={feedbackItemId === item.id ? error : null}
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
