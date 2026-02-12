import { supabase } from './client';
import type { BloomLevel } from '@/types/database';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

function generateMockEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

export async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  const conversation = await supabase
    .from('conversations')
    .insert({
      user_id: TEST_USER_ID,
      title: 'Understanding Economic Principles',
    })
    .select()
    .single();

  if (conversation.error) {
    console.error('Error creating conversation:', conversation.error);
    throw conversation.error;
  }

  console.log('✅ Created conversation:', conversation.data.title);

  const messages = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversation.data.id,
        role: 'user' as const,
        content: 'Can you explain supply and demand?',
      },
      {
        conversation_id: conversation.data.id,
        role: 'assistant' as const,
        content: 'Supply and demand are fundamental economic concepts...',
      },
      {
        conversation_id: conversation.data.id,
        role: 'user' as const,
        content: 'How does price elasticity relate to this?',
      },
    ])
    .select();

  if (messages.error) {
    console.error('Error creating messages:', messages.error);
    throw messages.error;
  }

  console.log(`✅ Created ${messages.data.length} messages\n`);

  const crystalData = [
    {
      title: 'Supply and Demand Equilibrium',
      definition: 'The price point where quantity supplied equals quantity demanded, creating market stability.',
      core_insight: 'Markets naturally tend toward equilibrium through price adjustments.',
      bloom_level: 'Understand' as BloomLevel,
    },
    {
      title: 'Price Elasticity of Demand',
      definition: 'Measure of how quantity demanded changes in response to price changes.',
      core_insight: 'Elastic goods have substitutes; inelastic goods are necessities.',
      bloom_level: 'Analyze' as BloomLevel,
    },
    {
      title: 'Opportunity Cost',
      definition: 'The value of the next best alternative foregone when making a choice.',
      core_insight: 'Every decision has hidden costs beyond monetary price.',
      bloom_level: 'Apply' as BloomLevel,
    },
    {
      title: 'Comparative Advantage',
      definition: 'The ability to produce at a lower opportunity cost than competitors.',
      core_insight: 'Specialization and trade benefit both parties even when one is better at everything.',
      bloom_level: 'Evaluate' as BloomLevel,
    },
    {
      title: 'Marginal Utility',
      definition: 'The additional satisfaction gained from consuming one more unit of a good.',
      core_insight: 'Utility diminishes with each additional unit consumed.',
      bloom_level: 'Understand' as BloomLevel,
    },
  ];

  const crystals = await supabase
    .from('crystals')
    .insert(
      crystalData.map((c, i) => ({
        user_id: TEST_USER_ID,
        ...c,
        source_conversation_id: conversation.data.id,
        source_message_ids: [messages.data[i % messages.data.length].id],
        embedding: generateMockEmbedding(),
        stability: 1.0,
        ease_factor: 2.5,
        retrievability: 1.0,
        next_review_due: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        review_count: 0,
        consecutive_correct: 0,
      }))
    )
    .select();

  if (crystals.error) {
    console.error('Error creating crystals:', crystals.error);
    throw crystals.error;
  }

  console.log(`✅ Created ${crystals.data.length} crystals:`);
  crystals.data.forEach((c) => console.log(`   - ${c.title}`));
  console.log();

  const [c1, c2, c3, c4, c5] = crystals.data;

  const edges = await supabase
    .from('crystal_edges')
    .insert([
      {
        user_id: TEST_USER_ID,
        source_crystal_id: c1.id,
        target_crystal_id: c2.id,
        type: 'RELATED' as const,
        weight: 0.8,
        ai_suggested: true,
      },
      {
        user_id: TEST_USER_ID,
        source_crystal_id: c2.id,
        target_crystal_id: c5.id,
        type: 'BUILDS_ON' as const,
        weight: 0.7,
        ai_suggested: true,
      },
      {
        user_id: TEST_USER_ID,
        source_crystal_id: c3.id,
        target_crystal_id: c4.id,
        type: 'PREREQUISITE' as const,
        weight: 0.9,
        ai_suggested: false,
      },
      {
        user_id: TEST_USER_ID,
        source_crystal_id: c1.id,
        target_crystal_id: c5.id,
        type: 'RELATED' as const,
        weight: 0.6,
        ai_suggested: true,
      },
      {
        user_id: TEST_USER_ID,
        source_crystal_id: c3.id,
        target_crystal_id: c1.id,
        type: 'RELATED' as const,
        weight: 0.5,
        ai_suggested: true,
      },
      {
        user_id: TEST_USER_ID,
        source_crystal_id: c4.id,
        target_crystal_id: c1.id,
        type: 'BUILDS_ON' as const,
        weight: 0.7,
        ai_suggested: true,
      },
    ])
    .select();

  if (edges.error) {
    console.error('Error creating edges:', edges.error);
    throw edges.error;
  }

  console.log(`✅ Created ${edges.data.length} crystal edges\n`);

  console.log('🎉 Database seeded successfully!');
  console.log(`📊 Summary: 1 conversation, ${messages.data.length} messages, ${crystals.data.length} crystals, ${edges.data.length} edges`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
