'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Route Error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-8 flex flex-col items-center text-center gap-6"
      >
        <div className="h-16 w-16 rounded-full bg-neural-cyan/10 border border-neural-cyan/20 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-8 h-8 text-neural-cyan"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-neural-light">
            Interface Sync Failed
          </h2>
          <p className="text-neural-light/60 text-sm leading-relaxed">
            The neural interface encountered a synchronization error. Attempting to reconnect might resolve the issue.
          </p>
        </div>

        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-neural-gray-800 hover:bg-neural-gray-700 border border-white/10 rounded-xl text-neural-light font-medium text-sm tracking-wide transition-all"
        >
          Try Again
        </motion.button>
      </motion.div>
    </div>
  );
}
