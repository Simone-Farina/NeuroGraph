# Phase 27: Neurogenesis UX & Operational Polish - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the static GenerateNeuronButton with an in-chat contextual neurogenesis suggestion triggered by Bloom evaluator depth, remove all internal platform jargon from static UI copy, and eliminate unnecessary API polling during active chat sessions.

</domain>

<decisions>
## Implementation Decisions

### Contextual Neurogenesis Trigger
- **D-01:** Suggestion appears as an inline chat message-style card below the last AI message when Bloom hits Analyze+ — reuse the existing `NeurogenesisSuggestion.tsx` component pattern
- **D-02:** Trigger condition: Bloom evaluator detects Analyze+ AND confidence >= 0.75 — matches current `GenerateNeuronButton` threshold logic, driven by Zustand `bloomLevel` state
- **D-03:** Remove `GenerateNeuronButton` entirely — the contextual suggestion replaces it completely
- **D-04:** Suggestion auto-dismisses when user sends next message (non-intrusive) — can re-appear if still at Analyze+ after next evaluation

### Jargon Replacement
- **D-05:** Replace "crystallize", "neuron", "Bloom" in all static UI copy (graph empty state, labels, tooltips) — NOT in API internals, code comments, or variable names
- **D-06:** Replace "neuron" with "concept" or "idea" — neutral, user-friendly terms for knowledge graph nodes
- **D-07:** Replace "crystallize" with "extract" or "save" — plain action verbs
- **D-08:** Graph empty state: welcoming, plain language (e.g., "Start a conversation to build your knowledge graph") — no jargon, no internal terminology

### Polling Elimination
- **D-09:** Suppress `/api/queue`, `/api/review`, `/api/neurons` polling during active chat — per PERF-01. Main targets: `GraphPanel.tsx` retrievability timer (60s) and graph reload (5min)
- **D-10:** Detect "active chat session" via `leftPanelMode === 'chat'` from graphStore — suppress polling when in chat mode, resume on panel switch
- **D-11:** Keep `QueueBootstrap.tsx` focus/visibility refresh but guard with panel mode check — only refresh queue when on queue page
- **D-12:** Pause `GraphPanel.tsx` `setInterval` timers when `leftPanelMode === 'chat'` — resume on panel switch

### Claude's Discretion
- Exact styling and animation of the contextual suggestion appearance
- Specific replacement wording for each jargon instance (within the "concept"/"idea" and "extract"/"save" guidance)
- Implementation approach for interval pausing (cleanup vs. guard clause)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Neurogenesis trigger
- `src/components/chat/GenerateNeuronButton.tsx` — Current static button to be replaced
- `src/components/chat/NeurogenesisSuggestion.tsx` — Existing inline card component to reuse/adapt
- `src/components/chat/ChatPanel.tsx` — Where GenerateNeuronButton is imported and rendered
- `src/stores/graphStore.ts` — Zustand bloomLevel/bloomConfidence state that drives trigger

### Polling targets
- `src/components/graph/GraphPanel.tsx` — Contains two `setInterval` calls (retrievability 60s, graph reload 5min)
- `src/components/queue/QueueBootstrap.tsx` — Focus/visibility-based queue refresh
- `src/stores/queueStore.ts` — Queue store with refreshQueue method

### Jargon audit surface
- `src/components/graph/GraphPanel.tsx` — Graph empty state copy
- All `.tsx` files with static string literals containing "crystallize", "neuron", or "Bloom"

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NeurogenesisSuggestion.tsx` — Full inline card with title, definition, core_insight, Bloom level, commit/discard buttons, collision handling via BouncerCard
- `GenerateNeuronButton.tsx` — Contains Bloom threshold logic (ANALYZE_LEVELS, CONFIDENCE_THRESHOLD) that maps to the new trigger
- `graphStore.ts` — Already has `bloomLevel`, `bloomConfidence`, `isBloomPending`, `resetBloomEval`, `addNeurogenesisResult` actions

### Established Patterns
- Bloom state flow: `/api/bloom-evaluate` -> Zustand `setBloomEval` -> component reactivity
- Neurogenesis pipeline: POST `/api/neurogenesis` -> `addNeurogenesisResult` -> React Flow update
- Panel mode: `leftPanelMode` in graphStore controls which panel is shown

### Integration Points
- `ChatPanel.tsx` currently renders `<GenerateNeuronButton />` — swap point for contextual suggestion
- `MessageList.tsx` renders chat messages — suggestion could be injected as a pseudo-message
- `GraphPanel.tsx` interval setup in `useEffect` hooks — add panel mode guard

</code_context>

<specifics>
## Specific Ideas

- User specifically mentioned wanting to restore the previous in-chat neurogenesis suggestion (from the old tool-call flow) instead of the current static button — the screenshot showed the GENERATE NEURON button they want replaced
- The contextual suggestion should trigger the same POST `/api/neurogenesis` pipeline — no regression in the actual Neurogenesis flow (SC-04)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-neurogenesis-ux-operational-polish*
*Context gathered: 2026-04-03*
