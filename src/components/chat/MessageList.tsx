'use client';

import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useGraphStore } from '@/stores/graphStore';

type MessageListProps = {
  messages: UIMessage[];
  isLoading?: boolean;
  sentinelRef?: RefObject<HTMLDivElement | null>;
};

export function bloomToHighlightClass(level: string | null): string {
  switch (level) {
    case 'Remember':   return 'bg-sky-400/10';
    case 'Understand': return 'bg-teal-400/10';
    case 'Apply':      return 'bg-emerald-400/10';
    case 'Analyze':    return 'bg-amber-400/15';
    case 'Evaluate':   return 'bg-orange-400/15';
    case 'Create':     return 'bg-yellow-300/15';
    default:           return '';
  }
}

export function renderHighlightedText(
  text: string,
  phrases: string[],
  isHighlighted: boolean,
  highlightClass: string
): React.ReactNode {
  if (phrases.length === 0) return text;

  // Escape regex metacharacters in each phrase, then build a single capturing-group pattern
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  // String.split() with a capturing group places matches at odd indices
  // Always render spans so CSS transition can animate the fade-out
  return parts.map((part, i) => {
    const isMatch = i % 2 === 1;
    return isMatch ? (
      <span
        key={i}
        className={`rounded-sm transition-colors duration-700 motion-reduce:duration-200 ${isHighlighted ? highlightClass : ''}`}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

export function useBloomHighlight() {
  const bloomKeyPhrases = useGraphStore((s) => s.bloomKeyPhrases);
  const latestBloomMessageId = useGraphStore((s) => s.latestBloomMessageId);
  const bloomLevel = useGraphStore((s) => s.bloomLevel);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    if (bloomKeyPhrases.length === 0) {
      setIsHighlighted(false);
      return;
    }
    // D-10: fade in when evaluator returns
    setIsHighlighted(true);
    // D-11: fade out after 5 seconds
    const timer = setTimeout(() => setIsHighlighted(false), 5000);
    return () => clearTimeout(timer);
  }, [bloomKeyPhrases]);

  return { isHighlighted, bloomKeyPhrases, latestBloomMessageId, bloomLevel };
}

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

export function MessageList({ messages, isLoading, sentinelRef }: MessageListProps) {
  const { isHighlighted, bloomKeyPhrases, latestBloomMessageId, bloomLevel } = useBloomHighlight();
  const highlightClass = bloomToHighlightClass(bloomLevel);

  if (!messages.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-4 font-serif text-3xl font-normal tracking-tight text-white/40">
          A blank page.
        </h2>
        <p className="max-w-md font-serif text-[17px] leading-relaxed text-white/30">
          Start a conversation. Explore ideas, build understanding, and grow your knowledge graph.
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
                    // D-07: Only highlight the most recent user message (matched by ID)
                    // D-09: Assistant messages are never highlighted (this block is user-only)
                    const isBloomTarget = message.id === latestBloomMessageId && bloomKeyPhrases.length > 0;
                    return (
                      <div
                        key={index}
                        className="inline-block text-[15px] leading-relaxed text-white/50 font-sans transition-all duration-300"
                      >
                        {isBloomTarget
                          ? renderHighlightedText(part.text, bloomKeyPhrases, isHighlighted, highlightClass)
                          : part.text}
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
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
