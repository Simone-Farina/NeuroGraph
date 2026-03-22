'use client';

import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { ReviewBadge } from '@/components/ReviewBadge';
import { OnboardingProvider } from '@/components/onboarding/OnboardingTour';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ConversationProvider } from '@/lib/contexts/ConversationContext';
import { GraphPanel } from '@/components/graph/GraphPanel';
import { NeuronDetailPanel } from '@/components/graph/NeuronDetailPanel';
import { QueueBootstrap } from '@/components/queue/QueueBootstrap';
import { useGraphStore } from '@/stores/graphStore';

const PRESET_WIDTHS = {
  standard: { left: '40vw', right: '60vw' },
  deep_read: { left: '60vw', right: '40vw' },
  graph_zenith: { left: '25vw', right: '75vw' }
};

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const leftPanelMode = useGraphStore((state) => state.leftPanelMode);
  const shellPreset = useGraphStore((state) => state.shellPreset);

  if (loading) {
    return (
      <div className="min-h-screen bg-neural-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
          <div className="text-neural-light/40 text-sm font-medium tracking-wide animate-pulse">Initializing Interface...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neural-dark selection:bg-white/20 selection:text-neural-light">
      <QueueBootstrap />

      {/* Area Operativa Sinistra */}
      <motion.div 
        initial={false}
        animate={{ width: PRESET_WIDTHS[shellPreset].left }}
        transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="flex flex-shrink-0 border-r border-white/5 relative bg-neural-dark z-10"
      >
        <AppSidebar />

        {/* Area di Contesto Attivo */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="sticky top-0 z-50 border-b border-white/5 bg-neural-dark/80 backdrop-blur-xl supports-[backdrop-filter]:bg-neural-dark/60">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[15px] font-serif font-semibold tracking-tight text-white/90">
                  NeuroGraph
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-widest bg-white/[0.04] text-white/30 border border-white/[0.06]">
                  Beta
                </span>
              </div>

              <div className="flex-1 flex justify-end">
                <ReviewBadge />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto relative p-0 m-0 w-full h-full">
            {children}
          </main>
        </div>
      </motion.div>

      {/* Area Rete Neurale Destra */}
      <motion.div 
        initial={false}
        animate={{ width: PRESET_WIDTHS[shellPreset].right }}
        transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="flex-grow relative overflow-hidden bg-neural-dark"
      >
        <GraphPanel />
        {leftPanelMode === 'neuron' && <NeuronDetailPanel />}
      </motion.div>
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
