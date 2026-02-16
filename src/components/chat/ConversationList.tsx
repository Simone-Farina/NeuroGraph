'use client';

import type { ConversationSummary } from '@/types/chat';

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onNew: () => void;
}

export function ConversationList({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onNew,
}: ConversationListProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/5 p-4 lg:flex lg:flex-col bg-neural-dark/30">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neural-light/40">Conversations</p>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neural-light/80 transition hover:bg-white/10 hover:text-neural-cyan hover:border-neural-cyan/30"
        >
          + New Chat
        </button>
      </div>
      <div className="space-y-1 overflow-y-auto pr-1 flex-1 scrollbar-hide">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                currentId === conversation.id
                  ? 'border-neural-cyan/30 bg-neural-cyan/5 text-neural-cyan shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]'
                  : 'border-transparent text-neural-light/60 hover:bg-white/5 hover:text-neural-light'
              }`}
            >
              <p className="truncate font-medium pr-6">{conversation.title}</p>
              <p className="truncate text-[10px] text-neural-light/30 mt-0.5 group-hover:text-neural-light/50 transition-colors">
                {new Date(conversation.updated_at).toLocaleDateString()}
              </p>
            </button>
            <button
              type="button"
              onClick={(e) => onDelete(e, conversation.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-neural-light/30 hover:text-red-400 transition-all"
              title="Delete conversation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
