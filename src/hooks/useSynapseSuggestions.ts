import { MarkerType, type Edge } from '@xyflow/react';

import type { RelationshipType } from '@/types/chat';

type SynapseLike = {
  id: string;
  source_neuron_id: string;
  target_neuron_id: string;
  type: RelationshipType;
};

function markerForSynapse(type: RelationshipType) {
  if (type === 'RELATED') {
    return undefined;
  }

  return {
    type: MarkerType.ArrowClosed,
    color: type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
  };
}

export function toGraphSynapse(synapse: SynapseLike): Edge {
  return {
    id: synapse.id,
    source: synapse.source_neuron_id,
    target: synapse.target_neuron_id,
    type: 'synapseEdge',
    data: { typeLabel: synapse.type },
    markerEnd: markerForSynapse(synapse.type),
  };
}

export function synapseSuggestionKey(suggestion: Omit<SynapseLike, 'id'>) {
  return `${suggestion.source_neuron_id}:${suggestion.target_neuron_id}:${suggestion.type}`;
}
