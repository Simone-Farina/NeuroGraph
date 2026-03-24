# Phase 17: Horizon & Crystallize UI Fixes - Context

**Gathered:** 2026-03-24 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 5 UI/state bugs: Crystallize paste state leak across conversations, Learning Target container dynamic sizing, ghost node layout overlap, shell preset timing on Horizon generation, and TARGET label removal.

</domain>

<decisions>
## Implementation Decisions

### CRYST-04: Crystallize Paste State Cleanup
- **D-01:** Always reset `activeCrystallizeSession` to `null` when `currentConversationId` changes, regardless of whether `loadMessages` runs. Add an explicit reset at the top of the conversation-switch `useEffect` in ChatPanel.tsx, before the `skipNextLoadRef` guard.

### HORIZON-04: Learning Target Container Sizing
- **D-02:** Make the HorizonControls outer container size conditional on `isTargetOpen`. When collapsed (just the button), use minimal padding (`p-2`) and no fixed width. When expanded (showing input + buttons), use the current `p-3` with the existing max-width constraint.
- **D-03:** The parent positioning wrapper (`w-[min(460px,...)]`) should only apply width when `isTargetOpen` is true. When collapsed, the container should shrink to fit the button content.

### HORIZON-05: Ghost Node Layout
- **D-04:** Increase the dagre node height allocation for ghost nodes. Use a larger `nodeHeight` (e.g., 160px) when the node type is `ghostNeuron`, keeping 80px for regular neurons. Pass node-specific dimensions to dagre's `setNode`.
- **D-05:** Fix `GhostNeuronNode.tsx` handle positions from `Position.Top`/`Position.Bottom` to `Position.Left`/`Position.Right` to match the LR dagre layout direction. Use `style={{ display: 'none' }}` to hide them (matching the NeuronNode pattern from Phase 15).

### HORIZON-06: Shell Preset Timing
- **D-06:** Decouple the `shellPreset: 'graph_zenith'` change from `setHorizonDraft` in graphStore. Instead of setting the preset atomically with the ghost nodes, delay it by ~300ms (using `setTimeout` in the GraphPanel component after `setHorizonDraft` is called) to allow dagre layout and React Flow rendering to complete first.

### HORIZON-07: TARGET Label Removal
- **D-07:** Remove the `{horizonTarget && ...}` block in HorizonControls that renders the "Target {horizonTarget}" and "horizonError" labels. The target name is already visible in the ghost nodes themselves.

### Claude's Discretion
- Exact dagre height for ghost nodes (160px is a starting point — may need calibration)
- Whether to use `requestAnimationFrame` vs `setTimeout` for the preset delay
- Exact padding values for collapsed vs expanded HorizonControls

</decisions>

<canonical_refs>
## Canonical References

### Crystallize state
- `src/components/chat/ChatPanel.tsx` — `activeCrystallizeSession` state (line 190), conversation-switch useEffect (lines 339-357), `skipNextLoadRef` guard (line 351)
- `src/components/chat/CrystallizePasteComposer.tsx` — paste UI rendering

### Horizon controls
- `src/components/graph/GraphPanel.tsx` — HorizonControls component (lines 99-167), parent wrapper (line 449), TARGET label (lines 152-158)
- `src/components/graph/GhostNeuronNode.tsx` — ghost node component, handle positions (lines 18, 42)

### Layout and presets
- `src/stores/graphStore.ts` — `setHorizonDraft` (lines 159-174), `shellPreset: 'graph_zenith'` (line 172)
- `src/app/(app)/layout.tsx` — shell preset consumption, panel width animation (lines 43, 77)

### Dagre layout
- `src/components/graph/GraphPanel.tsx` — `getLayoutedElements` (lines 41-70), `nodeWidth`/`nodeHeight` constants (lines 38-39)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getLayoutedElements` dagre function — needs per-node height support
- HorizonControls sub-component — already extracted in Phase 15, needs sizing refinement
- `style={{ display: 'none' }}` Handle pattern from NeuronNode — reuse for GhostNeuronNode

### Established Patterns
- Shell presets managed by Zustand, consumed by framer-motion in layout
- `useEffect` cleanup for state reset on route/conversation changes
- Dagre layout with fixed node dimensions

### Integration Points
- ChatPanel conversation-switch effect → activeCrystallizeSession reset
- GraphPanel → dagre layout → ghost node dimensions
- graphStore setHorizonDraft → delayed shellPreset change
- GhostNeuronNode handles → Position.Left/Right alignment

</code_context>

<specifics>
## Specific Ideas

- Ghost nodes in the screenshot (Image 17) show overlapping labels and stacked positions — dagre needs taller allocations for these content-rich nodes
- The chat panel collapse is visible in Image 17 — the left panel shrinks to ~25vw immediately when ghosts render
- Use impeccable frontend design quality on all UI changes (carried forward from v1.3)

</specifics>

<deferred>
## Deferred Ideas

None — all 5 bugs are in scope.

</deferred>

---

*Phase: 17-horizon-crystallize-ui-fixes*
*Context gathered: 2026-03-24*
