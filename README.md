# NeuroGraph

NeuroGraph is a Next.js app for turning conversations into connected knowledge crystals.

## Prerequisites

- Node.js `20.20.0` (see `.nvmrc`)
- npm `>=11`
- Supabase project with `pgvector` enabled

## Quick Start

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Configure environment:

   ```bash
   cp .env.example .env.local
   ```

   Fill `.env.local` with real Supabase and AI provider keys.

3. Apply database migrations in Supabase SQL Editor (in order):

   - `src/lib/db/migrations/001_initial_schema.sql`
   - `src/lib/db/migrations/002_query_functions.sql`
   - `src/lib/db/migrations/003_fsrs_schema.sql`
   - `src/lib/db/migrations/004_update_rpc_fsrs.sql`
   - `src/lib/db/migrations/005_rate_limit.sql`
   - `src/lib/db/migrations/006_fix_retrievability.sql`
   - `src/lib/db/migrations/007_fix_recursive_query.sql`
   - `src/lib/db/migrations/008_add_content_and_editing.sql`
   - `src/lib/db/migrations/009_add_messages_metadata.sql`

4. Verify database setup:

   ```bash
   set -a && source .env.local && set +a && npx tsx src/lib/db/verify-setup.ts
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

6. Build for production check:

   ```bash
   npm run build
   ```

## Deploy to Vercel

1. Install dependencies and run preflight:

   ```bash
   npm ci
   npm run deploy:preflight
   ```

2. Authenticate and link project:

   ```bash
   npx vercel login
   npx vercel link
   ```

3. Configure Vercel environment variables (Production and Preview):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `AI_PROVIDER`
   - `OPENAI_API_KEY` (required for embeddings)
   - `ANTHROPIC_API_KEY` (if `AI_PROVIDER=anthropic`)
   - `GOOGLE_API_KEY` (if `AI_PROVIDER=google`)

4. Deploy:

   ```bash
   npm run deploy:vercel
   ```

5. After deploy, verify:

   - App loads at the Vercel URL.
   - Login and chat work.
   - `/api/chat` can process a request without runtime env errors.
   - Rate-limit migration is present (`check_rate_limit` function exists in DB).

## Project Plans

The canonical, portable context file is:

- `MASTER_SPECIFICATION.txt`

Historical planning artifacts (Sisyphus/OpenCode-era) are versioned in:

- `.sisyphus/plans/neurograph-mvp.md`
- `.sisyphus/plans/neurograph-dev-process.md`

The repo is configured to keep plan markdown files while ignoring other local Sisyphus runtime state.

## Switching Development Environments

This repository supports mutually-exclusive development sessions for:

- OpenCode (Linux machine)
- Google Antigravity (Mac Mini M4)

Use:

```bash
bash scripts/switch-environment.sh opencode
# or
bash scripts/switch-environment.sh antigravity
```

Details are documented in `docs/DEVELOPMENT_ENVIRONMENTS.md`.
