# NeuroGraph Database Setup

## Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Running Migrations

### Option 1: Supabase Dashboard (SQL Editor)

1. Go to your Supabase project → SQL Editor
2. Copy and paste `migrations/001_initial_schema.sql`
3. Click "Run"
4. Copy and paste `migrations/002_query_functions.sql`
5. Click "Run"

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Seeding Development Data

```bash
# Seed database with sample data (5 crystals, 6 edges, 1 conversation)
npx tsx src/lib/db/seed.ts
```

## Running Performance Spike

Test recursive CTE performance with 500 nodes + 1500 edges:

```bash
npx tsx src/lib/db/performance-spike.ts
```

Expected result: < 100ms average query time

## Schema Overview

### Tables

- **conversations**: User chat sessions
- **messages**: Individual messages within conversations
- **crystals**: Knowledge nodes with embeddings and spaced repetition metadata
- **crystal_edges**: Relationships between crystals

### Indexes

- HNSW index on `crystals.embedding` for fast vector similarity search
- B-tree indexes on foreign keys and `next_review_due`

### RLS Policies

All tables have Row Level Security enabled:
- Users can only access their own data
- Policy: `auth.uid() = user_id`

### Functions

- `find_similar_crystals(embedding, user_id, threshold, limit)`: Vector similarity search
- `get_crystal_neighborhood(crystal_id, max_depth)`: Recursive graph traversal (2-hop max)

## Query Helpers

Import from `@/lib/db/queries`:

```typescript
import { crystalQueries, edgeQueries, conversationQueries, messageQueries } from '@/lib/db/queries';

await crystalQueries.create({ ... });
await crystalQueries.getById(id);
await crystalQueries.getDueForReview(userId);
await crystalQueries.findSimilar(embedding, userId);
await crystalQueries.getNeighborhood(crystalId, 2);
```

## Troubleshooting

### pgvector extension not available

If you get `extension "vector" does not exist`:

1. Go to Supabase Dashboard → Database → Extensions
2. Enable "vector" extension
3. Re-run migrations

### RLS blocking queries

If queries return empty results unexpectedly:

1. Check that you're authenticated: `supabase.auth.getUser()`
2. Verify user_id matches: `auth.uid()` should equal the row's `user_id`
3. Temporarily disable RLS for debugging: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;` (NOT for production)
