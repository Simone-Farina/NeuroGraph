'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGraphStore } from '@/stores/graphStore';

type ReviewItem = {
  id: string;
  title: string;
};

export function ReviewBadge() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const openReview = useGraphStore((state) => state.openReview);

  const fetchDueCount = useCallback(async () => {
    try {
      const response = await fetch('/api/review');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch review count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueCount();
    const handleFocus = () => fetchDueCount();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDueCount]);

  const handleOpen = useCallback(() => {
    if (reviews.length > 0) {
      // Open the first due neuron in ReviewMode
      openReview(reviews[0].id);
    }
  }, [reviews, openReview]);

  const count = reviews.length;

  if (!loading && count === 0) return null;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <button
        onClick={handleOpen}
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
              className="relative flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#c4785a]/90 text-[10px] font-bold text-white"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>

        {loading && (
          <div className="relative w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
        )}
      </button>
    </motion.div>
  );
}
