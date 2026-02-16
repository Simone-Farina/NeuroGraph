import { create } from 'zustand';
import type { Edge, Node } from '@xyflow/react';

type GraphStore = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  addEdges: (edges: Edge[]) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  updateNode: (nodeId: string, data: Partial<Node['data']>) => void;
  batchUpdateNodes: (updates: { id: string; data: Partial<Node['data']> }[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
};

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
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
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
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
  batchUpdateNodes: (updates) =>
    set((state) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.data]));
      return {
        nodes: state.nodes.map((node) => {
          const update = updateMap.get(node.id);
          return update ? { ...node, data: { ...node.data, ...update } } : node;
        }),
      };
    }),
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
}));
