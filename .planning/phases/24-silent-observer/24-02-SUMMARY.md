---
phase: 24-silent-observer
plan: "02"
subsystem: ui, api
tags: [bloom, zustand, nextjs-api, generateText, debounce, fire-and-forget, langfuse]

# Dependency graph
requires:
  - phase: 24-01
    provides: Bloom evaluator system prompt (prompt.txt) and schema reference

provides:
  - POST /api/bloom-evaluate endpoint — async Bloom classification via LLM
  - Zustand bloomLevel/bloomConfidence/isBloomPending state + setBloomEval/setBloomPending/resetBloomEval actions
  - GenerateNeuronButton component — muted/solid states driven by Zustand bloom state
  - ChatPanel wired with debounced fire-and-forget bloom evaluator call after each chat stream

affects: [25-neurogenesis-wiring, GenerateNeuronButton, ChatPanel, graphStore]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Bloom evaluator self-contained in route (inline prompt, no external import)
    - Fire-and-forget async eval with 500ms debounce using setTimeout + fetch
    - messagesRef pattern for closure-safe access to current messages in useCallback
    - Graceful degradation — never 500, failures return 200 with bloom_level null
    - Langfuse flush in finally block for non-streaming JSON routes

key-files:
  created:
    - src/app/api/bloom-evaluate/route.ts
    - src/components/chat/GenerateNeuronButton.tsx
  modified:
    - src/stores/graphStore.ts
    - src/components/chat/ChatPanel.tsx

key-decisions:
  - "24-02-inline-prompt: BLOOM_EVALUATOR_PROMPT defined inline in route.ts — evaluator is self-contained, no import from prompts.ts"
  - "24-02-never-500: bloom-evaluate route returns 200 even on parse/timeout failure — per CONTEXT.md: better false positive than blocked user"
  - "24-02-messagesref: messagesRef pattern used for closure-safe message access in triggerBloomEval without adding messages to useCallback deps"
  - "24-02-no-sonner: sonner not installed; button click uses console.log for Phase 25 stub — wires real architect call in next phase"
  - "24-02-animate-pulse-border-only: isBloomPending adds animate-pulse only on border color (not whole button) per CONTEXT.md barely-noticeable indicator"

patterns-established:
  - "Non-streaming JSON route Langfuse flush: wrap handler in try/finally with langfuseProcessor.forceFlush() — flush happens before function exits"
  - "Fire-and-forget with debounce: bloomDebounceRef + setTimeout(500ms) in onFinish, setBloomPending(true) before fetch, setBloomEval on response"
  - "UIMessage text extraction: filter parts by type 'text', map to text, join — no fallback to .content (doesn't exist on UIMessage type)"

requirements-completed: [AGENT-03, AGENT-04, AGENT-05]

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 24 Plan 02: Silent Observer Wiring Summary

**Async Bloom evaluator API route + Zustand bloom state + GenerateNeuronButton that illuminates at Analyze-level cognitive depth, firing silently after each chat stream without blocking the user**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T21:50:00Z
- **Completed:** 2026-03-25T22:05:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- POST /api/bloom-evaluate endpoint with Supabase auth, Zod validation, generateText via getModelForRole('evaluator'), and graceful degradation (never 500)
- Bloom state (bloomLevel, bloomConfidence, isBloomPending) added to graphStore with setBloomEval/setBloomPending/resetBloomEval actions
- GenerateNeuronButton with two CSS states: muted (opacity-40, pointer-events-none) and solid (opacity-100), smooth 300ms transition
- ChatPanel fires debounced (500ms) fire-and-forget bloom eval in onFinish, resets on conversation change

## Task Commits

Each task was committed atomically:

1. **Task 1: POST /api/bloom-evaluate + Zustand bloom state** - `77e91df` (feat)
2. **Task 2: GenerateNeuronButton + ChatPanel wiring** - `80eaa8a` (feat)

**Plan metadata:** _(docs commit below)_

## Files Created/Modified
- `src/app/api/bloom-evaluate/route.ts` - POST endpoint: auth, Zod validation, generateText, JSON parse, graceful 200 on failure
- `src/stores/graphStore.ts` - Added bloomLevel, bloomConfidence, isBloomPending + three actions
- `src/components/chat/GenerateNeuronButton.tsx` - Client button component with muted/solid states, Phase 25 stub on click
- `src/components/chat/ChatPanel.tsx` - Added bloom selectors, bloomDebounceRef, messagesRef, triggerBloomEval, onFinish wiring, resetBloomEval on conversation change

## Decisions Made
- BLOOM_EVALUATOR_PROMPT defined inline in route.ts — evaluator is self-contained, no import from shared prompts
- Route returns 200 on any error (parse failure, timeout) with bloom_level: null — never blocks the user
- `messagesRef` pattern used for closure-safe message access in triggerBloomEval useCallback, avoiding stale closure
- `sonner` not installed — button click uses `console.log` for Phase 25 stub (real architect call wired next phase)
- `animate-pulse` applied only on border (not whole button) when isBloomPending — barely noticeable, per CONTEXT.md design spec

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid UIMessage.content fallback**
- **Found during:** Task 2 (ChatPanel wiring)
- **Issue:** Plan spec referenced `m.content` fallback on UIMessage, but the Vercel AI SDK UIMessage type has no `content` field — TypeScript error TS2339
- **Fix:** Removed the fallback; parts-based extraction is sufficient and correct
- **Files modified:** src/components/chat/ChatPanel.tsx
- **Verification:** `npx tsc --noEmit` shows no new errors
- **Committed in:** 80eaa8a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type bug)
**Impact on plan:** Minimal — correct SDK type usage, no behavioral change.

## Issues Encountered
- None beyond the UIMessage type fix above.

## User Setup Required
None — no new external services. To use Gemini Flash as the evaluator, set `AI_MODEL_EVALUATOR=google:gemini-2.5-flash` in `.env.local` (otherwise defaults to `openai:gpt-4o-mini`).

## Known Stubs
- `src/components/chat/GenerateNeuronButton.tsx` — button click uses `console.log` instead of actual POST /api/architect. Intentional Phase 25 stub. Phase 25 (neurogenesis wiring) will replace this with the real Architect pipeline call.

## Next Phase Readiness
- Silent Observer infrastructure complete: bloom evaluator fires silently, Zustand state updates, button illuminates
- Phase 25 can wire the actual POST /api/architect call into GenerateNeuronButton's onClick handler
- TypeScript clean (no new errors introduced)

---
*Phase: 24-silent-observer*
*Completed: 2026-03-25*

## Self-Check: PASSED

All files verified present, all commits verified in git log.
