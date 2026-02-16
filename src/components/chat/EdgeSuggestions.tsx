'use client';

import type { EdgeSuggestion } from '@/types/chat';
import { edgeSuggestionKey } from './utils';

interface EdgeSuggestionsProps {
  suggestions: EdgeSuggestion[];
  onConfirm: (suggestion: EdgeSuggestion) => Promise<void>;
  onDismiss: (suggestionId: string) => void;
}

export function EdgeSuggestions({
  suggestions,
  onConfirm,
  onDismiss,
}: EdgeSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mx-6 mb-4 rounded-xl border border-white/10 bg-neural-gray-900/60 p-4 backdrop-blur-md shadow-2xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neural-light/40 mb-3">
        Suggested Connections
      </p>
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const suggestionId = edgeSuggestionKey(suggestion);
          const relationshipLabel = suggestion.type.toLowerCase().replace('_', ' ');

          return (
            <div
              key={suggestionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neural-light">
                  {suggestion.target_title}
                </p>
                <p className="text-xs text-neural-light/40 flex items-center gap-1.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      suggestion.source === 'vector' ? 'bg-neural-purple' : 'bg-neural-cyan'
                    }`}
                  />
                  {relationshipLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void onConfirm(suggestion);
                  }}
                  className="rounded-md bg-neural-cyan/10 border border-neural-cyan/20 px-3 py-1.5 text-xs font-semibold text-neural-cyan transition hover:bg-neural-cyan/20 hover:border-neural-cyan/40 hover:shadow-[0_0_10px_-2px_rgba(6,182,212,0.3)]"
                >
                  Connect
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(suggestionId)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-neural-light/50 transition hover:bg-white/5 hover:text-neural-light/80"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
