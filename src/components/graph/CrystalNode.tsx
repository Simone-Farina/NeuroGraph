'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';

type CrystalNodeData = {
  title: string;
  retrievability?: number;
};

type CrystalFlowNode = Node<CrystalNodeData, 'crystal'>;

function getNodeStyles(retrievability: number) {
  if (retrievability < 0.45) {
    return 'border-amber-400/50 bg-amber-500/10 text-amber-100';
  }

  if (retrievability > 0.85) {
    return 'border-neural-cyan/60 bg-neural-cyan/10 text-neural-light';
  }

  return 'border-neural-purple/50 bg-neural-purple/10 text-neural-light';
}

export function CrystalNode({ data }: NodeProps<CrystalFlowNode>) {
  const retrievability = typeof data.retrievability === 'number' ? data.retrievability : 0.7;

  return (
    <div className={`w-48 rounded-xl border px-3 py-2 shadow-md ${getNodeStyles(retrievability)}`}>
      <Handle type="target" position={Position.Left} className="!bg-neural-cyan" />
      <p className="text-xs font-semibold uppercase tracking-wide text-neural-light/60">Crystal</p>
      <p className="mt-1 text-sm font-medium leading-snug">{data.title}</p>
      <Handle type="source" position={Position.Right} className="!bg-neural-cyan" />
    </div>
  );
}
