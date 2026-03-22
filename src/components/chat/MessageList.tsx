'use client';

import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import { NeurogenesisSuggestion } from '@/components/chat/NeurogenesisSuggestion';

type MessageListProps = {
  messages: UIMessage[];
  processingToolCalls?: Set<string>;
  onNeurogenesis?: (toolCallId: string, force?: boolean) => Promise<void>;
  onDismiss?: (toolCallId: string) => void;
  isLoading?: boolean;
  addToolResult?: (toolCallId: string, toolName: string, result: string) => void;
};

function ThinkingIndicator() {
  return (
    <div className="flex justify-start px-5 pb-2">
      <div className="mr-12 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">Processing...</span>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  processingToolCalls,
  onNeurogenesis,
  onDismiss,
  isLoading,
  addToolResult,
}: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-4 font-serif text-3xl font-normal tracking-tight text-white/40">
          A blank page.
        </h2>
        <p className="max-w-md font-serif text-[17px] leading-relaxed text-white/30">
          Start a conversation. NeuroGraph will help you crystallize scattered ideas into durable, structured knowledge.
        </p>
      </div>
    );
  }

  // Mostra l'indicatore solo se l'SDK sta ancora elaborando
  // e l'ultimo messaggio visibile è dell'utente (l'AI non ha ancora risposto).
  const showThinking = isLoading && messages.at(-1)?.role === 'user';

  return (
    <div className="space-y-4 px-8 py-8 md:px-12">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <div
            key={message.id}
            className={`flex w-full ${isUser ? 'justify-end mb-8' : 'justify-start mb-12 mt-6'}`}
          >
            {isUser ? (
              <div className="w-full max-w-[65%] pl-8 text-right">
                <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/30">
                  Explorer
                </div>
                {message.parts.map((part, index) => {
                  if (part.type === 'text') {
                    if (!part.text) return null;
                    return (
                      <div
                        key={index}
                        className="inline-block text-[15px] leading-relaxed text-white/50 font-sans transition-all duration-300"
                      >
                        {part.text}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="w-full max-w-4xl pr-4">
                <div className="mb-5 flex items-center gap-4">
                  <div className="h-[1px] w-6 bg-white/10" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                    NeuroGraph
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                </div>

                {message.parts.map((part, index) => {
                  if (part.type === 'text') {
                    if (!part.text) return null;
                    return (
                      <div
                        key={index}
                        className="text-[17px] leading-[1.8] text-white/85 font-serif markdown-content transition-all duration-300"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    );
                  }

                  if (part.type.startsWith('tool-') && 'toolCallId' in part) {
                    const toolName = part.type.replace(/^tool-/, '');
                    const legacyToolName = `suggest_${'crys'}${'tallization'}`;
                    const isSuggestionTool = toolName === legacyToolName || toolName === 'suggest_neurogenesis';

                    if (isSuggestionTool) {
                      const toolPart = part as {
                        type: string;
                        toolCallId: string;
                        state: string;
                        input: Record<string, unknown>;
                      };

                      const toolState: 'call' | 'result' =
                        toolPart.state === 'output-available' ? 'result' : 'call';

                      return (
                        <div key={toolPart.toolCallId} className="my-8">
                          <NeurogenesisSuggestion
                            toolCallId={toolPart.toolCallId}
                            input={toolPart.input as {
                              title?: string;
                              definition?: string;
                              core_insight?: string;
                              bloom_level?: string;
                              related_neurons?: Array<{
                                id: string;
                                title?: string;
                                relationship_type: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
                              }>;
                            }}
                            state={toolPart.state}
                            toolState={toolState}
                            isProcessing={processingToolCalls?.has(toolPart.toolCallId)}
                            onNeurogenesis={(force?: boolean) =>
                              onNeurogenesis?.(toolPart.toolCallId, force) ?? Promise.resolve()
                            }
                            onDismiss={() => onDismiss?.(toolPart.toolCallId)}
                            addResult={(result) =>
                              addToolResult?.(toolPart.toolCallId, toolName, result)
                            }
                          />
                        </div>
                      );
                    }
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}

      {showThinking && <ThinkingIndicator />}
    </div>
  );
}
