---
phase: 18-ai-reliability
plan: "01"
subsystem: ai-reliability
tags: [ai, error-handling, resilience, generateObject, neurons]
dependency_graph:
  requires: []
  provides: [AI-02, AI-03]
  affects: [architect-route, extract-route, curriculum-route, neurons-route, inferPrerequisites, embeddings]
tech_stack:
  added: []
  patterns:
    - "NoObjectGeneratedError.isInstance() / APICallError.isInstance() typed discrimination"
    - "AbortSignal.timeout(25_000) for all generateObject calls"
    - "maxRetries: 2 on all AI SDK calls"
    - "Non-fatal post-insert enrichment block with single try/catch"
key_files:
  created: []
  modified:
    - src/app/api/architect/route.ts
    - src/app/api/neurons/extract/route.ts
    - src/app/api/neurons/curriculum/route.ts
    - src/lib/ai/inferPrerequisites.ts
    - src/lib/ai/embeddings.ts
    - src/app/api/neurons/route.ts
decisions:
  - "Use NoObjectGeneratedError.isInstance() not instanceof — SDK bundles its own error classes"
  - "inferPrerequisites has no catch block — errors propagate to caller (neurons/route.ts non-fatal block)"
  - "Entire post-insert enrichment block wrapped in single try/catch rather than individual guards"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_modified: 6
---

# Phase 18 Plan 01: AI Reliability Hardening Summary

Hardened all generateObject call sites with 25s timeouts, 2 retries, and typed error discrimination (NoObjectGeneratedError → 422, APICallError → 502); fixed critical bug where find_similar_neurons failure caused a 500 response after successful neuron insert.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Harden generateObject call sites with maxRetries, abortSignal, typed errors (AI-02) | 22e1b06 | architect/route.ts, extract/route.ts, curriculum/route.ts, inferPrerequisites.ts, embeddings.ts |
| 2 | Make neurons POST post-insert operations non-fatal (AI-03) | 5f98e06 | neurons/route.ts |

## What Was Built

### Task 1: AI Call Site Hardening (AI-02)

All 4 `generateObject` call sites now have:
- `maxRetries: 2` — automatic retry on transient failures
- `abortSignal: AbortSignal.timeout(25_000)` — 25s hard timeout

The 3 route handlers (architect, extract, curriculum) now discriminate typed errors:
- `NoObjectGeneratedError.isInstance(error)` → 422 with actionable user message
- `APICallError.isInstance(error)` → 502 with "AI provider error"
- Fallback → 500 (unchanged)

The `inferPrerequisites` function has maxRetries + abortSignal but no catch block — errors propagate to the neurons/route.ts non-fatal wrapper.

The `embed()` call in embeddings.ts now has `maxRetries: 2`.

### Task 2: Non-Fatal Post-Insert Enrichment (AI-03)

The critical bug in neurons POST route is fixed. Previously, if `find_similar_neurons` RPC failed after a successful neuron insert, the handler returned a 500 to the client — causing users to see an error and potentially retry, creating duplicates.

The fix wraps the entire post-insert block in a single `try/catch`:
- Crystallize queue advancement
- Vector search (`find_similar_neurons`)
- AI prerequisite inference (`inferPrerequisites`)
- Ghost node projection (`projectGhostNodes`)

If any of these fail, a `console.warn('[neurons/POST] ...')` is logged and the handler returns 201 with partial success (`{ neuron, prerequisite_links: [], projected_ghosts: [], mastered_queue_item_id: undefined }`).

Pre-insert operations (embedding generation, bouncer check, actual insert) remain correctly fatal.

## Verification Results

1. TypeScript compiles without errors in all 6 modified files (`npx tsc --noEmit` — 2 pre-existing failures in test files are out of scope)
2. All 4 generateObject calls confirmed to have `maxRetries` and `AbortSignal.timeout`
3. No `status: 500` return exists after the neuron insert block in neurons/route.ts
4. All 3 route handlers (architect, extract, curriculum) have `NoObjectGeneratedError` and `APICallError` handling

## Deviations from Plan

None — plan executed exactly as written. The neurons/route.ts already had a non-fatal try/catch around the AI inference block, but the `find_similar_neurons` 500-return bug was outside it. The fix restructured everything into a single non-fatal wrapper as specified.

## Known Stubs

None.

## Self-Check: PASSED

- [x] 22e1b06 — feat(18-01): harden generateObject call sites
- [x] 5f98e06 — fix(18-01): make neurons POST post-insert operations non-fatal
- [x] All 6 modified files present and TypeScript-clean
- [x] No status: 500 return after successful neuron insert
