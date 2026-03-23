# NeuroGraph

NeuroGraph is a Next.js app for turning conversations into connected knowledge neurons.

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

3. Apply database migrations in Supabase SQL Editor.

   Baseline schema and RPC functions:

   - `src/lib/db/migrations/001_initial_schema.sql`
   - `src/lib/db/migrations/002_query_functions.sql`
   - `src/lib/db/migrations/003_fsrs_schema.sql`
   - `src/lib/db/migrations/004_update_rpc_fsrs.sql`
   - `src/lib/db/migrations/005_rate_limit.sql`
   - `src/lib/db/migrations/006_fix_retrievability.sql`
   - `src/lib/db/migrations/007_fix_recursive_query.sql`
   - `src/lib/db/migrations/008_add_content_and_editing.sql`
   - `src/lib/db/migrations/009_add_messages_metadata.sql`

   Then apply the tracked Supabase migrations in `supabase/migrations/`:

   - `supabase/migrations/20260217223000_add_messages_metadata.sql`
   - `supabase/migrations/20260302120000_unique_neuron_titles.sql`
   - `supabase/migrations/20260304000000_check_rate_limit.sql`
   - `supabase/migrations/20260321000000_ttl_cron.sql`
   - `supabase/migrations/20260322000000_knowledge_queue.sql`
   - `supabase/migrations/20260322000001_user_api_keys.sql`

   The last two are required for the Staging Area endpoints:
   - `knowledge_queue` powers `/api/capture` and `/app/queue`
   - `user_api_keys` powers `/api/keys`

4. Verify database setup:

   ```bash
   set -a && source .env.local && set +a && npx tsx src/lib/db/verify-setup.ts
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

## Prompt Eval

Phase 10 adds a local `promptfoo` harness for agent evaluation.

- `promptfoo` is installed as a project dev dependency only. Do not install it globally.
- The dedicated eval workspace lives in `prompt-eval/`.
- The first real Golden suite is `prompt-eval/bouncer/`.

Run the harness with:

```bash
npm run eval:all
```

Focused loops:

```bash
npm run eval:bouncer
npm run eval:architect
npm run eval:conversationalist
```

Notes:

- The Bouncer suite uses the local provider script in `prompt-eval/shared/` and reuses the runtime Bouncer prompt contract from `src/lib/ai/prompts.ts`.
- If real AI provider keys are present, the Bouncer eval uses the evaluator model path. If not, it falls back to a deterministic heuristic so the harness still runs locally.
- `architect` and `conversationalist` are scaffolds in Phase 10. Their real suites land in later phases.

## Run With Docker Compose

1. Configure the local environment file:

   ```bash
   cp .env.example .env.local
   ```

   Fill `.env.local` with your real Supabase and AI keys.

2. Start the app in Docker:

   ```bash
   docker compose up --build
   ```

3. Open the app:

   ```text
   http://localhost:3000
   ```

Notes:

- The compose setup runs the existing Next.js dev server inside the container.
- Source code is bind-mounted, so edits on the host reload in the container.
- `NEXT_PUBLIC_APP_URL` is forced to `http://localhost:3000` inside compose.

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
   - Staging Area migrations are present (`knowledge_queue` and `user_api_keys` tables exist).
