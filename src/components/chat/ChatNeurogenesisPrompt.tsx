'use client';

import { useState } from 'react';

type ChatNeurogenesisPromptProps = {
  conversationId: string;
  onSuccess: (neuron: Record<string, unknown>, synapses: Record<string, unknown>[]) => void;
  onDismiss: () => void;
};

export function ChatNeurogenesisPrompt({
  conversationId,
  onSuccess,
  onDismiss,
}: ChatNeurogenesisPromptProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/neurogenesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        const { neuron, synapses } = await response.json();
        onSuccess(neuron, synapses);
        setFeedback({
          type: 'success',
          message: `"${neuron.title}" saved`,
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        let errorMessage = 'Neurogenesis failed';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorMessage;
        } catch {
          // keep default message if parse fails
        }
        setFeedback({ type: 'error', message: errorMessage });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error — please try again' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-1 mb-3 pl-5 border-l-2 border-amber-500/20 py-3 animate-in fade-in duration-300">
      <p className="text-[10px] font-medium uppercase tracking-widest text-amber-500/50 mb-2">
        Ready to extract
      </p>
      <p className="text-[14px] font-serif leading-relaxed text-white/60 mb-4">
        Your conversation has reached a point of deep insight. Save it to your knowledge graph?
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="text-[11px] font-medium uppercase tracking-wider text-white/90 bg-white/[0.06] border border-white/10 px-4 py-2 transition-all duration-300 hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Saving...' : 'Save to graph'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isGenerating}
          className="text-[11px] font-medium uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
        >
          Dismiss
        </button>
      </div>
      {feedback && (
        <span
          className={
            feedback.type === 'success'
              ? 'text-emerald-400/80 text-[10px] mt-2 block'
              : 'text-red-400/80 text-[10px] mt-2 block'
          }
        >
          {feedback.message}
        </span>
      )}
    </div>
  );
}
