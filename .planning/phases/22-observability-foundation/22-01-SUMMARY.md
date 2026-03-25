---
phase: 22-observability-foundation
plan: 01
subsystem: infra
tags: [langfuse, opentelemetry, otel, tracing, observability, llm-observability]

# Dependency graph
requires: []
provides:
  - OTel provider registration with LangfuseSpanProcessor (src/instrumentation.ts)
  - Shared buildTelemetry helper for experimental_telemetry config (src/lib/ai/tracing.ts)
  - wrapRagWithObserve for RAG context span creation (src/lib/ai/tracing.ts)
  - Langfuse environment variable documentation (.env.example)
affects: [22-02-instrumentation, all-ai-call-sites]

# Tech tracking
tech-stack:
  added: ["@langfuse/otel@5.0.1", "@langfuse/tracing@5.0.1", "@opentelemetry/sdk-node@0.214.0"]
  patterns:
    - "OTel bootstrap in src/instrumentation.ts (Next.js convention, auto-loaded on server start)"
    - "buildTelemetry() factory returns experimental_telemetry config with functionId for agent naming"
    - "wrapRagWithObserve() uses startActiveObservation for RAG span grouping"

key-files:
  created:
    - src/instrumentation.ts
    - src/lib/ai/tracing.ts
  modified:
    - package.json
    - .env.example

key-decisions:
  - "flushAt: 1 replaces non-existent immediateExport option — v5.0.1 API uses flushAt for immediate export"
  - "shouldExportSpan replaces non-existent shouldExport — v5 signature is ({ otelSpan }) => boolean"
  - "wrapRagWithObserve uses startActiveObservation (v5 API) not observe(options, fn) pattern from research docs"
  - "observe() re-exported from tracing.ts for route handlers that need custom spans"

patterns-established:
  - "Pattern 1: buildTelemetry('agent-name', { userId, conversationId }) is the one-call API for any AI call site"
  - "Pattern 2: wrapRagWithObserve() wraps getRelevantContext() calls to create named RAG retrieval spans"
  - "Pattern 3: langfuseProcessor re-exported from tracing.ts — route handlers never import from instrumentation.ts directly"

requirements-completed: [OBS-05, OBS-02]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 22 Plan 01: Observability Foundation Summary

**Langfuse OTel stack installed with NodeTracerProvider + LangfuseSpanProcessor, shared buildTelemetry() helper, and RAG span wrapper ready for 8 AI call site instrumentation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T20:14:05Z
- **Completed:** 2026-03-25T20:17:10Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Installed @langfuse/otel, @langfuse/tracing, @opentelemetry/sdk-node (3 packages, all v5.0.1 or compatible)
- Created src/instrumentation.ts: Next.js OTel bootstrap with LangfuseSpanProcessor, runtime guard, span filter
- Created src/lib/ai/tracing.ts: buildTelemetry() factory, wrapRagWithObserve(), langfuseProcessor re-export
- Documented LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASEURL in .env.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Langfuse OTel packages and create instrumentation.ts** - `a700a71` (feat)
2. **Task 2: Create the shared tracing.ts helper module** - `16d9f5a` (feat)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/instrumentation.ts` - OTel provider bootstrap with LangfuseSpanProcessor, exports register() and langfuseProcessor
- `src/lib/ai/tracing.ts` - Shared helper: buildTelemetry(), wrapRagWithObserve(), langfuseProcessor re-export, observe re-export
- `package.json` - Added 3 new Langfuse/OTel dependencies
- `.env.example` - Added Langfuse observability section with LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASEURL

## Decisions Made

- Used `flushAt: 1` instead of `immediateExport: true` — the v5.0.1 package API has no `immediateExport` field; `flushAt: 1` achieves the same result (flush after every span)
- Used `shouldExportSpan: ({ otelSpan }) => ...` instead of `shouldExport: (span) => ...` — v5 renamed this option with a different parameter shape
- Used `startActiveObservation` instead of `observe(options, fn)` — v5 `observe()` is a decorator pattern (`observe(fn, options)` returns a wrapped function); `startActiveObservation` is the correct API for ad-hoc span creation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LangfuseSpanProcessor v5.0.1 API diverges from plan's assumed options**
- **Found during:** Task 1 (Create instrumentation.ts), Task 2 (TypeScript verification)
- **Issue:** Plan specified `immediateExport: true` and `shouldExport: (span) => ...` but v5.0.1 `LangfuseSpanProcessorParams` has neither field. Actual options are `flushAt: number` and `shouldExportSpan: ({ otelSpan }) => boolean`
- **Fix:** Replaced `immediateExport: true` with `flushAt: 1`; replaced `shouldExport` with `shouldExportSpan` using the correct parameter shape
- **Files modified:** src/instrumentation.ts
- **Verification:** `npx tsc --noEmit` shows no errors in our files
- **Committed in:** 16d9f5a (Task 2 commit)

**2. [Rule 1 - Bug] @langfuse/tracing v5.0.1 observe() is a decorator, not a span-context factory**
- **Found during:** Task 2 (TypeScript verification of tracing.ts)
- **Issue:** Plan specified `observe({ name, metadata, userId }, () => fn())` but v5 `observe()` is `observe<T extends (...args: any[]) => any>(fn: T, options?: ObserveOptions)` — it wraps a function, not calls one with context
- **Fix:** Used `startActiveObservation('rag-retrieval', () => fn(), { asType: 'retriever' })` which is the v5 API for creating a named span that wraps a callback
- **Files modified:** src/lib/ai/tracing.ts
- **Verification:** TypeScript passes, plan acceptance criteria satisfied
- **Committed in:** 16d9f5a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — API version mismatch between research docs and installed package)
**Impact on plan:** Both auto-fixes required for correctness. Functional intent preserved exactly — immediate export, span filter, RAG context wrapping. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in test files (architect.test.ts, inferPrerequisites.test.ts) — unrelated to this plan, out of scope per deviation rules

## User Setup Required

**External services require manual configuration.** Users must:
1. Create a Langfuse Cloud account and project at https://cloud.langfuse.com
2. Generate API keys under Settings -> API Keys
3. Set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` environment variables

## Next Phase Readiness

- Foundation layer complete — 22-02 can now instrument all 8 AI call sites using `buildTelemetry()` and `wrapRagWithObserve()`
- No blockers for next phase
- Note: `flushAt: 1` means every span flushes immediately — may add latency in high-throughput scenarios; can be tuned to `flushAt: 5` in production if needed

---
*Phase: 22-observability-foundation*
*Completed: 2026-03-25*
