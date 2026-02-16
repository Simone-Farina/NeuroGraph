import { describe, it, expect } from 'vitest';
import { toGraphEdge, edgeSuggestionKey } from './useEdgeSuggestions';
import { RelationshipType } from '@/types/chat';
import { MarkerType } from '@xyflow/react';

describe('useEdgeSuggestions utils', () => {
  describe('toGraphEdge', () => {
    it('should create a PREREQUISITE edge with correct marker', () => {
      const input = {
        id: 'edge1',
        source_crystal_id: 'source1',
        target_crystal_id: 'target1',
        type: 'PREREQUISITE' as RelationshipType,
      };

      const result = toGraphEdge(input);

      expect(result).toEqual({
        id: 'edge1',
        source: 'source1',
        target: 'target1',
        type: 'crystalEdge',
        data: { typeLabel: 'PREREQUISITE' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#22d3ee',
        },
      });
    });

    it('should create a RELATED edge with no marker', () => {
      const input = {
        id: 'edge2',
        source_crystal_id: 'source2',
        target_crystal_id: 'target2',
        type: 'RELATED' as RelationshipType,
      };

      const result = toGraphEdge(input);

      expect(result).toEqual({
        id: 'edge2',
        source: 'source2',
        target: 'target2',
        type: 'crystalEdge',
        data: { typeLabel: 'RELATED' },
        markerEnd: undefined,
      });
    });

    it('should create a BUILDS_ON edge with correct marker', () => {
      const input = {
        id: 'edge3',
        source_crystal_id: 'source3',
        target_crystal_id: 'target3',
        type: 'BUILDS_ON' as RelationshipType,
      };

      const result = toGraphEdge(input);

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
    it('should generate correct key string', () => {
      const input = {
        source_crystal_id: 'source1',
        target_crystal_id: 'target1',
        type: 'PREREQUISITE' as RelationshipType,
      };

      const result = edgeSuggestionKey(input);

      expect(result).toBe('source1:target1:PREREQUISITE');
    });
  });
});
