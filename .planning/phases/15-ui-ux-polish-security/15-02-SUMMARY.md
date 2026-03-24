---
phase: 15-ui-ux-polish-security
plan: "02"
subsystem: ui
tags: [react, tailwind, design-system, framer-motion, api-key-security]

# Dependency graph
requires:
  - phase: 15-ui-ux-polish-security-01
    provides: GraphPanel and AppSidebar baseline from BUG-06 fix
provides:
  - HorizonControls extracted shared sub-component in GraphPanel.tsx with editorial design tokens
  - API key masking (ng_****...) with 10-second reveal window in AppSidebar.tsx
affects: [15-ui-ux-polish-security, graph-panel, sidebar-api-key]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared sub-component extraction for dual-location UI (empty state + populated state) to prevent drift"
    - "useRef + setTimeout auto-mask timer pattern with useEffect cleanup"
    - "Editorial design tokens: rounded-2xl/rounded-xl containers, border-white/5-8, font-serif labels, bg-white/[0.03] muted backgrounds"

key-files:
  created: []
  modified:
    - src/components/graph/GraphPanel.tsx
    - src/components/layout/AppSidebar.tsx

key-decisions:
  - "15-02-horizon-extraction: HorizonControls extracted into shared sub-component so empty-state and populated-state copies cannot drift apart"
  - "15-02-key-masking: isKeyPrefixVisible defaults false; 10s timer starts on generation success; timer ref cleaned up on unmount to prevent memory leaks"
  - "15-02-reveal-timing: visibility window starts at 'revealed' state (when raw key is shown) — prefix remains hidden when user dismisses to 'has-key' later"

patterns-established:
  - "Editorial horizon chrome: rounded-2xl container, rounded-xl buttons, border-white/5 muted, font-serif text, bg-white/[0.03] base"
  - "Auto-expire reveal: useRef timer + useState visibility + useEffect cleanup; same-class masked/revealed display prevents layout shift"

requirements-completed: [BUG-05, BUG-08]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 15 Plan 02: UI/UX Polish — Horizon Controls Redesign & API Key Masking Summary

**Editorial redesign of Set Learning Target HUD to dark rectangular card language (BUG-05), plus ng_**** key masking with 10-second auto-reveal after generation (BUG-08)**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-24T16:49:13Z
- **Completed:** 2026-03-24T16:52:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extracted `HorizonControls` shared sub-component from two previously duplicated horizon control sections in `GraphPanel.tsx`, eliminating future drift risk
- Restyled all horizon controls from floating pill/HUD aesthetic to dark editorial card: `rounded-2xl` container, `rounded-xl` buttons, `border-white/5` muted borders, `font-serif` typography, muted `bg-white/[0.03]` backgrounds
- Added API key masking in `AppSidebar.tsx`: `ng_****...` shown by default; actual `keyPrefix` visible only for 10 seconds after key generation with proper useRef timer cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign horizon controls to editorial design language (BUG-05)** - `59ede2d` (feat)
2. **Task 2: Add API key masking with auto-expire reveal (BUG-08)** - `ac5748b` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/graph/GraphPanel.tsx` — Extracted `HorizonControls` sub-component; applied editorial tokens to both empty-state and populated-state horizon locations
- `src/components/layout/AppSidebar.tsx` — Added `isKeyPrefixVisible` state, `keyPrefixTimerRef`, 10s timer in `handleGenerate`, cleanup `useEffect`, masked `has-key` display

## Decisions Made

- **HorizonControls extraction preferred over parallel edits**: Extracted into a shared sub-component rather than applying identical changes twice. DRY enforcement is higher value here — future edits only need to touch one place.
- **Visibility timer starts on generation success, not on dismiss**: The 10-second window begins immediately when the key is generated (during `'revealed'` state) so that when the user dismisses the reveal modal, the `has-key` prefix is already partially through its countdown — avoids a jarring "just became visible" moment.
- **Same CSS classes for masked/unmasked**: `font-mono text-xs text-white/50 truncate` applied to both states to prevent layout shift; no animation added as the plan only specified a crossfade as optional and the subtle text swap is sufficiently editorial.

## Deviations from Plan

None — plan executed exactly as written. The HorizonControls sub-component extraction was suggested in the plan itself as preferred (Claude's discretion — extraction is preferred for DRY).

## Issues Encountered

13 pre-existing test failures confirmed via baseline check (stash/pop pattern). None of the failing tests (`AppSidebar.queue.test.tsx`, `ChatPanel`, `tools.test.ts`, `QueueItemCard`) are related to this plan's changes. No new failures introduced.

## Known Stubs

None — both features are fully wired. The key masking display reads from live `keyPrefix` state. The horizon controls pass live store state via props.

## Next Phase Readiness

- BUG-05 and BUG-08 are closed; horizon controls and API key masking meet production design quality
- 13 pre-existing test failures remain in the suite — should be addressed in a separate hardening pass (out of scope for this plan)

---
*Phase: 15-ui-ux-polish-security*
*Completed: 2026-03-24*
