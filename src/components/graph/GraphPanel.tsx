'use client';

import '@xyflow/react/dist/style.css';

import { useEffect, useCallback } from 'react';
import {
  Background,
  Edge,
  MarkerType,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  Position,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';

import { SynapseEdge } from '@/components/graph/SynapseEdge';
import { NeuronNode } from '@/components/graph/NeuronNode';
import { NeuronDetailPanel } from '@/components/graph/NeuronDetailPanel';
import { useGraphStore } from '@/stores/graphStore';
import { calculateRetrievability } from '@/lib/ai/fsrs';
import { Neuron } from '@/types/database';

const nodeTypes = {
  neuron: NeuronNode,
};

const edgeTypes = {
  synapseEdge: SynapseEdge,
};

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function GraphCanvas() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setGraph = useGraphStore((state) => state.setGraph);
  const updateNode = useGraphStore((state) => state.updateNode);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const { fitView } = useReactFlow();

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);

  const onLayout = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nextNodes, nextEdges);

      setFlowNodes([...layoutedNodes]);
      setFlowEdges([...layoutedEdges]);

      window.requestAnimationFrame(() => {
        fitView({ padding: 0.3, maxZoom: 0.7 });
      });
    },
    [setFlowNodes, setFlowEdges, fitView]
  );

  useEffect(() => {
    onLayout(nodes, edges);
  }, [nodes, edges, onLayout]);

  useEffect(() => {
    const updateRetrievability = () => {
      const now = new Date();
      const currentNodes = useGraphStore.getState().nodes;

      currentNodes.forEach((node) => {
        const data = node.data as Record<string, unknown>;

        if (typeof data.stability === 'number') {
          const neuronPartial = {
            stability: data.stability,
            last_review: typeof data.last_review === 'string' ? data.last_review : null,
            state: typeof data.state === 'string' ? data.state : 'Review',
          } as Neuron;

          const previousRetrievability = typeof data.retrievability === 'number' ? data.retrievability : 0;
          const newRetrievability = calculateRetrievability(neuronPartial, now);

          if (Math.abs(newRetrievability - previousRetrievability) > 0.001) {
            updateNode(node.id, { retrievability: newRetrievability });
          }
        }
      });
    };

    updateRetrievability();
    const interval = setInterval(updateRetrievability, 60 * 1000);

    return () => clearInterval(interval);
  }, [updateNode]);

  useEffect(() => {
    const loadGraph = async () => {
      const response = await fetch('/api/neurons', { cache: 'no-store' });
      if (!response.ok) return;

      const payload = await response.json();
      const neurons = payload.neurons || [];
      const synapses = payload.synapses || [];

      const mappedNodes: Node[] = neurons.slice(0, 200).map((neuron: any) => ({
        id: neuron.id,
        type: 'neuron',
        position: { x: 0, y: 0 },
        data: {
          title: neuron.title,
          retrievability: neuron.retrievability,
          last_reviewed_at: neuron.last_reviewed_at,
          stability: neuron.stability,
          last_review: neuron.last_review,
          state: neuron.state,
        },
      }));

      const mappedEdges: Edge[] = synapses.map((synapse: any) => ({
        id: synapse.id,
        source: synapse.source_neuron_id,
        target: synapse.target_neuron_id,
        type: 'synapseEdge',
        data: { typeLabel: synapse.type },
        markerEnd:
          synapse.type === 'RELATED'
            ? undefined
            : {
                type: MarkerType.ArrowClosed,
                color: synapse.type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
              },
      }));

      setGraph(mappedNodes, mappedEdges);
    };

    loadGraph();
    const interval = setInterval(loadGraph, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [setGraph]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  if (!flowNodes.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center bg-neural-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_rgba(10,10,10,0)_70%)]" />
        <div className="relative z-10 max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neural-cyan/10 text-3xl text-neural-cyan animate-pulse-cyan">
            🕸️
          </div>
          <h3 className="text-xl font-bold text-neural-light mb-2">Neural Network Empty</h3>
          <p className="text-sm text-neural-light/60">
            Start a conversation to generate neurons. Your network will grow organically as you learn.
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
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 0.7 }}
      className="bg-neural-dark"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />
    </ReactFlow>
  );
}

export function GraphPanel() {
  return (
    <section className="graph-panel h-full overflow-hidden bg-neural-dark relative" data-tour="graph-panel">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.05)_0%,_rgba(10,10,10,0)_50%)] z-0" />
      <ReactFlowProvider>
        <GraphCanvas />
      </ReactFlowProvider>
      <NeuronDetailPanel />
    </section>
  );
}
