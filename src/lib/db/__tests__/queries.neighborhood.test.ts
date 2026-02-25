import { describe, it, expect, vi, beforeEach } from 'vitest';
import { neuronQueries } from '../queries';

function createMockClient() {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockOr = vi.fn();
  const mockIn = vi.fn();

  const mockBuilder = {
    select: mockSelect,
    or: mockOr,
    in: mockIn,
  };

  mockFrom.mockReturnValue(mockBuilder);
  mockSelect.mockReturnValue(mockBuilder);
  mockOr.mockReturnValue(Promise.resolve({ data: [], error: null }));
  mockIn.mockReturnValue(Promise.resolve({ data: [], error: null }));

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      or: mockOr,
      in: mockIn,
    },
  } as any;
}

describe('neuronQueries.getNeighborhoodsBatch', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should fetch synapses and neurons for multiple ids', async () => {
    const ids = ['1', '2'];
    const mockSynapses = [
      { source_neuron_id: '1', target_neuron_id: '10', type: 'RELATED' },
      { source_neuron_id: '20', target_neuron_id: '2', type: 'PREREQUISITE' },
    ];
    const mockNeurons = [
      { id: '1', title: 'Neuron 1' },
      { id: '2', title: 'Neuron 2' },
      { id: '10', title: 'Neighbor 10' },
      { id: '20', title: 'Neighbor 20' },
    ];

    mockClient._mocks.or.mockResolvedValue({ data: mockSynapses, error: null });
    mockClient._mocks.in.mockResolvedValue({ data: mockNeurons, error: null });

    const result = await neuronQueries.getNeighborhoodsBatch(mockClient, ids, 1);

    expect(mockClient.from).toHaveBeenCalledWith('synapses');
    const expectedOrFilter = `source_neuron_id.in.(${ids.join(',')}),target_neuron_id.in.(${ids.join(',')})`;
    expect(mockClient._mocks.or).toHaveBeenCalledWith(expectedOrFilter);

    expect(mockClient.from).toHaveBeenCalledWith('neurons');
    const expectedIds = expect.arrayContaining(['1', '2', '10', '20']);
    expect(mockClient._mocks.in).toHaveBeenCalledWith('id', expectedIds);

    expect(result.size).toBe(2);
    const n1 = result.get('1');
    expect(n1).toBeDefined();
    expect(n1?.neurons.map((n: any) => n.id)).toContain('1');
    expect(n1?.neurons.map((n: any) => n.id)).toContain('10');
    expect(n1?.synapses).toHaveLength(1);

    const n2 = result.get('2');
    expect(n2).toBeDefined();
    expect(n2?.neurons.map((n: any) => n.id)).toContain('2');
    expect(n2?.neurons.map((n: any) => n.id)).toContain('20');
    expect(n2?.synapses).toHaveLength(1);
  });

  it('should handle empty input', async () => {
    const result = await neuronQueries.getNeighborhoodsBatch(mockClient, [], 1);
    expect(result.size).toBe(0);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('should throw if maxDepth > 1', async () => {
    await expect(neuronQueries.getNeighborhoodsBatch(mockClient, ['1'], 2)).rejects.toThrow(
      'Batch neighborhood retrieval only supports depth 1'
    );
  });
});
