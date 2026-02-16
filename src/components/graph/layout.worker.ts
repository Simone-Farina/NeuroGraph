import dagre from '@dagrejs/dagre';

// We redefine minimal types to avoid importing large dependencies or React-specific types if possible,
// but importing types from @xyflow/react is usually safe as they are erased at runtime.
// However, to be safe and standalone, I'll define the shape expected.
interface Node {
  id: string;
  width?: number;
  height?: number;
  position: { x: number; y: number };
  [key: string]: any;
}

interface Edge {
  source: string;
  target: string;
  [key: string]: any;
}

interface LayoutMessage {
  nodes: Node[];
  edges: Edge[];
  requestId: number;
}

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
      targetPosition: 'top', // Position.Top
      sourcePosition: 'bottom', // Position.Bottom
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

self.onmessage = (event: MessageEvent<LayoutMessage>) => {
  const { nodes, edges, requestId } = event.data;

  try {
    const result = getLayoutedElements(nodes, edges);
    self.postMessage({ ...result, requestId });
  } catch (error) {
    // In case of error, just return original nodes/edges or handle gracefully
    // For now we log and return original
    console.error('Layout worker error:', error);
    self.postMessage({ nodes, edges, requestId });
  }
};
