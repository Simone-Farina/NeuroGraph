import { KeyboardEvent } from 'react';

import { isYouTubeUrl } from '@/lib/youtube';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isStreaming = false,
  onStop,
  disabled = false,
}: ChatInputProps) {
  const hasYouTubeUrl = isYouTubeUrl(value);
  const isSending = disabled && !isStreaming && Boolean(value.trim());

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative w-full shrink-0 bg-gradient-to-t from-neural-gray-900/90 via-neural-gray-900/50 to-transparent pt-8 pb-6 px-6 md:px-12 z-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="relative flex items-end gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 shadow-sm backdrop-blur-xl transition-all focus-within:border-white/[0.12] focus-within:bg-white/[0.04]">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question or explore an idea..."
            className="flex-1 resize-none bg-transparent py-1 text-[15px] text-white/80 outline-none placeholder:text-white/30 min-h-[24px] max-h-[30vh] font-serif leading-relaxed"
            disabled={disabled}
            style={{ minHeight: '32px' }}
            data-tour="chat-input"
            aria-label="Message input"
          />
          <div className="shrink-0 pb-0.5">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="rounded-lg p-2 text-red-400/80 transition-all hover:bg-red-500/10 hover:text-red-400"
                title="Stop Generating"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <rect x="5" y="5" width="10" height="10" rx="1" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={disabled || !value.trim()}
                className="rounded-lg p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white/90 disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:bg-transparent"
                title="Send Message"
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`}
                >
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {hasYouTubeUrl && (
          <div className="mt-3 flex items-center justify-center">
            <span className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[10px] font-medium text-white/50 uppercase tracking-widest backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-80">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              YouTube Context Active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
