# Phase 15: UI/UX Polish & Security - Context

**Gathered:** 2026-03-24 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 5 UI/UX bugs discovered during QA testing. All fixes must meet the app's editorial design standard — no functional-only patches. Use impeccable frontend design skills throughout.

</domain>

<decisions>
## Implementation Decisions

### BUG-04: Review Panel Width Reset
- **D-01:** Add a cleanup `useEffect` return in `/app/review/page.tsx` that calls `setShellPreset('standard')` on unmount. This ensures navigating away from Review via sidebar `<Link>` (which doesn't call `openChat()`) still resets the layout.

### BUG-05: Learning Target UI Redesign
- **D-02:** Restyle the "Set Learning Target" controls in `GraphPanel.tsx` to match the app's editorial design language. Replace `rounded-full` pill buttons with `rounded-xl` rectangular buttons. Replace `border-white/12` with subtler `border-white/8` or `border-white/5`. Use the serif font family (`font-serif`) for labels consistent with the rest of the graph chrome.
- **D-03:** The entire horizon controls container should feel like it belongs in the same dark editorial world as the rest of the app — muted, deliberate, not a floating HUD element. Reference the existing chat empty state and review panel for design language consistency.
- **D-04:** Apply impeccable frontend design attention to all UI changes in this phase — no functional-only patches. Every modified element must meet production design quality.

### BUG-06: Stuck "Synthesizing new neuron..."
- **D-05:** Fix `NeurogenesisSuggestion.tsx` to treat any tool call that is not actively streaming (`state !== 'partial-call'`) as complete. For persisted tool calls loaded from chat history, the state may not be `'output-available'` but the tool call is definitively done. Show the resolved candidate card, not the synthesizing spinner.

### BUG-07: Residual Handle Dot
- **D-06:** Replace the Tailwind `!opacity-0 !w-0 !h-0` classes on `<Handle>` components in `NeuronNode.tsx` with `style={{ display: 'none' }}` inline style. This guarantees the Handle is invisible regardless of React Flow's CSS specificity. Edge routing still works because React Flow uses node positions, not Handle DOM elements, for edge calculations when handles are hidden.

### BUG-08: API Key Masking
- **D-07:** In `AppSidebar.tsx`, replace the always-visible `{keyPrefix}...` with a masked display: show `ng_****...` by default. Only show the actual prefix for a brief period (e.g., 10 seconds) immediately after key generation, then auto-mask. Use a `setTimeout` + state flag pattern.

### Claude's Discretion
- Exact animation/transition for the key masking reveal → auto-hide
- Exact border opacity values for the Learning Target redesign
- Whether to add subtle motion (framer-motion fade) to the horizon controls

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shell layout and presets
- `src/stores/graphStore.ts` — `setShellPreset`, `openChat`, `openReview` actions
- `src/app/(app)/app/review/page.tsx` — Review page that sets `deep_read` preset
- `src/app/(app)/layout.tsx` — Layout consuming `shellPreset` for panel widths

### Horizon / Learning Target UI
- `src/components/graph/GraphPanel.tsx` — Lines 337-410: horizon controls container, buttons, input

### Neurogenesis display
- `src/components/chat/NeurogenesisSuggestion.tsx` — Tool call rendering, `isInputComplete`, state checks
- `src/components/chat/MessageList.tsx` — `toolState` derivation from tool parts

### Node handles
- `src/components/graph/NeuronNode.tsx` — Handle components (lines 253, 274)

### API key sidebar
- `src/components/layout/AppSidebar.tsx` — Lines 311-345: API key management section, key prefix display

### Design reference (editorial language)
- `src/components/chat/ChatPanel.tsx` — Chat empty state styling
- `src/components/graph/ReviewMode.tsx` — Review panel styling
- `.impeccable.md` — Design guidelines (if exists)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shellPreset` state machine in graphStore — already has `standard`, `deep_read`, `graph_zenith` presets
- Framer-motion already used for panel transitions
- Editorial design tokens: `text-white/30`, `border-white/5`, `rounded-xl`, `font-serif`

### Established Patterns
- Shell presets managed by Zustand store, consumed by layout
- Dark editorial aesthetic: muted borders, serif typography, no bright UI chrome
- API key one-time reveal pattern (full key shown only at generation)

### Integration Points
- Review page → graphStore `setShellPreset`
- GraphPanel horizon controls → self-contained styling
- NeurogenesisSuggestion → tool call state from AI SDK
- AppSidebar → API key state management

</code_context>

<specifics>
## Specific Ideas

- "Use impeccable frontend design skills to refactor the UI" — all changes must be production-quality, not just functional fixes
- The Learning Target UI should feel like it's part of the same dark editorial world as the rest of the graph
- Reference the existing Neurogenesis candidate card UI for design language (which the user praised as "beautiful")

</specifics>

<deferred>
## Deferred Ideas

None — all 5 bugs are in scope for this phase.

</deferred>

---

*Phase: 15-ui-ux-polish-security*
*Context gathered: 2026-03-24*
