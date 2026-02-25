import { describe, it, expect } from 'vitest';
import { toGraphSynapse, synapseSuggestionKey } from '../useSynapseSuggestions';
import { RelationshipType } from '@/types/chat';
import { MarkerType } from '@xyflow/react';

describe('toGraphSynapse', () => {
  it('should transform a synapse object correctly for RELATED type', () => {
    const synapse = {
      id: 'edge1',
      source_neuron_id: 'source1',
      target_neuron_id: 'target1',
      type: 'RELATED' as RelationshipType,
    };

    const result = toGraphSynapse(synapse);

    expect(result).toEqual({
      id: 'edge1',
      source: 'source1',
      target: 'target1',
      type: 'synapseEdge',
      data: { typeLabel: 'RELATED' },
      markerEnd: undefined,
    });
  });

  it('should transform a synapse object correctly for PREREQUISITE type', () => {
    const synapse = {
      id: 'edge2',
      source_neuron_id: 'source2',
      target_neuron_id: 'target2',
      type: 'PREREQUISITE' as RelationshipType,
    };

    const result = toGraphSynapse(synapse);

    expect(result).toEqual({
      id: 'edge2',
      source: 'source2',
      target: 'target2',
      type: 'synapseEdge',
      data: { typeLabel: 'PREREQUISITE' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#22d3ee',
      },
    });
  });

  it('should transform a synapse object correctly for BUILDS_ON type', () => {
    const synapse = {
      id: 'edge3',
      source_neuron_id: 'source3',
      target_neuron_id: 'target3',
      type: 'BUILDS_ON' as RelationshipType,
    };

    const result = toGraphSynapse(synapse);

    expect(result).toEqual({
      id: 'edge3',
      source: 'source3',
      target: 'target3',
      type: 'synapseEdge',
      data: { typeLabel: 'BUILDS_ON' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#f59e0b',
      },
    });
  });
});

describe('synapseSuggestionKey', () => {
  it('should generate the correct key for a suggestion', () => {
    const suggestion = {
      source_neuron_id: 'source1',
      target_neuron_id: 'target1',
      type: 'RELATED' as RelationshipType,
    };

    const result = synapseSuggestionKey(suggestion);

    expect(result).toBe('source1:target1:RELATED');
  });

  it('should generate the correct key for different types', () => {
     const suggestion = {
      source_neuron_id: 'source2',
      target_neuron_id: 'target2',
      type: 'PREREQUISITE' as RelationshipType,
    };

    expect(synapseSuggestionKey(suggestion)).toBe('source2:target2:PREREQUISITE');
  });
});
