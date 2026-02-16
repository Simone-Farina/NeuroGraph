import dagre from '@dagrejs/dagre';
import { performance } from 'perf_hooks';

// Simulate Node and Edge types if needed for the benchmark context
interface Node {
  id: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
}
interface Edge {
  id: string;
  source: string;
  target: string;
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
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Generate synthetic graph
const generateGraph = (numNodes: number, numEdges: number) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < numNodes; i++) {
    nodes.push({ id: `node-${i}`, position: { x: 0, y: 0 } });
  }

  for (let i = 0; i < numEdges; i++) {
    const source = `node-${Math.floor(Math.random() * numNodes)}`;
    const target = `node-${Math.floor(Math.random() * numNodes)}`;
    if (source !== target) {
      edges.push({ id: `edge-${i}`, source, target });
    }
  }

  return { nodes, edges };
};

const runBenchmark = () => {
  const { nodes, edges } = generateGraph(500, 1000);
  console.log(`Running layout benchmark with ${nodes.length} nodes and ${edges.length} edges...`);

  const start = performance.now();
  getLayoutedElements(nodes, edges);
  const end = performance.now();

  console.log(`Layout calculation took ${(end - start).toFixed(2)}ms`);
};

runBenchmark();
