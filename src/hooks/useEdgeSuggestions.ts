import { MarkerType, type Edge } from '@xyflow/react';

import type { RelationshipType } from '@/types/chat';

type EdgeLike = {
  id: string;
  source_crystal_id: string;
  target_crystal_id: string;
  type: RelationshipType;
};

function markerForEdge(type: RelationshipType) {
  if (type === 'RELATED') {
    return undefined;
  }

  return {
    type: MarkerType.ArrowClosed,
    color: type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
  };
}

export function toGraphEdge(edge: EdgeLike): Edge {
  return {
    id: edge.id,
    source: edge.source_crystal_id,
    target: edge.target_crystal_id,
    type: 'crystalEdge',
    data: { typeLabel: edge.type },
    markerEnd: markerForEdge(edge.type),
  };
}

export function edgeSuggestionKey(suggestion: Omit<EdgeLike, 'id'>) {
  return `${suggestion.source_crystal_id}:${suggestion.target_crystal_id}:${suggestion.type}`;
}
