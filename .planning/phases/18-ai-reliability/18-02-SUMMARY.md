---
phase: 18-ai-reliability
plan: "02"
subsystem: api
tags: [ai-sdk, streaming, error-handling, timeout, abortSignal]

# Dependency graph
requires:
  - phase: 18-ai-reliability
    provides: "CONTEXT.md with AI-01 requirement and stream error analysis"
provides:
  - "onError callbacks on both streamText call sites for mid-stream provider failure logging"
  - "AbortSignal.timeout(60_000) on chat route — 60s hard cap"
  - "AbortSignal.timeout(30_000) on ai-action route — 30s hard cap"
  - "maxRetries: 1 on chat route for transient provider errors"
affects: [18-ai-reliability, 19-prompts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onError callback as primary surface for AI SDK mid-stream errors (not outer try/catch)"
    - "AbortSignal.timeout() for streaming endpoint timeout protection"
    - "maxRetries: 1 for interactive streaming, 0 (default) for fire-and-forget commands"

key-files:
  created: []
  modified:
    - src/app/api/chat/route.ts
    - src/app/api/neurons/ai-action/route.ts

key-decisions:
  - "onError is the ONLY reliable surface for mid-stream AI SDK errors per GitHub issue #4726 — outer try/catch does not catch them"
  - "maxRetries: 1 on chat (not 2) — user is watching, second retry adds dead silence"
  - "No maxRetries on ai-action — fire-and-forget slash commands; user can retry via menu"
  - "60s timeout for chat (multi-turn Socratic), 30s for ai-action (short-form slash commands)"

patterns-established:
  - "streamText hardening pattern: onError + abortSignal on every call site"
  - "Empty message guard in onFinish prevents persisting aborted stream results"

requirements-completed: [AI-01]

# Metrics
duration: 8min
completed: 2026-03-24
---

# Phase 18 Plan 02: streamText Hardening Summary

**onError callbacks and AbortSignal timeouts added to both streamText call sites, eliminating silent mid-stream provider failures in /api/chat (60s) and /api/neurons/ai-action (30s)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-24T21:10:00Z
- **Completed:** 2026-03-24T21:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Chat route (/api/chat) now logs all mid-stream provider errors via onError with `[chat/stream]` prefix
- Chat route has maxRetries: 1 for transient 429/500/503 errors (1 retry — user is watching)
- Chat route has 60s AbortSignal timeout preventing silent hangs on long Socratic exchanges
- AI-action route (/api/neurons/ai-action) now logs mid-stream errors via onError with `[neurons/ai-action]` prefix
- AI-action route has 30s AbortSignal timeout appropriate for short-form slash commands
- Empty assistant message guard in onFinish was already in place (line 214 in chat route) — confirmed covers abort case

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onError, maxRetries, and abortSignal to chat streamText** - `dc34815` (feat)
2. **Task 2: Add onError and abortSignal to ai-action streamText** - `e3ecc42` (feat)

## Files Created/Modified

- `src/app/api/chat/route.ts` - Added maxRetries: 1, abortSignal: AbortSignal.timeout(60_000), onError callback
- `src/app/api/neurons/ai-action/route.ts` - Added abortSignal: AbortSignal.timeout(30_000), onError callback

## Decisions Made

- Used `AbortSignal.timeout()` (Web standard API) — no new imports needed
- 60s for chat route: multi-turn Socratic exchanges can be long; 30s for ai-action: slash commands should be fast
- maxRetries: 1 only on chat — fire-and-forget ai-action callers can retry via UI menu
- Confirmed existing onFinish guard (`if (!assistantText && toolInvocations.length === 0) return`) already covers the abort-empty-message case; no change needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `src/lib/ai/__tests__/architect.test.ts` and `inferPrerequisites.test.ts` (PromiseLike<JSONSchema7> property access). These are out of scope — not caused by this plan's changes and were present before execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both streamText call sites are hardened: mid-stream errors will now appear in logs instead of being silently swallowed
- Any mid-stream provider failure during Phase 19 prompt engineering will be observable and attributable
- Ready for Phase 18 Plan 03 (if any) or Phase 19 prompt engineering work

---
*Phase: 18-ai-reliability*
*Completed: 2026-03-24*
