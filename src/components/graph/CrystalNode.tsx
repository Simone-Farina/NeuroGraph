'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { useGraphStore } from '@/stores/graphStore';

type CrystalNodeData = {
  id?: string;
  title: string;
  retrievability?: number;
  stability?: number;
  last_review?: string | null;
  last_reviewed_at?: string; // Keep for backward compatibility if needed, but prefer last_review
};

type CrystalFlowNode = Node<CrystalNodeData, 'crystal'>;

function getNodeStyles(retrievability: number) {
  // Fresh (>0.9) - High energy, glowing
  if (retrievability > 0.9) {
    return {
      container: 'border-cyan-400/60 bg-cyan-950/30 shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)] animate-pulse-cyan backdrop-blur-xl',
      text: 'text-cyan-50',
      label: 'text-cyan-300/80',
      handle: '!bg-cyan-400 !border-cyan-200',
      icon: '💎',
      state: 'Fresh',
      progress: 'bg-cyan-400'
    };
  }

  // Stable (0.7-0.9) - Solid, calm, reliable
  if (retrievability > 0.7) {
    return {
      container: 'border-purple-500/50 bg-purple-950/20 shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)] backdrop-blur-lg',
      text: 'text-purple-50',
      label: 'text-purple-300/80',
      handle: '!bg-purple-500 !border-purple-300',
      icon: '🔮',
      state: 'Stable',
      progress: 'bg-purple-500'
    };
  }

  // Fading (0.5-0.7) - Warning, needs attention
  if (retrievability > 0.5) {
    return {
      container: 'border-yellow-500/50 bg-yellow-950/20 shadow-[0_0_15px_-5px_rgba(234,179,8,0.2)] backdrop-blur-lg',
      text: 'text-yellow-50',
      label: 'text-yellow-300/80',
      handle: '!bg-yellow-500 !border-yellow-300',
      icon: '🌙',
      state: 'Fading',
      progress: 'bg-yellow-500'
    };
  }

  // Decaying (0.3-0.5) - Unstable, trembling
  if (retrievability > 0.3) {
    return {
      container: 'border-orange-500/60 bg-orange-950/30 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] animate-tremble backdrop-blur-xl',
      text: 'text-orange-50',
      label: 'text-orange-300/80',
      handle: '!bg-orange-500 !border-orange-300',
      icon: '🍂',
      state: 'Decaying',
      progress: 'bg-orange-500'
    };
  }

  // Critical (<0.3) - Emergency, dying
  return {
    container: 'border-red-600/70 bg-red-950/40 shadow-[0_0_30px_-5px_rgba(220,38,38,0.4)] animate-pulse-red backdrop-blur-2xl',
    text: 'text-red-50',
    label: 'text-red-300/80',
    handle: '!bg-red-600 !border-red-400',
    icon: '⚠️',
    state: 'Critical',
    progress: 'bg-red-600'
  };
}

export function CrystalNode({ id, data }: NodeProps<CrystalFlowNode>) {
  const retrievability = typeof data.retrievability === 'number' ? data.retrievability : 1.0;
  const styles = getNodeStyles(retrievability);
  const removeNode = useGraphStore((state) => state.removeNode);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this crystal?')) return;

    try {
      const response = await fetch(`/api/crystals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        removeNode(id);
      } else {
        const error = await response.json();
        alert('Failed to delete crystal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete crystal', error);
      alert('An error occurred while deleting the crystal.');
    }
  };

  const lastReviewDate = data.last_review || data.last_reviewed_at;

  return (
    <div className={`group relative w-52 rounded-2xl border px-5 py-4 transition-all duration-300 hover:scale-105 hover:border-opacity-100 hover:z-50 ${styles.container}`}>
      {/* Tooltip */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-max max-w-[220px] rounded-xl bg-neural-gray-900/95 border border-white/10 p-3 text-xs text-neural-light opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-top-24 pointer-events-none z-50 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
          <span className="text-lg">{styles.icon}</span>
          <span className={`font-bold text-sm ${styles.text}`}>{styles.state} State</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-neural-light/60">Retrievability</span>
            <span className={`font-mono font-bold ${styles.text}`}>{Math.round(retrievability * 100)}%</span>
          </div>
          {lastReviewDate && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-neural-light/60">Last Review</span>
              <span className="text-neural-light/80">{new Date(lastReviewDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neural-gray-900/95 border-r border-b border-white/10 rotate-45"></div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-neural-dark text-neural-light/40 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 shadow-lg"
        title="Delete crystal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>

      <Handle type="target" position={Position.Top} className={`!h-3.5 !w-3.5 !border-2 !border-neural-dark transition-colors duration-300 ${styles.handle}`} />
      
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${styles.label}`}>Crystal</p>
        <span className="text-sm filter drop-shadow-md">{styles.icon}</span>
      </div>
      
      <p className={`text-sm font-bold leading-snug mb-3 line-clamp-2 ${styles.text}`}>
        {data.title}
      </p>
      
      <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden backdrop-blur-sm">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.progress}`}
          style={{ 
            width: `${retrievability * 100}%`,
          }} 
        />
      </div>

      <Handle type="source" position={Position.Bottom} className={`!h-3.5 !w-3.5 !border-2 !border-neural-dark transition-colors duration-300 ${styles.handle}`} />
    </div>
  );
}
