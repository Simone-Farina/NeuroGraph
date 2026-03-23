'use client';

import { useGraphStore } from '@/stores/graphStore';

export function HorizonBriefingPanel() {
  const activeGhostNodeId = useGraphStore((state) => state.activeGhostNodeId);
  const ghostNodes = useGraphStore((state) => state.ghostNodes);
  const horizonTarget = useGraphStore((state) => state.horizonTarget);
  const beginHorizonLearning = useGraphStore((state) => state.beginHorizonLearning);
  const openChat = useGraphStore((state) => state.openChat);

  const activeGhostNode = ghostNodes.find((node) => node.id === activeGhostNodeId);
  const data = activeGhostNode?.data;

  if (!data) {
    return (
      <section className="flex h-full items-center justify-center px-8 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/26">Horizon</p>
          <h2 className="font-serif text-3xl tracking-tight text-white/72">No ghost selected.</h2>
          <p className="text-sm leading-relaxed text-white/42">
            Choose a ghost node in the graph to open its briefing and move it into active learning.
          </p>
          <button
            type="button"
            onClick={openChat}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/58 transition hover:border-white/18 hover:text-white/82"
          >
            Back to chat
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col overflow-hidden bg-neural-gray-900/30">
      <div className="border-b border-white/5 px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/26">Horizon Briefing</p>
        <h2 className="mt-3 font-serif text-[34px] leading-none tracking-tight text-white/88">
          {data.title}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/34">
          {horizonTarget ? (
            <span className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1">
              Target {horizonTarget}
            </span>
          ) : null}
          <span className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1">
            Bloom {data.bloomLevel}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/24">Definition</p>
            <p className="font-serif text-[20px] leading-relaxed text-white/78">{data.definition}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/24">Intent</p>
            <p className="text-sm leading-relaxed text-white/48">
              This is still a blueprint. Starting here opens a fresh chat session centered on this
              concept without committing anything to the durable graph.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={beginHorizonLearning}
            className="rounded-full border border-white/16 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/84 transition hover:border-white/24 hover:bg-white/[0.09]"
          >
            Start Learning (Crystallize)
          </button>
          <button
            type="button"
            onClick={openChat}
            className="rounded-full border border-white/8 px-4 py-2.5 text-sm text-white/52 transition hover:border-white/16 hover:text-white/76"
          >
            Back to chat
          </button>
        </div>
      </div>
    </section>
  );
}
