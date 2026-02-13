'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';

type CrystalNodeData = {
  title: string;
  retrievability?: number;
};

type CrystalFlowNode = Node<CrystalNodeData, 'crystal'>;

function getNodeStyles(retrievability: number) {
  if (retrievability < 0.45) {
    return {
      container: 'border-amber-500/50 bg-amber-950/40 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]',
      text: 'text-amber-100',
      label: 'text-amber-200/60',
      handle: '!bg-amber-500',
      icon: '⚠️'
    };
  }

  if (retrievability > 0.85) {
    return {
      container: 'border-neural-cyan/50 bg-neural-cyan/10 shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] animate-pulse-cyan',
      text: 'text-neural-cyan',
      label: 'text-neural-cyan/60',
      handle: '!bg-neural-cyan',
      icon: '💎'
    };
  }

  return {
    container: 'border-neural-purple/40 bg-neural-purple/10 shadow-[0_0_15px_-5px_rgba(168,85,247,0.3)]',
    text: 'text-neural-light',
    label: 'text-neural-purple/60',
    handle: '!bg-neural-purple',
    icon: '🔮'
  };
}

export function CrystalNode({ data }: NodeProps<CrystalFlowNode>) {
  const retrievability = typeof data.retrievability === 'number' ? data.retrievability : 0.7;
  const styles = getNodeStyles(retrievability);

  return (
    <div className={`relative w-48 rounded-xl border px-4 py-3 backdrop-blur-md transition-all hover:scale-105 hover:border-opacity-80 ${styles.container}`}>
      <Handle type="target" position={Position.Left} className={`!h-3 !w-3 !border-2 !border-neural-dark ${styles.handle}`} />
      
      <div className="flex items-start justify-between mb-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${styles.label}`}>Crystal</p>
        <span className="text-xs opacity-80">{styles.icon}</span>
      </div>
      
      <p className={`text-sm font-bold leading-tight ${styles.text}`}>
        {data.title}
      </p>
      
      <div className="mt-2 h-1 w-full rounded-full bg-black/20 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${retrievability * 100}%`,
            backgroundColor: retrievability > 0.85 ? '#06b6d4' : retrievability < 0.45 ? '#f59e0b' : '#a855f7'
          }} 
        />
      </div>

      <Handle type="source" position={Position.Right} className={`!h-3 !w-3 !border-2 !border-neural-dark ${styles.handle}`} />
    </div>
  );
}
