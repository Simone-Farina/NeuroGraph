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
    <div className="border-t border-white/5 bg-neural-dark/80 backdrop-blur-xl p-4">
      <div className="relative flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/10 focus-within:border-neural-cyan/50 focus-within:bg-white/10 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask a question or explore an idea..."
          className="flex-1 resize-none bg-transparent text-sm text-neural-light outline-none placeholder:text-neural-light/30 min-h-[24px] max-h-[200px]"
          disabled={disabled}
          style={{ minHeight: '24px' }}
          data-tour="chat-input"
          aria-label="Message input"
        />
        <div className="shrink-0">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20 hover:shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]"
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
              className="rounded-lg bg-gradient-to-r from-neural-cyan to-neural-purple p-2 text-white transition-all hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
        <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-neural-cyan/30 bg-neural-cyan/10 px-2.5 py-1 text-[10px] font-medium text-neural-cyan uppercase tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            YouTube Context Active
            </span>
        </div>
      )}
    </div>
  );
}
