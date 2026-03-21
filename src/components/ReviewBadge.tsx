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
        className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 transition-all duration-300"
      >
        <span className="text-[11px] font-medium tracking-wider uppercase text-white/40 group-hover:text-white/70 transition-colors">
          Review
        </span>

        <AnimatePresence mode="wait">
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/90 text-[10px] font-bold text-neural-dark"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>

        {loading && (
          <div className="relative w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
        )}
      </Link>
    </motion.div>
  );
}
