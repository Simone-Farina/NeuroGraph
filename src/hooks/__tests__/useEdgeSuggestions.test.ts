import { describe, it, expect } from 'vitest';
import { toGraphEdge, edgeSuggestionKey } from '../useEdgeSuggestions';
import { RelationshipType } from '@/types/chat';
import { MarkerType } from '@xyflow/react';

describe('toGraphEdge', () => {
  it('should transform an edge object correctly for RELATED type', () => {
    const edge = {
      id: 'edge1',
      source_crystal_id: 'source1',
      target_crystal_id: 'target1',
      type: 'RELATED' as RelationshipType,
    };

    const result = toGraphEdge(edge);

    expect(result).toEqual({
      id: 'edge1',
      source: 'source1',
      target: 'target1',
      type: 'crystalEdge',
      data: { typeLabel: 'RELATED' },
      markerEnd: undefined,
    });
  });

  it('should transform an edge object correctly for PREREQUISITE type', () => {
    const edge = {
      id: 'edge2',
      source_crystal_id: 'source2',
      target_crystal_id: 'target2',
      type: 'PREREQUISITE' as RelationshipType,
    };

    const result = toGraphEdge(edge);

    expect(result).toEqual({
      id: 'edge2',
      source: 'source2',
      target: 'target2',
      type: 'crystalEdge',
      data: { typeLabel: 'PREREQUISITE' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#22d3ee',
      },
    });
  });

  it('should transform an edge object correctly for BUILDS_ON type', () => {
    const edge = {
      id: 'edge3',
      source_crystal_id: 'source3',
      target_crystal_id: 'target3',
      type: 'BUILDS_ON' as RelationshipType,
    };

    const result = toGraphEdge(edge);

    expect(result).toEqual({
      id: 'edge3',
      source: 'source3',
      target: 'target3',
      type: 'crystalEdge',
      data: { typeLabel: 'BUILDS_ON' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#f59e0b',
      },
    });
  });
});

describe('edgeSuggestionKey', () => {
  it('should generate the correct key for a suggestion', () => {
    const suggestion = {
      source_crystal_id: 'source1',
      target_crystal_id: 'target1',
      type: 'RELATED' as RelationshipType,
    };

    const result = edgeSuggestionKey(suggestion);

    expect(result).toBe('source1:target1:RELATED');
  });

  it('should generate the correct key for different types', () => {
     const suggestion = {
      source_crystal_id: 'source2',
      target_crystal_id: 'target2',
      type: 'PREREQUISITE' as RelationshipType,
    };

    expect(edgeSuggestionKey(suggestion)).toBe('source2:target2:PREREQUISITE');
  });
});
