import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-neural-dark flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/[0.03] border border-white/[0.06] text-4xl">
          🧠
        </div>

        <h1 className="text-6xl font-serif font-bold mb-6 tracking-tight text-white/95">
          NeuroGraph
        </h1>

        <p className="text-lg text-white/50 font-sans font-medium tracking-wide mb-12 max-w-2xl mx-auto leading-relaxed">
          Organic Discovery <span className="text-white/25 mx-2">→</span>
          Structured Knowledge <span className="text-white/25 mx-2">→</span>
          Rigorous Retention
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-white/90 text-neural-dark font-bold rounded-xl hover:bg-white transition-all text-lg"
          >
            Start Learning
          </Link>
          <a
            href="#"
            className="px-8 py-4 bg-white/[0.03] border border-white/[0.08] text-white/70 font-medium rounded-xl hover:bg-white/[0.06] hover:border-white/15 transition-all text-lg"
          >
            Read the Manifesto
          </a>
        </div>

        <div className="mt-20 border-t border-white/5 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white/80 font-semibold mb-2">Discovery</h3>
            <p className="text-sm text-white/40 leading-relaxed">Explore topics naturally through conversation. No rigid curriculum.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white/80 font-semibold mb-2">Neurogenesis</h3>
            <p className="text-sm text-white/40 leading-relaxed">Turn insights into permanent knowledge nodes in your personal graph.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white/80 font-semibold mb-2">Retention</h3>
            <p className="text-sm text-white/40 leading-relaxed">Spaced repetition algorithms ensure you never forget what you&apos;ve learned.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
