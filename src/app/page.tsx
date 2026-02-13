import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-neural-dark flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neural-cyan/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neural-purple/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-6 inline-flex items-center justify-center h-24 w-24 rounded-full bg-neural-cyan/10 border border-neural-cyan/30 text-5xl animate-float">
          🧠
        </div>
        
        <h1 className="text-7xl font-bold mb-6 tracking-tight bg-gradient-to-br from-neural-cyan via-white to-neural-purple bg-clip-text text-transparent">
          NeuroGraph
        </h1>
        
        <p className="text-xl text-neural-light/70 font-medium tracking-wide mb-12 max-w-2xl mx-auto leading-relaxed">
          Organic Discovery <span className="text-neural-cyan mx-2">→</span> 
          Crystallized Knowledge <span className="text-neural-purple mx-2">→</span> 
          Rigorous Retention
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-gradient-to-r from-neural-cyan to-neural-purple text-white font-bold rounded-xl shadow-lg shadow-neural-cyan/20 hover:shadow-neural-cyan/40 hover:scale-105 transition-all text-lg"
          >
            Start Learning
          </Link>
          <a 
            href="#" 
            className="px-8 py-4 bg-white/5 border border-white/10 text-neural-light font-medium rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-lg backdrop-blur-sm"
          >
            Read the Manifesto
          </a>
        </div>
        
        <div className="mt-20 border-t border-white/5 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <h3 className="text-neural-cyan font-bold mb-2">Discovery</h3>
            <p className="text-sm text-neural-light/50">Explore topics naturally through conversation. No rigid curriculum.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <h3 className="text-neural-purple font-bold mb-2">Crystallization</h3>
            <p className="text-sm text-neural-light/50">Turn insights into permanent knowledge nodes in your personal graph.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2">Retention</h3>
            <p className="text-sm text-neural-light/50">Spaced repetition algorithms ensure you never forget what you've learned.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
