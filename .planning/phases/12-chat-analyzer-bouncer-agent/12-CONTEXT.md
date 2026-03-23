# Phase 12: Chat Analyzer / Bouncer Agent - Context

**Gathered:** 2026-03-23 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Define and validate a production-grade Chat Analyzer / Bouncer prompt that protects graph quality by rejecting duplicates and extracting structured insight from ambiguous user text. The phase delivers a prompt contract, expanded golden evaluation suite, and updated heuristic fallback — but does NOT wire the LLM bouncer into the production neuron route.

</domain>

<decisions>
## Implementation Decisions

### Bouncer Prompt Scope
- **D-01:** Extend the existing `BOUNCER_SYSTEM_PROMPT` to handle both duplicate rejection AND definition/insight extraction as a single agent with an expanded JSON response contract.
- **D-02:** The response schema adds optional `extracted_definition` and `extracted_core_insight` fields that populate only on `allow_new` decisions. `append_to_existing` decisions continue returning only `decision`, `confidence`, `match_title`, and `rationale`.

### Eval Suite Structure
- **D-03:** Extend (not replace) the existing 5-case bouncer CSV with new cases covering extraction behavior. The Phase 10 baseline golden cases for duplicate detection must remain as regression tests.
- **D-04:** New extraction cases should include: ambiguous user text with extractable insight, partial/incomplete phrasing, overly technical jargon, conversational tone that hides a real insight. Target ~12-15 total cases.
- **D-05:** Assertions for extraction cases use scored thresholds (not hard pass/fail) since extraction quality is subjective. Duplicate rejection cases remain hard pass/fail.

### Heuristic Fallback Provider
- **D-06:** Extend the `heuristicDecision` function in `neurograph-bouncer-provider.mjs` to produce extraction fields for `allow_new` decisions. Offline/CI runs must pass the full expanded suite without an API key.

### Runtime Integration Boundary
- **D-07:** Phase 12 remains eval-only. The production neuron route (`src/app/api/neurons/route.ts`) continues using the vector-similarity `checkNeuronCollision` function. LLM bouncer runtime wiring is deferred to a later phase.

### Claude's Discretion
- Exact extraction scoring thresholds (e.g., cosine similarity or LLM-as-judge)
- Whether to use YAML or CSV for new extraction cases
- Exact number of extraction golden cases beyond the minimum
- Assertion helper structure for extraction quality checks

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bouncer prompt and runtime
- `src/lib/ai/prompts.ts` — Current `BOUNCER_SYSTEM_PROMPT` (lines 41-58), the contract to expand
- `src/lib/ai/bouncer.ts` — Current vector-similarity `checkNeuronCollision` function
- `src/app/api/neurons/route.ts` — Where bouncer is called during Neurogenesis (lines 130-145)

### Existing eval infrastructure
- `prompt-eval/bouncer/promptfooconfig.yaml` — Current bouncer eval config
- `prompt-eval/bouncer/cases.csv` — Current 5-case golden baseline
- `prompt-eval/shared/neurograph-bouncer-provider.mjs` — Heuristic fallback provider (lines 78-124)

### Pattern reference (Architect suite)
- `prompt-eval/architect/promptfooconfig.yaml` — Config pattern to follow
- `prompt-eval/architect/cases.csv` — 8-case golden suite pattern
- `prompt-eval/shared/neurograph-architect-provider.mjs` — Provider pattern reference

### Project context
- `.planning/REQUIREMENTS.md` — BOUNCER-01, BOUNCER-02, BOUNCER-03 requirements
- `.planning/phases/10-promptfoo-evaluation-harness/10-CONTEXT.md` — Eval infrastructure decisions
- `.planning/phases/11-dag-manager-agent/11-CONTEXT.md` — Agent contract pattern decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BOUNCER_SYSTEM_PROMPT` in `prompts.ts` — starting point, needs expansion for extraction fields
- `neurograph-bouncer-provider.mjs` — heuristic fallback already handles duplicate decisions, needs extraction extension
- `prompt-eval/bouncer/cases.csv` — 5 golden cases to preserve and extend
- Phase 11 Architect pattern — strict schema, golden suite, provider pattern to replicate

### Established Patterns
- Hybrid eval model: hard pass/fail for structural checks, scored thresholds for quality
- Hand-curated golden casuistry (5-8 cases per suite, not broad synthetic)
- Runtime prompts in `src/lib/ai/`, eval configs in `prompt-eval/`
- Heuristic fallback providers enable offline/CI runs

### Integration Points
- `prompt-eval/bouncer/promptfooconfig.yaml` — extend with new assertion types
- `prompt-eval/bouncer/cases.csv` — extend with extraction cases
- `prompt-eval/shared/neurograph-bouncer-provider.mjs` — extend heuristic for extraction fields
- `src/lib/ai/prompts.ts` — update `BOUNCER_SYSTEM_PROMPT`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follows the established Phase 10/11 eval-driven pattern.

</specifics>

<deferred>
## Deferred Ideas

- Wiring the LLM bouncer into the production neuron creation route (replacing or supplementing vector-similarity check)
- Multi-turn bouncer interaction (currently single-shot decision)
- Bouncer integration with TipTap editor bubble menu
- LLM-as-judge scoring for extraction quality (scaffold now, implement if needed)

</deferred>

---

*Phase: 12-chat-analyzer-bouncer-agent*
*Context gathered: 2026-03-23*
