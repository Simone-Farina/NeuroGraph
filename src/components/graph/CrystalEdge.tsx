'use client';

import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

type CrystalEdgeData = {
  typeLabel?: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
};

type CrystalFlowEdge = Edge<CrystalEdgeData, 'crystalEdge'>;

export function CrystalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<CrystalFlowEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const typeLabel = data?.typeLabel ?? 'RELATED';

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: '#4b5563', strokeWidth: 1.5 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="rounded border border-neural-gray-700 bg-neural-gray-900 px-1.5 py-0.5 text-[10px] text-neural-light/70"
        >
          {typeLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
