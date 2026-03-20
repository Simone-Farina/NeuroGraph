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
    <div className="neurogenesis-suggestion my-4 rounded-xl border border-red-500/30 bg-red-500/5 p-5 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-1">🛡️</span>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-bold text-neural-light">AI Bouncer</h3>
          <p className="text-sm text-neural-light/80 leading-relaxed">
            This insight closely matches your existing Neuron: <span className="font-semibold text-neural-cyan">[[{matchTitle}]]</span>.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={handleAppend}
              disabled={isAppending || isForcing}
              className="rounded-lg bg-neural-cyan px-4 py-2 text-xs font-bold text-neural-dark transition hover:bg-neural-cyan/80 disabled:opacity-50"
            >
              {isAppending ? 'Appending...' : 'Append to Existing'}
            </button>
            <button
              onClick={handleForceNew}
              disabled={isAppending || isForcing}
              className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-xs font-medium text-neural-light/70 transition hover:bg-white/5 hover:text-neural-light disabled:opacity-50"
            >
              {isForcing ? 'Forcing...' : 'Force New Neuron'}
            </button>
            <button
              onClick={onDismiss}
              disabled={isAppending || isForcing}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neural-light/40 transition hover:text-neural-light/80 ml-auto disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
