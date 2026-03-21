'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { HorizonBriefingPanel } from '@/components/graph/HorizonBriefingPanel';
import { ReviewMode } from '@/components/graph/ReviewMode';
import { useGraphStore } from '@/stores/graphStore';

export default function AppPage() {
  const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {leftPanelMode === 'briefing' ? <HorizonBriefingPanel /> : leftPanelMode === 'review' ? <ReviewMode /> : <ChatPanel />}
    </div>
  );
}
