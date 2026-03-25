'use client';

import { useGraphStore } from '@/stores/graphStore';

const ANALYZE_LEVELS = ['Analyze', 'Evaluate', 'Create'];
const CONFIDENCE_THRESHOLD = 0.75;

export function GenerateNeuronButton() {
  const bloomLevel = useGraphStore((state) => state.bloomLevel);
  const bloomConfidence = useGraphStore((state) => state.bloomConfidence);
  const isBloomPending = useGraphStore((state) => state.isBloomPending);

  const isReady =
    bloomLevel !== null &&
    ANALYZE_LEVELS.includes(bloomLevel) &&
    bloomConfidence >= CONFIDENCE_THRESHOLD;

  const handleClick = () => {
    if (!isReady) return;
    console.log('[GenerateNeuronButton] Bloom eval payload:', { bloomLevel, bloomConfidence });
    // Phase 25 stub — actual POST /api/architect call comes in the next phase
    console.log('[GenerateNeuronButton] Cognitive threshold reached. Architect pipeline pending.');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isReady}
      className={[
        'text-[11px] font-medium uppercase tracking-wider text-white/90',
        'bg-white/[0.06] border px-4 py-2 rounded-none',
        'transition-all duration-300 ease-out',
        isReady
          ? 'opacity-100 scale-100 cursor-pointer'
          : 'opacity-40 scale-[0.98] pointer-events-none',
        isBloomPending && !isReady
          ? 'border-white/20 animate-pulse'
          : 'border-white/10',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      Generate Neuron
    </button>
  );
}
