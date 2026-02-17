'use client';

import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';
import { ReviewBadge } from '@/components/ReviewBadge';
import { OnboardingProvider } from '@/components/onboarding/OnboardingTour';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ConversationProvider } from '@/lib/contexts/ConversationContext';

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
    <div className="flex h-screen overflow-hidden bg-neural-dark selection:bg-neural-cyan/30 selection:text-neural-light">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
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
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-hidden max-w-[1920px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConversationProvider>
        <OnboardingProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </OnboardingProvider>
      </ConversationProvider>
    </AuthProvider>
  );
}
