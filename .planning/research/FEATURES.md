# Feature Landscape: Multi-Agent Architecture & LLM Observability

**Domain:** LLM Observability + Multi-Agent Edtech Architecture
**Researched:** 2026-03-25
**Milestone scope:** v2.1 Core Flow Stability — decompose monolith, add Langfuse tracing
**Confidence:** MEDIUM-HIGH (Langfuse official docs HIGH; async UX patterns MEDIUM; edtech-specific multi-agent MEDIUM)

---

## Research Context: What This Milestone Changes

v2.0 shipped a **monolithic chat endpoint**: one stream handles Socratic conversation AND inline Bloom evaluation AND neurogenesis tool-calling AND architect suggestions. This creates four compounding problems:

1. **Observability blindspot** — No trace data means prompt regressions are invisible in production.
2. **Latency coupling** — Bloom evaluation blocks the user-facing response stream.
3. **Prompt contamination** — A single prompt tries to be a tutor, an evaluator, and a curriculum planner simultaneously.
4. **Untestable contracts** — The monolith cannot be eval-tested at the agent boundary because there are no boundaries.

The v2.1 goal is architectural, not feature-adding: make the existing loop observable, decompose it into agents with clean contracts, and let the async evaluator drive UI state rather than block the stream.

---

## 1. LLM Observability (Langfuse)

### Table Stakes

Features that a production Langfuse integration MUST have. Missing any of these means the dashboard is unusable for debugging or cost management.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Trace per user request | One trace = one logical unit of user activity; without this, spans are orphaned and unnavigable | LOW | Set via `functionId` + `metadata.userId` in `experimental_telemetry` |
| Session grouping | Groups traces by conversation; allows replay of a full learning session | LOW | Pass `sessionId` (conversation ID) on every trace |
| Generation spans with model + tokens | Cost and latency visibility impossible without model name + prompt/completion token counts | LOW | AI SDK OpenTelemetry middleware captures this automatically |
| User ID propagation | Required for per-user cost analysis; "who is spending what?" | LOW | Pass `userId` in trace metadata |
| Input/output capture | The entire value of observability is seeing what the LLM was given and what it returned | LOW | AI SDK traces this by default; do not disable |
| Latency per span | P50/P95 latency per agent is the primary bottleneck signal | LOW | Automatic via OpenTelemetry timing |
| Environment tagging | `production` vs `development` traces must be separable | LOW | Pass `tags: [process.env.NODE_ENV]` |

### Differentiators

Features that elevate a basic Langfuse integration into a production-quality observability layer.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Agent-level span naming | "conversationalist", "bloom-evaluator", "architect", "bouncer" — one span per agent makes the dashboard readable | LOW | Set `functionId` per call site, not per route |
| Bloom level as custom metadata | Attach `bloom_level` to the evaluator generation span — enables filtering "all Analyze+ evaluations" | LOW | Add `metadata: { bloom_level }` to evaluator span after result is known |
| Prompt version tagging | When prompts change, version tag makes before/after comparison possible | LOW | Add `metadata: { promptVersion: 'v2.1.0' }` |
| Cost estimation via token math | Langfuse does not auto-estimate cost unless model pricing is configured; missing this makes cost analysis incomplete | MEDIUM | Configure model prices in Langfuse project settings |
| LLM-as-Judge scores via Langfuse API | Attach evaluator scores (bloom_level scores, bouncer pass/fail) as Langfuse `score` objects on the trace | MEDIUM | Requires POST to /api/scores after generation; enables historical eval dashboards |
| Flush before serverless function exits | Vercel cloud functions kill the process after response is sent; unflushed spans are silently lost | LOW | Use Vercel `after()` utility to schedule `langfuseSpanProcessor.flush()` after response |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Tracing every token in a stream | Micro-spans per token create noise without signal; Langfuse is not a per-token debugger | Trace the full generation span (input + output + latency) per LLM call |
| PII in trace payloads | User message content may contain sensitive data; full logging in production is a GDPR risk | Evaluate whether to mask user inputs; at minimum document the data retention policy |
| Disabling input/output capture | Some teams disable this to reduce payload size — it eliminates 80% of the debug value | Keep input/output on; reduce noise via session/user filters instead |
| Custom trace exporter without Vercel `after()` | Synchronous flush blocks response time; async flush without `after()` drops traces on cold exits | Always use `after(async () => await processor.flush())` in serverless |

### Langfuse Data Model for NeuroGraph

Based on official Langfuse documentation (HIGH confidence):

```
Trace: one per user request
  ├── sessionId: conversationId
  ├── userId: supabase user id
  ├── tags: [env, agent_name]
  ├── metadata: { promptVersion }
  │
  ├── Span: "rag-retrieval"          (vector search for relevant neurons)
  ├── Generation: "conversationalist" (main chat response — model, tokens, latency)
  ├── Span: "bloom-evaluation"       (wraps the async evaluator call)
  │     └── Generation: "bloom-eval-generation" (cheap LLM call — gpt-4o-mini)
  │           metadata: { bloom_level, conversation_id }
  └── Score: "bloom_confidence"      (0.0–1.0 attached to bloom-eval-generation)

Separate traces for non-chat agents:
  Trace: "architect-run"
    ├── Generation: "epistemological-inquisitor"
    ├── Generation: "synthesizer"
    └── Span: "rag-prerequisite-search"

  Trace: "bouncer-check"
    └── Generation: "bouncer"
          metadata: { decision: "accept|reject", reason }
```

This maps exactly to Langfuse's recommended structure: one trace per user-visible action, spans for retrieval and orchestration, generations for LLM calls, scores for eval results.

---

## 2. Pure Conversationalist (Stripped /api/chat)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Socratic response only — no tool calls | The chat route should stream text, nothing else; tool-calling in a stream adds latency and complexity that belongs in the evaluator | LOW (remove tools from streamText call) | Already instrumented via Vercel AI SDK `useChat` |
| System prompt focused on tutoring only | Current prompt tries to be tutor + evaluator + curriculum suggester; separation of concerns makes each better | LOW (prompt rewrite) | Split the cognitive work: tutor knows nothing about Bloom thresholds |
| RAG context injection unchanged | The chat agent should still receive relevant neurons as context — this is the personalization layer | LOW | No change required |
| Conversation history pass-through | The tutor needs the full turn history to maintain Socratic coherence | LOW | Already handled by `useChat` messages array |
| Langfuse trace on every call | Non-negotiable for debugging regressions | LOW | See Section 1 |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Reduced model size for conversationalist | With Bloom eval decoupled, the chat model can be cheapened: gpt-4o vs gpt-4o-mini tradeoff is worth exploring | LOW (config change) | Measure quality delta with promptfoo before switching |
| Streaming unblocked by eval | User sees first token while evaluator runs independently — perceived latency drops significantly | LOW (architectural change already separates the two) | Main benefit of decoupling |
| Explicit "I don't know about your curriculum" stance | Tutor should not know about Architect output; clean boundary prevents prompt contamination | LOW (prompt instruction) | Reinforces the multi-agent contract |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Inline Bloom classification in the stream | Puts a classifier call in the hot path; adds 300–800ms to every response | Run Bloom eval as a background POST after the stream completes |
| Neurogenesis suggestion as a streamed tool | Tool calls in the main stream make the conversationalist stateful; removes architectural cleanness | Bloom evaluator fires the neurogenesis signal via separate state channel |
| Session memory summarization in chat | Creates passive ingestion shortcut; user should do extraction work | Keep the 14-day TTL discipline; no AI-generated summaries |

---

## 3. Async Bloom Evaluator (Silent Observer)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Fires after each user message, not during | Background evaluation must not block the stream | MEDIUM | POST to /api/bloom-eval after `onFinish` callback in `useChat` |
| Uses a cheap model | Bloom classification does not require gpt-4o; gpt-4o-mini achieves 81% F1 on this task per MDPI 2024 study | LOW | Cost reduction is significant at scale |
| Returns bloom_level + confidence | The UI needs both the level and a confidence score to decide whether to illuminate the button | LOW | Zod schema: `{ bloom_level, confidence, reasoning }` |
| Langfuse trace on evaluator call | The evaluator is the most cost-sensitive call; tracing it enables "bloom eval cost per user" analysis | LOW | See Section 1 |
| Stores result in React state (Zustand or local) | Frontend needs to hold the bloom_level between renders to drive button state | LOW | Store `{ bloomLevel, confidence, isPending }` |
| Does NOT block the user from typing | Async means the user can keep conversing while eval runs | LOW | Architecture constraint, not feature — enforce at design time |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Illuminated "Generate Neuron" button on Analyze+ | Progressive disclosure driven by cognitive state — only show the action when it makes sense | MEDIUM | Button transitions from dim/disabled to lit/enabled when bloom_level >= Analyze AND confidence >= 0.7 |
| Pending state indicator during eval | Users notice when the button is "thinking" — a brief pulse or shimmer while eval runs prevents confusion | LOW | CSS animation on the button during `isPending: true` |
| Confidence threshold as a UX gate | Don't illuminate the button on LOW confidence eval results — reduces false positive "you're ready" signals | LOW | Threshold tunable; start at 0.7 |
| Bloom level as context for neurogenesis route | Pass the `bloom_level` from the evaluator to the /api/architect call so the Architect knows the cognitive entry point | LOW | Add to POST body |
| Evaluation result visible in Langfuse | Attaching the bloom_level as a Langfuse score enables historical "depth over time" dashboards | MEDIUM | POST score to Langfuse after eval |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Polling for eval result | Polling adds unnecessary requests; the eval completes in 1–3 seconds — a single POST with optimistic state is sufficient | Fire POST, update state on response, no polling loop needed |
| Showing the raw Bloom level label to users | "You are at Analyze level" creates grading anxiety and gaming behavior | Use the button illumination as the implicit signal; Bloom label is internal only |
| Eval on every assistant turn | The evaluator should read user messages, not assistant messages — the user's cognitive state is what matters | Fire evaluator on user message + preceding assistant context, not on assistant response |
| Hard-blocking neurogenesis on eval failure | If the eval POST fails (network error, timeout), the user should not be locked out of neurogenesis | Fall back to showing the button as available; better false positive than blocked user |

### UX Pattern: Async Readiness Signal

Based on research into progressive disclosure and async background job patterns (MEDIUM confidence — no direct edtech precedent found; pattern synthesized from general async UX literature):

**The illuminate-on-readiness pattern:**

```
User sends message
  → Chat stream starts immediately (non-blocking)
  → Background: POST /api/bloom-eval (fire-and-forget from client perspective)

While eval is pending:
  → "Generate Neuron" button: visible but dimmed, shimmer animation
  → State: { bloomLevel: null, isPending: true }

Eval returns (1–3s):
  → If bloom_level >= Analyze AND confidence >= 0.7:
       Button transitions: dimmed → illuminated (CSS transition, 300ms ease)
       State: { bloomLevel: "Analyze", isPending: false, ready: true }
  → If below threshold:
       Button stays dimmed (no animation, no label)
       State: { bloomLevel: "Understand", isPending: false, ready: false }

User clicks illuminated button:
  → Triggers /api/architect with bloom_level context
  → Resets evaluator state for next round
```

This pattern is used in production by tools like Notion AI (which illuminates "Improve writing" only after detecting editable text) and GitHub Copilot (which shows suggestions only when context is sufficient). The principle is: **show the action only when the system has enough confidence the action is meaningful.**

---

## 4. Decoupled Architect Endpoint

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User-triggered POST /api/architect | Neurogenesis is a deliberate user action, not AI-initiated; the endpoint fires only when the user clicks the illuminated button | LOW (route already partially exists) | Remove any auto-trigger logic |
| Accepts bloom_level in request body | Architect should know the cognitive entry point to calibrate curriculum depth | LOW | Add to Zod input schema |
| Runs Synthesizer → RAG → Epistemological Inquisitor in sequence | Established chain; the synthesis step grounds the curriculum in the user's actual insight | MEDIUM (orchestration already exists; needs sequencing contract) | Order matters: synthesize insight first, then infer prerequisites |
| Returns neuron proposal (title + body + prerequisites) | The user must review and confirm before anything writes to the DB | LOW | Existing flow — no change |
| Langfuse traces the full chain | Three LLM calls in one route = three generations in one trace | LOW | Wrap entire route in a Langfuse trace, add sub-spans per agent |
| Graceful error handling | If any step fails, return a partial result with a clear error; do not 500 | MEDIUM | Wrap each agent call in try/catch, return what succeeded |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bloom-calibrated Synthesizer prompt | If user is at Create level, Synthesizer asks for a novel combination; if at Analyze, asks for pattern identification | LOW (prompt switch based on bloom_level) | Two prompt variants, same contract |
| Prerequisite inference uses conversation as context | The Epistemological Inquisitor should receive the last N turns as context, not just the proposed neuron title | MEDIUM | Improves prerequisite accuracy — existing inferPrerequisites call only gets the title |
| Idempotency via conversation_id | If user clicks the button twice quickly, deduplicate the request server-side | LOW | Check conversation_id + recent timestamp before firing |
| Conversation excerpt in Langfuse trace | Attach the last 3 turns as metadata on the architect trace — makes debugging prerequisite inference much easier | LOW | Add to trace metadata |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI-initiated neurogenesis | AI auto-creating nodes violates the core "Active Extraction" value proposition | User must always click; the evaluator only illuminates the button, never clicks it |
| Auto-writing to the knowledge graph without review | Trust is broken if the graph fills with AI-generated content the user didn't consciously confirm | Always require the review/confirm step before DB write |
| Architect endpoint as a streaming route | The architect chain is synchronous by design — three sequential LLM calls; streaming adds complexity without UX benefit | Return JSON when the full chain completes |
| Triggering Architect from chat (inline) | Chat stream should have no side effects; neurogenesis via chat conflates the tutor and architect roles | Keep the explicit button → POST /api/architect flow |

---

## 5. Feature Dependencies

```
Langfuse observability
  → required by: ALL agents (no conditional dependency; add to every call site)
  → needs: instrumentation.ts OpenTelemetry setup (new file)
  → needs: LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY env vars
  → blocks nothing (additive instrumentation)

Pure Conversationalist
  → requires: Bloom evaluator decoupled (cannot strip tools from chat until eval is elsewhere)
  → enhances: Langfuse tracing (cleaner span = conversationalist generation only)

Async Bloom Evaluator
  → requires: new POST /api/bloom-eval route (new)
  → requires: Zustand store update or React state for { bloomLevel, isPending, ready }
  → enhances: Architect endpoint (passes bloom_level as context)
  → blocks: "Generate Neuron" button illumination

Decoupled Architect Endpoint
  → requires: Async Bloom Evaluator (needs bloom_level input)
  → requires: /api/architect POST route hardened with Langfuse tracing
  → requires: Conversationalist stripped (chat no longer triggers neurogenesis)
  → depends on: existing Synthesizer + RAG + Epistemological Inquisitor chain (already built)

Build order:
  1. Langfuse instrumentation.ts (no dependencies, additive)
  2. Pure Conversationalist (strip tools, update prompt)
  3. Async Bloom Evaluator route + frontend state
  4. Decoupled Architect endpoint + button wiring
```

---

## 6. Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Langfuse trace on every LLM call | HIGH (debugging, cost visibility) | LOW (OpenTelemetry middleware) | P1 |
| Strip tool-calling from /api/chat | HIGH (latency reduction, clean contract) | LOW (remove tools array from streamText) | P1 |
| POST /api/bloom-eval async route | HIGH (unblocks streaming, separates concerns) | MEDIUM (new route + Zod schema + cheap LLM call) | P1 |
| "Generate Neuron" button illumination | HIGH (core UX feedback loop) | MEDIUM (Zustand state + CSS transition) | P1 |
| Langfuse session + userId propagation | MEDIUM (per-user cost analysis) | LOW (metadata fields) | P1 |
| Architect endpoint Langfuse tracing | MEDIUM (debug prerequisite inference) | LOW (wrap existing route) | P2 |
| Bloom-calibrated Architect prompt variants | MEDIUM (curriculum quality) | LOW (two prompt variants) | P2 |
| LLM-as-Judge scores via Langfuse API | MEDIUM (historical eval dashboards) | MEDIUM (POST to /api/scores) | P2 |
| Conversation context in prerequisite inference | MEDIUM (prerequisite accuracy) | MEDIUM (pass last N turns to Inquisitor) | P2 |
| Pending shimmer animation on button | LOW (polish) | LOW (CSS only) | P3 |
| Cost estimation in Langfuse dashboard | LOW (nice to have) | LOW (configure model prices) | P3 |

**Priority key:**
- P1: Must have — this is the milestone definition
- P2: Should have — adds meaningful quality without scope risk
- P3: Nice to have — defer if velocity slows

---

## 7. Competitor/Reference Analysis

There is no direct competitor using this exact stack combination. Reference patterns from adjacent domains:

| Feature | How Others Do It | NeuroGraph Approach |
|---------|-----------------|---------------------|
| LLM observability | Datadog APM (expensive), Helicone (limited), LangSmith (OpenAI-centric) | Langfuse (open source, self-hostable, framework-agnostic) — strongest option for Next.js + multi-model |
| Async cognitive evaluation | No edtech product found using async background Bloom eval; Khanmigo is fully synchronous | Novel: async eval on every user turn, illuminate UI on confidence threshold |
| Multi-agent chat decomposition | LangChain agent executors (heavy), CrewAI (Python), OpenAI Agents SDK (new, March 2025) | Direct function calls + Vercel AI SDK — avoid orchestration frameworks that add latency and opacity |
| User-initiated knowledge creation | Roam Research: manual; Notion AI: AI-suggested but auto-inserts; Obsidian: manual | Hybrid: AI detects readiness, user initiates creation — the highest-friction, highest-quality model |

---

## Sources

- [Langfuse Observability Concepts — Official Docs](https://langfuse.com/docs/observability/data-model) — HIGH confidence
- [Langfuse Vercel AI SDK Integration — Official Docs](https://langfuse.com/integrations/frameworks/vercel-ai-sdk) — HIGH confidence
- [Langfuse Sessions — Official Docs](https://langfuse.com/docs/observability/features/sessions) — HIGH confidence
- [Langfuse Metadata — Official Docs](https://langfuse.com/docs/observability/features/metadata) — HIGH confidence
- [Langfuse Next.js + Vercel AI SDK Example — GitHub](https://github.com/langfuse/langfuse-vercel-ai-nextjs-example) — HIGH confidence
- [AI SDK 6 Release — Vercel Blog](https://vercel.com/blog/ai-sdk-6) — HIGH confidence (useChat Zustand decoupling confirmed)
- [Vercel AI SDK Langfuse Observability Integration](https://ai-sdk.dev/providers/observability/langfuse) — HIGH confidence (official AI SDK docs)
- [UI Patterns for Async Workflows — LogRocket](https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines) — MEDIUM confidence
- [LLM Observability Best Practices 2025 — Maxim AI](https://www.getmaxim.ai/articles/llm-observability-best-practices-for-2025/) — MEDIUM confidence
- [Progressive Disclosure — AI UX Design Patterns](https://www.aiuxdesign.guide/patterns/progressive-disclosure) — MEDIUM confidence
- [Multi-Agent Architecture Patterns — Google Developers Blog](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/) — MEDIUM confidence
- [The Multi-Agent Trap — Towards Data Science](https://towardsdatascience.com/the-multi-agent-trap/) — MEDIUM confidence (warning: multi-agent complexity amplifies errors 17x without structured contracts)
- [Learning Analytics with Bloom's Taxonomy Labeling — MDPI Computers 2024](https://www.mdpi.com/2073-431X/14/12/555) — HIGH confidence (gpt-4o-mini achieves 81% F1 on Bloom classification)
- [Granular LLM Monitoring per User and Feature — Traceloop](https://www.traceloop.com/blog/granular-llm-monitoring-for-tracking-token-usage-and-latency-per-user-and-feature) — MEDIUM confidence

---
*Feature research for: v2.1 Multi-Agent Architecture & LLM Observability (NeuroGraph)*
*Researched: 2026-03-25*
