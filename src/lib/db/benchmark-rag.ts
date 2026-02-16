import { supabase } from './client';
import { crystalQueries } from './queries';
import type { BloomLevel } from '@/types/database';

const SPIKE_USER_ID = '00000000-0000-0000-0000-000000000003'; // Different ID for this benchmark
const NUM_CRYSTALS = 500;
const NUM_EDGES = 1500;
const BATCH_TEST_SIZE = 5; // Simulating the RAG context retrieval of 5 crystals

function generateMockEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

function randomBloomLevel(): BloomLevel {
  const levels: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  return levels[Math.floor(Math.random() * levels.length)];
}

async function createPerformanceData() {
  console.log(`🔧 Creating performance test data: ${NUM_CRYSTALS} crystals, ${NUM_EDGES} edges\n`);

  const conversationResult = await supabase
    .from('conversations')
    .insert({
      user_id: SPIKE_USER_ID,
      title: 'RAG Benchmark Conversation',
    })
    .select()
    .single();

  if (conversationResult.error) throw conversationResult.error;

  const messageResult = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationResult.data.id,
      role: 'user',
      content: 'RAG Benchmark message',
    })
    .select()
    .single();

  if (messageResult.error) throw messageResult.error;

  const batchSize = 100;
  const crystalIds: string[] = [];

  for (let i = 0; i < NUM_CRYSTALS; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, NUM_CRYSTALS - i) }, (_, j) => {
      const idx = i + j;
      return {
        user_id: SPIKE_USER_ID,
        title: `RAG Benchmark Crystal ${idx}`,
        definition: `Test crystal for RAG benchmark number ${idx}`,
        core_insight: `Insight ${idx}`,
        bloom_level: randomBloomLevel(),
        source_conversation_id: conversationResult.data.id,
        source_message_ids: [messageResult.data.id],
        embedding: generateMockEmbedding(),
        stability: 1.0,
        retrievability: 1.0,
        next_review_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        review_count: 0,
        consecutive_correct: 0,
        // FSRS fields
        difficulty: 5.0,
        state: 'New' as const,
        reps: 0,
        lapses: 0,
        elapsed_days: 0,
        scheduled_days: 0
      };
    });

    const result = await supabase.from('crystals').insert(batch).select('id');
    if (result.error) throw result.error;

    crystalIds.push(...result.data.map((c) => c.id));
    console.log(`  Created crystals ${i}-${i + batch.length - 1}`);
  }

  console.log(`✅ Created ${crystalIds.length} crystals\n`);

  const edgeTypes = ['PREREQUISITE', 'RELATED', 'BUILDS_ON'] as const;
  const edgeBatchSize = 200;

  for (let i = 0; i < NUM_EDGES; i += edgeBatchSize) {
    const batch = Array.from({ length: Math.min(edgeBatchSize, NUM_EDGES - i) }, () => {
      const sourceIdx = Math.floor(Math.random() * crystalIds.length);
      let targetIdx = Math.floor(Math.random() * crystalIds.length);

      while (targetIdx === sourceIdx) {
        targetIdx = Math.floor(Math.random() * crystalIds.length);
      }

      return {
        user_id: SPIKE_USER_ID,
        source_crystal_id: crystalIds[sourceIdx],
        target_crystal_id: crystalIds[targetIdx],
        type: edgeTypes[Math.floor(Math.random() * edgeTypes.length)],
        weight: Math.random(),
        ai_suggested: Math.random() > 0.5,
      };
    });

    const result = await supabase.from('crystal_edges').insert(batch).select('id');
    if (result.error) throw result.error;

    console.log(`  Created edges ${i}-${i + batch.length - 1}`);
  }

  console.log(`✅ Created ${NUM_EDGES} edges\n`);

  return { crystalIds };
}

async function benchmarkImplementations(crystalIds: string[]) {
  console.log(`⚡ Benchmarking RAG neighborhood retrieval (batch size: ${BATCH_TEST_SIZE})...\n`);

  const iterations = 10;
  const timingsConcurrent: number[] = [];
  const timingsBatch: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Select random crystals for this iteration
    const testIds: string[] = [];
    for (let k = 0; k < BATCH_TEST_SIZE; k++) {
      testIds.push(crystalIds[Math.floor(Math.random() * crystalIds.length)]);
    }

    // 1. Measure Concurrent RPCs (Baseline)
    const startConcurrent = performance.now();
    await Promise.all(
      testIds.map(id => crystalQueries.getNeighborhood(supabase, id, 1))
    );
    const endConcurrent = performance.now();
    timingsConcurrent.push(endConcurrent - startConcurrent);

    // 2. Measure Batched Query (Optimized)
    const startBatch = performance.now();
    // @ts-ignore - function might not exist yet if running before implementation
    if (crystalQueries.getNeighborhoodsBatch) {
      // @ts-ignore
      await crystalQueries.getNeighborhoodsBatch(supabase, testIds, 1);
    } else {
      console.warn('getNeighborhoodsBatch not implemented yet');
    }
    const endBatch = performance.now();
    timingsBatch.push(endBatch - startBatch);

    process.stdout.write('.');
  }
  console.log('\n');

  const avgConcurrent = timingsConcurrent.reduce((a, b) => a + b, 0) / timingsConcurrent.length;
  const avgBatch = timingsBatch.reduce((a, b) => a + b, 0) / timingsBatch.length;

  console.log('📊 Benchmark Results:');
  console.log(`  Concurrent RPCs (Baseline): ${avgConcurrent.toFixed(2)}ms`);
  console.log(`  Batched Query (Optimized):  ${avgBatch.toFixed(2)}ms`);
  console.log(`  Improvement:                ${((avgConcurrent - avgBatch) / avgConcurrent * 100).toFixed(1)}% faster`);

  return { avgConcurrent, avgBatch };
}

async function cleanup() {
  console.log('\n🧹 Cleaning up performance test data...');

  // Delete edges
  await supabase.from('crystal_edges').delete().eq('user_id', SPIKE_USER_ID);

  // Delete crystals
  await supabase.from('crystals').delete().eq('user_id', SPIKE_USER_ID);

  // Clean up conversation and messages
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', SPIKE_USER_ID);

  if (conversations && conversations.length > 0) {
    await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversations.map(c => c.id));

    await supabase
      .from('conversations')
      .delete()
      .eq('user_id', SPIKE_USER_ID);
  }

  console.log('✅ Cleanup complete\n');
}

async function runBenchmark() {
  try {
    console.log('🚀 NeuroGraph RAG Benchmark\n');
    const { crystalIds } = await createPerformanceData();
    await benchmarkImplementations(crystalIds);
    await cleanup();
    console.log('🎉 Benchmark completed successfully!');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    await cleanup().catch(console.error);
    process.exit(1);
  }
}

if (require.main === module) {
  runBenchmark();
}
