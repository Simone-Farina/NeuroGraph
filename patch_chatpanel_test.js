const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatPanel.test.tsx', 'utf8');

code = code.replace(
  'vi.mock(\'@/stores/graphStore\', () => ({\n  useGraphStore: {\n    getState: () => ({\n      edges: [],\n      addEdge: vi.fn(),\n      addNode: vi.fn(),\n    }),\n  },\n}));',
  `vi.mock('@/stores/graphStore', () => {
  const storeFn = vi.fn((selector) => {
    const state = {
      nodes: [],
      edges: [],
      addEdge: vi.fn(),
      addNode: vi.fn(),
    };
    return selector ? selector(state) : state;
  });
  storeFn.getState = () => ({
    nodes: [],
    edges: [],
    addEdge: vi.fn(),
    addNode: vi.fn(),
  });
  return { useGraphStore: storeFn };
});`
);

// We should also look out for: vi.mocked(require('@/stores/graphStore').useGraphStore).getState
code = code.replace(
  `vi.mocked(require('@/stores/graphStore').useGraphStore).getState = vi.fn(() => ({
  nodes: [],
  edges: [],
  addEdge: vi.fn(),
  addNode: vi.fn(),
}));`,
  ''
);

fs.writeFileSync('src/components/chat/ChatPanel.test.tsx', code);
