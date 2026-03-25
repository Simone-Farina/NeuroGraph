import { create } from 'zustand';
import { MarkerType } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import type { ArchitectResponse } from '@/lib/ai/architect';
import { createGhostNodeId } from '@/lib/ai/architect';

type ShellPreset = 'standard' | 'deep_read' | 'graph_zenith';

export type HorizonGhostNodeData = {
  title: string;
  definition: string;
  bloomLevel: string;
  target: string;
};

type HorizonLearningSeed = {
  title: string;
  definition: string;
} | null;

type GraphStore = {
  nodes: Node[];
  edges: Edge[];
  ghostNodes: Array<Node<HorizonGhostNodeData, 'ghostNeuron'>>;
  ghostEdges: Edge[];
  horizonTarget: string | null;
  horizonError: string | null;
  isHorizonLoading: boolean;
  pendingHorizonSeed: HorizonLearningSeed;
  leftPanelMode: 'chat' | 'neuron' | 'review' | 'briefing';
  shellPreset: ShellPreset;
  activeNeuronId: string | null;
  activeGhostNodeId: string | null;
  // Bloom evaluator state — updated silently after each chat message
  bloomLevel: string | null;       // 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create' | null
  bloomConfidence: number;          // 0.0-1.0
  isBloomPending: boolean;          // true while evaluator is running
  setBloomEval: (level: string | null, confidence: number) => void;
  setBloomPending: (pending: boolean) => void;
  resetBloomEval: () => void;
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  addEdges: (edges: Edge[]) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  updateNode: (nodeId: string, data: Partial<Node['data']>) => void;
  beginHorizonRequest: (target: string) => void;
  setHorizonDraft: (target: string, draft: ArchitectResponse) => void;
  setHorizonError: (error: string) => void;
  clearHorizonDraft: () => void;
  openGhostBriefing: (ghostNodeId: string) => void;
  beginHorizonLearning: () => void;
  clearHorizonLearningIntent: () => void;
  setShellPreset: (preset: ShellPreset) => void;
  openNeuronDetail: (id: string) => void;
  openChat: () => void;
  openReview: (id?: string) => void;
  addNeurogenesisResult: (neuron: Record<string, unknown>, synapses: Record<string, unknown>[]) => void;
};

function createGhostNodes(target: string, draft: ArchitectResponse) {
  const idByTitle = new Map<string, string>();

  const ghostNodes = draft.nodes.map((node) => {
    const id = createGhostNodeId(node.title);
    idByTitle.set(node.title, id);

    return {
      id,
      type: 'ghostNeuron' as const,
      position: { x: 0, y: 0 },
      data: {
        title: node.title,
        definition: node.definition,
        bloomLevel: node.bloom_level,
        target,
      },
    };
  });

  const ghostEdges = draft.synapses
    .map((synapse, index) => {
      const source = idByTitle.get(synapse.sourceTitle);
      const targetId = idByTitle.get(synapse.targetTitle);

      if (!source || !targetId) {
        return null;
      }

      return {
        id: `ghost-edge:${index}:${source}:${targetId}:${synapse.type}`,
        source,
        target: targetId,
        style: {
          stroke: 'rgba(148, 163, 184, 0.42)',
          strokeWidth: 1.15,
          strokeDasharray: '5 5',
        },
        markerEnd:
          synapse.type === 'RELATED'
            ? undefined
            : {
                type: 'arrowclosed',
                color: 'rgba(148, 163, 184, 0.42)',
              },
        data: {
          typeLabel: synapse.type,
          ghost: true,
        },
      } satisfies Edge;
    })
    .filter((edge) => edge !== null) as Edge[];

  return { ghostNodes, ghostEdges };
}

export const useGraphStore = create<GraphStore>((set) => ({
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
  bloomLevel: null,
  bloomConfidence: 0,
  isBloomPending: false,
  setBloomEval: (level, confidence) => set({ bloomLevel: level, bloomConfidence: confidence, isBloomPending: false }),
  setBloomPending: (pending) => set({ isBloomPending: pending }),
  resetBloomEval: () => set({ bloomLevel: null, bloomConfidence: 0, isBloomPending: false }),
  setGraph: (nodes, edges) => set({ nodes, edges }),
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),
  addEdges: (edges) =>
    set((state) => ({
      edges: [...state.edges, ...edges],
    })),
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      activeNeuronId: state.activeNeuronId === nodeId ? null : state.activeNeuronId,
    })),
  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),
  updateNode: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),
  beginHorizonRequest: (target) =>
    set({
      horizonTarget: target,
      horizonError: null,
      isHorizonLoading: true,
      activeGhostNodeId: null,
      leftPanelMode: 'chat',
    }),
  setHorizonDraft: (target, draft) =>
    set(() => {
      const { ghostNodes, ghostEdges } = createGhostNodes(target, draft);

      return {
        ghostNodes,
        ghostEdges,
        horizonTarget: target,
        horizonError: null,
        isHorizonLoading: false,
        activeGhostNodeId: null,
        pendingHorizonSeed: null,
        leftPanelMode: 'chat',
        // shellPreset NOT set here — GraphPanel delays the transition
        // by 300ms to let dagre layout and React Flow render first
      };
    }),
  setHorizonError: (error) =>
    set({
      ghostNodes: [],
      ghostEdges: [],
      horizonError: error,
      isHorizonLoading: false,
      activeGhostNodeId: null,
    }),
  clearHorizonDraft: () =>
    set({
      ghostNodes: [],
      ghostEdges: [],
      horizonTarget: null,
      horizonError: null,
      isHorizonLoading: false,
      activeGhostNodeId: null,
      pendingHorizonSeed: null,
      leftPanelMode: 'chat',
      shellPreset: 'standard',
    }),
  openGhostBriefing: (ghostNodeId) =>
    set({
      leftPanelMode: 'briefing',
      activeGhostNodeId: ghostNodeId,
      activeNeuronId: null,
      shellPreset: 'standard',
    }),
  beginHorizonLearning: () =>
    set((state) => {
      const ghostNode = state.ghostNodes.find((node) => node.id === state.activeGhostNodeId);
      const data = ghostNode?.data;

      if (!data) {
        return {};
      }

      return {
        pendingHorizonSeed: {
          title: data.title,
          definition: data.definition,
        },
        leftPanelMode: 'chat' as const,
        shellPreset: 'standard' as ShellPreset,
      };
    }),
  clearHorizonLearningIntent: () => set({ pendingHorizonSeed: null }),
  setShellPreset: (preset) => set({ shellPreset: preset }),
  openNeuronDetail: (id) =>
    set({
      leftPanelMode: 'neuron',
      activeNeuronId: id,
      activeGhostNodeId: null,
      shellPreset: 'standard',
    }),
  openChat: () =>
    set({
      leftPanelMode: 'chat',
      activeNeuronId: null,
      activeGhostNodeId: null,
      shellPreset: 'standard',
    }),
  openReview: (id) =>
    set({
      leftPanelMode: 'review',
      activeNeuronId: id || null,
      activeGhostNodeId: null,
      shellPreset: 'deep_read',
    }),
  addNeurogenesisResult: (neuron, synapses) =>
    set((state) => {
      const newNode: Node = {
        id: neuron.id as string,
        type: 'neuron',
        position: { x: 0, y: 0 },
        draggable: false,
        data: {
          title: neuron.title,
          retrievability: neuron.retrievability,
          stability: neuron.stability,
          last_review: neuron.last_review,
          state: neuron.state,
          is_ghost: false,
          ghost_depth: null,
          ghost_target_title: null,
        },
      };

      const newEdges: Edge[] = synapses.map((synapse) => ({
        id: synapse.id as string,
        source: synapse.source_neuron_id as string,
        target: synapse.target_neuron_id as string,
        type: 'synapseEdge',
        data: { typeLabel: synapse.type, is_ghost_edge: false },
        style:
          synapse.type === 'PREREQUISITE'
            ? { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }
            : undefined,
        markerEnd:
          synapse.type === 'RELATED'
            ? undefined
            : {
                type: MarkerType.ArrowClosed,
                color: synapse.type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
              },
      }));

      return {
        nodes: [...state.nodes, newNode],
        edges: [...state.edges, ...newEdges],
      };
    }),
}));
