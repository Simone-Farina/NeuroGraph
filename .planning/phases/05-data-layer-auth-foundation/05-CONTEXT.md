# Phase 5: Data Layer & Auth Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Two new Supabase tables (`knowledge_queue`, `user_api_keys`), RLS policies enforcing per-user isolation and structural separation from the neurons/embeddings pipeline, TypeScript types, and Zod validation schemas.

</domain>

<decisions>
## Implementation Decisions

### Queue Item Schema
- **MINIMAL + METADATA**: Fields are: `id`, `user_id`, `title`, `url` (nullable — supports pure thoughts), `notes` (nullable), `state` (4-state enum), `source_domain` (auto-extracted from URL), `favicon_url` (auto-extracted), `estimated_read_time` (auto-extracted), `created_at`, `updated_at`.
- URL is **optional** — queue accepts both external URLs and text-only quick thoughts.
- The capture endpoint **auto-extracts** the page `<title>`, `source_domain`, `favicon_url`, and `estimated_read_time` from the URL server-side. Client only needs to send the URL.

### API Key Storage & Limits
- **1 key max per user**. Generating a new key auto-revokes the previous one. No key management list needed.
- SHA-256 hash via Node.js `crypto.createHash`. `ng_` prefix stored for display. `crypto.timingSafeEqual` for comparison.
- **No expiry** — key lives until manually revoked.
- **Rate limit**: 60 captures/hour per key, checked via `last_used_at` timestamp comparison. Not a hard DB constraint — checked in the route handler.

### State Machine (Forward-Only Funnel)
- **Valid transitions**:
  - `inbox` → `passive_debt` (auto on view/open)
  - `inbox` → `resource` (manual archive)
  - `passive_debt` → `mastered` (via Crystallize → Neurogenesis)
  - `resource` → `passive_debt` (un-archive)
- **Blocked**: `mastered` → anything (earned, permanent). `passive_debt` → `inbox` (can't unsee).
- Server-side allowlist validates all transitions. Client does optimistic update with rollback on rejection.
- **Mastered items disappear** from the queue list. They exist only as Neurons in the graph.
- **Hard delete** — no soft delete, no trash. Consistent with the 14-day TTL philosophy.

### RLS & AI Isolation
- `knowledge_queue` table has its own RLS policies scoped to `auth.uid() = user_id`.
- **Structural isolation**: The table is never joined or queried in chat routes, RAG context, or Neurogenesis flows.
- The capture endpoint will need a **service role client** (no cookie session from iOS Shortcuts). This is isolated to the capture route handler — all other routes continue using `createServerSupabaseClient()`.

### Claude's Discretion
- Exact migration file naming and ordering
- Whether to use a PostgreSQL ENUM type or a CHECK constraint for the 4-state field
- Index strategy for the queue (probably `user_id` + `state` composite)
- Whether `estimated_read_time` is stored as integer (minutes) or text ("5 min read")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database & Migrations
- `supabase/migrations/20260321000000_ttl_cron.sql` — Existing migration pattern (pg_cron, CASCADE deletes)
- `supabase/migrations/20260217223000_add_messages_metadata.sql` — Column addition pattern

### Types & Validation
- `src/types/database.ts` — Existing Database type definition covering all tables (neurons, synapses, conversations, messages). New types must follow same structure.

### Auth Pattern
- `src/lib/auth/supabase.ts` — `createServerSupabaseClient()` for cookie-based auth, `createClient()` for browser
- `src/lib/auth/server.ts` — `getAuthenticatedUser()` helper. Capture endpoint cannot use this (no cookies from iOS).

### Research
- `.planning/research/STACK.md` — SHA-256 hashing approach, nanoid for key generation
- `.planning/research/ARCHITECTURE.md` — Integration points, service role client isolation
- `.planning/research/PITFALLS.md` — CVE-2025-29927 (route-handler auth, not middleware)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/database.ts` — Extend the `Database` type with new table definitions
- `src/lib/auth/server.ts` — `getAuthenticatedUser()` pattern for session-based routes
- Existing Zod patterns in `src/app/api/neurons/extract/route.ts` and `src/app/api/neurons/ai-action/route.ts`

### Established Patterns
- Migrations in `supabase/migrations/` with timestamp prefix
- RLS follows `auth.uid() = user_id` pattern on all existing tables
- TypeScript types in `src/types/database.ts` with Row/Insert/Update sub-types

### Integration Points
- New migration files in `supabase/migrations/`
- Extend `Database` type in `src/types/database.ts`
- New Zod schemas likely in `src/lib/validation/` or co-located with route handlers

</code_context>

<specifics>
## Specific Ideas

- The `ng_` prefix for API keys mirrors Stripe's `sk_` convention — familiar to developers.
- Queue item shape is intentionally lean compared to Neurons (20+ fields). Queue is a triage tool, not a knowledge store.
- Forward-only funnel enforces the product philosophy: you can't un-learn something, and you can't un-see something.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-data-layer-auth-foundation*
*Context gathered: 2026-03-22*
