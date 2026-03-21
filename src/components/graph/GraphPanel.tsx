'use client';

import '@xyflow/react/dist/style.css';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { usePathname, useRouter } from 'next/navigation';

import type { ArchitectResponse } from '@/lib/ai/architect';
import { GhostNeuronNode } from '@/components/graph/GhostNeuronNode';
import { SynapseEdge } from '@/components/graph/SynapseEdge';
import { NeuronNode } from '@/components/graph/NeuronNode';
import { useGraphStore } from '@/stores/graphStore';
import { calculateRetrievability } from '@/lib/ai/fsrs';
import { Neuron } from '@/types/database';

const nodeTypes = {
  neuron: NeuronNode,
  ghostNeuron: GhostNeuronNode,
};

const edgeTypes = {
  synapseEdge: SynapseEdge,
};

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

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
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
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
  const ghostNodes = useGraphStore((state) => state.ghostNodes);
  const ghostEdges = useGraphStore((state) => state.ghostEdges);
  const horizonTarget = useGraphStore((state) => state.horizonTarget);
  const horizonError = useGraphStore((state) => state.horizonError);
  const isHorizonLoading = useGraphStore((state) => state.isHorizonLoading);
  const setGraph = useGraphStore((state) => state.setGraph);
  const beginHorizonRequest = useGraphStore((state) => state.beginHorizonRequest);
  const setHorizonDraft = useGraphStore((state) => state.setHorizonDraft);
  const setHorizonError = useGraphStore((state) => state.setHorizonError);
  const clearHorizonDraft = useGraphStore((state) => state.clearHorizonDraft);
  const updateNode = useGraphStore((state) => state.updateNode);
  const openNeuronDetail = useGraphStore((state) => state.openNeuronDetail);
  const openGhostBriefing = useGraphStore((state) => state.openGhostBriefing);
  const activeNeuronId = useGraphStore((state) => state.activeNeuronId);
  const { fitView, setCenter, getNode } = useReactFlow();
  const router = useRouter();
  const pathname = usePathname();

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');

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

  const combinedNodes = useMemo(() => [...nodes, ...ghostNodes], [ghostNodes, nodes]);
  const combinedEdges = useMemo(() => [...edges, ...ghostEdges], [edges, ghostEdges]);

  useEffect(() => {
    onLayout(combinedNodes, combinedEdges);
  }, [combinedNodes, combinedEdges, onLayout]);

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
        draggable: false,
        data: {
          title: neuron.title,
          retrievability: neuron.retrievability,
          last_reviewed_at: neuron.last_reviewed_at,
          stability: neuron.stability,
          last_review: neuron.last_review,
          state: neuron.state,
          is_ghost: neuron.is_ghost ?? false,
          ghost_depth: neuron.ghost_depth ?? null,
          ghost_target_title: neuron.ghost_target_title ?? null,
        },
      }));

      const mappedEdges: Edge[] = synapses.map((synapse: any) => ({
        id: synapse.id,
        source: synapse.source_neuron_id,
        target: synapse.target_neuron_id,
        type: 'synapseEdge',
        data: { typeLabel: synapse.type, is_ghost_edge: false },
        style: synapse.type === 'PREREQUISITE' ? { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 } : undefined,
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

  useEffect(() => {
    if (activeNeuronId) {
      const node = getNode(activeNeuronId);
      if (node && node.position) {
        setCenter(node.position.x + nodeWidth / 2, node.position.y + nodeHeight / 2, {
          zoom: 1.5,
          duration: 800,
        });
      }
    }
  }, [activeNeuronId, getNode, setCenter]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'ghostNeuron') {
        openGhostBriefing(node.id);
        if (pathname !== '/app') {
          router.push('/app');
        }
        return;
      }

      openNeuronDetail(node.id);
    },
    [openGhostBriefing, openNeuronDetail, pathname, router]
  );

  const handleTargetSubmit = useCallback(async () => {
    const target = targetInput.trim();
    if (!target || isHorizonLoading) {
      return;
    }

    beginHorizonRequest(target);

    try {
      const response = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; draft?: ArchitectResponse; target?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to generate a learning path right now.');
      }

      if (!payload?.draft) {
        throw new Error('Architect response was missing a draft payload.');
      }

      if (!payload.draft.isValid) {
        setHorizonError(payload.draft.refusalReason || 'Architect refused this target.');
        return;
      }

      setHorizonDraft(payload.target || target, payload.draft);
      setTargetInput('');
      setIsTargetOpen(false);
    } catch (error) {
      setHorizonError(
        error instanceof Error ? error.message : 'Unable to generate a learning path right now.'
      );
    }
  }, [
    beginHorizonRequest,
    isHorizonLoading,
    setHorizonDraft,
    setHorizonError,
    targetInput,
  ]);

  if (!flowNodes.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[#0c0c0e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)]" />
        <div className="relative z-10 max-w-md">
          <h3 className="mb-4 font-serif text-3xl font-normal tracking-tight text-white/40">
            An empty space.
          </h3>
          <p className="font-serif text-[17px] leading-relaxed text-white/30">
            Set a target or crystallize ideas in chat. This graph will hold your durable neurons,
            while the Horizon lets you inspect a draft path before anything becomes permanent.
          </p>
        </div>
        <div className="absolute left-5 top-5 z-20 w-[min(420px,calc(100%-2.5rem))]">
          <div className="rounded-[24px] border border-white/7 bg-neural-dark/75 p-3 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              {!isTargetOpen ? (
                <button
                  type="button"
                  onClick={() => setIsTargetOpen(true)}
                  className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  Set Learning Target
                </button>
              ) : (
                <>
                  <input
                    aria-label="Learning target"
                    value={targetInput}
                    onChange={(event) => setTargetInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void handleTargetSubmit();
                      }
                    }}
                    placeholder="Vector Databases"
                    className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 outline-none placeholder:text-white/24 focus:border-white/18"
                  />
                  <button
                    type="button"
                    onClick={() => void handleTargetSubmit()}
                    className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-white/82 transition hover:border-white/20"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTargetOpen(false)}
                    className="rounded-full border border-white/8 px-3 py-2 text-sm text-white/46 transition hover:text-white/76"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 z-20 w-[min(460px,calc(100%-2.5rem))]">
        <div className="pointer-events-auto rounded-[24px] border border-white/7 bg-neural-dark/72 p-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            {!isTargetOpen ? (
              <button
                type="button"
                onClick={() => setIsTargetOpen(true)}
                className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Set Learning Target
              </button>
            ) : (
              <>
                <input
                  aria-label="Learning target"
                  value={targetInput}
                  onChange={(event) => setTargetInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleTargetSubmit();
                    }
                  }}
                  placeholder="Vector Databases"
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 outline-none placeholder:text-white/24 focus:border-white/18"
                />
                <button
                  type="button"
                  onClick={() => void handleTargetSubmit()}
                  className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-white/82 transition hover:border-white/20"
                >
                  {isHorizonLoading ? 'Thinking…' : 'Generate'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTargetOpen(false)}
                  className="rounded-full border border-white/8 px-3 py-2 text-sm text-white/46 transition hover:text-white/76"
                >
                  Cancel
                </button>
              </>
            )}

            {ghostNodes.length > 0 ? (
              <button
                type="button"
                onClick={clearHorizonDraft}
                className="rounded-full border border-white/8 px-3 py-2 text-sm text-white/46 transition hover:text-white/76"
              >
                Clear Draft
              </button>
            ) : null}
          </div>

          {(horizonTarget || horizonError) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
              {horizonTarget ? (
                <span className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-white/34">
                  Target {horizonTarget}
                </span>
              ) : null}
              {horizonError ? (
                <span className="rounded-full border border-orange-400/16 bg-orange-500/[0.08] px-3 py-1 text-orange-300/82">
                  {horizonError}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

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
        className="bg-[#0c0c0e]"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255, 255, 255, 0.03)" gap={40} size={1} variant={'lines' as any} />
      </ReactFlow>
    </>
  );
}

export function GraphPanel() {
  return (
    <section className="graph-panel h-full overflow-hidden bg-neural-dark relative" data-tour="graph-panel">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.01)_0%,_transparent_70%)] z-0" />
      <ReactFlowProvider>
        <GraphCanvas />
      </ReactFlowProvider>
    </section>
  );
}
