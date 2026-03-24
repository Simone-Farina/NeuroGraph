---
phase: 14-backend-ai-correctness
plan: "02"
subsystem: api
tags: [bloom, neurogenesis, vector-search, supabase, zod, vitest]

requires:
  - phase: 14-backend-ai-correctness/14-01
    provides: Architect schema fixes (refusalReason nullable, inferPrerequisites nullable)

provides:
  - Server-side Bloom gate in POST /api/neurons (422 for Remember/Understand/Apply on non-ghost neurons)
  - Ghost neuron bypass for Bloom gate (is_ghost: true skips gate)
  - Restricted suggestNeurogenesisTool enum to Analyze/Evaluate/Create only
  - Widened find_similar_neurons RPC: match_threshold 0.15, match_count 10
  - SQL migration to clean up all legacy RELATED+ai_suggested=true synapses

affects:
  - chat-ai-routing
  - neurogenesis-flow
  - dag-prerequisite-inference

tech-stack:
  added: []
  patterns:
    - "Bloom gate as server-side runtime enforcement with 422 rejection"
    - "Ghost node bypass via is_ghost flag in Bloom gate check"
    - "Defense-in-depth: tool enum restriction + server-side gate"

key-files:
  created:
    - supabase/migrations/20260324000000_cleanup_legacy_related_synapses.sql
  modified:
    - src/app/api/neurons/route.ts
    - src/lib/ai/tools.ts
    - src/app/api/neurons/__tests__/route.test.ts
    - src/lib/ai/__tests__/tools.test.ts

key-decisions:
  - "14-02-bloom-gate: Server-side NEUROGENESIS_BLOOM_THRESHOLD constant gates POST /api/neurons at runtime — Zod schema keeps all 6 levels for schema validation, gate fires after parse succeeds"
  - "14-02-ghost-bypass: Ghost neurons (is_ghost: true) bypass the Bloom gate entirely — architect-projected ghost nodes are allowed at any Bloom level"
  - "14-02-tool-enum: suggestNeurogenesisTool enum restricted to 3 values as defense-in-depth alongside server gate"
  - "14-02-vector-widening: match_threshold lowered from 0.3 to 0.15, match_count raised from 5 to 10 to give inferPrerequisites more candidates"
  - "14-02-migration-idempotent: Legacy RELATED+ai_suggested=true cleanup is a SQL migration (idempotent, preserves user edges)"
  - "14-02-tools-test-cleanup: Removed stale related_neurons tests from tools.test.ts — the field does not exist in neurogenesisSchema; tests were passing for wrong reason (bloom_level: 'Remember' was the validator)"

patterns-established:
  - "NEUROGENESIS_BLOOM_THRESHOLD constant placed immediately after safeParse success check, before data destructuring"
  - "422 Unprocessable Entity for semantic validation failures (vs 400 for schema failures)"

requirements-completed: [BUG-02, BUG-03]

duration: 8min
completed: 2026-03-24
---

# Phase 14 Plan 02: Backend AI Correctness — Bloom Gate and DAG Prerequisite Wiring Summary

**Server-side Bloom gate (422 for shallow non-ghost neurons) + restricted tool enum + widened vector search params (0.15/10) + legacy RELATED edge cleanup migration**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T16:15:49Z
- **Completed:** 2026-03-24T16:23:00Z
- **Tasks:** 2
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments

- Added NEUROGENESIS_BLOOM_THRESHOLD gate in POST /api/neurons returning 422 for Remember/Understand/Apply bloom levels on non-ghost neurons
- Ghost neurons (is_ghost: true) bypass the Bloom gate, allowing architect-projected nodes at any Bloom level
- Restricted suggestNeurogenesisTool enum to ['Analyze', 'Evaluate', 'Create'] as defense-in-depth
- Widened find_similar_neurons RPC parameters from (0.3/5) to (0.15/10) to give the Epistemological Inquisitor more prerequisite candidates
- Created idempotent SQL migration to clean up all legacy RELATED+ai_suggested=true synapses (pre-v1.2 auto-wiring noise)
- 18 tests pass across both test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Bloom gate + tool enum restriction + test updates** - `ec344e4` (feat)
2. **Task 2: Widen vector search params + legacy edge migration** - `0ab9023` (feat)

## Files Created/Modified

- `src/app/api/neurons/route.ts` - Added NEUROGENESIS_BLOOM_THRESHOLD Bloom gate; changed match_threshold 0.3→0.15, match_count 5→10
- `src/lib/ai/tools.ts` - Restricted bloom_level enum to ['Analyze', 'Evaluate', 'Create']
- `src/app/api/neurons/__tests__/route.test.ts` - Updated validPayload bloom_level to 'Analyze'; added 422 gate tests, ghost bypass test, widened params test
- `src/lib/ai/__tests__/tools.test.ts` - Rewrote to use 'Analyze' bloom_level; removed stale related_neurons tests; added threshold rejection and valid level tests
- `supabase/migrations/20260324000000_cleanup_legacy_related_synapses.sql` - DELETE legacy RELATED+ai_suggested=true synapses

## Decisions Made

- Bloom gate fires AFTER safeParse (Zod schema still accepts all 6 Bloom levels for ghost node compatibility), not inside the schema itself
- Ghost neurons bypass gate via `!parsed.data.is_ghost` check — architect-projected nodes must be allowed at any level
- 422 Unprocessable Entity chosen (vs 400) — payload is structurally valid but semantically rejected
- Kept the schema accepting all 6 bloom_levels in createNeuronSchema (as specified in plan interface) — only the runtime gate restricts non-ghost neurons

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rewrote stale related_neurons tests in tools.test.ts**
- **Found during:** Task 1 (test verification)
- **Issue:** tools.test.ts contained "Related Neurons Validation" tests for a `related_neurons` field that does not exist in neurogenesisSchema. Zod strips unknown keys, so those tests should have returned `success: true`, but were incorrectly asserting `success: false`. They were passing before this plan because `bloom_level: 'Remember'` was valid (making the schema parse succeed), and so the tests for bad `related_neurons` would return `success: true`, causing the tests to FAIL — but this was hidden behind the prior bloom_level restriction bug. After restricting the enum, 'Remember' became invalid, causing `success: false` which matched the assertion — masking the schema mismatch.
- **Fix:** Removed the Related Neurons Validation test block entirely (the field doesn't exist in the schema); replaced with tests that verify all 3 valid Bloom levels (Analyze, Evaluate, Create) are accepted, and all 3 invalid levels (Remember, Understand, Apply) are rejected.
- **Files modified:** src/lib/ai/__tests__/tools.test.ts
- **Verification:** 9 tests pass in tools.test.ts
- **Committed in:** ec344e4 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in test fixtures)
**Impact on plan:** Necessary to fix masked test failures. No scope creep — test behavior now correctly reflects actual schema constraints.

## Issues Encountered

None beyond the stale test fixtures documented above.

## User Setup Required

Run the Supabase migration in production to clean up legacy RELATED edges:

```bash
supabase db push
```

Or apply manually in Supabase dashboard:
```sql
DELETE FROM synapses
WHERE type = 'RELATED'
  AND ai_suggested = true;
```

This is safe and idempotent. User-created RELATED edges (ai_suggested=false) are preserved.

## Next Phase Readiness

- BUG-02 (Bloom gate) and BUG-03 (DAG prerequisite wiring) are resolved
- Phase 14 is complete — both bugs fixed, all tests pass
- The Neurogenesis flow now enforces Bloom-level depth at the server boundary
- inferPrerequisites has a wider candidate pool (10 neurons at 0.15 threshold) for better DAG wiring
- Legacy RELATED edge noise cleaned up by migration

---
*Phase: 14-backend-ai-correctness*
*Completed: 2026-03-24*
