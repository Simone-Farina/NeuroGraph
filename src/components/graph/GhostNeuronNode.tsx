'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';

import type { HorizonGhostNodeData } from '@/stores/graphStore';

type GhostNeuronFlowNode = Node<HorizonGhostNodeData, 'ghostNeuron'>;

export function GhostNeuronNode({ data, selected }: NodeProps<GhostNeuronFlowNode>) {
  return (
    <div
      className={`group relative w-52 rounded-[26px] border border-dashed border-white/14 bg-white/[0.02] px-5 py-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-300 hover:border-white/24 hover:bg-white/[0.035] ${
        selected ? 'border-white/26 bg-white/[0.05]' : 'opacity-65 hover:opacity-90'
      }`}
    >
      <Handle type="target" position={Position.Top} style={{ display: 'none' }} />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/28">
          Blueprint
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/24">
          {data.bloomLevel}
        </span>
      </div>

      <p className="mb-2 font-serif text-[15px] leading-snug text-white/78">{data.title}</p>
      <p className="line-clamp-3 text-[12px] leading-relaxed text-white/44">{data.definition}</p>

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/22">
        <span>Ghost Node</span>
        <span>Click to Brief</span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ display: 'none' }} />
    </div>
  );
}
