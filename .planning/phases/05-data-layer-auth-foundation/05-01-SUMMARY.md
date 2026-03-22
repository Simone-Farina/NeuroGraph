---
phase: 05-data-layer-auth-foundation
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, typescript, migrations]

# Dependency graph
requires: []
provides:
  - knowledge_queue table with 4-state CHECK constraint, RLS (FOR ALL), partial composite index, and updated_at trigger
  - user_api_keys table with key_hash UNIQUE, narrow RLS (SELECT+DELETE only), partial unique index for one-active-key-per-user enforcement
  - QueueItemState union type exported from src/types/database.ts
  - KnowledgeQueueItem type with all columns matching SQL schema
  - ApiKey type with key_hash (not hashed_key) matching SQL schema
  - Database Tables extended with knowledge_queue and user_api_keys Row/Insert/Update/Relationships entries
affects:
  - 05-data-layer-auth-foundation (remaining plans)
  - 06-capture-api-key-management
  - 07-queue-triage-ui
  - 08-crystallize-flow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CHECK constraint for 4-state machine (not PostgreSQL ENUM) — easier to alter without migration cycle"
    - "Narrow RLS policies on user_api_keys (SELECT+DELETE only) to allow service role INSERT/UPDATE bypass"
    - "Partial unique index WHERE revoked_at IS NULL for DB-level one-active-key-per-user enforcement"
    - "Idempotent migration pattern: CREATE TABLE IF NOT EXISTS + DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies) END $$"

key-files:
  created:
    - supabase/migrations/20260322000000_knowledge_queue.sql
    - supabase/migrations/20260322000001_user_api_keys.sql
  modified:
    - src/types/database.ts

key-decisions:
  - "CHECK constraint over PostgreSQL ENUM for state field — simpler ALTER TABLE if state machine ever needs a fifth state"
  - "key_hash (not hashed_key) as canonical column name — matches STACK.md, applied consistently across SQL and TypeScript"
  - "Narrow RLS on user_api_keys (SELECT+DELETE only) — service role client bypasses RLS for INSERT (Phase 6 capture endpoint) and UPDATE (last_used_at tracking)"
  - "Partial unique index idx_user_api_keys_active_per_user WHERE revoked_at IS NULL — DB-level enforcement of 1 active key per user"
  - "estimated_read_time as INTEGER (minutes) not TEXT — display formatting deferred to Phase 7 UI"

patterns-established:
  - "Pattern 1: Migration idempotency — CREATE TABLE IF NOT EXISTS + policy existence checks in DO $$ blocks"
  - "Pattern 2: Structural AI isolation — knowledge_queue never referenced in neurons/chat query paths"
  - "Pattern 3: Database type extension — new standalone types (KnowledgeQueueItem, ApiKey) declared before Database type, referenced in Tables entries"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04]

# Metrics
duration: 1min
completed: 2026-03-22
---

# Phase 5 Plan 01: Data Layer & Auth Foundation Summary

**Two Supabase SQL migrations and TypeScript Database type extensions providing the knowledge_queue (4-state CHECK constraint + RLS + partial index) and user_api_keys (SHA-256 hash storage + narrow SELECT/DELETE RLS + one-active-key-per-user partial unique index) foundation for the Staging Area feature.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-22T14:42:50Z
- **Completed:** 2026-03-22T14:44:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `knowledge_queue` migration with exactly 4 states (inbox/passive_debt/resource/mastered) via CHECK constraint, RLS FOR ALL policy, composite partial index excluding mastered items, and auto-updating trigger
- Created `user_api_keys` migration with SHA-256 hash storage (key_hash TEXT NOT NULL UNIQUE), narrow SELECT/DELETE RLS only (service role bypasses for INSERT/UPDATE), and partial unique index enforcing one active key per user at DB level
- Extended `src/types/database.ts` with QueueItemState, KnowledgeQueueItem, ApiKey types and corresponding Database Tables entries — all existing types preserved, TypeScript compiles with exit code 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migrations for knowledge_queue and user_api_keys** - `bd07324` (feat)
2. **Task 2: Extend Database type with KnowledgeQueueItem and ApiKey types** - `9574ee7` (feat)

**Plan metadata:** (docs commit — see final commit below)

## Files Created/Modified

- `supabase/migrations/20260322000000_knowledge_queue.sql` - knowledge_queue table with 4-state CHECK constraint, RLS, partial composite index, updated_at trigger
- `supabase/migrations/20260322000001_user_api_keys.sql` - user_api_keys table with SHA-256 hash storage, narrow RLS (SELECT+DELETE), partial unique index for one-active-key-per-user
- `src/types/database.ts` - Extended with QueueItemState, KnowledgeQueueItem, ApiKey types and Database Tables entries for both new tables

## Decisions Made

- Used CHECK constraint (not PostgreSQL ENUM) for the 4-state field — altering a CHECK constraint is a simple `ALTER TABLE` vs. a full `DROP TYPE + CREATE TYPE` migration cycle for ENUMs.
- Used `key_hash` as canonical column name throughout — consistent with STACK.md; avoids the `hashed_key` naming from ARCHITECTURE.md that would create downstream drift.
- Narrow RLS on `user_api_keys` (SELECT + DELETE only, no INSERT/UPDATE) — the Phase 6 capture endpoint uses a service role client that bypasses RLS for INSERT (key generation) and UPDATE (last_used_at tracking). A FOR ALL policy would block service role on tables with RLS enabled if any auth.uid() check fails.
- `estimated_read_time` stored as INTEGER (minutes) — display formatting ("5 min read") is a UI concern deferred to Phase 7.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migrations are ready to apply to Supabase via `supabase db push` or the Supabase dashboard.

## Next Phase Readiness

- Schema foundation complete for phases 6-8
- Phase 6 (Capture API & Key Management) can now implement: `/api/capture` endpoint, `/api/keys/generate` endpoint, using the `knowledge_queue` and `user_api_keys` tables respectively
- Phase 7 (Queue Triage UI) can import `KnowledgeQueueItem`, `QueueItemState`, and `Database['public']['Tables']['knowledge_queue']` types directly
- Phase 8 (Crystallize Flow) can import `KnowledgeQueueItem` for the mastered state transition
- Constraint: Phase 6 route handlers must never return `key_hash` in API responses — SELECT policy allows it but application layer must exclude it

## Self-Check

Verified before finalizing:
- `supabase/migrations/20260322000000_knowledge_queue.sql` exists: FOUND
- `supabase/migrations/20260322000001_user_api_keys.sql` exists: FOUND
- `src/types/database.ts` contains `QueueItemState`, `KnowledgeQueueItem`, `ApiKey`: FOUND
- `npx tsc --noEmit src/types/database.ts` exits 0: PASS
- Commits bd07324 and 9574ee7 exist: FOUND

## Self-Check: PASSED

---
*Phase: 05-data-layer-auth-foundation*
*Completed: 2026-03-22*
