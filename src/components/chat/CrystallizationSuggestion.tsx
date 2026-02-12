'use client';

type CrystallizationSuggestionProps = {
  toolCallId: string;
  input: {
    title?: string;
    definition?: string;
    core_insight?: string;
    bloom_level?: string;
  };
  state: string;
  onCrystallize: () => void;
  onDismiss: () => void;
};

export function CrystallizationSuggestion({
  input,
  state,
  onCrystallize,
  onDismiss,
}: CrystallizationSuggestionProps) {
  const title = input.title ?? 'New Insight';
  const definition = input.definition ?? '';
  const coreInsight = input.core_insight ?? '';
  const bloomLevel = input.bloom_level ?? 'Understand';

  // Hide when the tool call has received a result (crystallized or dismissed)
  if (state === 'output-available') {
    return null;
  }

  return (
    <div className="crystallization-suggestion my-3 rounded-2xl border border-neural-purple/40 bg-neural-purple/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-neural-light">✨ Potential Crystal</h3>
        <span className="rounded-full border border-neural-cyan/40 bg-neural-cyan/10 px-2 py-1 text-xs text-neural-cyan">
          {bloomLevel}
        </span>
      </div>

      <p className="text-sm font-medium text-neural-light">{title}</p>
      <p className="mt-1 text-sm text-neural-light/70">{definition}</p>

      {coreInsight && (
        <p className="mt-2 rounded-lg border border-neural-gray-700 bg-neural-gray-800/50 px-3 py-2 text-xs italic text-neural-light/60">
          💡 {coreInsight}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onCrystallize}
          className="rounded-lg bg-gradient-to-r from-neural-cyan to-neural-purple px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
        >
          Crystallize
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-neural-gray-700 px-3 py-1.5 text-xs text-neural-light/70 transition hover:border-neural-gray-600"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
