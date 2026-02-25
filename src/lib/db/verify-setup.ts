import { supabase } from './client';
import { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];

async function verifySetup() {
  console.log('🔍 Verifying NeuroGraph database setup...\n');

  const checks = {
    connection: false,
    pgvector: false,
    tables: false,
    functions: false,
  };

  try {
      const { error } = await supabase.from('neurons').select('count').limit(0);
    if (!error) {
      checks.connection = true;
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error);
  }

  try {
    const { error } = await supabase.rpc('find_similar_neurons', {
      query_embedding: Array(1536).fill(0),
      match_user_id: '00000000-0000-0000-0000-000000000000',
      match_threshold: 0.5,
      match_count: 5,
    });

    if (!error) {
      checks.pgvector = true;
      checks.functions = true;
      console.log('✅ pgvector extension enabled');
      console.log('✅ Query functions installed');
    } else {
      if (error.message.includes('vector')) {
        console.log('❌ pgvector extension not enabled');
      } else if (error.message.includes('find_similar_neurons')) {
        console.log('❌ Query functions not installed');
      } else {
        console.log('⚠️  Query function check inconclusive:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Function verification failed:', error);
  }

  const requiredTables: TableName[] = ['neurons', 'synapses', 'conversations', 'messages'];
  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(0);
      if (!error) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing:`, error.message);
        allTablesExist = false;
      }
    } catch (error) {
      console.log(`❌ Table '${table}' check failed:`, error);
      allTablesExist = false;
    }
  }

  checks.tables = allTablesExist;

  console.log('\n📊 Setup Verification Summary:');
  console.log('================================');
  console.log(`Connection:       ${checks.connection ? '✅' : '❌'}`);
  console.log(`pgvector:         ${checks.pgvector ? '✅' : '❌'}`);
  console.log(`Tables:           ${checks.tables ? '✅' : '❌'}`);
  console.log(`Query Functions:  ${checks.functions ? '✅' : '❌'}`);

  const allPassed = Object.values(checks).every((c) => c);

  if (allPassed) {
    console.log('\n🎉 All checks passed! Database is ready.');
    return true;
  } else {
    console.log('\n⚠️  Some checks failed. Please review the setup.');
    console.log('See src/lib/db/README.md for setup instructions.');
    return false;
  }
}

if (require.main === module) {
  verifySetup()
    .then((passed) => process.exit(passed ? 0 : 1))
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifySetup };
