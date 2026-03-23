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
      <div className="neurogenesis-suggestion my-8 pl-5 border-l-2 border-emerald-700/30 animate-in fade-in duration-500">
        <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-500/50 mb-2">
          Knowledge Consolidated
        </p>
        <p className="text-[15px] font-serif text-white/70">
          The concept <span className="text-white/90">"{title}"</span> has been permanently etched into your knowledge graph.
        </p>
      </div>
    );
  }

  const isInputComplete = input && Object.keys(input).length > 0 && input.definition;

  if (!isInputComplete) {
    return (
      <div className="neurogenesis-suggestion my-8 pl-5 border-l border-amber-500/20">
        <p className="text-[14px] font-serif italic text-white/40 flex items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500/40 animate-pulse" />
          {input?.title ? `Crystallizing "${input.title}"...` : 'Synthesizing new neuron...'}
        </p>
      </div>
    );
  }

  const title = input.title ?? 'New Neuron';
  const definition = input.definition ?? '';
  const coreInsight = input.core_insight ?? '';
  const bloomLevel = input.bloom_level ?? 'Understand';
  const isDisabled = isGenerating || isProcessing;

  return (
    <div className="neurogenesis-suggestion my-10 pl-5 border-l-2 border-white/10 group transition-colors hover:border-white/20">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-widest text-amber-500/60">Candidate Neuron</h3>
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
          {bloomLevel}
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="text-2xl font-serif text-white/90 leading-tight">{title}</h4>
        <p className="text-[15px] font-serif leading-relaxed text-white/70">{definition}</p>
      </div>

      {coreInsight && (
        <div className="mt-5 pt-5 border-t border-white/5">
          <p className="text-[14px] font-serif leading-relaxed text-white/50 italic">
            &quot;{coreInsight}&quot;
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center gap-5">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isDisabled}
          className="bg-white/90 hover:bg-white text-black px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDisabled ? 'Committing...' : 'Commit to Graph'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isDisabled}
          className="text-[12px] font-medium uppercase tracking-wider text-white/30 hover:text-white/70 transition-colors disabled:opacity-40"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
