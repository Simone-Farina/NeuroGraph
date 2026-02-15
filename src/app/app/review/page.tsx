'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Crystal } from '@/types/database';

type ReviewCrystal = Crystal & {
  intervals: {
    1: string;
    2: string;
    3: string;
    4: string;
  };
};

async function submitReview(crystalId: string, rating: number): Promise<Crystal | null> {
  const res = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crystalId, rating }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.crystal;
}

export default function ReviewPage() {
  const [crystals, setCrystals] = useState<ReviewCrystal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load crystals on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/review');
        if (res.ok) {
          const json = await res.json();
          setCrystals(json.reviews || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const currentCrystal = crystals[currentIndex];

  const handleReveal = () => setIsRevealed(true);

  const handleRate = async (rating: number) => {
    if (!currentCrystal) return;

    // Optimistic update: move to next card immediately
    const nextIndex = currentIndex + 1;
    
    // Send request in background
    submitReview(currentCrystal.id, rating);

    setIsRevealed(false);
    
    if (nextIndex < crystals.length) {
      setCurrentIndex(nextIndex);
    } else {
      // Finished: clear crystals to trigger empty state
      setCrystals([]); 
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center text-neural-light">
        <div className="animate-pulse">Loading reviews...</div>
      </div>
    );
  }

  if (!currentCrystal) {
    return (
      <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center">
        <header className="fixed top-0 left-0 right-0 p-4 flex items-center justify-between bg-neural-dark/80 backdrop-blur-md z-10 border-b border-white/5">
          <Link href="/app" className="text-neural-light/60 hover:text-neural-light transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            <span>Back</span>
          </Link>
        </header>
        
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-neural-purple/10 border border-neural-purple/30 text-4xl animate-pulse">
            ✨
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neural-purple to-neural-cyan bg-clip-text text-transparent">All caught up!</h1>
          <p className="text-neural-light/60 mb-8 leading-relaxed">
            You've reviewed all your due crystals. Great job consolidating your knowledge!
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
    <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center pt-24">
      <header className="fixed top-0 left-0 right-0 p-4 flex items-center justify-between bg-neural-dark/80 backdrop-blur-md z-10 border-b border-white/5">
        <Link href="/app" className="text-neural-light/60 hover:text-neural-light transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          <span>Back</span>
        </Link>
        <div className="text-neural-light/40 text-sm uppercase tracking-wider font-mono">
          {currentIndex + 1} / {crystals.length}
        </div>
        <div className="w-20" />
      </header>

      <div className="w-full max-w-2xl">
        <div className="relative h-[500px]">
          <motion.div 
            key={currentCrystal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col overflow-y-auto"
          >
            {/* Front of Card */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neural-light mb-6">{currentCrystal.title}</h2>
              <div className="text-lg text-neural-light/80 leading-relaxed">
                {currentCrystal.definition}
              </div>
            </div>

            {/* Back of Card (Revealed) */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 pt-8 border-t border-white/10"
                >
                  <div className="text-neural-cyan mb-2 text-sm uppercase tracking-wider font-bold">Core Insight</div>
                  <p className="text-neural-light leading-relaxed">
                    {currentCrystal.core_insight}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mt-8 flex justify-center gap-4 h-24">
          {!isRevealed ? (
            <button 
              onClick={handleReveal}
              className="px-8 py-3 bg-neural-purple text-white rounded-lg font-bold hover:bg-neural-purple/80 transition-colors w-full max-w-xs self-start"
            >
              Show Answer
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-4 w-full">
              <button onClick={() => handleRate(1)} className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1">
                <span className="font-bold">Again</span>
                <span className="text-xs opacity-60">{currentCrystal.intervals[1]}</span>
              </button>
              <button onClick={() => handleRate(2)} className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex flex-col items-center gap-1">
                <span className="font-bold">Hard</span>
                <span className="text-xs opacity-60">{currentCrystal.intervals[2]}</span>
              </button>
              <button onClick={() => handleRate(3)} className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex flex-col items-center gap-1">
                <span className="font-bold">Good</span>
                <span className="text-xs opacity-60">{currentCrystal.intervals[3]}</span>
              </button>
              <button onClick={() => handleRate(4)} className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1">
                <span className="font-bold">Easy</span>
                <span className="text-xs opacity-60">{currentCrystal.intervals[4]}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
