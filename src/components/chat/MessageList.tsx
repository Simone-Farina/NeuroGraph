'use client';

import { ChatMessage } from '@/types/chat';

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center text-sm text-neural-light/50">
        Start a conversation and NeuroGraph will help you turn ideas into durable knowledge.
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 py-5">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                isUser
                  ? 'bg-neural-cyan/20 border border-neural-cyan/40 text-neural-light'
                  : 'bg-neural-gray-800 border border-neural-gray-700 text-neural-light/90'
              }`}
            >
              {message.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
