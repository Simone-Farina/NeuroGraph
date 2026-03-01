import { ChatPanel } from '@/components/chat/ChatPanel';

export default function AppPage() {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ChatPanel />
    </div>
  );
}
