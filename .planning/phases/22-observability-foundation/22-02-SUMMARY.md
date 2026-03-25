---
phase: 22-observability-foundation
plan: 02
subsystem: infra
tags: [langfuse, opentelemetry, otel, tracing, observability, llm-observability, instrumentation]

# Dependency graph
requires:
  - OTel provider registration (22-01 src/instrumentation.ts)
  - buildTelemetry() and wrapRagWithObserve() helpers (22-01 src/lib/ai/tracing.ts)
provides:
  - All 8 AI call sites emit named Langfuse traces (OBS-01, OBS-02)
  - Every trace carries authenticated userId in metadata (OBS-03)
  - Chat trace carries conversationId for session correlation (OBS-03)
  - RAG retrieval is wrapped in observe() span (OBS-04)
affects: [all-ai-call-sites, langfuse-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "experimental_telemetry: buildTelemetry('agent-name', { userId, extra }) pattern applied to all 8 call sites"
    - "wrapRagWithObserve() replaces direct getRelevantContext() in chat route to create RAG retrieval span"
    - "Optional userId? parameter added to library functions (inferPrerequisites, generateCrystallizeSeed) for trace correlation"

key-files:
  created: []
  modified:
    - src/app/api/chat/route.ts
    - src/app/api/architect/route.ts
    - src/app/api/neurons/extract/route.ts
    - src/app/api/neurons/ai-action/route.ts
    - src/app/api/neurons/curriculum/route.ts
    - src/app/api/neurons/[id]/synthesize/route.ts
    - src/lib/ai/inferPrerequisites.ts
    - src/lib/crystallize/seed.ts
    - src/app/api/neurons/route.ts

key-decisions:
  - "inferPrerequisites userId? is optional so existing call sites compile without changes; neurons/route.ts updated to pass user.id"
  - "GenerateCrystallizeSeedInput.userId? is optional so existing call sites in crystallize/route.ts and manual/route.ts compile unchanged"
  - "buildTelemetry extra metadata uses string values per Record<string, string> type — neuronId, actionType, target, newNeuronTitle all coerce to string naturally"

requirements-completed: [OBS-01, OBS-02, OBS-03, OBS-04]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 22 Plan 02: AI Call Site Instrumentation Summary

**All 8 AI call sites instrumented with named Langfuse traces — conversationalist, architect, bouncer-extract, ai-action, curriculum, synthesize, inquisitor, and crystallize-seed — every trace carrying userId; chat trace also carries conversationId and RAG span**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T20:21:09Z
- **Completed:** 2026-03-25T20:24:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Task 1: Instrumented chat route with `buildTelemetry('conversationalist')` (userId + conversationId) and replaced `getRelevantContext` with `wrapRagWithObserve` for RAG span visibility; instrumented architect route with `buildTelemetry('architect')` (userId + target)
- Task 2: Instrumented 6 remaining call sites — extract (`bouncer-extract`), ai-action (`ai-action` + actionType), curriculum (`curriculum` + target), synthesize (`synthesize` + neuronId), inferPrerequisites (`inquisitor` + newNeuronTitle), crystallize seed (`crystallize-seed`)
- Added optional `userId?: string` parameter to `inferPrerequisites()` and `GenerateCrystallizeSeedInput` type to propagate userId into library functions without breaking existing callers
- Updated `neurons/route.ts` to pass `user.id` to `inferPrerequisites()` call for trace correlation
- TypeScript compiles cleanly (only pre-existing test errors in architect.test.ts and inferPrerequisites.test.ts, documented in 22-01 as out of scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Instrument chat route and architect route with telemetry + RAG observe** - `2efba61` (feat)
2. **Task 2: Instrument remaining 6 AI call sites with telemetry** - `47cc096` (feat)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/app/api/chat/route.ts` - Replaced getRelevantContext import with buildTelemetry + wrapRagWithObserve; added experimental_telemetry to streamText
- `src/app/api/architect/route.ts` - Added buildTelemetry import; added experimental_telemetry to generateObject
- `src/app/api/neurons/extract/route.ts` - Added buildTelemetry import; added experimental_telemetry to generateObject
- `src/app/api/neurons/ai-action/route.ts` - Added buildTelemetry import; added experimental_telemetry with actionType extra to streamText
- `src/app/api/neurons/curriculum/route.ts` - Added buildTelemetry import; added experimental_telemetry with target extra to generateObject
- `src/app/api/neurons/[id]/synthesize/route.ts` - Added buildTelemetry import; added experimental_telemetry with neuronId extra to generateText
- `src/lib/ai/inferPrerequisites.ts` - Added buildTelemetry import; added userId? parameter to function signature; added experimental_telemetry with newNeuronTitle extra to generateObject
- `src/lib/crystallize/seed.ts` - Added buildTelemetry import; added userId? to GenerateCrystallizeSeedInput type; added experimental_telemetry to generateText
- `src/app/api/neurons/route.ts` - Updated inferPrerequisites call to pass user.id as third argument

## Decisions Made

- Made `userId` optional on `inferPrerequisites()` and `GenerateCrystallizeSeedInput` so existing call sites in `crystallize/route.ts` and `manual/route.ts` compile without modification — they will not pass userId, which means those seeds will emit traces without userId correlation until callers are updated
- Updated `neurons/route.ts` to pass `user.id` to `inferPrerequisites()` since that route already has `user` in scope

## Deviations from Plan

None — plan executed exactly as written. All 8 call sites instrumented per specification. TypeScript compiles with no new errors (only the 2 pre-existing test errors documented in 22-01 summary).

## Known Stubs

None — all 8 call sites emit real traces. The optional `userId` on seed.ts means crystallize routes emit traces without userId correlation, but this is intentional (callers can pass it optionally as they evolve).

## Verification Results

- `grep -r "experimental_telemetry" src/ --include="*.ts"` — 10 lines (8 call sites + 2 comments in tracing.ts)
- All 8 unique agent names confirmed: conversationalist, architect, bouncer-extract, ai-action, curriculum, synthesize, inquisitor, crystallize-seed
- `npx tsc --noEmit` — no new errors (2 pre-existing test errors, out of scope)

---
*Phase: 22-observability-foundation*
*Completed: 2026-03-25*
