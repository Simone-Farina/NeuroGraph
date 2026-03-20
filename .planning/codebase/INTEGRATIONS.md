# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**AI Providers:**
- OpenAI API - AI models for chat, synthesis, and neurogenesis
  - SDK/Client: `@ai-sdk/openai`
- Anthropic API - Alternative AI models
  - SDK/Client: `@ai-sdk/anthropic`
- Google AI API - Alternative AI models
  - SDK/Client: `@ai-sdk/google`
  - Integration: Orchestrated dynamically via `getModelForRole(role)` in `src/lib/ai/providers.ts`

**External APIs:**
- YouTube Transcript API - Used for fetching video transcripts
  - SDK/Client: `youtube-transcript` npm package

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store and vector database (`pgvector`)
  - Connection/Client: `@supabase/supabase-js`, `@supabase/ssr`
  - Key Tables: `messages`, `neurons` (implied by context)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Likely used based on the presence of Supabase packages
  - Token storage: SSR cookies via `@supabase/ssr`

## CI/CD & Deployment

**Hosting:**
- Vercel - Frontend and Next.js serverless functions
  - Deployment: Script `deploy:vercel` runs `npx vercel --prod --yes`

## Environment Configuration

**Development:**
- Required env vars: Likely Supabase URL/Keys, AI Provider Keys
- Secrets location: `.env.local` (gitignored), template in `.env.example`

**Production:**
- Secrets management: Configured in Vercel and Supabase cloud

---

*Integration audit: 2026-03-20*
*Update when adding/removing external services*
