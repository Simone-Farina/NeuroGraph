import { create } from 'zustand';
import type { Edge, Node } from '@xyflow/react';

type GraphStore = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
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
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
}));
