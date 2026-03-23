import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

import { GhostNeuronNode } from '@/components/graph/GhostNeuronNode';
import { useGraphStore } from '@/stores/graphStore';

describe('GraphPanel horizon rendering contract', () => {
  beforeEach(() => {
    useGraphStore.setState({
      nodes: [],
      edges: [],
      ghostNodes: [],
      ghostEdges: [],
      horizonTarget: null,
      horizonError: null,
      isHorizonLoading: false,
      pendingHorizonSeed: null,
      leftPanelMode: 'chat',
      shellPreset: 'standard',
      activeNeuronId: null,
      activeGhostNodeId: null,
    });
  });

  it('renders the ghost node blueprint surface with the expected content', () => {
    render(
      <GhostNeuronNode
        {...({
          id: 'ghost:Embeddings',
          data: {
            title: 'Embeddings',
            definition: 'Dense vector representations that encode semantic meaning.',
            bloomLevel: 'Understand',
            target: 'Vector Databases',
          },
          selected: false,
        } as any)}
      />
    );

    expect(screen.getByText('Blueprint')).toBeInTheDocument();
    expect(screen.getByText('Embeddings')).toBeInTheDocument();
    expect(
      screen.getByText('Dense vector representations that encode semantic meaning.')
    ).toBeInTheDocument();
  });

  it('keeps the horizon graph draft ephemeral in store state', () => {
    useGraphStore.getState().setHorizonDraft('Vector Databases', {
      isValid: true,
      nodes: [
        {
          title: 'Embeddings',
          definition: 'Dense vector representations that encode semantic meaning.',
          bloom_level: 'Understand',
        },
      ],
      synapses: [],
    });

    const state = useGraphStore.getState();

    expect(state.ghostNodes).toHaveLength(1);
    expect(state.nodes).toHaveLength(0);
    expect(state.horizonTarget).toBe('Vector Databases');
  });
});
