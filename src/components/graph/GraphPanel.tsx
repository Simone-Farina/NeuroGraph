'use client';

import '@xyflow/react/dist/style.css';

import { useEffect } from 'react';
import {
  Background,
  Controls,
  Edge,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';

import { CrystalEdge } from '@/components/graph/CrystalEdge';
import { CrystalNode } from '@/components/graph/CrystalNode';
import { useGraphStore } from '@/stores/graphStore';

const nodeTypes = {
  crystal: CrystalNode,
};

const edgeTypes = {
  crystalEdge: CrystalEdge,
};

function GraphCanvas() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setGraph = useGraphStore((state) => state.setGraph);

  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    const loadGraph = async () => {
      const response = await fetch('/api/crystals', { cache: 'no-store' });
      if (!response.ok) return;

      const payload = await response.json();
      const crystals = payload.crystals || [];
      const crystalEdges = payload.edges || [];

      const mappedNodes: Node[] = crystals.slice(0, 200).map((crystal: any, index: number) => ({
        id: crystal.id,
        type: 'crystal',
        position: {
          x: 120 + (index % 4) * 220,
          y: 100 + Math.floor(index / 4) * 140,
        },
        data: {
          title: crystal.title,
          retrievability: crystal.retrievability,
        },
      }));

      const mappedEdges: Edge[] = crystalEdges.map((edge: any) => ({
        id: edge.id,
        source: edge.source_crystal_id,
        target: edge.target_crystal_id,
        type: 'crystalEdge',
        data: { typeLabel: edge.type },
      }));

      setGraph(mappedNodes, mappedEdges);
    };

    loadGraph();
  }, [setGraph]);

  if (!flowNodes.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-neural-light/60">
        Start a conversation to build your knowledge graph.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      className="bg-neural-dark"
    >
      <Controls />
      <Background color="#2d2d2d" gap={24} />
    </ReactFlow>
  );
}

export function GraphPanel() {
  return (
    <section className="graph-panel h-[calc(100vh-73px)] bg-neural-dark">
      <ReactFlowProvider>
        <GraphCanvas />
      </ReactFlowProvider>
    </section>
  );
}
