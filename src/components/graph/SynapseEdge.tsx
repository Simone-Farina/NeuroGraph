'use client';

import { BaseEdge, Edge, EdgeProps, getBezierPath } from '@xyflow/react';

type SynapseEdgeData = {
  typeLabel?: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
};

type SynapseFlowEdge = Edge<SynapseEdgeData, 'synapseEdge'>;

export function SynapseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<SynapseFlowEdge>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const typeLabel = data?.typeLabel ?? 'RELATED';
  const styleByType: Record<
    NonNullable<SynapseEdgeData['typeLabel']>,
    {
      stroke: string;
      strokeWidth: number;
      strokeDasharray?: string;
      showArrow: boolean;
    }
  > = {
    PREREQUISITE: {
      stroke: '#22d3ee',
      strokeWidth: 1.8,
      showArrow: true,
    },
    RELATED: {
      stroke: '#a78bfa',
      strokeWidth: 1.6,
      strokeDasharray: '6 4',
      showArrow: false,
    },
    BUILDS_ON: {
      stroke: '#f59e0b',
      strokeWidth: 1.8,
      strokeDasharray: '2 4',
      showArrow: true,
    },
  };
  const { showArrow, ...edgeStyle } = styleByType[typeLabel];

  const glowStyle = {
    ...edgeStyle,
    strokeWidth: edgeStyle.strokeWidth * 4,
    strokeOpacity: 0.15,
    filter: 'blur(3px)',
  };

  return (
    <>
      <BaseEdge id={`${id}-glow`} path={edgePath} style={glowStyle} />
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerEnd={showArrow ? markerEnd : undefined} />
    </>
  );
}
