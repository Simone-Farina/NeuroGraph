---
phase: 15-ui-ux-polish-security
plan: "01"
subsystem: ui
tags: [react-flow, zustand, framer-motion, ai-sdk, neurogenesis]

# Dependency graph
requires:
  - phase: 09-ui-polish-design-system
    provides: shell preset system (setShellPreset, deep_read, standard presets)
  - phase: 08-crystallize-flow
    provides: neurogenesis tool call flow and NeurogenesisSuggestion component
provides:
  - Review page resets shell layout to standard on unmount (BUG-04 closed)
  - Rehydrated neurogenesis tool calls render as resolved neuron cards (BUG-06 closed)
  - All 4 Handle elements on graph nodes are display:none (BUG-07 closed)
affects: [chat, graph, review, neurogenesis]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useEffect cleanup returns for layout side effects that must reset on unmount
    - input-available state maps to result for rehydrated AI SDK tool calls
    - style={{ display: 'none' }} preferred over Tailwind !opacity-0 for Handle visibility

key-files:
  created: []
  modified:
    - src/app/(app)/app/review/page.tsx
    - src/components/graph/NeuronNode.tsx
    - src/components/chat/MessageList.tsx
    - src/components/chat/NeurogenesisSuggestion.tsx

key-decisions:
  - "useEffect cleanup for setShellPreset: sidebar Link navigation bypasses openChat(), so cleanup must live in the layout effect itself"
  - "input-available maps to result: only rehydrated messages from loadMessages have this state; fresh streaming calls use partial-call"
  - "style={{ display: 'none' }} on Handle elements: guarantees invisibility despite React Flow CSS specificity wars"
  - "isStreaming guard in NeurogenesisSuggestion: defensive layer ensuring fresh partial-call tool invocations always show spinner"

patterns-established:
  - "Pattern: useEffect cleanup for layout side effects — always add return cleanup when a useEffect sets shell preset"
  - "Pattern: AI SDK tool state mapping — input-available and output-available both map to result; partial-call maps to call"

requirements-completed: [BUG-04, BUG-06, BUG-07]

# Metrics
duration: 12min
completed: 2026-03-24
---

# Phase 15 Plan 01: UI Bug Fix Summary

**Three surgical UI fixes: review layout reset on unmount, rehydrated neurogenesis spinner resolution, and React Flow Handle visibility override via inline style**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-24T17:45:00Z
- **Completed:** 2026-03-24T17:57:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Review page now resets shell to standard layout when navigating away via sidebar Link (BUG-04)
- Rehydrated neurogenesis tool calls from chat history show resolved "Knowledge Consolidated" cards instead of stuck spinners (BUG-06)
- All 4 Handle elements on graph nodes (ghost + standard) are definitively hidden via display:none, removing residual dot artifacts (BUG-07)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix review panel width reset and graph Handle dots (BUG-04, BUG-07)** - `74cc7b9` (fix)
2. **Task 2: Fix stuck neurogenesis spinners on rehydrated chat history (BUG-06)** - `0b12dca` (fix)

## Files Created/Modified
- `src/app/(app)/app/review/page.tsx` - Added cleanup return to layout useEffect: `return () => setShellPreset('standard')`
- `src/components/graph/NeuronNode.tsx` - Replaced `className="!opacity-0 !w-0 !h-0"` with `style={{ display: 'none' }}` on all 4 Handle elements
- `src/components/chat/MessageList.tsx` - Expanded toolState derivation to map `input-available` to `'result'` alongside `output-available`
- `src/components/chat/NeurogenesisSuggestion.tsx` - Added `isStreaming = state === 'partial-call'` guard to spinner condition

## Decisions Made
- Cleanup return placed only in the layout effect (first useEffect), not in the data-fetch effect — per plan spec
- `input-available` state is safe to treat as result because only rehydrated messages have it; streaming calls always start with `partial-call`
- `isStreaming` guard in NeurogenesisSuggestion is a defensive layer — the primary fix is in MessageList.tsx's toolState derivation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures (7 failed / 42 passed) confirmed identical before and after changes — no regressions introduced. Failures are pre-existing and out of scope per deviation boundary rules.

## Known Stubs

None — all three bugs are fully resolved with no placeholder logic.

## Next Phase Readiness
- BUG-04, BUG-06, BUG-07 are closed and committed
- Plan 15-02 (BUG-05 Learning Target UI redesign + BUG-08 API key masking) can proceed independently
- No blockers

---
*Phase: 15-ui-ux-polish-security*
*Completed: 2026-03-24*
