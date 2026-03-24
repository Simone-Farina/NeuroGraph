---
plan: 17-02
phase: 17-horizon-crystallize-ui-fixes
status: complete
started: 2026-03-24T20:30:00Z
completed: 2026-03-24T20:45:00Z
duration: ~15min
one_liner: "Ghost node TB layout with 200px height allocation, delayed graph_zenith shell preset, and full crystallize state cleanup on conversation switch"
requirements_completed:
  - CRYST-04
  - HORIZON-05
  - HORIZON-06
---

# Plan 17-02 Summary

## What Was Built

Fixed three bugs that were blocking QA approval:

1. **CRYST-04 (paste state leak)**: Added `setIsCrystallizing(false)` and `setCrystallizeNotice(null)` to the conversation-switch cleanup in ChatPanel.tsx. The original Phase 17-01 fix only reset `activeCrystallizeSession` but missed the `isCrystallizing` and `crystallizeNotice` states that control the "Preparing source..." banner.

2. **HORIZON-05 (ghost node layout)**: Switched dagre from LR to TB (top-to-bottom) layout. Ghost nodes now get 200px height allocation (vs 80px for regular neurons). All Handle positions updated to Top/Bottom across NeuronNode, GhostNeuronNode, and the dagre layout function. Matches the expected tree structure from QA Image 19.

3. **HORIZON-06 (shell preset timing)**: Removed `shellPreset: 'graph_zenith'` from the atomic `setHorizonDraft` store action. Added `setTimeout(() => setShellPreset('graph_zenith'), 300)` in GraphPanel after the draft is set, giving dagre and React Flow time to render before the panel shrinks.

## Deviations

- Executed inline by orchestrator rather than via subagent, due to iterative QA feedback requiring direct fixes
- CRYST-04 fix was split across 17-01 (partial) and 17-02 (complete) — the `isCrystallizing` state leak was discovered during human verification

## Key Files

- `src/components/chat/ChatPanel.tsx` — crystallize state cleanup
- `src/stores/graphStore.ts` — removed shellPreset from setHorizonDraft
- `src/components/graph/GraphPanel.tsx` — TB layout, ghost height, delayed preset
- `src/components/graph/GhostNeuronNode.tsx` — hidden handles
- `src/components/graph/NeuronNode.tsx` — Top/Bottom handle positions
