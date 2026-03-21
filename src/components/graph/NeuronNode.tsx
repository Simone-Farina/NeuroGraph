'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';

import { useGraphStore } from '@/stores/graphStore';

type NeuronNodeData = {
  id?: string;
  title: string;
  retrievability?: number;
  stability?: number;
  last_review?: string | null;
  last_reviewed_at?: string;
};

type NeuronFlowNode = Node<NeuronNodeData, 'neuron'>;

function getNodeStyles(retrievability: number) {
  if (retrievability > 0.9) {
    return {
      container:
        'border-white/20 bg-white/[0.04] shadow-2xl backdrop-blur-xl group-hover:border-white/40',
      text: 'text-white/90',
      label: 'text-white/30',
      handle: '!bg-white/40 !border-white/10',
      icon: '○',
      state: 'Fresh',
      progress: 'bg-white/60',
    };
  }

  if (retrievability > 0.7) {
    return {
      container:
        'border-white/10 bg-white/[0.02] shadow-xl backdrop-blur-lg group-hover:border-white/30',
      text: 'text-white/80',
      label: 'text-white/20',
      handle: '!bg-white/30 !border-white/5',
      icon: '◎',
      state: 'Stable',
      progress: 'bg-white/40',
    };
  }

  if (retrievability > 0.5) {
    return {
      container:
        'border-white/5 bg-white/[0.01] shadow-lg backdrop-blur-md group-hover:border-white/20',
      text: 'text-white/60',
      label: 'text-white/10',
      handle: '!bg-white/20 !border-white/5',
      icon: '◍',
      state: 'Fading',
      progress: 'bg-white/20',
    };
  }

  if (retrievability > 0.3) {
    return {
      container:
        'border-white/5 bg-transparent backdrop-blur-sm group-hover:border-white/15',
      text: 'text-white/40',
      label: 'text-white/10',
      handle: '!bg-white/10 !border-white/5',
      icon: '◌',
      state: 'Decaying',
      progress: 'bg-white/10',
    };
  }

  return {
    container:
      'border-white/5 bg-transparent opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0',
    text: 'text-white/30',
    label: 'text-white/5',
    handle: '!bg-white/5 !border-white/5',
    icon: '•',
    state: 'Critical',
    progress: 'bg-white/5',
  };
}

export function NeuronNode({ id, data, selected }: NodeProps<NeuronFlowNode>) {
  const retrievability = typeof data.retrievability === 'number' ? data.retrievability : 1.0;
  const styles = getNodeStyles(retrievability);
  const removeNode = useGraphStore((state) => state.removeNode);

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this neuron?')) return;

    try {
      const response = await fetch(`/api/neurons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        removeNode(id);
      } else {
        const error = await response.json();
        alert(`Failed to delete neuron: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete neuron', error);
      alert('An error occurred while deleting the neuron.');
    }
  };

  const lastReviewDate = data.last_review || data.last_reviewed_at;

  return (
    <div
      className={`group relative w-52 rounded-2xl border px-5 py-4 transition-all duration-300 hover:border-white/30 hover:z-50 ${styles.container} ${selected ? 'border-white/60 bg-white/[0.05] z-50' : ''}`}
    >
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-max max-w-[220px] rounded-xl bg-neural-gray-900/95 border border-white/10 p-3 text-xs text-neural-light opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-top-24 pointer-events-none z-50 shadow-2xl">
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
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neural-gray-900/95 border-r border-b border-white/10 rotate-45" />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-neural-dark text-neural-light/40 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 shadow-lg"
        title="Delete neuron"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
      </button>

      <Handle
        type="target"
        position={Position.Top}
        className={`!h-3.5 !w-3.5 !border-2 !border-neural-dark transition-colors duration-300 ${styles.handle}`}
      />

      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Neuron</p>
        <span className="text-xs text-white/40 font-serif">{styles.icon}</span>
      </div>

      <p className={`text-[15px] font-serif leading-snug mb-4 line-clamp-2 ${styles.text}`}>{data.title}</p>

      <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.progress}`}
          style={{ width: `${retrievability * 100}%` }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={`!h-3.5 !w-3.5 !border-2 !border-neural-dark transition-colors duration-300 ${styles.handle}`}
      />
    </div>
  );
}
