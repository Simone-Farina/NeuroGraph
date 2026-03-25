'use client';

import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

type MessageListProps = {
  messages: UIMessage[];
  isLoading?: boolean;
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

export function MessageList({ messages, isLoading }: MessageListProps) {
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

  // Show indicator only if the SDK is still processing
  // and the last visible message is from the user (AI has not yet responded).
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
