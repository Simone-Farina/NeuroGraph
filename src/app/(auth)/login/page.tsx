'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/lib/auth/supabase';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Magic link sent! Check your email to sign in.',
      });
      setEmail('');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neural-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neural-cyan/20 rounded-full blur-3xl animate-pulse-cyan" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neural-purple/20 rounded-full blur-3xl animate-pulse-cyan" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-neural-gray-900 border border-neural-gray-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-neural-cyan to-neural-purple bg-clip-text text-transparent">
              NeuroGraph
            </h1>
            <p className="text-neural-light/60 text-sm">
              Organic Discovery → Crystallized Knowledge
            </p>
          </motion.div>

          {!isDesktop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-neural-purple/10 border border-neural-purple/30 rounded-lg"
            >
              <p className="text-neural-purple text-sm text-center">
                ⚠️ NeuroGraph is best experienced on desktop (1024px+)
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neural-light/80 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-neural-gray-800 border border-neural-gray-700 rounded-lg text-neural-light placeholder-neural-light/30 focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:border-transparent transition-all"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-neural-cyan to-neural-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-neural-cyan/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Magic Link'
              )}
            </motion.button>
          </form>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-neural-cyan/10 border border-neural-cyan/30 text-neural-cyan'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              <p className="text-sm text-center">{message.text}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center text-neural-light/40 text-xs"
          >
            <p>First time? Your account will be created automatically.</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
