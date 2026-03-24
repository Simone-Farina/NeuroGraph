# Phase 16: Socratic Agent Redesign - Context

**Gathered:** 2026-03-24 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the Socratic agent prompt from a question-parrot to a teach-then-ask tutor. The agent must share knowledge, context, and new perspectives in every response before posing its Socratic question. Update the eval heuristic and golden suite to reward teaching + questioning, not question-only responses. No runtime route changes.

</domain>

<decisions>
## Implementation Decisions

### Prompt Redesign
- **D-01:** Replace the absolute "NEVER give direct answers" directive with a structured "teach-then-ask" pattern. The agent must share at least one piece of new information (context, counterexample, analogy, historical background, related concept) before posing its closing Socratic question.
- **D-02:** The prompt must explicitly instruct the agent to: (a) acknowledge the user's answer, (b) enrich with new knowledge the user hasn't stated, (c) connect to broader context or related concepts, (d) close with a focused question that deepens further.
- **D-03:** The Bloom-gated Neurogenesis Policy (Analyze+ threshold) remains unchanged. Teaching does NOT collapse into answer-giving — the agent shares knowledge strategically to deepen the user's understanding, not to replace their thinking.
- **D-04:** Add a directive to reference RAG-supplied context (existing neurons, neighbors) when available, connecting new discussion to the user's existing knowledge graph.

### Eval Heuristic Redesign
- **D-05:** Update `scoreSocraticTone` in the conversationalist provider to reward teaching content (factual statements, context-setting, analogies) in addition to questions. The scoring should reward the "teach + question" pattern, not penalize information-sharing.
- **D-06:** Remove or reduce the penalty for "here is" / "the answer is" type phrases — these are legitimate when followed by a deepening question. The anti-pattern is answer-ONLY responses with no follow-up question.
- **D-07:** Add new golden cases that test the teach-then-ask pattern: cases where the user provides a shallow answer and the correct response includes contextual enrichment before the next question.

### Eval Suite Integrity
- **D-08:** The full 31-case promptfoo suite (bouncer 13 + architect 8 + conversationalist 10) must continue passing at 100% after changes. Existing conversationalist cases may need assertion threshold adjustments to accommodate the new scoring model.

### Claude's Discretion
- Exact wording of the prompt's teach-then-ask instruction
- Exact scoring weights for teaching vs questioning in the heuristic
- Whether to add example response patterns in the prompt (few-shot style)
- How many new golden cases to add (minimum 3)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chat prompt
- `src/lib/ai/prompts.ts` — `CHAT_SYSTEM_PROMPT` (lines 1-37): the contract to redesign
- `src/app/api/chat/route.ts` — Where prompt is injected with RAG context (line 187)
- `src/lib/ai/rag.ts` — RAG context formatting (lines 49-55)

### Eval infrastructure
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — `scoreSocraticTone` heuristic (lines 129-169), `heuristicConversationalist` function
- `prompt-eval/conversationalist/cases.yaml` — 10 existing golden cases
- `prompt-eval/conversationalist/promptfooconfig.yaml` — assertion config (score >= 0.8 threshold)

### Prior context
- `.planning/phases/13-socratic-chat-engine/13-CONTEXT.md` — Phase 13 decisions (D-01 anti-answer, D-03 Bloom gate)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CHAT_SYSTEM_PROMPT` — needs rewrite of Goals (line 4) and Behavior (lines 9-13) sections
- `scoreSocraticTone` — needs new scoring dimensions for teaching content
- 10 existing golden cases — baseline to preserve (may need threshold adjustments)

### Established Patterns
- Hybrid eval: scored threshold for tone, hard pass/fail for neurogenesis trigger
- Hand-curated golden casuistry
- Heuristic fallback for offline/CI

### Integration Points
- `prompts.ts` prompt text → extracted by provider via regex → used in eval suite
- `scoreSocraticTone` → drives the `socratic_score` output → assertion threshold in config
- RAG context appended at runtime in chat route

</code_context>

<specifics>
## Specific Ideas

- QA failure example: User discusses Siddhartha by Hesse. Agent asks "What do you think motivated Siddharta to leave Gotama?" without EVER mentioning Buddhism, the historical context, Hesse's philosophy, or the novel's themes. Pure question-parrot.
- The ideal response would be: "Interesting — Siddharta's departure from Gotama echoes a central tension in Buddhist philosophy: can enlightenment be transmitted through doctrine, or must it be experienced directly? Hesse was deeply influenced by his own journey through Eastern philosophy in the 1920s. What do you think this suggests about the difference between intellectual understanding and lived wisdom?"
- The structural rule: every agent response = acknowledge + teach + question

</specifics>

<deferred>
## Deferred Ideas

- Few-shot example responses embedded in the prompt (may help but adds token cost)
- Model-specific prompt tuning (OpenAI vs Anthropic vs Google)
- Advanced RAG context integration (fetching related neurons proactively)

</deferred>

---

*Phase: 16-socratic-agent-redesign*
*Context gathered: 2026-03-24*
