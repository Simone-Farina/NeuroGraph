# Phase 23: Pure Conversationalist - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Strip all tool-calling from `/api/chat`, rewrite the system prompt as a natural Socratic tutor with depth encouragement, hard-reset legacy chat data, and rebuild the conversationalist eval suite from scratch with no-jargon, no-bullet-point, and Socratic constraints.

</domain>

<decisions>
## Implementation Decisions

### Chat System Prompt Rewrite (AGENT-01, AGENT-02)
- Keep "You are NeuroGraph, a rigorous Socratic thinking companion" identity — distinct persona, not generic tutor
- Strip ALL platform/technical jargon: no "Neurons", "Crystallization", "Bloom's Taxonomy", "Knowledge Graph", "Neurogenesis"
- Kill the acknowledge/enrich/question structure completely — it caused robotic tone. Mandate natural, fluid, paragraph-form dialogue
- Strictly forbid unsolicited bullet points or lists unless explicitly requested by the user
- Convert the Neurogenesis Policy section to a "Depth Encouragement" directive: the AI must relentlessly (but politely) push users to think deeper, analyze tradeoffs, and synthesize ideas — without knowing why (the background evaluator handles the rest)
- No mention of Bloom's Taxonomy or cognitive levels anywhere in the prompt. Strict separation of concerns.

### Tool Removal from Chat Route (AGENT-01)
- Remove `tools: { suggest_neurogenesis: suggestNeurogenesisTool }` from the `streamText` call in `/api/chat/route.ts`
- Remove the import of `suggestNeurogenesisTool` and any tool-related code
- The chat endpoint becomes a pure text streamer — no tool invocations ever

### Tool-Call Message DB Migration (AGENT-06)
- HARD RESET (destructive) — sole user beta, data is disposable
- Create a SQL migration that TRUNCATEs the `messages` and `conversations` tables (CASCADE)
- No complex JSON-parsing migration — clean slate for the new architecture
- This completely eliminates any risk of legacy tool-call rendering bugs

### Conversationalist Eval Suite (EVAL-01)
- Trash ALL old conversationalist eval cases that expect tool-calls — start fresh
- Add 4 new golden cases: no-jargon, natural-flow, depth-challenge, mistake-handling
- JavaScript/regex assertion blocks with hard constraints:
  - FAIL if response contains banned jargon: "Neuron", "Crystallize", "Bloom", "Taxonomy", "Insight"
  - FAIL if response contains bullet points (regex: `^\s*[\*\-\d\.]+\s+`)
  - PASS only if response contains a follow-up question (Socratic requirement)
  - Simple length/paragraph-count check to avoid the old 3-block formula
- Update existing cases to remove tool-call expectations

### Claude's Discretion
- Exact wording of the "Depth Encouragement" directive in the prompt
- Specific eval case scenarios (domains, user messages)
- Migration file naming convention
- Whether to keep any existing eval cases or start fully fresh

</decisions>

<canonical_refs>
## Canonical References

- `src/app/api/chat/route.ts` — streamText with tools (lines 197-198)
- `src/lib/ai/prompts.ts` — CHAT_SYSTEM_PROMPT
- `src/lib/ai/tools.ts` — suggestNeurogenesisTool definition
- `src/components/chat/ChatPanel.tsx` — toolInvocations handling
- `prompt-eval/conversationalist/cases.yaml` — existing eval cases
- `prompt-eval/conversationalist/promptfooconfig.yaml` — eval config
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — eval provider

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `neurograph-conversationalist-provider.mjs` — heuristic fallback eval provider
- `scoreSocraticTone` function — can be adapted for new assertion style
- `BLOOM_ANALYZE_SIGNALS` patterns — NOT needed in this phase (moved to Phase 24)

### Established Patterns
- promptfoo golden cases in YAML format with JavaScript assertion blocks
- Heuristic provider with offline/CI fallback mode
- pinned judge model: `openai:gpt-4o-2024-08-06`

### Integration Points
- `src/app/api/chat/route.ts` — remove tools object from streamText call
- `src/lib/ai/prompts.ts` — rewrite CHAT_SYSTEM_PROMPT
- `src/components/chat/ChatPanel.tsx` — remove toolInvocations rendering if present
- Supabase migration in `supabase/migrations/` — truncate messages + conversations

</code_context>

<specifics>
## Specific Ideas

- The prompt should feel like talking to a brilliant, curious friend who happens to know a lot — not an AI tutor
- "Danish Computation" aesthetic extends to the conversational style: calm, rigorous, no gamification
- The depth encouragement should make users naturally reach Analyze/Evaluate/Create level thinking without being told that's what's happening
- Eval banned jargon list: "Neuron", "Crystallize", "Bloom", "Taxonomy", "Insight" (exact terms)

</specifics>

<deferred>
## Deferred Ideas

- Few-shot examples in the prompt (keep concise for now)
- Context-aware prompt that references the user's existing knowledge graph (requires Phase 25 integration)
- Streaming quality metrics (latency, token count) — belongs in observability enhancements

</deferred>

---

*Phase: 23-pure-conversationalist*
*Context gathered: 2026-03-25*
