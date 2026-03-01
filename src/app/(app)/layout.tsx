'use client';

import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';
import { ReviewBadge } from '@/components/ReviewBadge';
import { OnboardingProvider } from '@/components/onboarding/OnboardingTour';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ConversationProvider } from '@/lib/contexts/ConversationContext';
import { GraphPanel } from '@/components/graph/GraphPanel';
import { NeuronDetailPanel } from '@/components/graph/NeuronDetailPanel';
import { useGraphStore } from '@/stores/graphStore';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

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
    <div className="flex h-screen w-full overflow-hidden bg-neural-dark selection:bg-neural-cyan/30 selection:text-neural-light">
      {/* Area Operativa Sinistra (40vw) */}
      <div className="flex w-[40vw] flex-shrink-0 border-r border-white/5 relative bg-neural-dark">
        <AppSidebar />

        {/* Area di Contesto Attivo */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="sticky top-0 z-50 border-b border-white/5 bg-neural-dark/80 backdrop-blur-xl supports-[backdrop-filter]:bg-neural-dark/60">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-neural-cyan via-white to-neural-purple bg-clip-text text-transparent">
                  NeuroGraph
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neural-cyan/10 text-neural-cyan border border-neural-cyan/20">
                  Beta
                </span>
              </div>

              <div className="flex-1 flex justify-end">
                <ReviewBadge />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto relative p-0 m-0 w-full h-full">
            {leftPanelMode === 'neuron' ? <NeuronDetailPanel /> : children}
          </main>
        </div>
      </div>

      {/* Area Rete Neurale Destra (60vw) */}
      <div className="w-[60vw] flex-grow relative overflow-hidden bg-neural-dark">
        <GraphPanel />
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
