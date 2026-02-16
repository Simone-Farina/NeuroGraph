import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crystalQueries } from '../db/queries';

// Mock data
const mockIds = ['1', '2', '3', '4', '5'];
const mockNeighborhood = {
  crystals: [{ id: '1', title: 'C1' }, { id: 'n1', title: 'N1' }],
  edges: [{ source_crystal_id: '1', target_crystal_id: 'n1' }]
};

// Delays
const RPC_DELAY = 50;
const QUERY_DELAY = 10; // Simple select is faster than CTE

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('RAG Performance Benchmark', () => {
  let mockClient: any;
  let rpcCallCount = 0;
  let queryCallCount = 0;

  beforeEach(() => {
    rpcCallCount = 0;
    queryCallCount = 0;

    const createQueryBuilder = () => {
        const builder: any = {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) => {
                queryCallCount++;
                // Simulate async db call
                return delay(QUERY_DELAY).then(() => {
                   // Return mock data depending on context if needed,
                   // but for perf test just returning valid structure is enough
                   resolve({ data: [], error: null });
                });
            }
        };
        return builder;
    };

    mockClient = {
      rpc: vi.fn(async () => {
        rpcCallCount++;
        await delay(RPC_DELAY);
        return { data: [mockNeighborhood], error: null };
      }),
      from: vi.fn(() => createQueryBuilder())
    };
  });

  it('measures baseline performance (Promise.all + RPC)', async () => {
    const start = Date.now();

    // Old Logic: Loop calling RPC
    await Promise.all(
      mockIds.map(id =>
        mockClient.rpc('get_crystal_neighborhood', { root_crystal_id: id, max_depth: 1 })
      )
    );

    const duration = Date.now() - start;
    console.log(`\nBaseline (Parallel RPCs): ${duration}ms`);
    console.log(`  RPC Calls: ${rpcCallCount}`);
    console.log(`  Query Calls: ${queryCallCount}`);

    expect(rpcCallCount).toBe(mockIds.length);
    expect(queryCallCount).toBe(0);
  });

  it('measures optimized performance (Batch Query)', async () => {
    const start = Date.now();

    // New Logic: Use the real implementation
    await crystalQueries.getNeighborhoodsBatch(mockClient, mockIds);

    const duration = Date.now() - start;
    console.log(`\nOptimized (Batch Queries): ${duration}ms`);
    console.log(`  RPC Calls: ${rpcCallCount}`);
    console.log(`  Query Calls: ${queryCallCount}`);

    expect(rpcCallCount).toBe(0);
    expect(queryCallCount).toBe(2);

    // We expect 2 sequential calls of 10ms = ~20ms
    // vs 5 parallel calls of 50ms = ~50ms
    // So optimization should be faster in latency too.
  });
});
