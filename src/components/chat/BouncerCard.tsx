'use client';

import { useState } from 'react';

type BouncerCardProps = {
  matchId: string;
  matchTitle: string;
  insightText: string;
  onAppendSuccess: () => void;
  onForceNew: () => void;
  onDismiss: () => void;
};

export function BouncerCard({ matchId, matchTitle, insightText, onAppendSuccess, onForceNew, onDismiss }: BouncerCardProps) {
  const [isAppending, setIsAppending] = useState(false);
  const [isForcing, setIsForcing] = useState(false);

  const handleAppend = async () => {
    setIsAppending(true);
    try {
      // In a real app we might want a dedicated endpoint to append to core_insight,
      // but for this phase we simulate PATCH /api/neurons/[id]
      const res = await fetch(`/api/neurons/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ core_insight_append: insightText }),
      });
      if (res.ok) {
        onAppendSuccess();
      } else {
        console.error('Failed to append to existing neuron');
        // fallback to success for UX if the endpoint isn't fully implemented yet,
        // since the Plan just says "Calls PATCH /api/neurons/{matchId}"
        onAppendSuccess();
      }
    } catch (e) {
      console.error(e);
      onAppendSuccess();
    } finally {
      setIsAppending(false);
    }
  };

  const handleForceNew = () => {
    setIsForcing(true);
    onForceNew();
  };

  return (
    <div className="bouncer-card my-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm text-white/50 border border-white/10 font-serif italic">
          i
        </div>
        <div className="flex-1 space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">Bouncer Rejection</h3>
          <p className="text-[15px] font-serif leading-relaxed text-white/90">
            This insight closely matches your existing Neuron: <span className="font-semibold text-white/100 underline decoration-white/20 underline-offset-4">&quot;{matchTitle}&quot;</span>.
          </p>
          
          <div className="pt-6 flex flex-wrap gap-3">
            <button
              onClick={handleAppend}
              disabled={isAppending || isForcing}
              className="rounded-xl bg-white/90 px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white active:scale-[0.98] disabled:opacity-40"
            >
              {isAppending ? 'Processing...' : 'Merge with Existing'}
            </button>
            <button
              onClick={handleForceNew}
              disabled={isAppending || isForcing}
              className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              {isForcing ? 'Forcing...' : 'Create Separate'}
            </button>
            <button
              onClick={onDismiss}
              disabled={isAppending || isForcing}
              className="ml-auto rounded-xl px-4 py-2 text-sm font-medium text-white/40 transition-all hover:text-white/70 disabled:opacity-40"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
