import { supabase } from './client';
import type { BloomLevel } from '@/types/database';

const SPIKE_USER_ID = '00000000-0000-0000-0000-000000000002';
const NUM_CRYSTALS = 500;
const NUM_EDGES = 1500;

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
      title: 'Performance Test Conversation',
    })
    .select()
    .single();

  if (conversationResult.error) throw conversationResult.error;

  const messageResult = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationResult.data.id,
      role: 'user',
      content: 'Performance test message',
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
        title: `Performance Crystal ${idx}`,
        definition: `Test crystal for performance measurement number ${idx}`,
        core_insight: `Insight ${idx}`,
        bloom_level: randomBloomLevel(),
        source_conversation_id: conversationResult.data.id,
        source_message_ids: [messageResult.data.id],
        embedding: generateMockEmbedding(),
        stability: 1.0,
        ease_factor: 2.5,
        retrievability: 1.0,
        next_review_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        review_count: 0,
        consecutive_correct: 0,
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

  return { crystalIds, conversationId: conversationResult.data.id };
}

async function testRecursiveCTEPerformance(crystalIds: string[]) {
  console.log('⚡ Testing recursive CTE performance (2-hop neighborhood query)...\n');

  const testCrystalId = crystalIds[Math.floor(crystalIds.length / 2)];

  const iterations = 10;
  const timings: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    const { data, error } = await supabase.rpc('get_crystal_neighborhood', {
      root_crystal_id: testCrystalId,
      max_depth: 2,
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    timings.push(duration);
    console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms`);
  }

  const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
  const minTime = Math.min(...timings);
  const maxTime = Math.max(...timings);

  console.log('\n📊 Performance Results:');
  console.log(`  Average: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min: ${minTime.toFixed(2)}ms`);
  console.log(`  Max: ${maxTime.toFixed(2)}ms`);

  const threshold = 100;
  if (avgTime < threshold) {
    console.log(`\n✅ PASS: Average query time ${avgTime.toFixed(2)}ms < ${threshold}ms threshold`);
  } else {
    console.log(`\n❌ FAIL: Average query time ${avgTime.toFixed(2)}ms >= ${threshold}ms threshold`);
  }

  return { avgTime, minTime, maxTime, threshold };
}

async function cleanup() {
  console.log('\n🧹 Cleaning up performance test data...');

  const deleteEdges = await supabase
    .from('crystal_edges')
    .delete()
    .eq('user_id', SPIKE_USER_ID);

  if (deleteEdges.error) throw deleteEdges.error;

  const deleteCrystals = await supabase
    .from('crystals')
    .delete()
    .eq('user_id', SPIKE_USER_ID);

  if (deleteCrystals.error) throw deleteCrystals.error;

  const { data: conversationRows, error: conversationLookupError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', SPIKE_USER_ID);

  if (conversationLookupError) throw conversationLookupError;

  const conversationIds = (conversationRows || []).map((conversation) => conversation.id);

  if (conversationIds.length > 0) {
    const { error: deleteMessagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);

    if (deleteMessagesError) throw deleteMessagesError;
  }

  const deleteConversations = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', SPIKE_USER_ID);

  if (deleteConversations.error) throw deleteConversations.error;

  console.log('✅ Cleanup complete\n');
}

async function runPerformanceSpike() {
  try {
    console.log('🚀 NeuroGraph Performance Spike\n');
    console.log(`Testing recursive CTE with ${NUM_CRYSTALS} nodes and ${NUM_EDGES} edges\n`);

    const { crystalIds } = await createPerformanceData();

    const results = await testRecursiveCTEPerformance(crystalIds);

    await cleanup();

    console.log('🎉 Performance spike completed successfully!');

    return results;
  } catch (error) {
    console.error('❌ Performance spike failed:', error);
    await cleanup().catch(console.error);
    throw error;
  }
}

if (require.main === module) {
  runPerformanceSpike()
    .then((results) => {
      if (results.avgTime >= results.threshold) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runPerformanceSpike };
