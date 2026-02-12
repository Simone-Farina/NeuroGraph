import { ChatPanel } from '@/components/chat/ChatPanel';
import { GraphPanel } from '@/components/graph/GraphPanel';

export default function AppPage() {
  return (
    <div className="min-h-[calc(100vh-73px)]">
      <div className="hidden h-[calc(100vh-73px)] grid-cols-[2fr_3fr] lg:grid">
        <ChatPanel />
        <GraphPanel />
      </div>

      <div className="flex h-[calc(100vh-73px)] items-center justify-center px-6 text-center text-neural-light/70 lg:hidden">
        NeuroGraph is best experienced on desktop.
      </div>
    </div>
  );
}
