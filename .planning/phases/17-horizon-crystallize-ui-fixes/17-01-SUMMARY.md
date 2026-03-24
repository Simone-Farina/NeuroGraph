---
phase: 17-horizon-crystallize-ui-fixes
plan: 01
subsystem: ui
tags: [react, zustand, crystallize, horizon, chatpanel, graphpanel]

requires:
  - phase: 15-ui-ux-polish-security
    provides: HorizonControls component and Crystallize session state
  - phase: 11.5-horizon-ui-dag-wiring
    provides: ghost nodes, horizonTarget, activeCrystallizeSession wiring

provides:
  - CRYST-04: Crystallize paste state resets unconditionally on every conversation switch
  - HORIZON-04: HorizonControls container is compact (p-2, no fixed width) when collapsed
  - HORIZON-07: TARGET label block removed from HorizonControls render

affects: [crystallize-flow, horizon-ui, chatpanel]

tech-stack:
  added: []
  patterns:
    - "Unconditional state reset before early-return guards: reset shared UI state at effect entry before branching"
    - "Conditional Tailwind class string via template literal based on boolean prop"

key-files:
  created: []
  modified:
    - src/components/chat/ChatPanel.tsx
    - src/components/graph/GraphPanel.tsx

key-decisions:
  - "17-01-cryst04-unconditional-reset: setActiveCrystallizeSession(null) placed before if(!currentConversationId) so skipNextLoadRef guard cannot prevent the reset"
  - "17-01-horizon04-conditional-width: wrapper divs use no width class when collapsed; container shrinks to content"
  - "17-01-horizon07-label-removal: TARGET label JSX removed entirely; horizonTarget/horizonError props retained in type and call sites"

requirements-completed: [CRYST-04, HORIZON-04, HORIZON-07]

duration: 8min
completed: 2026-03-24
---

# Phase 17 Plan 01: Horizon & Crystallize UI Fixes Summary

**Crystallize paste banner no longer leaks across conversations; HorizonControls collapses to a compact pill; TARGET label removed from below the controls.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-24T19:32:00Z
- **Completed:** 2026-03-24T19:40:57Z
- **Tasks:** 1 of 2 automated (Task 2 is human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- CRYST-04: `setActiveCrystallizeSession(null)` moved to the top of the conversation-switch useEffect, before the `skipNextLoadRef.current` guard. Paste banner can no longer bleed when navigating to freshly-created conversations.
- HORIZON-04: HorizonControls outer div uses `p-2` when collapsed and `p-3` when expanded. Both wrapper divs (empty-state and populated-state) drop the fixed `w-[min(...)]` when `isTargetOpen` is false, so the container shrinks to its content width.
- HORIZON-07: The `{(horizonTarget || horizonError) && (...)}` TARGET label block deleted from HorizonControls. Props retained in type and call sites (used by graph store logic elsewhere).

## Task Commits

1. **Task 1: Fix Crystallize paste state leak and HorizonControls styling** - `24c49ce` (fix)

## Files Created/Modified

- `src/components/chat/ChatPanel.tsx` - Added unconditional `setActiveCrystallizeSession(null)` before early-return guards in conversation-switch useEffect
- `src/components/graph/GraphPanel.tsx` - Conditional padding on HorizonControls outer div; conditional width on both wrapper divs; removed TARGET label block

## Decisions Made

- Kept `horizonTarget` and `horizonError` in the HorizonControlsProps type — removing them would require touching all call sites and is out of scope; only the render is removed per HORIZON-07.
- No new dependency added; changes are pure conditional Tailwind classes and state ordering.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `src/lib/ai/__tests__/architect.test.ts` and `src/lib/ai/__tests__/inferPrerequisites.test.ts` (unrelated JSONSchema7 type issue). Pre-existing test failures in `ChatPanel.crystallize.test.tsx` and `ChatPanel.mastery.test.tsx` (useGraphStore mock not wired in test setup). Neither set of issues was introduced by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three UI regressions (CRYST-04, HORIZON-04, HORIZON-07) are patched.
- Task 2 checkpoint awaits visual verification in the browser.
- Plan 17-02 can proceed after checkpoint approval.

---
*Phase: 17-horizon-crystallize-ui-fixes*
*Completed: 2026-03-24*
