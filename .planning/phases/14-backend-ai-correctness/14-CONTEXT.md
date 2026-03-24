# Phase 14: Backend AI Correctness - Context

**Gathered:** 2026-03-24 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three backend/AI bugs discovered during QA testing: Architect schema error, Bloom-gated Neurogenesis runtime enforcement, and DAG prerequisite wiring. Includes legacy edge cleanup.

</domain>

<decisions>
## Implementation Decisions

### BUG-01: Architect Schema Fix
- **D-01:** Change `refusalReason` in `architectResponseSchema` from `z.string().min(1).optional()` to `z.string().nullable()`. OpenAI structured outputs requires all properties in the `required` array — `.optional()` is incompatible.
- **D-02:** Update the `.superRefine()` validation in `architect.ts` to check `!== null` instead of `!== undefined` for the `refusalReason` field.
- **D-03:** Apply the same `.optional()` → `.nullable()` fix to `suggested_next` in `inferPrerequisites.ts` (`prerequisiteInferenceSchema`) — it has the same OpenAI structured output incompatibility.

### BUG-02: Bloom Gate Runtime Enforcement
- **D-04:** Add server-side validation in the neurons POST route (`src/app/api/neurons/route.ts`) that rejects neurogenesis when `bloom_level` is Remember, Understand, or Apply — unless the neuron is a ghost node (`is_ghost: true`).
- **D-05:** Restrict the `suggestNeurogenesisTool` schema enum to `['Analyze', 'Evaluate', 'Create']` only — defense in depth alongside the server-side gate.
- **D-06:** Return a clear 422 error with message explaining the Bloom threshold when a shallow neuron is rejected.

### BUG-03: DAG Prerequisite Wiring
- **D-07:** Widen the `find_similar_neurons` RPC parameters: lower `match_threshold` from 0.3 to 0.15 and increase `match_count` from 5 to 10. This gives the LLM Epistemological Inquisitor more candidates to evaluate.
- **D-08:** Create a Supabase SQL migration that deletes all `synapses` rows where `type = 'RELATED'` AND `ai_suggested = true`. These are entirely legacy artifacts from the pre-v1.2 vector-similarity auto-wiring. The current system only creates `PREREQUISITE` edges via `inferPrerequisites`.

### Claude's Discretion
- Whether to add a broader candidate source (all user neurons) alongside widened vector search
- Exact error message wording for the Bloom gate 422 response
- Whether the legacy edge cleanup migration should be a Supabase migration file or a one-time API endpoint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architect schema and route
- `src/lib/ai/architect.ts` — `architectResponseSchema` (line 88: `refusalReason` optional), `.superRefine()` (lines 93-120)
- `src/app/api/architect/route.ts` — `generateObject` call (line 37-42)

### Neurogenesis and Bloom gate
- `src/app/api/neurons/route.ts` — Neurons POST route, `createNeuronSchema` (line 23: accepts all 6 Bloom levels)
- `src/lib/ai/tools.ts` — `suggestNeurogenesisTool` schema (line 21: full Bloom enum)
- `src/lib/ai/prompts.ts` — `CHAT_SYSTEM_PROMPT` (Bloom-gated Neurogenesis Policy, lines 16-37)

### DAG prerequisite inference
- `src/app/api/neurons/route.ts` — `find_similar_neurons` RPC call (lines 156-161: threshold 0.3, count 5)
- `src/lib/ai/inferPrerequisites.ts` — `prerequisiteInferenceSchema` (line 20: `suggested_next` optional), `inferPrerequisites` function

### Provider configuration
- `src/lib/ai/providers.ts` — Model role defaults (OpenAI gpt-4o for neurogenesis_heavy)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `architectResponseSchema` in `architect.ts` — needs `.optional()` → `.nullable()` fix
- `prerequisiteInferenceSchema` in `inferPrerequisites.ts` — same `.optional()` fix needed
- `createNeuronSchema` in neurons route — add Bloom validation
- `suggestNeurogenesisTool` in `tools.ts` — restrict enum

### Established Patterns
- Zod schemas validated server-side before database operations
- `generateObject` from Vercel AI SDK for structured LLM output
- `find_similar_neurons` RPC for vector search candidates

### Integration Points
- `architect.ts` schema → `/api/architect` route
- `tools.ts` schema → `/api/chat` route → neurogenesis flow
- `neurons/route.ts` → `inferPrerequisites` → Supabase synapses table

</code_context>

<specifics>
## Specific Ideas

- The OpenAI structured output error message was: `INVALID SCHEMA FOR RESPONSE_FORMAT 'RESPONSE': IN CONTEXT=(), 'REQUIRED' IS REQUIRED TO BE SUPPLIED AND TO BE AN ARRAY INCLUDING EVERY KEY IN PROPERTIES. MISSING 'REFUSALREASON'.`
- User created "NoSQL Databases" neuron from "Can we create a neuron for NoSQL databases?" — a single shallow sentence
- "Vector Databases" node created as orphan despite "Relational Databases" and "NoSQL Databases" existing
- Legacy edge: "Relational Databases" → "Automated Red-Teaming in LLM Development" (dashed line visible in screenshot)

</specifics>

<deferred>
## Deferred Ideas

- Wire LLM Bouncer into production neuron creation (v1.4+)
- Broader candidate source for prerequisite inference (all user neurons) — may not be needed if lowered threshold works
- More sophisticated legacy edge cleanup with embedding similarity scoring

</deferred>

---

*Phase: 14-backend-ai-correctness*
*Context gathered: 2026-03-24*
