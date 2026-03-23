# Phase 13: Socratic Chat Engine - Context

**Gathered:** 2026-03-23 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Define and validate a Socratic coaching prompt that maintains guidance quality over multi-turn exchanges and knows when to propose Neurogenesis. The phase delivers a tightened `CHAT_SYSTEM_PROMPT`, a multi-turn golden evaluation suite, and a custom conversationalist provider — but does NOT change runtime route logic or tool schemas.

</domain>

<decisions>
## Implementation Decisions

### Prompt Contract Modification
- **D-01:** Modify `CHAT_SYSTEM_PROMPT` to add explicit anti-answer-giving directives: the AI must never give direct answers unprompted, must always lead with a question or challenge, and must guide the user to arrive at understanding themselves.
- **D-02:** Tighten the Neurogenesis Policy from "fire liberally" to "fire only on genuine deep insights." The current liberal policy ("DO NOT wait for a perfect insight", "call the tool at least once per conversation") violates the core spec that node creation must "follow demonstrated conceptual depth" and be "selective to avoid noise." Replace with Bloom's Taxonomy depth gating.
- **D-03:** Use Bloom's Taxonomy to evaluate Deep Insight readiness. The AI should propose Neurogenesis only when the user demonstrates cognitive engagement at the Analyze level or higher (Analyze, Evaluate, Create). Remember/Understand level exchanges are too shallow for node creation.

### Multi-Turn Eval Strategy
- **D-04:** The conversationalist eval suite must use multi-turn conversation format (message arrays), not single-shot prompts, since SOCRATES-02 requires testing across multiple simulated chat turns.
- **D-05:** Use pre-scripted conversation scripts (hand-written user messages with simulated context). Assertions check the final assistant reply. This matches the golden casuistry philosophy — hand-curated, deterministic, not synthetic multi-step loops.

### Custom Provider Architecture
- **D-06:** Create `neurograph-conversationalist-provider.mjs` in `prompt-eval/shared/` following the established bouncer/architect pattern: extract prompt from `prompts.ts`, resolve model, heuristic fallback for offline/CI runs.

### Assertion Strategy
- **D-07:** Socratic tone evaluation uses scored assertions with threshold > 0.8, not hard pass/fail. Coaching tone is inherently subjective.
- **D-08:** Dual-mode assertion: custom heuristic (checks for question marks in response, absence of direct "The answer is..." patterns) as offline fallback, with LLM-as-judge rubric for live mode. Matches the established dual-mode pattern.
- **D-09:** Neurogenesis proposal assertions are hard pass/fail: the model must call the suggest_neurogenesis tool in the correct golden case (deep insight present) and must NOT call it in shallow exchanges.

### Claude's Discretion
- Exact heuristic scoring algorithm for offline Socratic tone assessment
- Exact number of golden cases (target 8-12 covering: coaching tone, answer-giving refusal, multi-turn consistency, Bloom-gated neurogenesis trigger, shallow exchange rejection)
- Whether to use YAML or CSV for multi-turn cases (CSV may struggle with message arrays)
- Exact Bloom level keywords/patterns for the heuristic fallback

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chat prompt and runtime
- `src/lib/ai/prompts.ts` — Current `CHAT_SYSTEM_PROMPT` (lines 1-37), the contract to modify
- `src/app/api/chat/route.ts` — Where chat prompt is used, tool integration
- `src/lib/ai/tools.ts` — `suggestNeurogenesisTool` schema (neurogenesis proposal trigger)

### Existing eval infrastructure
- `prompt-eval/conversationalist/promptfooconfig.yaml` — Scaffold from Phase 10 (currently echo placeholder)
- `prompt-eval/shared/neurograph-bouncer-provider.mjs` — Provider pattern reference (heuristic fallback)
- `prompt-eval/shared/neurograph-architect-provider.mjs` — Provider pattern reference (schema validation)

### Project context
- `.planning/REQUIREMENTS.md` — SOCRATES-01, SOCRATES-02, SOCRATES-03 requirements
- `.planning/phases/10-promptfoo-evaluation-harness/10-CONTEXT.md` — Eval infrastructure decisions
- `.planning/phases/12-chat-analyzer-bouncer-agent/12-CONTEXT.md` — Phase 12 contract pattern decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CHAT_SYSTEM_PROMPT` in `prompts.ts` — starting point, needs Socratic tightening and Bloom-gated neurogenesis
- Bouncer/Architect provider patterns — extract prompt via regex, heuristic fallback, dual-mode
- `prompt-eval/conversationalist/` scaffold — directory and placeholder config from Phase 10
- `suggestNeurogenesisTool` in `tools.ts` — the tool the model must learn to call only on deep insights

### Established Patterns
- Hybrid eval model: hard pass/fail for structural checks, scored thresholds for behavioral quality
- Hand-curated golden casuistry (8-12 cases per suite)
- Runtime prompts in `src/lib/ai/`, eval configs in `prompt-eval/`
- Heuristic fallback providers enable offline/CI runs
- Phase 12 proved the dual-purpose prompt expansion pattern

### Integration Points
- `prompt-eval/conversationalist/promptfooconfig.yaml` — replace echo placeholder with real config
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — new provider
- `src/lib/ai/prompts.ts` — update `CHAT_SYSTEM_PROMPT`
- `promptfooconfig.yaml` (root) — ensure `eval:conversationalist` script works

</code_context>

<specifics>
## Specific Ideas

- "Node creation should follow demonstrated conceptual depth — selective to avoid noise, conservative against duplicates"
- Bloom's Taxonomy as the measurement framework: Remember → Understand → Apply → **Analyze → Evaluate → Create** (neurogenesis threshold)
- The Socratic method means the AI never answers directly — it asks questions that lead the user to the answer
- Current Neurogenesis Policy's "fire liberally" stance is explicitly rejected as legacy behavior

</specifics>

<deferred>
## Deferred Ideas

- Wiring the tightened Socratic prompt into production (already the active prompt — changes are immediate)
- Full LLM-as-judge scoring infrastructure (Phase 13 uses heuristic fallback; real rubric is a future enhancement)
- Multi-step generative eval loops (scripted conversations only for now)
- Adjusting the `suggest_neurogenesis` tool schema to carry Bloom level metadata

</deferred>

---

*Phase: 13-socratic-chat-engine*
*Context gathered: 2026-03-23*
