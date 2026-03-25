'use client';

import { useState } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useConversationContext } from '@/lib/contexts/ConversationContext';

const ANALYZE_LEVELS = ['Analyze', 'Evaluate', 'Create'];
const CONFIDENCE_THRESHOLD = 0.75;

export function GenerateNeuronButton() {
  const bloomLevel = useGraphStore((state) => state.bloomLevel);
  const bloomConfidence = useGraphStore((state) => state.bloomConfidence);
  const isBloomPending = useGraphStore((state) => state.isBloomPending);
  const addNeurogenesisResult = useGraphStore((s) => s.addNeurogenesisResult);
  const resetBloomEval = useGraphStore((s) => s.resetBloomEval);

  const { currentConversationId } = useConversationContext();

  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const isReady =
    bloomLevel !== null &&
    ANALYZE_LEVELS.includes(bloomLevel) &&
    bloomConfidence >= CONFIDENCE_THRESHOLD;

  const handleClick = async () => {
    if (!isReady || isGenerating || !currentConversationId) return;

    setIsGenerating(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/neurogenesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: currentConversationId }),
      });

      if (response.ok) {
        const { neuron, synapses } = await response.json();
        addNeurogenesisResult(neuron, synapses);
        resetBloomEval();
        setFeedback({ type: 'success', message: `"${neuron.title}" created` });
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

  const isDisabled = !isReady || isGenerating || !currentConversationId;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={[
          'text-[11px] font-medium uppercase tracking-wider text-white/90',
          'bg-white/[0.06] border px-4 py-2 rounded-none',
          'transition-all duration-300 ease-out',
          isReady && !isGenerating
            ? 'opacity-100 scale-100 cursor-pointer'
            : 'opacity-40 scale-[0.98] pointer-events-none',
          isGenerating
            ? 'border-white/30 animate-pulse'
            : isBloomPending && !isReady
              ? 'border-white/20 animate-pulse'
              : 'border-white/10',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isGenerating ? 'Generating...' : 'Generate Neuron'}
      </button>

      {feedback !== null && (
        <span
          className={
            feedback.type === 'success' ? 'text-emerald-400/80 text-[10px]' : 'text-red-400/80 text-[10px]'
          }
        >
          {feedback.message}
        </span>
      )}
    </div>
  );
}
