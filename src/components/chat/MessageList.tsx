'use client';

import type { UIMessage } from 'ai';
import { CrystallizationSuggestion } from '@/components/chat/CrystallizationSuggestion';

type MessageListProps = {
  messages: UIMessage[];
  onCrystallize?: (toolCallId: string) => void;
  onDismiss?: (toolCallId: string) => void;
};

export function MessageList({ messages, onCrystallize, onDismiss }: MessageListProps) {
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
            <div className="max-w-[88%]">
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  if (!part.text) return null;
                  return (
                    <div
                      key={index}
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser
                          ? 'bg-neural-cyan/20 border border-neural-cyan/40 text-neural-light'
                          : 'bg-neural-gray-800 border border-neural-gray-700 text-neural-light/90'
                        }`}
                    >
                      {part.text}
                    </div>
                  );
                }

                // Tool invocation parts have type 'tool-{toolName}'
                if (part.type.startsWith('tool-') && 'toolCallId' in part) {
                  const toolName = part.type.replace(/^tool-/, '');
                  if (toolName === 'suggest_crystallization') {
                    const toolPart = part as {
                      type: string;
                      toolCallId: string;
                      state: string;
                      input: Record<string, unknown>;
                    };
                    return (
                      <CrystallizationSuggestion
                        key={toolPart.toolCallId}
                        toolCallId={toolPart.toolCallId}
                        input={toolPart.input as {
                          title?: string;
                          definition?: string;
                          core_insight?: string;
                          bloom_level?: string;
                        }}
                        state={toolPart.state}
                        onCrystallize={() => onCrystallize?.(toolPart.toolCallId)}
                        onDismiss={() => onDismiss?.(toolPart.toolCallId)}
                      />
                    );
                  }
                }

                return null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
