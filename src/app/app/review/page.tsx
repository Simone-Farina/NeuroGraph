// Review page for spaced repetition
export default function ReviewPage() {
  return (
    <div className="min-h-screen p-8 bg-neural-dark flex flex-col items-center justify-center">
      <div className="text-center max-w-lg mx-auto">
        <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-neural-purple/10 border border-neural-purple/30 text-4xl animate-pulse">
            🕰️
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neural-purple to-neural-cyan bg-clip-text text-transparent">Spaced Repetition Review</h1>
        <p className="text-neural-light/60 mb-8 leading-relaxed">
            Your review session is being prepared. The FSRS algorithm will schedule optimal review times to maximize your retention.
        </p>
        
        <div className="p-6 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm text-left">
            <h3 className="text-neural-light font-bold mb-3">Review Stats</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neural-dark/50 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-neural-light/40 uppercase tracking-wider">Due Today</p>
                    <p className="text-2xl font-bold text-neural-cyan">0</p>
                </div>
                <div className="bg-neural-dark/50 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-neural-light/40 uppercase tracking-wider">Retention</p>
                    <p className="text-2xl font-bold text-neural-purple">--%</p>
                </div>
            </div>
        </div>

        <button className="mt-8 px-6 py-3 rounded-lg border border-white/10 bg-white/5 text-neural-light/50 text-sm font-medium cursor-not-allowed" disabled>
            No cards due for review
        </button>
      </div>
    </div>
  );
}
