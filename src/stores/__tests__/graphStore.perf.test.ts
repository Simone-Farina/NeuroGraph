import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGraphStore } from '../graphStore';
import { Edge } from '@xyflow/react';

// Mock edge data
const generateEdges = (count: number): Edge[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `edge-${i}`,
    source: `source-${i}`,
    target: `target-${i}`,
    type: 'synapseEdge',
    data: { typeLabel: 'RELATED' },
  }));
};

describe('GraphStore Performance', () => {
  beforeEach(() => {
    useGraphStore.setState({ nodes: [], edges: [] });
  });

  it('measures baseline performance for adding edges one by one', () => {
    const edgeCount = 5000;
    const edges = generateEdges(edgeCount);

    const upsertEdgeInStore = (edgeInput: any) => {
      const { edges: currentEdges, addEdge } = useGraphStore.getState();

      const exists = currentEdges.some((existing) => {
        const data = existing.data as { typeLabel?: string } | undefined;
        return (
          existing.id === edgeInput.id ||
          (existing.source === edgeInput.source &&
            existing.target === edgeInput.target &&
            data?.typeLabel === edgeInput.data?.typeLabel)
        );
      });

      if (exists) {
        return;
      }

      addEdge(edgeInput);
    };

    const start = performance.now();

    edges.forEach((edge) => {
      upsertEdgeInStore(edge);
    });

    const end = performance.now();
    const duration = end - start;

    console.log(`[Baseline] Adding ${edgeCount} edges one-by-one took: ${duration.toFixed(2)}ms`);

    expect(useGraphStore.getState().edges.length).toBe(edgeCount);
  });

  it('measures optimized performance for adding edges in batch (with deduping using Set)', () => {
    const edgeCount = 5000;
    const edges = generateEdges(edgeCount);
    const edgesWithDups = [...edges, ...edges.slice(0, 100)];

    const upsertEdgesInBatch = (newEdges: Edge[]) => {
      const { edges: currentEdges, addEdges } = useGraphStore.getState();

      const seenIds = new Set(currentEdges.map(e => e.id));
      const seenContent = new Set(currentEdges.map(e => {
        const data = e.data as { typeLabel?: string } | undefined;
        return `${e.source}:${e.target}:${data?.typeLabel}`;
      }));

      const edgesToAdd: Edge[] = [];

      for (const edge of newEdges) {
        if (seenIds.has(edge.id)) continue;

        const contentKey = `${edge.source}:${edge.target}:${(edge.data as any)?.typeLabel}`;
        if (seenContent.has(contentKey)) continue;

        edgesToAdd.push(edge);
        seenIds.add(edge.id);
        seenContent.add(contentKey);
      }

      if (edgesToAdd.length > 0) {
        addEdges(edgesToAdd);
      }
    };

    const start = performance.now();

    upsertEdgesInBatch(edgesWithDups);

    const end = performance.now();
    const duration = end - start;

    console.log(`[Optimized] Adding ${edgesWithDups.length} edges (with dups) in batch took: ${duration.toFixed(2)}ms`);

    expect(useGraphStore.getState().edges.length).toBe(edgeCount);
  });
});
