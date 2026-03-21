'use client';

import { useState } from 'react';
import { BouncerCard } from '@/components/chat/BouncerCard';

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
  onNeurogenesis: (force?: boolean) => Promise<void>;
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
  const [collisionData, setCollisionData] = useState<{ matchId: string; matchTitle: string; insightText: string } | null>(null);

  const handleGenerate = async (force = false) => {
    if (isGenerating || isProcessing) return;
    setIsGenerating(true);
    setCollisionData(null);
    try {
      await onNeurogenesis(force);
      setIsSuccess(true);
      addResult('Neuron successfully generated.');
    } catch (err: any) {
      if (err && err.type === 'collision') {
        setCollisionData(err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (collisionData) {
    return (
      <BouncerCard
        matchId={collisionData.matchId}
        matchTitle={collisionData.matchTitle}
        insightText={collisionData.insightText}
        onAppendSuccess={() => {
          setIsSuccess(true);
          setCollisionData(null);
          addResult('Appended to existing neuron.');
        }}
        onForceNew={() => handleGenerate(true)}
        onDismiss={onDismiss}
      />
    );
  }

  // Stato di successo: generazione avvenuta (locale o proveniente dal DB)
  if (isSuccess || state === 'output-available') {
    const title = input?.title ?? 'Neuron';
    return (
      <div className="neurogenesis-suggestion my-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-lg">
          <span className="text-white/50 mb-0.5">●</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
            Neuron Synapsed
          </p>
          <p className="text-[15px] font-serif text-white/90 truncate">
            &quot;{title}&quot; added to your Neural Network.
          </p>
        </div>
      </div>
    );
  }

  const isInputComplete = input && Object.keys(input).length > 0 && input.definition;

  if (!isInputComplete) {
    return (
      <div className="neurogenesis-suggestion my-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {input?.title ? `Synthesizing "${input.title}"...` : 'Synthesizing Neuron...'}
          </p>
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
    <div className="neurogenesis-suggestion my-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl transition-all duration-300 hover:border-white/20 group">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-white/40 ring-4 ring-white/5" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">Insight Detected</h3>
        </div>
        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50">
          {bloomLevel}
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-xl font-serif font-medium text-white/90 leading-tight">{title}</p>
        <p className="text-[15px] font-serif leading-relaxed text-white/70">{definition}</p>
      </div>

      {coreInsight && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-[15px] font-serif leading-relaxed text-white/60 italic">
            &quot;{coreInsight}&quot;
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isDisabled}
          className="flex-1 rounded-xl bg-white/90 px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDisabled ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              Processing...
            </span>
          ) : (
            'Commit to Network'
          )}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isDisabled}
          className="rounded-xl border border-white/10 bg-transparent px-6 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
