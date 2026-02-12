'use client';

import { KeyboardEvent } from 'react';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function ChatInput({ value, onChange, onSubmit, disabled = false }: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-neural-gray-700 bg-neural-gray-900/70 p-4">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Ask a question or explore an idea..."
        className="w-full resize-none rounded-xl border border-neural-gray-700 bg-neural-gray-800 px-3 py-2 text-sm text-neural-light outline-none transition focus:border-neural-cyan"
        disabled={disabled}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-gradient-to-r from-neural-cyan to-neural-purple px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
