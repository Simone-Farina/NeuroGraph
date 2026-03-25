# Phase 25: Decoupled Architect Pipeline - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a user-triggered neurogenesis pipeline as `POST /api/neurogenesis` with 3 traceable steps (Synthesizer → RAG → Epistemological Inquisitor), wire the GenerateNeuronButton to call it, and update the React Flow graph with the resulting neuron and DAG edges.

</domain>

<decisions>
## Implementation Decisions

### Pipeline Architecture (ARCH-01, ARCH-02, ARCH-03)
- New `POST /api/neurogenesis` endpoint — keeps existing `/api/architect` (curriculum/horizon) untouched
- Sequential pipeline in one route handler: Synthesizer → RAG → Inquisitor → insert neuron + synapses
- Each step wrapped in `observe()` from `@langfuse/tracing` for independent Langfuse spans
- Add `experimental_telemetry: buildTelemetry('neurogenesis-pipeline', { userId })` on the outer call

### Synthesizer Step (ARCH-02)
- New `generateObject` call with Zod schema `{ title: string, definition: string, core_insight: string }`
- Uses evaluator model (cheap, fast) via `getModelForRole('evaluator')`
- Input: last N messages from the conversation history
- Chain-of-thought prompt: analyze conversation, identify the deepest insight, synthesize into canonical form

### RAG + Inquisitor Steps
- RAG: reuse existing `find_similar_neurons` RPC from neurons/route.ts pattern
- Inquisitor: reuse existing `inferPrerequisites` from `src/lib/ai/inferPrerequisites.ts`
- Both are non-fatal: if RAG or Inquisitor fails, neuron is created as orphan (Phase 18 pattern)

### Error Handling
- Synthesizer failure → return 500 (can't create neuron without title/definition)
- RAG failure → skip prerequisites, create orphan neuron
- Inquisitor failure → skip prerequisites, create orphan neuron
- Always return 200 with `{ neuron, synapses }` on success

### Button → Pipeline Wiring (ARCH-04)
- GenerateNeuronButton sends POST with `{ conversationId }` — endpoint fetches messages server-side
- Button shows spinner while pipeline runs (isBloomPending state)
- Chat remains fully interactive during pipeline execution
- On success: Toast notification + neuron appears in graph + button resets to muted
- On failure: Toast error notification

### Graph Update
- Pipeline returns `{ neuron, synapses }` in response
- Client adds neuron + edges to graphStore directly
- Re-run dagre layout to position new nodes
- No page reload needed

### Claude's Discretion
- Exact Synthesizer system prompt wording
- Number of messages to pass to Synthesizer
- Neuron insert SQL/Supabase pattern (follow existing neurons/route.ts)
- Exact dagre re-layout trigger

</decisions>

<canonical_refs>
## Canonical References

- `src/app/api/neurons/route.ts` — existing neuron creation + post-insert enrichment pattern (lines 157-224)
- `src/lib/ai/inferPrerequisites.ts` — Epistemological Inquisitor
- `src/lib/ai/tracing.ts` — buildTelemetry, wrapRagWithObserve, observe
- `src/stores/graphStore.ts` — addNeuron, addSynapse, dagre layout functions
- `src/components/chat/GenerateNeuronButton.tsx` — Phase 25 stub to replace
- `src/components/chat/ChatPanel.tsx` — button placement
- `src/components/graph/GraphPanel.tsx` — dagre layout logic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `inferPrerequisites()` — already handles RAG → Inquisitor flow
- `find_similar_neurons` RPC — existing Supabase function
- `buildTelemetry()` and `observe()` from tracing.ts
- `getModelForRole('evaluator')` for cheap Synthesizer model
- graphStore already has methods for adding neurons and edges

### Established Patterns
- Post-insert enrichment wrapped in non-fatal try/catch (Phase 18)
- Supabase insert with `.select().single()` for returning created record
- dagre TB layout with `getLayoutedElements()`

### Integration Points
- GenerateNeuronButton.tsx → POST /api/neurogenesis
- /api/neurogenesis → Supabase (insert neuron) + inferPrerequisites (edges)
- Response → graphStore.addNeuron + graphStore.addSynapse
- graphStore → dagre re-layout → React Flow re-render

</code_context>

<specifics>
## Specific Ideas

- The Synthesizer should feel like it's distilling the conversation's "aha moment" into a crystallized knowledge unit
- The pipeline should complete in under 10 seconds for typical conversations
- The graph update should feel instant to the user — no loading spinner on the graph itself

</specifics>

<deferred>
## Deferred Ideas

- Batch neurogenesis (multiple neurons from one conversation)
- Preview step before committing the neuron
- Synthesizer quality scoring/confidence
- Ghost node projection from the new neuron

</deferred>

---

*Phase: 25-decoupled-architect-pipeline*
*Context gathered: 2026-03-25*
