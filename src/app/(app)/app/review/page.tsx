'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Neuron } from '@/types/database';

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
      <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center text-neural-light">
        <div className="animate-pulse">Loading reviews...</div>
      </div>
    );
  }

  if (!currentNeuron) {
    return (
      <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-neural-purple/10 border border-neural-purple/30 text-4xl animate-pulse">
            ✨
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neural-purple to-neural-cyan bg-clip-text text-transparent">
            All caught up!
          </h1>
          <p className="text-neural-light/60 mb-8 leading-relaxed">
            You&apos;ve reviewed all your due neurons. Great job consolidating your knowledge!
          </p>

          <div className="p-6 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm text-left">
            <h3 className="text-neural-light font-bold mb-3">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neural-dark/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-neural-light/40 uppercase tracking-wider">Reviewed</p>
                <p className="text-2xl font-bold text-neural-cyan">{currentIndex}</p>
              </div>
              <div className="bg-neural-dark/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-neural-light/40 uppercase tracking-wider">Next Due</p>
                <p className="text-2xl font-bold text-neural-purple">Tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-neural-dark flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mb-4 sm:mb-8">
        <div className="flex justify-between items-end text-[10px] uppercase tracking-widest font-bold mb-2">
          <span className="text-neural-cyan">Session Progress</span>
          <span className="text-neural-light/40">
            {currentIndex + 1} of {neurons.length} reviewed
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neural-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / neurons.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl flex-1 flex flex-col">
        <div className="relative flex-1 min-h-[400px] sm:h-[500px] sm:flex-none">
          <motion.div
            key={currentNeuron.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col overflow-y-auto"
          >
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-neural-light mb-4 sm:mb-6">
                {currentNeuron.title}
              </h2>
              <div className="text-base sm:text-lg text-neural-light/80 leading-relaxed">
                {currentNeuron.definition}
              </div>
            </div>

            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10"
                >
                  <div className="text-neural-cyan mb-2 text-xs sm:text-sm uppercase tracking-wider font-bold">
                    Core Insight
                  </div>
                  <p className="text-sm sm:text-base text-neural-light leading-relaxed">
                    {currentNeuron.core_insight}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mt-6 sm:mt-8 flex justify-center gap-4 min-h-[6rem]">
          {!isRevealed ? (
            <button
              onClick={handleReveal}
              className="px-8 py-3 bg-neural-purple text-white rounded-lg font-bold hover:bg-neural-purple/80 transition-colors w-full sm:max-w-xs self-start"
            >
              Show Answer
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
              <button
                onClick={() => handleRate(1)}
                className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
              >
                <span className="font-bold text-sm sm:text-base">Again</span>
                <span className="text-[10px] sm:text-xs opacity-60">{currentNeuron.intervals[1]}</span>
              </button>
              <button
                onClick={() => handleRate(2)}
                className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex flex-col items-center gap-1"
              >
                <span className="font-bold text-sm sm:text-base">Hard</span>
                <span className="text-[10px] sm:text-xs opacity-60">{currentNeuron.intervals[2]}</span>
              </button>
              <button
                onClick={() => handleRate(3)}
                className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex flex-col items-center gap-1"
              >
                <span className="font-bold text-sm sm:text-base">Good</span>
                <span className="text-[10px] sm:text-xs opacity-60">{currentNeuron.intervals[3]}</span>
              </button>
              <button
                onClick={() => handleRate(4)}
                className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1"
              >
                <span className="font-bold text-sm sm:text-base">Easy</span>
                <span className="text-[10px] sm:text-xs opacity-60">{currentNeuron.intervals[4]}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
