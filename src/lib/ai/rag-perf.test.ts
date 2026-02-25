import { describe, it, expect, vi, beforeEach } from 'vitest';
import { neuronQueries } from '../db/queries';

const mockIds = ['1', '2', '3', '4', '5'];
const mockNeighborhood = {
  neurons: [{ id: '1', title: 'N1' }, { id: 'n1', title: 'N2' }],
  synapses: [{ source_neuron_id: '1', target_neuron_id: 'n1' }],
};

const RPC_DELAY = 50;
const QUERY_DELAY = 10;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        then: (resolve: any) => {
          queryCallCount++;
          return delay(QUERY_DELAY).then(() => {
            resolve({ data: [], error: null });
          });
        },
      };
      return builder;
    };

    mockClient = {
      rpc: vi.fn(async () => {
        rpcCallCount++;
        await delay(RPC_DELAY);
        return { data: [mockNeighborhood], error: null };
      }),
      from: vi.fn(() => createQueryBuilder()),
    };
  });

  it('measures baseline performance (Promise.all + RPC)', async () => {
    const start = Date.now();

    await Promise.all(
      mockIds.map((id) =>
        mockClient.rpc('get_neuron_neighborhood', { root_neuron_id: id, max_depth: 1 })
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

    await neuronQueries.getNeighborhoodsBatch(mockClient, mockIds);

    const duration = Date.now() - start;
    console.log(`\nOptimized (Batch Queries): ${duration}ms`);
    console.log(`  RPC Calls: ${rpcCallCount}`);
    console.log(`  Query Calls: ${queryCallCount}`);

    expect(rpcCallCount).toBe(0);
    expect(queryCallCount).toBe(2);
  });
});
