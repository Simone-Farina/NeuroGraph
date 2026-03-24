---
phase: 18-ai-reliability
verified: 2026-03-24T00:00:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 18: AI Reliability Verification Report

**Phase Goal:** Every AI call site is resilient — timeouts bound LLM calls, retries handle transient failures, typed errors surface actionable messages instead of opaque 500s, and the neurons route never returns 500 after a successful insert.
**Verified:** 2026-03-24
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A generateObject call that times out after 25s returns a typed error, not an unhandled rejection | VERIFIED | `AbortSignal.timeout(25_000)` present in all 4 generateObject calls (architect, extract, curriculum, inferPrerequisites) |
| 2 | A generateObject call where the model fails to produce valid JSON returns a 422 with actionable message, not a 500 | VERIFIED | `NoObjectGeneratedError.isInstance(error)` → 422 in architect (line 51), extract (line 83), curriculum (line 236) |
| 3 | A 429 rate-limit from the provider returns a 502 or 429 to the client, not an opaque 500 | VERIFIED | `APICallError.isInstance(error)` → 502 in all 3 route handlers; `maxRetries: 2` retries transient errors before surfacing |
| 4 | Creating a neuron succeeds even when post-insert vector search fails | VERIFIED | `find_similar_neurons` error is caught at line 189, logs warn, continues; outer `catch (enrichmentError)` at line 225 absorbs exceptions |
| 5 | Creating a neuron succeeds even when inferPrerequisites fails | VERIFIED | `inferPrerequisites` called inside the non-fatal try block (line 208); exception falls to `catch (enrichmentError)` at line 225 |
| 6 | The neuron appears in the graph and returns 201 even if enrichment operations error | VERIFIED | `return NextResponse.json({ neuron, ... }, { status: 201 })` at line 230 is unconditionally reached after the non-fatal try/catch |
| 7 | A streaming error in /api/chat is logged via onError, not silently swallowed | VERIFIED | `onError: ({ error }) => { console.error('[chat/stream] Provider error during stream:', error); }` at line 202 |
| 8 | A streaming error in /api/neurons/ai-action is logged via onError, not silently swallowed | VERIFIED | `onError: ({ error }) => { console.error('[neurons/ai-action] Stream error:', error); }` at line 82 |
| 9 | A chat stream that exceeds 60s is aborted cleanly via AbortSignal.timeout | VERIFIED | `abortSignal: AbortSignal.timeout(60_000)` at line 201 of chat/route.ts |
| 10 | An ai-action stream that exceeds 30s is aborted cleanly via AbortSignal.timeout | VERIFIED | `abortSignal: AbortSignal.timeout(30_000)` at line 81 of ai-action/route.ts |
| 11 | An aborted or empty chat stream does not persist an empty assistant message to the database | VERIFIED | `if (!assistantText && toolInvocations.length === 0) return;` at line 220 in onFinish; confirmed also covers abort case |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/architect/route.ts` | generateObject with maxRetries, abortSignal, typed error handling | VERIFIED | `maxRetries: 2`, `AbortSignal.timeout(25_000)`, `NoObjectGeneratedError.isInstance`, `APICallError.isInstance` all present |
| `src/app/api/neurons/extract/route.ts` | generateObject with maxRetries, abortSignal, typed error handling | VERIFIED | `maxRetries: 2`, `AbortSignal.timeout(25_000)`, `NoObjectGeneratedError.isInstance`, `APICallError.isInstance` all present |
| `src/app/api/neurons/curriculum/route.ts` | generateObject with maxRetries, abortSignal, typed error handling | VERIFIED | `maxRetries: 2`, `AbortSignal.timeout(25_000)`, `NoObjectGeneratedError.isInstance`, `APICallError.isInstance` all present |
| `src/lib/ai/inferPrerequisites.ts` | generateObject with maxRetries, abortSignal, errors propagate | VERIFIED | `maxRetries: 2`, `AbortSignal.timeout(25_000)` present; no catch block — errors propagate to neurons/route.ts non-fatal wrapper as designed |
| `src/lib/ai/embeddings.ts` | embed call with maxRetries | VERIFIED | `maxRetries: 2` present on `embed()` call (3-line file; only meaningful content) |
| `src/app/api/neurons/route.ts` | Non-fatal post-insert operations returning 201 partial success | VERIFIED | Non-fatal try/catch wraps lines 167–228; `console.warn('[neurons/POST] ...')` logged; always returns 201 |
| `src/app/api/chat/route.ts` | streamText with onError, maxRetries, abortSignal | VERIFIED | `maxRetries: 1`, `AbortSignal.timeout(60_000)`, `onError` callback all present |
| `src/app/api/neurons/ai-action/route.ts` | streamText with onError, abortSignal | VERIFIED | `AbortSignal.timeout(30_000)`, `onError` callback present; maxOutputTokens: 600 preserved |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/architect/route.ts` | ai SDK generateObject | `maxRetries: 2` present on call | WIRED | Line 42-43: `maxRetries: 2, abortSignal: AbortSignal.timeout(25_000)` |
| `src/app/api/neurons/route.ts` | find_similar_neurons RPC | non-fatal try/catch around post-insert block | WIRED | Line 189: `console.warn('[neurons/POST] find_similar_neurons failed (non-fatal):', similarError.message)` — matches required pattern |
| `src/app/api/chat/route.ts` | ai SDK streamText | `onError` callback for mid-stream failures | WIRED | Line 202: `onError: ({ error }) => { console.error('[chat/stream] ...', error); }` |
| `src/app/api/chat/route.ts` | onFinish persistence | empty text guard prevents persisting empty message | WIRED | Line 220: `if (!assistantText && toolInvocations.length === 0) return;` |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase hardens infrastructure (error handling, timeouts, retries). No new data rendering paths were introduced. All modified files are API route handlers or library utilities, not UI components.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compilation passes (modulo pre-existing test errors) | `npx tsc --noEmit` | 2 pre-existing errors in `__tests__/architect.test.ts` and `__tests__/inferPrerequisites.test.ts` only (PromiseLike<JSONSchema7> property access — out of scope) | PASS |
| All 4 commits documented in SUMMARY exist in git history | `git log --oneline` grep | 22e1b06, 5f98e06, dc34815, e3ecc42 — all present | PASS |
| No `status: 500` return in neurons POST after the insert | `grep "status: 500" neurons/route.ts` | Lines 58, 65 are in GET handler; line 157 is the INSERT error branch (pre-insert, correctly fatal); line 241 is the outer catch. Zero post-insert 500s. | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AI-01 | 18-02-PLAN.md | All `streamText` calls have an `onError` callback that logs and surfaces errors instead of silently swallowing them | SATISFIED | `onError` confirmed in chat/route.ts (line 202) and ai-action/route.ts (line 82). `maxRetries: 1` on chat, 60s/30s timeouts both present. |
| AI-02 | 18-01-PLAN.md | All `generateObject` calls have `maxRetries: 2`, `AbortSignal.timeout(25000)`, and typed error handling | SATISFIED | All 4 call sites (architect, extract, curriculum, inferPrerequisites) have `maxRetries: 2` and `AbortSignal.timeout(25_000)`. Route handlers discriminate `NoObjectGeneratedError` (422) and `APICallError` (502). |
| AI-03 | 18-01-PLAN.md | The neurons POST route does not return 500 after a successful neuron insert | SATISFIED | Post-insert enrichment block wrapped in single try/catch (lines 167-228). All enrichment failures log via `console.warn('[neurons/POST] ...')` and fall through to unconditional 201 response. The critical `find_similar_neurons` 500-return bug is eliminated. |

No orphaned requirements — all three AI-series requirements accounted for across the two plans.

---

### Anti-Patterns Found

None — no TODOs, placeholder comments, `return null`, or empty implementations found in the 8 modified files. The non-fatal catch at line 225 of neurons/route.ts is intentional design, not a stub.

---

### Human Verification Required

None required. All behaviors are verifiable via static analysis:
- Timeout values are literal constants in the code, not configurable
- Error discrimination logic uses SDK type guards, not runtime string matching
- The non-fatal pattern is structurally complete (try wraps enrichment, catch logs warn, 201 returned unconditionally)

---

### Summary

Phase 18 fully achieves its goal. All 11 observable truths verify against actual code. The three requirement IDs (AI-01, AI-02, AI-03) are each satisfied:

- **AI-01 (streamText hardening):** Both streaming endpoints now surface mid-stream errors via `onError` callbacks. The chat route has `maxRetries: 1` and a 60-second timeout; the ai-action route has a 30-second timeout. Neither route silently swallows provider failures.

- **AI-02 (generateObject hardening):** All four `generateObject` call sites have `maxRetries: 2` and `AbortSignal.timeout(25_000)`. The three route handlers (architect, extract, curriculum) discriminate `NoObjectGeneratedError` (→ 422 with actionable user message) from `APICallError` (→ 502) from generic errors (→ 500). The `embed()` call in embeddings.ts has `maxRetries: 2`.

- **AI-03 (non-fatal post-insert):** The critical bug is fixed. The entire post-insert enrichment block (crystallize queue, vector search, AI prerequisite inference, ghost projection) is wrapped in a single try/catch. Any failure logs a `[neurons/POST]` warn and the handler unconditionally returns 201 with the created neuron and partial-success defaults for enrichment fields.

The two TypeScript errors (`PromiseLike<JSONSchema7>` property access in test files) are pre-existing and explicitly out of scope — confirmed in both SUMMARY files and not caused by this phase's changes.

---

_Verified: 2026-03-24_
_Verifier: Claude (gsd-verifier)_
