'use client';

import { useState } from 'react';

type NeurogenesisSuggestionProps = {
  toolCallId: string;
  input: {
    title?: string;
    definition?: string;
    core_insight?: string;
    bloom_level?: string;
    related_neurons?: Array<{
      id: string;
      title?: string;
      relationship_type: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
    }>;
  };
  state: string;
  /** 'call' = in attesa di conferma utente; 'result' = già eseguito (caricato dal DB) */
  toolState: 'call' | 'result';
  isProcessing?: boolean;
  onNeurogenesis: () => Promise<void>;
  onDismiss: () => void;
  /** Invia il risultato all'AI SDK per sbloccare la risposta di conferma dell'assistente */
  addResult: (result: string) => void;
};

export function NeurogenesisSuggestion({
  input,
  state,
  toolState,
  isProcessing,
  onNeurogenesis,
  onDismiss,
  addResult,
}: NeurogenesisSuggestionProps) {
  // Se il DB riporta toolState 'result', la card parte già in stato di successo.
  const [isSuccess, setIsSuccess] = useState(toolState === 'result');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (isGenerating || isProcessing) return;
    setIsGenerating(true);
    try {
      await onNeurogenesis();
      setIsSuccess(true);
      addResult('Neuron successfully generated.');
    } catch {
      // In caso di errore l'UI rimane invariata (bottone visibile)
    } finally {
      setIsGenerating(false);
    }
  };

  // Stato di successo: generazione avvenuta (locale o proveniente dal DB)
  if (isSuccess || state === 'output-available') {
    const title = input?.title ?? 'Neuron';
    return (
      <div className="neurogenesis-suggestion my-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center gap-3 shadow-[0_0_24px_-6px_rgba(16,185,129,0.25)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-lg">
          ✅
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-400">
            Neuron{' '}
            <span className="text-emerald-300">"{title}"</span>{' '}
            aggiunto alla Rete Neurale
          </p>
          <p className="text-xs text-neural-light/40 mt-0.5">
            Il concetto è stato cristallizzato con successo.
          </p>
        </div>
      </div>
    );
  }

  if (!input) {
    return (
      <div className="neurogenesis-suggestion my-4 rounded-xl border border-neural-purple/20 bg-neural-purple/5 p-5 animate-pulse">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neural-purple/20 text-neural-purple">
            ✨
          </span>
          <p className="text-sm text-neural-light/50">Generating neuron...</p>
        </div>
      </div>
    );
  }

  const title = input.title ?? 'New Neuron';
  const definition = input.definition ?? '';
  const coreInsight = input.core_insight ?? '';
  const bloomLevel = input.bloom_level ?? 'Understand';
  const isDisabled = isGenerating || isProcessing;

  return (
    <div className="neurogenesis-suggestion my-4 rounded-xl border border-neural-purple/30 bg-neural-purple/5 p-5 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(168,85,247,0.15)] hover:border-neural-purple/50 transition-colors">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neural-purple/20 text-neural-purple">
            ✨
          </span>
          <h3 className="text-sm font-bold tracking-wide text-neural-light/90">Potential Neuron</h3>
        </div>
        <span className="rounded-full border border-neural-cyan/30 bg-neural-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neural-cyan">
          {bloomLevel}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-base font-semibold text-neural-light">{title}</p>
        <p className="text-sm leading-relaxed text-neural-light/70">{definition}</p>
      </div>

      {coreInsight && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 px-4 py-3">
          <div className="flex gap-2">
            <span className="text-neural-yellow/80 shrink-0">💡</span>
            <p className="text-xs italic text-neural-light/60 leading-relaxed">{coreInsight}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isDisabled}
          className="flex-1 rounded-lg bg-gradient-to-r from-neural-cyan to-neural-purple px-4 py-2 text-xs font-bold text-white shadow-lg shadow-neural-purple/20 transition-all hover:shadow-neural-purple/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isDisabled ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating...
            </span>
          ) : (
            'Generate Neuron'
          )}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isDisabled}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-neural-light/60 transition-all hover:bg-white/10 hover:text-neural-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
