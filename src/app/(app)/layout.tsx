'use client';

import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';

function LogoutButton() {
  const { signOut, user } = useAuth();

  if (!user) return null;

  return (
    <motion.button
      onClick={signOut}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2 bg-neural-gray-800 hover:bg-neural-gray-700 border border-neural-gray-700 rounded-lg text-neural-light/80 text-sm transition-all"
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
        <div className="text-neural-cyan animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neural-dark">
      <header className="border-b border-neural-gray-700 bg-neural-gray-900/50 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-neural-cyan to-neural-purple bg-clip-text text-transparent">
            NeuroGraph
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-neural-light/60 text-sm">{user.email}</span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
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
