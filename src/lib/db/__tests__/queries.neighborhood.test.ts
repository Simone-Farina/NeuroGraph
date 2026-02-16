import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crystalQueries } from '../queries';

function createMockClient() {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockOr = vi.fn();
  const mockIn = vi.fn();

  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ or: mockOr, in: mockIn });
  // Allow chaining: .or returns result, .in returns result
  // But wait, the actual implementation will await the result.
  // So .or should return a Promise (or an object with `then` or `data/error` property).

  // Actually, Supabase query builder returns a Promise-like object that also has filter methods.
  // But typically we await the final result.
  // Let's model it as:
  // .from() -> { select: () -> { or: () -> Promise<{data, error}>, in: () -> Promise<{data, error}> } }

  // But for the second query (crystals), we do .select().in()
  // For the first query (edges), we do .select().or()

  // So the mock needs to be flexible.

  const mockBuilder = {
    select: mockSelect,
    or: mockOr,
    in: mockIn,
    // Add then/catch to make it thenable if needed, or just return data from filters
  };

  mockFrom.mockReturnValue(mockBuilder);
  mockSelect.mockReturnValue(mockBuilder);
  mockOr.mockReturnValue(Promise.resolve({ data: [], error: null }));
  mockIn.mockReturnValue(Promise.resolve({ data: [], error: null }));

  return {
    from: mockFrom,
    // Expose mocks for assertions
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      or: mockOr,
      in: mockIn,
    }
  } as any;
}

describe('crystalQueries.getNeighborhoodsBatch', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it('should fetch edges and crystals for multiple ids', async () => {
    const ids = ['1', '2'];

    // Mock edges response
    const mockEdges = [
      { source_crystal_id: '1', target_crystal_id: '10', type: 'RELATED' },
      { source_crystal_id: '20', target_crystal_id: '2', type: 'PREREQUISITE' },
    ];

    // Mock crystals response
    // Should include original IDs (1, 2) and neighbors (10, 20)
    const mockCrystals = [
      { id: '1', title: 'Crystal 1' },
      { id: '2', title: 'Crystal 2' },
      { id: '10', title: 'Neighbor 10' },
      { id: '20', title: 'Neighbor 20' },
    ];

    // Setup mocks
    mockClient._mocks.or.mockResolvedValue({ data: mockEdges, error: null });
    mockClient._mocks.in.mockResolvedValue({ data: mockCrystals, error: null });

    // Call the function
    // @ts-ignore - function might not be in type definition yet
    const result = await crystalQueries.getNeighborhoodsBatch(mockClient, ids, 1);

    // Verify edges query
    expect(mockClient.from).toHaveBeenCalledWith('crystal_edges');
    // Verify that .or was called with correct filter string
    // Filter string should be roughly: source_crystal_id.in.(1,2),target_crystal_id.in.(1,2)
    const expectedOrFilter = `source_crystal_id.in.(${ids.join(',')}),target_crystal_id.in.(${ids.join(',')})`;
    expect(mockClient._mocks.or).toHaveBeenCalledWith(expectedOrFilter);

    // Verify crystals query
    expect(mockClient.from).toHaveBeenCalledWith('crystals');
    // Verify that .in was called with all involved IDs
    const expectedIds = expect.arrayContaining(['1', '2', '10', '20']);
    expect(mockClient._mocks.in).toHaveBeenCalledWith('id', expectedIds);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.size).toBe(2);

    const n1 = result.get('1');
    expect(n1).toBeDefined();
    expect(n1.crystals.map((c: any) => c.id)).toContain('1');
    expect(n1.crystals.map((c: any) => c.id)).toContain('10'); // Neighbor
    expect(n1.edges).toHaveLength(1); // Edge 1-10

    const n2 = result.get('2');
    expect(n2).toBeDefined();
    expect(n2.crystals.map((c: any) => c.id)).toContain('2');
    expect(n2.crystals.map((c: any) => c.id)).toContain('20'); // Neighbor
    expect(n2.edges).toHaveLength(1); // Edge 20-2
  });

  it('should handle empty input', async () => {
    // @ts-ignore
    const result = await crystalQueries.getNeighborhoodsBatch(mockClient, [], 1);
    expect(result.size).toBe(0);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('should throw if maxDepth > 1', async () => {
    await expect(
      // @ts-ignore
      crystalQueries.getNeighborhoodsBatch(mockClient, ['1'], 2)
    ).rejects.toThrow('Batch neighborhood retrieval only supports depth 1');
  });
});
