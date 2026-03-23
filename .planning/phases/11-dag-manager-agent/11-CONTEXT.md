# Phase 11: DAG Manager Agent - Context

**Gathered:** 2026-03-23
**Status:** Executed and approved

<domain>
## Phase Boundary

Phase 11 defines the Architect contract, not the product wiring.

The work establishes a strict prompt contract for curriculum generation, a local schema and invariant layer that can reject malformed graphs deterministically, and a Golden promptfoo suite that proves the model refuses cycles before any runtime route is allowed to touch the UI or database.

This phase explicitly does not create a Next.js Architect route, write draft paths to Supabase, or render ghost nodes in React Flow. Those concerns are deferred to Phase 11.5.

</domain>

<decisions>
## Implementation Decisions

### Strict JSON response contract
- The Architect returns one strict object with:
  - `isValid`
  - optional `refusalReason`
  - `nodes`
  - `synapses`
- Invalid results must return empty arrays for `nodes` and `synapses`.

### Relationship semantics
- Synapse types are locked to NeuroGraph's allowed graph semantics:
  - `PREREQUISITE`
  - `RELATED`
  - `BUILDS_ON`
- The prompt must not invent fourth or fifth relation labels.

### Cycle handling
- Cycles are a hard failure.
- The model must refuse explicitly instead of silently rewriting the learning path.
- Local invariant checks must also reject cycles even if the model output parses as JSON.

### Golden suite philosophy
- The eval suite stays small and hand-curated:
  - 3 valid curricula
  - 3 cycle traps
  - 2 edge cases around `PREREQUISITE` vs `BUILDS_ON`
- The goal is interpretability and structural confidence, not broad synthetic coverage.

### Runtime boundary
- Phase 11 remains runtime-light.
- The production route and Horizon UI handoff are deferred to Phase 11.5.

</decisions>

<specifics>
## Specific Ideas

- "Eval-Driven Development begins here."
- "Silent repair is forbidden."
- "The Architect must protect the DAG before the product ever renders it."
- "The same strict schema should serve both prompt evaluation and future runtime integration."

</specifics>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/architect.ts`
- `src/lib/ai/__tests__/architect.test.ts`
- `prompt-eval/architect/promptfooconfig.yaml`
- `prompt-eval/architect/cases.csv`
- `prompt-eval/shared/neurograph-architect-provider.mjs`

</canonical_refs>

<code_context>
## Existing Code Insights

- `src/lib/ai/prompts.ts` is the correct runtime home for the Architect system prompt.
- `src/lib/ai/architect.ts` is the correct local enforcement seam for response parsing and DAG invariants.
- `prompt-eval/architect/` can carry the Golden suite without touching runtime bundles.
- The prompt-eval harness from Phase 10 already provides the command surface and provider pattern needed for this suite.

</code_context>

<deferred>
## Deferred Ideas

- `/api/architect`
- Graph-side target setting
- Ghost node rendering
- Left-panel briefing mode
- Draft-path persistence or commit flow

</deferred>

---

*Phase: 11-dag-manager-agent*
*Context gathered: 2026-03-23*
