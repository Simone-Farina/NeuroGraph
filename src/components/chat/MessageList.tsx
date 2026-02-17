'use client';

import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { CrystallizationSuggestion } from '@/components/chat/CrystallizationSuggestion';

type MessageListProps = {
  messages: UIMessage[];
  processingToolCalls?: Set<string>;
  onCrystallize?: (toolCallId: string) => void;
  onDismiss?: (toolCallId: string) => void;
};

export function MessageList({ messages, processingToolCalls, onCrystallize, onDismiss }: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center text-sm text-neural-light/50">
        Start a conversation and NeuroGraph will help you turn ideas into durable knowledge.
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-6">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
            <div
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isUser ? 'message-user' : 'message-assistant'}`}
          >
            <div className={`max-w-[85%] ${isUser ? 'ml-12' : 'mr-12'}`}>
              <div className={`mb-1.5 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-neural-cyan' : 'text-neural-purple'}`}>
                  {isUser ? 'You' : 'NeuroGraph'}
                </span>
              </div>
              
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  if (!part.text) return null;
                  return (
                    <div
                      key={index}
                      className={`rounded-2xl px-5 py-3.5 text-sm leading-7 shadow-sm backdrop-blur-sm ${isUser
                          ? 'bg-neural-cyan/10 border border-neural-cyan/20 text-neural-light rounded-tr-sm'
                          : 'bg-white/5 border border-white/10 text-neural-light/90 rounded-tl-sm markdown-content'
                        }`}
                    >
                      {isUser ? (
                        part.text
                      ) : (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]} 
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {part.text}
                        </ReactMarkdown>
                      )}
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
                          related_crystals?: Array<{
                            id: string;
                            title?: string;
                            relationship_type: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
                          }>;
                        }}
                        state={toolPart.state}
                        isProcessing={processingToolCalls?.has(toolPart.toolCallId)}
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
