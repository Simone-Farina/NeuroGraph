---
phase: 25-decoupled-architect-pipeline
plan: "01"
subsystem: api
tags: [langfuse, observability, neurogenesis, synthesizer, rag, inquisitor, zod, generateObject]

# Dependency graph
requires:
  - phase: 22-observability-foundation
    provides: buildTelemetry, observe, langfuseProcessor from tracing.ts
  - phase: 24-silent-observer
    provides: bloom evaluation confirming Analyze+ gate for neurogenesis
provides:
  - POST /api/neurogenesis endpoint running Synthesizer -> RAG -> Inquisitor -> insert pipeline
  - synthesize() function in src/lib/ai/synthesizer.ts with Zod schema and evaluator model
affects: [25-02-frontend-wiring, any future neurogenesis callers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "observe() HOF decorator wraps pipeline function; pipeline() is called after wrapping"
    - "Synthesizer step is fatal (500 on failure); RAG and Inquisitor steps are non-fatal (orphan fallback)"
    - "langfuseProcessor.forceFlush() in finally block for non-streaming JSON routes"

key-files:
  created:
    - src/lib/ai/synthesizer.ts
    - src/app/api/neurogenesis/route.ts
  modified: []

key-decisions:
  - "25-01-observe-hof: observe() is a HOF decorator returning a wrapped fn, not an inline span; call pattern is const pipeline = observe(fn, opts); await pipeline()"
  - "25-01-bloom-level-analyze: Synthesizer-created neurons receive bloom_level='Analyze' as the minimum neurogenesis threshold"
  - "25-01-evaluator-model: Synthesizer uses getModelForRole('evaluator') for cheap/fast distillation per CONTEXT.md spec"

patterns-established:
  - "Synthesizer pattern: generateObject with Zod schema, evaluator model, buildTelemetry, last-20-message window"
  - "Non-fatal enrichment: try/catch wraps RAG and Inquisitor steps; neuron creation succeeds regardless"

requirements-completed: [ARCH-01, ARCH-02, ARCH-03]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 25 Plan 01: Decoupled Architect Pipeline — Backend Summary

**POST /api/neurogenesis with 3-step Synthesizer -> RAG -> Epistemological Inquisitor pipeline, each step independently traced in Langfuse**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-25T22:45:36Z
- **Completed:** 2026-03-25T22:48:12Z
- **Tasks:** 2
- **Files modified:** 2 (both created new)

## Accomplishments
- New Synthesizer module distills conversation history into canonical title/definition/core_insight using evaluator model
- POST /api/neurogenesis endpoint runs full 3-step pipeline: Synthesizer (fatal) -> RAG + embedding (non-fatal) -> Inquisitor (non-fatal)
- Each AI step independently traced in Langfuse via existing telemetry infrastructure
- Error handling matches CONTEXT.md spec exactly: orphan neuron on RAG/Inquisitor failure, 500 on Synthesizer failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Synthesizer module** - `04115f4` (feat)
2. **Task 2: Create POST /api/neurogenesis route** - `89818fb` (feat)

## Files Created/Modified
- `src/lib/ai/synthesizer.ts` - Synthesizer module: synthesizerOutputSchema (Zod), SynthesizerOutput type, synthesize() function with evaluator model and neurogenesis-synthesizer Langfuse span
- `src/app/api/neurogenesis/route.ts` - POST endpoint: auth, request validation, observe()-wrapped 3-step pipeline, neuron insert with FSRS defaults, synapse fetch for graph edges, forceFlush in finally

## Decisions Made

- **observe() HOF pattern:** `observe` from @langfuse/tracing is a higher-order function decorator (not an inline span call). Correct pattern: `const pipeline = observe(async () => {...}, { name: 'neurogenesis-pipeline' }); await pipeline()`. Attempting `observe('name', fn, opts)` fails TypeScript (only 1-2 args accepted).
- **bloom_level='Analyze':** Synthesizer-created neurons use Analyze as the minimum bloom level (the GenerateNeuronButton only activates at Analyze+).
- **Evaluator model for Synthesizer:** getModelForRole('evaluator') per CONTEXT.md decision — cheap/fast distillation is appropriate since the conversation context is already structured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed observe() call signature mismatch**
- **Found during:** Task 2 (neurogenesis route creation)
- **Issue:** Plan spec said `observe('neurogenesis-pipeline', async () => {...})` but observe() signature is `(fn, options?)` — a 3-argument call fails TypeScript
- **Fix:** Changed to HOF decorator pattern: `const pipeline = observe(async () => {...}, { name: 'neurogenesis-pipeline' }); await pipeline()`
- **Files modified:** src/app/api/neurogenesis/route.ts
- **Verification:** `npx tsc --noEmit` passes with zero new errors
- **Committed in:** 89818fb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for TypeScript correctness. Functional behavior is identical — parent Langfuse span is still created with the same name.

## Issues Encountered
- Pre-existing TypeScript errors in `src/lib/ai/__tests__/architect.test.ts` and `inferPrerequisites.test.ts` (Property 'required' on PromiseLike<JSONSchema7>) — not caused by this plan, out of scope per deviation boundary rules.

## Next Phase Readiness
- Backend pipeline ready for Phase 25-02 frontend wiring
- GenerateNeuronButton.tsx needs to call POST /api/neurogenesis with { conversationId }
- Response shape `{ neuron, synapses }` is ready for graphStore.addNeuron + graphStore.addSynapse

## Self-Check: PASSED

- FOUND: src/lib/ai/synthesizer.ts
- FOUND: src/app/api/neurogenesis/route.ts
- FOUND: .planning/phases/25-decoupled-architect-pipeline/25-01-SUMMARY.md
- FOUND commit: 04115f4 (feat: synthesizer module)
- FOUND commit: 89818fb (feat: neurogenesis route)

---
*Phase: 25-decoupled-architect-pipeline*
*Completed: 2026-03-25*
