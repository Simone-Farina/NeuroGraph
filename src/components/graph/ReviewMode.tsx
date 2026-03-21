'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { Rating } from '@/lib/ai/fsrs';

export function ReviewMode() {
  const activeNeuronId = useGraphStore((state) => state.activeNeuronId);
  const openChat = useGraphStore((state) => state.openChat);
  const updateNode = useGraphStore((state) => state.updateNode);
  const nodes = useGraphStore((state) => state.nodes);

  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socraticMode, setSocraticMode] = useState(false);
  const [socraticInput, setSocraticInput] = useState('');

  const activeNode = nodes.find(n => n.id === activeNeuronId);
  const nodeData = activeNode?.data as any;

  // Reset state when neuron changes
  useEffect(() => {
    setIsRevealed(false);
    setIsSubmitting(false);
    setSocraticMode(false);
    setSocraticInput('');
  }, [activeNeuronId]);

  const handleGrade = useCallback(async (rating: Rating) => {
    if (!activeNeuronId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/neurons/${activeNeuronId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (res.ok) {
        const payload = await res.json();
        // Update local node state
        if (payload.neuron) {
          updateNode(activeNeuronId, {
            retrievability: payload.neuron.retrievability,
            stability: payload.neuron.stability,
            last_review: payload.neuron.last_review,
            state: payload.neuron.state,
            difficulty: payload.neuron.difficulty,
          });
        }
        
        // Optimistically heal roots if API returned them
        if (payload.healed_node_ids && Array.isArray(payload.healed_node_ids)) {
          payload.healed_node_ids.forEach((id: string) => {
             // For now we just force a refresh effectively or just wait for 5 min poll.
             // Usually we'd fetch the specific node patches, but since it's just rust disappearing,
             // setting retrievability to 1.0 locally works as an optimistic patch.
             updateNode(id, { retrievability: 1.0 });
          });
        }
        
        setTimeout(() => openChat(), 600); // go back to chat after brief success state
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeNeuronId, isSubmitting, openChat, updateNode]);

  const handleSocraticSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!socraticInput.trim()) return;
    
    // In Phase 3, this is a mock implementation of the deep-dive evaluator.
    // A full implementation would stream this to AI_MODEL_EVALUATOR, parse the response,
    // and extract a grading score automatically.
    // For now, we simulate a successful "Good" rating if they wrote more than 10 chars.
    if (socraticInput.length > 10) {
       handleGrade(Rating.Good);
    } else {
       handleGrade(Rating.Again);
    }
  }, [socraticInput, handleGrade]);

  if (!activeNode || !nodeData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-neural-dark border-r border-white/5">
        <h2 className="text-xl text-white/60 font-serif">Select a Node to Review</h2>
        <button onClick={openChat} className="mt-4 text-sm text-cyan-400 opacity-80 hover:opacity-100 transition">Return to Chat</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-neural-gray-900 border-r border-neural-gray-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.02)_0%,_transparent_70%)] pointer-events-none" />
      
      <header className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between z-10">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neural-light/40 mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            Active Recall
          </h2>
          <h1 className="text-xl font-serif text-white/90">{nodeData.title}</h1>
        </div>
        <button onClick={openChat} className="text-white/40 hover:text-white/80 transition p-2 rounded-full hover:bg-white/5">
          ✕
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center z-10 relative">
        <div className="w-full max-w-sm space-y-6">
          
          <div className={`transition-all duration-700 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none fixed'}`}>
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur text-center space-y-4">
               <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest border-b border-white/5 pl-1 pb-2">Core Insight</h3>
               <p className="text-base text-white/90 font-serif leading-relaxed italic">
                 {nodeData.core_insight || "No specific insight recorded."}
               </p>
            </div>
            
            <div className="mt-8">
              {!socraticMode ? (
                <>
                  <p className="text-center text-xs text-white/40 mb-3 uppercase tracking-widest font-medium">How well did you remember?</p>
                  <div className="grid grid-cols-4 gap-2">
                    <button disabled={isSubmitting} onClick={() => handleGrade(Rating.Again)} className="py-3 rounded text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition disabled:opacity-50">Again</button>
                    <button disabled={isSubmitting} onClick={() => handleGrade(Rating.Hard)} className="py-3 rounded text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition disabled:opacity-50">Hard</button>
                    <button disabled={isSubmitting} onClick={() => handleGrade(Rating.Good)} className="py-3 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition disabled:opacity-50">Good</button>
                    <button disabled={isSubmitting} onClick={() => handleGrade(Rating.Easy)} className="py-3 rounded text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition disabled:opacity-50">Easy</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSocraticSubmit} className="space-y-3">
                   <p className="text-xs text-cyan-400/80 uppercase tracking-widest font-medium text-center">Socratic AI Evaluator</p>
                   <textarea
                     autoFocus
                     disabled={isSubmitting}
                     value={socraticInput}
                     onChange={e => setSocraticInput(e.target.value)}
                     placeholder={`Explain your understanding of "${nodeData.title}"...`}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none h-24 placeholder:text-white/20"
                   />
                   <div className="flex gap-2">
                     <button type="button" onClick={() => setSocraticMode(false)} className="flex-1 py-2 text-xs text-white/40 hover:text-white/80 transition">Cancel</button>
                     <button type="submit" disabled={isSubmitting || !socraticInput.trim()} className="flex-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded py-2 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/30 transition disabled:opacity-30">Submit for Grading</button>
                   </div>
                </form>
              )}
            </div>
          </div>

          {!isRevealed && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
               <div className="p-5 rounded-xl border border-white/5 bg-black/20 text-center relative overflow-hidden group">
                 <div className="absolute inset-0 backdrop-blur-[8px] bg-black/40 z-10 flex items-center justify-center transition opacity-100">
                    <span className="text-white/30 text-2xl font-serif italic pointer-events-none select-none">???</span>
                 </div>
                 <h3 className="text-sm font-semibold text-white/20 uppercase tracking-widest border-b border-white/5 pl-1 pb-2">Core Insight</h3>
                 <p className="text-base text-white/10 font-serif leading-relaxed italic mt-4 opacity-30 select-none">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
                 </p>
               </div>
               
               <button 
                 onClick={() => setIsRevealed(true)}
                 className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/90 font-bold tracking-widest uppercase hover:bg-white/10 hover:border-white/20 transition-all shadow-lg active:scale-95"
               >
                 Reveal Answer
               </button>
               
               <button 
                 onClick={() => { setIsRevealed(true); setSocraticMode(true); }}
                 className="w-full py-2.5 text-xs text-white/40 font-medium tracking-wide uppercase hover:text-white/80 transition-colors"
               >
                 Discuss with AI
               </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
