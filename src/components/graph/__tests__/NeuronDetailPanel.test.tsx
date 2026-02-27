import { render, screen, waitFor } from '@testing-library/react';
import { NeuronDetailPanel } from '../NeuronDetailPanel';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useGraphStore } from '@/stores/graphStore';

// Mock dependencies
vi.mock('@/stores/graphStore', () => ({
  useGraphStore: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('NeuronDetailPanel Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for useGraphStore
    // We need to handle both selector and non-selector usage if the component uses it that way
    // But based on the code, it uses selector pattern: useGraphStore(state => state.x)
    (useGraphStore as any).mockImplementation((selector: any) => {
      const state = {
        selectedNodeId: '123', // Ensure panel is open
        setSelectedNode: vi.fn(),
        updateNode: vi.fn(),
        nodes: [],
        edges: [],
      };
      return selector ? selector(state) : state;
    });

    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        neuron: {
          id: '123',
          title: 'Test Neuron',
          definition: 'A test definition',
          core_insight: 'Test insight',
          content: 'Test content',
          bloom_level: 'Understand',
          state: 'Review',
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders close button with accessible name', async () => {
    render(<NeuronDetailPanel />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Neuron')).toBeInTheDocument();
    });

    // This should fail if aria-label is missing on the icon-only button
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('associates labels with inputs correctly', async () => {
    render(<NeuronDetailPanel />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Neuron')).toBeInTheDocument();
    });

    // These should fail if htmlFor/id are missing
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/definition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/core insight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/detailed content/i)).toBeInTheDocument();
  });
});
