'use client';

import { CrystallizationSuggestion as CrystallizationSuggestionType } from '@/types/chat';

type CrystallizationSuggestionProps = {
  suggestion: CrystallizationSuggestionType;
  onCrystallize: () => void;
  onDismiss: () => void;
};

export function CrystallizationSuggestion({
  suggestion,
  onCrystallize,
  onDismiss,
}: CrystallizationSuggestionProps) {
  return (
    <div className="crystallization-suggestion mx-5 mb-4 rounded-2xl border border-neural-purple/40 bg-neural-purple/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-neural-light">Potential Crystal</h3>
        <span className="rounded-full border border-neural-cyan/40 bg-neural-cyan/10 px-2 py-1 text-xs text-neural-cyan">
          {suggestion.bloomLevel}
        </span>
      </div>

      <p className="text-sm font-medium text-neural-light">{suggestion.title}</p>
      <p className="mt-1 text-sm text-neural-light/70">{suggestion.definition}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onCrystallize}
          className="rounded-lg bg-gradient-to-r from-neural-cyan to-neural-purple px-3 py-1.5 text-xs font-medium text-white"
        >
          Crystallize
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-neural-gray-700 px-3 py-1.5 text-xs text-neural-light/70"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
