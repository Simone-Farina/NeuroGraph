# Phase 19: Enterprise Prompt Engineering - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade all AI agent prompts to enterprise pedagogical standards. Expand the eval suite to validate behavioral correctness. Add server-side cycle validation. No new features — make existing agents production-grade.

</domain>

<decisions>
## Implementation Decisions

### Socratic Agent (PROMPT-01)
- Add all 4 Khanmigo patterns to CHAT_SYSTEM_PROMPT: calibrated difficulty (assume confusion is unknown), mistake handling ("how did you get there?"), Goldilocks edge tracking (simplify/escalate based on engagement), meta-questioning ("what assumption are you making?")
- Mistake handling: ask about the reasoning process, don't correct directly
- Bloom distribution: prompt-level instruction to vary complexity across turns, no runtime tracking
- No few-shot examples — keep prompt concise, rely on behavioral eval

### DAG Agent (PROMPT-02)
- Add comprehension test heuristic: "If removing concept A would make concept B incomprehensible to a learner who has NEVER seen A, then A is a PREREQUISITE. Otherwise it is RELATED."
- Add 4 boundary examples covering: PREREQUISITE (math→physics), BUILDS_ON (calculus→differential equations), RELATED (Python↔JavaScript), no-connection (cooking↔quantum physics)

### Cycle Validation (PROMPT-03)
- Add Kahn's algorithm cycle detection in `architect.ts` `.superRefine()` block — post-parse structural validation independent of LLM prompt compliance
- Rejects cycles even when LLM says `isValid: true`

### Eval Suite (PROMPT-04)
- Add 8 new golden cases: 4 conversationalist behavioral (mistake handling, calibrated difficulty, meta-questioning, multi-turn neurogenesis priming) + 4 architect boundary cases
- Pin judge model version in promptfoo configs: `openai:gpt-4o-2024-08-06`
- Target: 42+ total cases across all suites

### Claude's Discretion
- Exact wording of Khanmigo pattern instructions in the prompt
- Exact wording of comprehension test in the inferPrerequisites prompt
- Kahn's algorithm implementation details (topological sort approach)
- Specific eval case scenarios for the 8 new cases

</decisions>

<canonical_refs>
## Canonical References

### Prompts
- `src/lib/ai/prompts.ts` — CHAT_SYSTEM_PROMPT (Socratic agent)
- `src/lib/ai/inferPrerequisites.ts` — prerequisite inference prompt (lines 48-61)
- `src/lib/ai/architect.ts` — architectResponseSchema + superRefine (lines 88-120)

### Eval infrastructure
- `prompt-eval/conversationalist/cases.yaml` — 13 current cases
- `prompt-eval/architect/cases.csv` — 8 current cases
- `prompt-eval/conversationalist/promptfooconfig.yaml`
- `prompt-eval/architect/promptfooconfig.yaml`
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs`

### Research
- `.planning/research/FEATURES.md` — Khanmigo patterns, comprehension test, Bloom classification
- `.planning/research/PITFALLS.md` — prompt drift, Bloom boundary collapse, DAG reasoning failures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CHAT_SYSTEM_PROMPT already has teach-then-ask structure from Phase 16
- architectResponseSchema already has `.superRefine()` for validation
- Existing eval providers with heuristic fallback pattern

### Established Patterns
- Prompt changes tested against existing golden suite before new cases added
- Heuristic fallback for offline/CI eval runs
- Hand-curated golden casuistry (not synthetic)

### Integration Points
- `prompts.ts` → extracted by eval providers via regex
- `architect.ts` superRefine → structural post-validation
- `inferPrerequisites.ts` prompt → feeds into neurons route

</code_context>

<specifics>
## Specific Ideas

- Research: "Khanmigo's four highest-value patterns are missing from the current CHAT_SYSTEM_PROMPT"
- Research: "The comprehension test is the most reliable DAG disambiguation tool"
- Research: "Soft cycles (4+ hop chains) pass the LLM's own cycle check — server-side Kahn's is a hard requirement"
- Pitfalls research: "Prompt drift is the highest-risk invisible failure" — eval expansion helps detect it

</specifics>

<deferred>
## Deferred Ideas

- Real-time Bloom classification API call per message (too much latency)
- Fine-tuned Bloom classifier model
- Eval score distribution tracking over time (monitoring, not implementation)

</deferred>

---

*Phase: 19-enterprise-prompt-engineering*
*Context gathered: 2026-03-24*
