import { ChatPanel } from '@/components/chat/ChatPanel';
import { GraphPanel } from '@/components/graph/GraphPanel';

export default function AppPage() {
  return (
    <div className="h-[calc(100vh-49px)] overflow-hidden">
      <div className="hidden h-full lg:grid overflow-hidden" style={{ gridTemplateColumns: '35% 65%' }}>
        <ChatPanel />
        <GraphPanel />
      </div>

      <div className="flex h-full items-center justify-center px-6 text-center text-neural-light/70 lg:hidden">
        NeuroGraph is best experienced on desktop.
      </div>
    </div>
  );
}
