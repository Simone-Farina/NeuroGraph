'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/lib/auth/supabase';
import { motion } from 'framer-motion';

type AuthMode = 'password' | 'magic-link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('password');
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

  const handlePasswordAuth = async () => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      window.location.href = '/app';
      return;
    }

    if (signInError.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (signUpError) {
        setMessage({ type: 'error', text: signUpError.message });
        return;
      }

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (retryError) {
        setMessage({
          type: 'success',
          text: 'Account created! Check your email to confirm, then sign in.',
        });
        return;
      }

      window.location.href = '/app';
      return;
    }

    setMessage({ type: 'error', text: signInError.message });
  };

  const handleMagicLink = async () => {
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
  };

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

    if (authMode === 'password') {
      if (password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        setLoading(false);
        return;
      }
      await handlePasswordAuth();
    } else {
      await handleMagicLink();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neural-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neural-cyan/20 rounded-full blur-[100px] animate-pulse-cyan" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neural-purple/20 rounded-full blur-[100px] animate-pulse-cyan" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-panel rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold mb-3 tracking-tight bg-gradient-to-br from-neural-cyan via-white to-neural-purple bg-clip-text text-transparent">
              NeuroGraph
            </h1>
            <p className="text-neural-light/60 text-sm font-medium tracking-wide">
              Organic Discovery → Crystallized Knowledge
            </p>
          </motion.div>

          {!isDesktop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-neural-purple/10 border border-neural-purple/30 rounded-lg backdrop-blur-sm"
            >
              <p className="text-neural-purple text-sm text-center font-medium">
                ⚠️ Best experienced on desktop (1024px+)
              </p>
            </motion.div>
          )}

          <div className="flex mb-6 bg-neural-gray-800/50 rounded-lg p-1 border border-white/5">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                authMode === 'password'
                  ? 'bg-neural-gray-700 text-white shadow-sm border border-white/10'
                  : 'text-neural-light/50 hover:text-neural-light/80 hover:bg-white/5'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('magic-link'); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                authMode === 'magic-link'
                  ? 'bg-neural-gray-700 text-white shadow-sm border border-white/10'
                  : 'text-neural-light/50 hover:text-neural-light/80 hover:bg-white/5'
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neural-light/50 mb-1.5 pl-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institute.edu"
                required
                className="w-full px-4 py-3 rounded-lg text-neural-light placeholder-neural-light/20 neural-input"
              />
            </div>

            {authMode === 'password' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neural-light/50 mb-1.5 pl-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg text-neural-light placeholder-neural-light/20 neural-input"
                />
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-neural-cyan to-neural-purple text-white font-bold tracking-wide rounded-lg shadow-lg shadow-neural-cyan/20 hover:shadow-neural-cyan/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {authMode === 'password' ? 'Signing in...' : 'Sending...'}
                </span>
              ) : authMode === 'password' ? (
                'Sign In'
              ) : (
                'Send Magic Link'
              )}
            </motion.button>
          </form>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg backdrop-blur-md border ${
                message.type === 'success'
                  ? 'bg-neural-cyan/10 border-neural-cyan/30 text-neural-cyan'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <p className="text-sm text-center font-medium">{message.text}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-neural-light/30 text-xs">
              {authMode === 'password' ? (
                'New account? Just enter your email and password — we will create it for you.'
              ) : (
                'First time? Your account will be created automatically.'
              )}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
