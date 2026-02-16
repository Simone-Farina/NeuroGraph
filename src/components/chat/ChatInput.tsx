import { KeyboardEvent } from 'react';

import { isYouTubeUrl } from '@/lib/youtube';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function ChatInput({ value, onChange, onSubmit, disabled = false }: ChatInputProps) {
  const hasYouTubeUrl = isYouTubeUrl(value);

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
      <div className="relative">
        <textarea
          aria-label="Message input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask a question or explore an idea..."
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neural-light outline-none transition-all placeholder:text-neural-light/30 hover:border-white/20 hover:bg-white/10 focus:border-neural-cyan/50 focus:bg-white/10 focus:shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)] min-h-[50px] max-h-[200px]"
          disabled={disabled}
          style={{ minHeight: '50px' }}
        />
        <div className="absolute right-2 bottom-2">
            <button
            type="button"
            aria-label="Send message"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            className={`rounded-lg bg-gradient-to-r from-neural-cyan to-neural-purple p-2 text-white transition-all hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] hover:opacity-90 disabled:cursor-not-allowed disabled:shadow-none ${
              disabled && value.trim() ? 'opacity-80' : 'disabled:opacity-40'
            }`}
            title="Send Message"
            >
            {disabled && value.trim() ? (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            )}
            </button>
        </div>
      </div>
      
      {hasYouTubeUrl && (
        <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-neural-cyan/30 bg-neural-cyan/10 px-2.5 py-1 text-[10px] font-medium text-neural-cyan uppercase tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            YouTube Context Active
            </span>
        </div>
      )}
    </div>
  );
}
