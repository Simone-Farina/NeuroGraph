'use client';

import '@xyflow/react/dist/style.css';

import { useEffect } from 'react';
import {
  Background,
  Controls,
  Edge,
  MarkerType,
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

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(edges);
  }, [edges, setFlowEdges]);

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
        markerEnd:
          edge.type === 'RELATED'
            ? undefined
            : {
                type: MarkerType.ArrowClosed,
                color: edge.type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
              },
      }));

      setGraph(mappedNodes, mappedEdges);
    };

    loadGraph();
  }, [setGraph]);

  if (!flowNodes.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center bg-neural-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_rgba(10,10,10,0)_70%)]" />
        <div className="relative z-10 max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neural-cyan/10 text-3xl text-neural-cyan animate-pulse-cyan">
            🕸️
          </div>
          <h3 className="text-xl font-bold text-neural-light mb-2">Knowledge Graph Empty</h3>
          <p className="text-sm text-neural-light/60">
            Start a conversation to generate crystalized knowledge nodes. Your graph will grow organically as you learn.
          </p>
        </div>
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
      nodesConnectable={false}
      fitView
      className="bg-neural-dark"
      proOptions={{ hideAttribution: true }}
    >
      <Controls className="!bg-neural-gray-800/80 !border-white/10 !fill-neural-light/70 [&>button]:!border-b-white/10 hover:[&>button]:!bg-white/5" />
      <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />
    </ReactFlow>
  );
}

export function GraphPanel() {
  return (
    <section className="graph-panel h-full overflow-hidden bg-neural-dark relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.05)_0%,_rgba(10,10,10,0)_50%)] z-0" />
      <ReactFlowProvider>
        <GraphCanvas />
      </ReactFlowProvider>
    </section>
  );
}
