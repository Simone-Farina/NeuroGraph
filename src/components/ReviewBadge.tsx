'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function ReviewBadge() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchDueCount = useCallback(async () => {
    try {
      const response = await fetch('/api/review');
      if (response.ok) {
        const data = await response.json();
        setCount(data.reviews?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch review count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueCount();

    const handleFocus = () => {
      fetchDueCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDueCount]);

  if (!loading && count === 0) return null;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link 
        href="/app/review"
        data-tour="review-badge"
        className="group relative flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neural-cyan/5 hover:bg-neural-cyan/10 border border-neural-cyan/20 hover:border-neural-cyan/40 transition-all duration-500 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-neural-cyan/0 via-neural-cyan/5 to-neural-cyan/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        
        <span className="relative text-xs font-bold tracking-wider uppercase text-neural-cyan/80 group-hover:text-neural-cyan transition-colors">
          Review
        </span>
        
        <AnimatePresence mode="wait">
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-neural-cyan text-[10px] font-black text-neural-dark shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>

        {loading && (
          <div className="relative w-1.5 h-1.5 rounded-full bg-neural-cyan animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        )}
      </Link>
    </motion.div>
  );
}
