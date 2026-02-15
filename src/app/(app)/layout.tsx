'use client';

import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';
import { ReviewBadge } from '@/components/ReviewBadge';

function LogoutButton() {
  const { signOut, user } = useAuth();

  if (!user) return null;

  return (
    <motion.button
      onClick={signOut}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-3 py-1.5 bg-neural-gray-800/50 hover:bg-neural-gray-700/50 border border-white/5 hover:border-white/10 rounded-md text-neural-light/60 hover:text-neural-light text-xs font-medium transition-all"
    >
      Sign Out
    </motion.button>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neural-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neural-cyan/30 border-t-neural-cyan" />
          <div className="text-neural-light/40 text-sm font-medium tracking-wide animate-pulse">Initializing Interface...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neural-dark selection:bg-neural-cyan/30 selection:text-neural-light">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-neural-dark/80 backdrop-blur-xl supports-[backdrop-filter]:bg-neural-dark/60">
        <div className="max-w-[1920px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-neural-cyan via-white to-neural-purple bg-clip-text text-transparent">
              NeuroGraph
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neural-cyan/10 text-neural-cyan border border-neural-cyan/20">
              Beta
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <ReviewBadge />
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-neural-light/40 text-xs font-mono hidden sm:inline-block">{user.email}</span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-[1920px] mx-auto">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
