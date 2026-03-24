# Phase 21: Graph Performance & Bloom UI - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Optimize graph rendering for scale (50-200 nodes) and add a real-time cognitive depth indicator in chat. React.memo on node components, onlyRenderVisibleElements for React Flow, and a 6-segment Bloom depth meter.

</domain>

<decisions>
## Implementation Decisions

### Graph Performance (GRAPH-01, GRAPH-02)
- Wrap NeuronNode and GhostNeuronNode in React.memo — prevents full graph re-render when one node's retrievability updates
- Add `onlyRenderVisibleElements` prop to ReactFlow — off-screen nodes excluded from DOM
- Note: research flagged GitHub #4516 edge rendering bug with onlyRenderVisibleElements — needs live testing with 100+ nodes before shipping. If edges break, remove the prop.

### Bloom UI (BLOOM-01)
- Add a 6-segment depth meter to the chat interface showing approximate Bloom level
- Client-side keyword analysis of user messages — no API call per message
- Use the existing BLOOM_ANALYZE_SIGNALS patterns from the conversationalist provider as the classification basis
- The meter is decorative/informational — it does NOT gate neurogenesis (that's server-side)
- Visual design: 6 horizontal segments, filled segments indicate detected Bloom level. Muted colors matching editorial aesthetic.

### Claude's Discretion
- Exact placement of the Bloom meter in the chat UI (below header? above input? floating?)
- Exact visual design of the 6 segments (dots, bars, gradient)
- Whether to label the segments with Bloom level names
- React.memo comparison function (shallow vs deep)

</decisions>

<canonical_refs>
## Canonical References

- `src/components/graph/NeuronNode.tsx` — needs React.memo wrapper
- `src/components/graph/GhostNeuronNode.tsx` — needs React.memo wrapper
- `src/components/graph/GraphPanel.tsx` — ReactFlow props, onlyRenderVisibleElements
- `src/components/chat/ChatPanel.tsx` — where Bloom meter will be added
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — BLOOM_ANALYZE_SIGNALS patterns (lines 29-38)
- `.planning/research/FEATURES.md` — Bloom UI indicator research
- `.planning/research/STACK.md` — React Flow performance section

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- BLOOM_ANALYZE_SIGNALS regex patterns from conversationalist provider — reuse for client-side detection
- Editorial design tokens from the app's existing dark aesthetic

### Established Patterns
- React Flow custom nodes registered via nodeTypes
- Zustand store for UI state
- Framer-motion for animations

</code_context>

<specifics>
## Specific Ideas

- Research: "No established visual pattern for a real-time Bloom depth indicator exists in production edtech"
- Research: "The 6-dot/segment depth meter is novel territory where NeuroGraph has an opportunity"
- The meter should feel like a subtle ambient indicator, not a gamification score

</specifics>

<deferred>
## Deferred Ideas

- Layout worker wiring (dagre on web worker thread)
- Batch store action for graph updates
- React Flow fitView optimization

</deferred>

---

*Phase: 21-graph-performance-bloom-ui*
*Context gathered: 2026-03-24*
