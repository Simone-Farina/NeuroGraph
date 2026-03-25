# Phase 24: Silent Observer - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a non-blocking Bloom Evaluator as a separate API endpoint, wire it to a "Generate Neuron" button that illuminates at Analyze-level cognitive depth, and create a 6-case eval suite validating the evaluator's accuracy. Eval-driven: suite ships before production code.

</domain>

<decisions>
## Implementation Decisions

### Bloom Evaluator Architecture (AGENT-03, AGENT-04)
- Separate `POST /api/bloom-evaluate` endpoint — NOT inside onFinish (Vercel serverless kills unawaited promises)
- Client calls the endpoint with a debounced fetch after each user message
- Model: Gemini 2.5 Flash via `getModelForRole('evaluator')` — best cost/speed ratio
- Evaluates the last 3 user messages from the conversation
- Returns JSON: `{ reasoning: string, bloom_level: string, confidence: number }` — chain-of-thought is MANDATORY (forces LLM to reason before classifying, prevents hallucinated classifications)
- The `reasoning` field is logged to Langfuse for debugging and tuning
- Client updates Zustand store directly from the HTTP response — NO polling Supabase, NO WebSockets
- Add `experimental_telemetry: buildTelemetry('bloom-evaluator', { userId })` for Langfuse tracing

### Generate Neuron Button UX (AGENT-05)
- Lives in ChatPanel left panel, visually coupled with the cognitive state indicator (BloomDepthMeter)
- Two states only: muted (opacity-40, non-interactive) and solid (opacity-100, clickable)
- Smooth CSS opacity + scale transition — no glow, no pulse, no gamification. Danish Computation aesthetic.
- Illuminates when `bloomLevel >= Analyze` AND `confidence >= 0.75`
- On click (Phase 25 not ready): show a clean Toast notification ("Cognitive threshold reached. Architect pipeline pending.") and console.log the payload
- Resets to muted after successful neurogenesis (wired in Phase 25)

### Bloom Eval Suite (EVAL-02, EVAL-03)
- 6 golden cases: 2 Remember/Understand (must score below threshold), 2 Analyze (must score above), 2 Evaluate/Create (must score well above)
- Evaluator output schema: `{ reasoning: string, bloom_level: string, confidence: number }`
- Confidence threshold: 0.75 for button illumination
- JavaScript assertion blocks checking bloom_level accuracy against expected classification
- Eval suite ships BEFORE production code (eval-driven development)

### Claude's Discretion
- Exact Bloom evaluator system prompt wording
- Specific eval case scenarios (topics, user messages)
- Debounce timing for client-side evaluator call
- Exact button placement relative to BloomDepthMeter
- Zustand store shape for bloom state

</decisions>

<canonical_refs>
## Canonical References

- `src/app/api/chat/route.ts` — onFinish callback (where evaluator is NOT placed)
- `src/components/chat/ChatPanel.tsx` — where button and evaluator call will be added
- `src/components/chat/BloomDepthMeter.tsx` — existing Bloom UI component
- `src/lib/ai/providers.ts` — getModelForRole('evaluator')
- `src/lib/ai/tracing.ts` — buildTelemetry helper
- `src/stores/graphStore.ts` — Zustand store pattern
- `prompt-eval/conversationalist/` — eval suite pattern to follow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BloomDepthMeter.tsx` — existing 6-segment Bloom indicator, button should be adjacent
- `buildTelemetry()` from `src/lib/ai/tracing.ts` — wrap evaluator with telemetry
- `getModelForRole('evaluator')` from providers.ts — model resolution
- `classifyBloomLevel()` from `src/lib/bloom/classifyBloomLevel.ts` — existing client-side heuristic (can be replaced or supplemented)

### Established Patterns
- API routes in `src/app/api/` with Supabase auth
- Zustand stores for UI state
- Framer-motion for animations (but keep transitions CSS-only for this)
- promptfoo eval with JavaScript assertion blocks

### Integration Points
- ChatPanel sends debounced POST to /api/bloom-evaluate after each user message
- Zustand bloom state drives button opacity
- Phase 25 will wire the button click to POST /api/architect

</code_context>

<specifics>
## Specific Ideas

- The evaluator must be "silent" — the user should never notice the evaluation happening
- Button illumination should feel like a natural state change, as if the interface is simply responding to the conversation's depth
- Chain-of-thought reasoning is logged to Langfuse but never shown to the user
- Research: gpt-4o-mini has 81% F1 on Bloom classification — Gemini Flash should be comparable or better

</specifics>

<deferred>
## Deferred Ideas

- Evaluating assistant turns (not just user turns) for cognitive demand detection
- Historical bloom_level tracking per conversation in DB
- Confidence threshold auto-tuning based on Langfuse data

</deferred>

---

*Phase: 24-silent-observer*
*Context gathered: 2026-03-25*
