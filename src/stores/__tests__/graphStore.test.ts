import { beforeEach, describe, expect, it } from 'vitest';

import { useGraphStore } from '@/stores/graphStore';

describe('graphStore horizon state', () => {
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

  it('stores a valid horizon draft as ghost nodes and edges', () => {
    useGraphStore.getState().setHorizonDraft('Vector Databases', {
      isValid: true,
      nodes: [
        {
          title: 'Embeddings',
          definition: 'Dense vector representations that encode semantic meaning.',
          bloom_level: 'Understand',
        },
        {
          title: 'Vector Databases',
          definition: 'Databases optimized for indexing and searching embeddings.',
          bloom_level: 'Apply',
        },
      ],
      synapses: [
        {
          sourceTitle: 'Embeddings',
          targetTitle: 'Vector Databases',
          type: 'PREREQUISITE',
        },
      ],
    });

    const state = useGraphStore.getState();

    expect(state.horizonTarget).toBe('Vector Databases');
    expect(state.ghostNodes).toHaveLength(2);
    expect(state.ghostEdges).toHaveLength(1);
    expect(state.shellPreset).toBe('graph_zenith');
  });

  it('opens briefing mode for a selected ghost node and converts it into a learning seed', () => {
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

    const ghostNodeId = useGraphStore.getState().ghostNodes[0].id;

    useGraphStore.getState().openGhostBriefing(ghostNodeId);
    expect(useGraphStore.getState().leftPanelMode).toBe('briefing');

    useGraphStore.getState().beginHorizonLearning();

    const state = useGraphStore.getState();
    expect(state.leftPanelMode).toBe('chat');
    expect(state.pendingHorizonSeed).toEqual({
      title: 'Embeddings',
      definition: 'Dense vector representations that encode semantic meaning.',
    });
  });

  it('records horizon errors without persisting any ghost draft', () => {
    useGraphStore.getState().beginHorizonRequest('Impossible Curriculum');
    useGraphStore.getState().setHorizonError('Pedagogical cycle detected.');

    const state = useGraphStore.getState();

    expect(state.isHorizonLoading).toBe(false);
    expect(state.horizonError).toBe('Pedagogical cycle detected.');
    expect(state.ghostNodes).toHaveLength(0);
  });
});

describe('graphStore bloom state', () => {
  beforeEach(() => {
    useGraphStore.setState({
      bloomLevel: null,
      bloomConfidence: 0,
      isBloomPending: false,
      bloomKeyPhrases: [],
      latestBloomMessageId: null,
    });
  });

  it('stores bloomKeyPhrases and latestBloomMessageId via setBloomEval', () => {
    useGraphStore.getState().setBloomEval('Analyze', 0.85, ['compared tradeoffs', 'because the bottleneck'], 'msg-123');
    const state = useGraphStore.getState();
    expect(state.bloomLevel).toBe('Analyze');
    expect(state.bloomConfidence).toBe(0.85);
    expect(state.bloomKeyPhrases).toEqual(['compared tradeoffs', 'because the bottleneck']);
    expect(state.latestBloomMessageId).toBe('msg-123');
    expect(state.isBloomPending).toBe(false);
  });

  it('defaults keyPhrases to [] and messageId to null when not provided', () => {
    useGraphStore.getState().setBloomEval('Remember', 0.9);
    const state = useGraphStore.getState();
    expect(state.bloomKeyPhrases).toEqual([]);
    expect(state.latestBloomMessageId).toBeNull();
  });

  it('resetBloomEval clears bloomKeyPhrases and latestBloomMessageId', () => {
    useGraphStore.getState().setBloomEval('Create', 0.95, ['novel framework'], 'msg-456');
    useGraphStore.getState().resetBloomEval();
    const state = useGraphStore.getState();
    expect(state.bloomLevel).toBeNull();
    expect(state.bloomConfidence).toBe(0);
    expect(state.bloomKeyPhrases).toEqual([]);
    expect(state.latestBloomMessageId).toBeNull();
  });

  it('initial state has empty bloomKeyPhrases and null latestBloomMessageId', () => {
    const state = useGraphStore.getState();
    expect(state.bloomKeyPhrases).toEqual([]);
    expect(state.latestBloomMessageId).toBeNull();
  });
});
