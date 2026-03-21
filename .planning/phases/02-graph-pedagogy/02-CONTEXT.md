# Phase 2: Graph Pedagogy - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the visual memory network into a strict, auto-laid-out DAG that enforces prerequisite mastery. Implement target-driven "Ghost Nodes" with an Elden Ring-style Fog of War to prevent cognitive overload while tempting continued learning.

</domain>

<decisions>
## Implementation Decisions

### DAG Layout Enforcement (Dual-Mode Architecture)
- **Strict LR (Left-to-Right) auto-layout** using `dagre` (already integrated via `@dagrejs/dagre`). Change `rankdir` from `'TB'` to `'LR'`.
- **Read-Only Graph:** Users CANNOT manually drag or scatter Neurons. The 60vw Neural Network panel is a mathematically strict, auto-organized map of their brain.
- **No manual node positioning.** React Flow's drag handles are disabled (`nodesDraggable={false}`).
- **Deferred:** A separate "Canvas Sandbox" mode (messy playground for PDFs, videos, notes) is future scope — not Phase 2.

### Prerequisite Wiring Behavior (Supervised AI Magic)
- **Users do NOT manually draw edges.** This eliminates cognitive friction and messy hierarchies.
- When the AI Bouncer / Heavy Neurogenesis model extracts a new Neuron, it **automatically infers prerequisites** from the user's existing vector-matched Neurons.
- The AI creates `synapses` with `type: 'PREREQUISITE'` in the database.
- **UX:** After Neurogenesis, a subtle toast informs the user: "Linked to [Algebra] and [Python]". Users can delete hallucinated edges but creation is automated.
- Edge creation uses `react-flow` connections disabled (`nodesConnectable={false}` — already set).

### Ghost Node UI & Ambiguity (The "Elden Ring" Fog of War)
- True Fog of War to prevent anxiety when importing large roadmaps (e.g., "AI Engineer").
- **Depth N (The Target):** Visible in the distance with a glowing "Beacon" style. Shows the goal node (e.g., "AI Engineer").
- **Depth 1 (Immediate Next Steps):** Visible titles (e.g., "Linear Algebra"), styled as dashed-border "Ghost Nodes". Clicking opens a chat to start learning.
- **Depth 2 to N-1 (The Fog):** Nodes rendered in the DAG with completely redacted text (`???` or blurred). User sees the structural path exists but cannot see topics until prerequisites are mastered.
- New DB column: `is_ghost: boolean` on neurons table.
- New DB column: `ghost_depth: integer | null` on neurons table (distance from the nearest mastered ancestor).

### Curriculum Generation (The Organic Compass)
- System "tempts" the user to keep learning. Ghost paths come from TWO sources:
  1. **Explicit:** User prompts (e.g., "I want to learn Quantum Mechanics") generate a ghost curriculum path.
  2. **Organic:** When a user successfully creates a new Neuron, the AI occasionally projects 1-2 Ghost Nodes as logical next steps (e.g., "You mastered Embeddings → [Vector Search]").
- This turns the graph into an active, tempting compass.

### Soft-FIRe (Decay Visibility, Not Lockout)
- If a foundational node decays below FSRS retrievability < 85%, it visually "rusts" (muted terracotta color).
- Dependent advanced nodes DO NOT lock or become unclickable. They inherit a visual warning (rust-colored border or warning icon) indicating "Your foundation is crumbling."
- User is always free to override or re-learn.
- **Note:** Actual FSRS-6 engine implementation is Phase 3. Phase 2 only implements the *visual* decay propagation on the graph.

### Claude's Discretion
- The exact number of ghost nodes projected during organic suggestion (1-2 is the guideline).
- The visual distinction between depth levels (exact CSS treatment for blurred/dashed nodes).
- Cycle detection algorithm choice for DAG validation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Conventions
- `.planning/codebase/ARCHITECTURE.md` — 40/60 split UI, AI routing, React Flow canvas.
- `.planning/codebase/CONVENTIONS.md` — Style patterns, Zustand state management.

### Phase 1 Decisions
- `.planning/phases/01-knowledge-quality-ephemerality/01-CONTEXT.md` — AI Bouncer mechanism, Neurogenesis flow, pgvector similarity search.

### Phase 4 Decisions
- `.planning/phases/04-advanced-ai-editor/CONTEXT.md` — Liquid Document paradigm, slash commands, Danish Computation aesthetic.

### Academic Foundation
- "The Math Academy Way" (Justin Skycak) — DAG-based prerequisite mastery as the pedagogical model.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `layout.worker.ts` — Web Worker dagre layout (currently `TB`, needs `LR` switch).
- `GraphPanel.tsx` — Already uses dagre for auto-layout, `nodesConnectable={false}`, `NeuronNode` type registration. Layout function duplicated in main thread and worker.
- `NeuronNode.tsx` — Retrievability-based styling with 5 visual states (Fresh → Critical). Can be extended for Ghost Node rendering.
- `SynapseEdge.tsx` — Custom edge component with `PREREQUISITE` / `RELATED` / `BUILDS_ON` type support.
- `database.ts` types — `Neuron`, `Synapse`, `SynapseType` already defined. `find_similar_neurons` and `get_neuron_neighborhood` RPC functions exist.
- `useSynapseSuggestions.ts` — Hook for AI-suggested synapses.

### Established Patterns
- Zustand (`graphStore.ts`) manages all graph state including nodes, edges, and active selections.
- Vercel AI SDK v6 for streaming AI responses.
- `getModelForRole('neurogenesis_heavy')` for the heavy extraction model.

### Integration Points
- `GET /api/neurons` — Returns neurons + synapses. Needs to include `is_ghost` and `ghost_depth` for rendering.
- `NeurogenesisSuggestion.tsx` — Where new neurons are confirmed. Prerequisite wiring should trigger here post-creation.
- `graphStore.setGraph()` — Entry point for mapping API data to React Flow nodes/edges.

</code_context>

<specifics>
## Specific Ideas

- "Elden Ring Fog of War" — The user explicitly referenced this game's exploration model as the UX metaphor for Ghost Nodes.
- The Beacon node (target/goal) should have a subtle glowing animation to draw the eye forward, like a distant lighthouse.
- Ghost Nodes at Depth 1 should feel "inviting" — dashed borders suggest possibility, not restriction.
- The word "rust" and "terracotta" were used for the Soft-FIRe decay visual. This is a warm, organic color — not a harsh red error state.

</specifics>

<deferred>
## Deferred Ideas

- **Canvas Sandbox Mode** — A separate messy playground (PDFs, videos, draggable items) distinct from the strict DAG view. Future phase.
- **Explicit `/target` curriculum command** — While the organic compass is Phase 2, the full "I want to learn X" roadmap generation is a more complex feature that may warrant its own sub-phase.

</deferred>

---

*Phase: 02-graph-pedagogy*
*Context gathered: 2026-03-21*
