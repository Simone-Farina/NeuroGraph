'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Neuron } from '@/types/database';
import { useGraphStore } from '@/stores/graphStore';

type ReviewNeuron = Neuron & {
  intervals: {
    1: string;
    2: string;
    3: string;
    4: string;
  };
};

async function submitReview(neuronId: string, rating: number): Promise<Neuron | null> {
  const res = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ neuronId, rating }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.neuron;
}

export default function ReviewPage() {
  const [neurons, setNeurons] = useState<ReviewNeuron[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const setShellPreset = useGraphStore((state) => state.setShellPreset);

  useEffect(() => {
    setShellPreset('deep_read');
  }, [setShellPreset]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/review');
        if (res.ok) {
          const json = await res.json();
          setNeurons(json.reviews || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const currentNeuron = neurons[currentIndex];

  const handleReveal = () => setIsRevealed(true);

  const handleRate = async (rating: number) => {
    if (!currentNeuron) return;

    const nextIndex = currentIndex + 1;
    submitReview(currentNeuron.id, rating);

    setIsRevealed(false);

    if (nextIndex < neurons.length) {
      setCurrentIndex(nextIndex);
    } else {
      setNeurons([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border border-white/10 border-t-white/40" />
          <div className="text-neural-light/30 text-xs font-medium tracking-widest uppercase">Loading reviews</div>
        </div>
      </div>
    );
  }

  if (!currentNeuron) {
    return (
      <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/[0.02] border border-white/[0.05]"
          >
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-serif font-medium mb-3 text-white/80"
          >
            Review complete
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-neural-light/50 mb-8 leading-relaxed text-sm"
          >
            All due knowledge has been consolidated.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-xl border border-white/5 bg-white/[0.02] text-left"
          >
            <h3 className="text-white/60 font-medium text-xs uppercase tracking-widest mb-4">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neural-dark/30 p-4 rounded-lg border border-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Reviewed</p>
                <p className="text-2xl font-serif text-white/70">{currentIndex}</p>
              </div>
              <div className="bg-neural-dark/30 p-4 rounded-lg border border-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Next Due</p>
                <p className="text-2xl font-serif text-white/50">Tomorrow</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-neural-dark flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mb-4 sm:mb-8">
        <div className="flex justify-between items-end text-[10px] uppercase tracking-widest font-bold mb-2">
          <span className="text-white/40">Session Progress</span>
          <span className="text-white/30">
            {currentIndex + 1} <span className="opacity-50">/</span> {neurons.length}
          </span>
        </div>
        <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/30"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / neurons.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl flex-1 flex flex-col">
        <div className="relative flex-1 min-h-[400px] sm:h-[500px] sm:flex-none">
          <motion.div
            key={currentNeuron.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-10 flex flex-col overflow-y-auto"
          >
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white/90 mb-6 sm:mb-8 leading-tight">
                {currentNeuron.title}
              </h2>
              <div className="text-base sm:text-lg text-white/60 leading-relaxed font-light">
                {currentNeuron.definition}
              </div>
            </div>

            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-8 pt-8 border-t border-white/5"
                >
                  <div className="text-white/30 mb-3 text-[10px] uppercase tracking-widest font-medium">
                    Core Insight
                  </div>
                  <p className="text-sm sm:text-base text-white/80 leading-relaxed font-serif">
                    {currentNeuron.core_insight}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mt-6 sm:mt-8 flex justify-center gap-4 min-h-[6rem]">
          {!isRevealed ? (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleReveal}
              className="px-8 py-3 bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-lg text-sm font-medium hover:bg-white/[0.08] hover:text-white transition-all w-full sm:max-w-xs self-start"
            >
              Reveal Insight
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full"
            >
              <button
                onClick={() => handleRate(1)}
                className="p-3 sm:p-4 rounded-xl border border-white/[0.04] bg-transparent text-white/40 hover:bg-white/[0.02] hover:text-white/60 hover:border-white/[0.08] transition-all flex flex-col items-center gap-1.5"
              >
                <span className="font-medium text-xs sm:text-sm tracking-wide">Again</span>
                <span className="font-mono text-[9px] sm:text-[10px] opacity-50">{currentNeuron.intervals[1]}</span>
              </button>
              <button
                onClick={() => handleRate(2)}
                className="p-3 sm:p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] text-white/50 hover:bg-white/[0.03] hover:text-white/70 hover:border-white/[0.1] transition-all flex flex-col items-center gap-1.5"
              >
                <span className="font-medium text-xs sm:text-sm tracking-wide">Hard</span>
                <span className="font-mono text-[9px] sm:text-[10px] opacity-60">{currentNeuron.intervals[2]}</span>
              </button>
              <button
                onClick={() => handleRate(3)}
                className="p-3 sm:p-4 rounded-xl border border-white/[0.12] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/[0.2] transition-all flex flex-col items-center gap-1.5"
              >
                <span className="font-semibold text-xs sm:text-sm tracking-wide">Good</span>
                <span className="font-mono text-[9px] sm:text-[10px] opacity-70">{currentNeuron.intervals[3]}</span>
              </button>
              <button
                onClick={() => handleRate(4)}
                className="p-3 sm:p-4 rounded-xl border border-white/[0.2] bg-white/[0.06] text-white/90 hover:bg-white/[0.1] hover:text-white hover:border-white/[0.3] transition-all flex flex-col items-center gap-1.5"
              >
                <span className="font-bold text-xs sm:text-sm tracking-wide">Easy</span>
                <span className="font-mono text-[9px] sm:text-[10px] opacity-80">{currentNeuron.intervals[4]}</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
