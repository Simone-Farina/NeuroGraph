# Project Research Summary

**Project:** NeuroGraph v2.1 — Multi-Agent Architecture & LLM Observability
**Domain:** Cognitive MicroSaaS / Graph-based Knowledge Management
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

NeuroGraph v2.1 is an architectural refactor milestone, not a feature-adding one. The existing monolithic `/api/chat` endpoint conflates four distinct responsibilities — Socratic tutoring, Bloom cognitive evaluation, neurogenesis triggering, and architect suggestions — into a single streaming handler. This coupling makes latency optimization impossible, prompt engineering fragile, agent contracts untestable, and production debugging blind. The research consensus is clear: decompose the monolith into a pure conversationalist, a silent async observer, and a sequenced architect pipeline, then layer Langfuse OpenTelemetry observability across all three.

The recommended technical approach uses three new packages (`@langfuse/otel@5.0.1`, `@langfuse/tracing@5.0.1`, `@opentelemetry/sdk-node@^0.214.0`) initialized once in `instrumentation.ts` at the project root, with `experimental_telemetry` opted in per AI SDK call site. The async Bloom evaluator runs as a fire-and-forget unawaited Promise inside the `streamText` `onFinish` callback — no new API route, no queue infrastructure, no Next.js upgrade required. Gemini 2.5 Flash is the correct model for the evaluator role (~2x cheaper than GPT-4o-mini, comparable quality on 6-class Bloom classification).

The primary risks are infrastructure-level, not product-level: Langfuse traces are silently dropped on Vercel unless explicitly flushed (use `immediateExport: true` for Next.js 14 compatibility since `after()` requires Next.js 15+); the Edge runtime is incompatible with Langfuse's Node.js SDK; and the removal of `suggest_neurogenesis` tool calls from the chat endpoint will break persisted message rehydration for existing sessions unless a migration script runs first. The evaluator's Bloom classification boundary (Understand vs Analyze) is inherently ambiguous — the evaluator should function as a UI hint layer with a 0.75 confidence threshold gate, not as the authoritative Bloom decision (that responsibility stays with the Bouncer).

---

## Key Findings

### Recommended Stack

The v2.1 stack is additive — no existing packages are removed. All three new Langfuse packages must be installed together and kept at matching versions (`@langfuse/otel` and `@langfuse/tracing` must share the same major.minor). The `langfuse-vercel` package (deprecated August 2025) and `@vercel/otel` (incompatible with OTel JS SDK v2) must be avoided explicitly. There is a known active issue (#12643) in `ai@6.0.82` + `@langfuse/otel@5.0.1` where trace-level input/output appears empty in the Langfuse Traces tab — data is correctly visible in the Observations tab; severity is LOW.

**Core technologies (new for v2.1):**
- `@langfuse/otel@5.0.1`: `LangfuseSpanProcessor` — the bridge between AI SDK OpenTelemetry spans and Langfuse — required because `langfuse-vercel` is deprecated
- `@langfuse/tracing@5.0.1`: `observe()` wrapper for RAG retrieval and custom span enrichment — required for logging what context the model actually received
- `@opentelemetry/sdk-node@^0.214.0`: `NodeTracerProvider` bootstrapper — required peer dependency; initialized once in `instrumentation.ts`, never in route handlers
- `google:gemini-2.5-flash`: evaluator model — GA March 2026, ~$0.075/$0.30 per 1M tokens, best price-performance for high-volume background Bloom classification
- **No new packages** for multi-agent decomposition or async evaluation — both are architectural patterns on existing infrastructure

**Critical version constraints:**
- `@langfuse/otel` v5 requires OTel JS SDK v2 — do not mix with `@vercel/otel`
- The project is on Next.js 14.2.35 — `after()` from `next/server` is Next.js 15+ only; use `immediateExport: true` flush pattern instead
- `@langfuse/otel@5.0.1` + `@ai-sdk/google@^3.0.26` + `gemini-2.5-flash` model string is a verified compatible combination

### Expected Features

**Must have (P1 — milestone definition):**
- Langfuse trace on every LLM call (chat, bloom evaluator, architect) — without this the milestone has no observability value
- Strip tool-calling from `/api/chat` — removes the `suggest_neurogenesis` tool; converts the chat agent to a pure text streamer
- Background Bloom evaluation via `onFinish` unawaited Promise — async observer, fires after each user message without blocking the stream
- "Generate Neuron" button illuminated by `bloomLevel` Zustand state — replaces tool-call event as the neurogenesis trigger
- Session + userId propagation in all Langfuse traces — required for per-user cost analysis and GDPR erasure

**Should have (P2 — quality without scope risk):**
- Architect endpoint Langfuse tracing with 3-step pipeline (Synthesizer → RAG → Inquisitor) — trace each step independently
- Bloom-calibrated Architect prompt variants (two variants based on `bloom_level` input)
- LLM-as-Judge scores posted to Langfuse via `/api/scores` — enables historical eval dashboards
- Conversation context passed to Epistemological Inquisitor for better prerequisite inference

**Defer (P3 / v2.2+):**
- Pending shimmer animation on the Generate Neuron button during eval — CSS polish, not substance
- Cost estimation configuration in Langfuse dashboard — nice to have, not blocking
- Evaluation debouncing at scale (every 3rd message) — premature optimization for current user volume
- Replace LLM Bloom evaluator with fine-tuned embedding classifier — relevant at 10k+ users only

### Architecture Approach

The refactored architecture introduces a clean three-endpoint model with a shared observability layer. A single `LangfuseSpanProcessor` initialized in `instrumentation.ts` captures all AI SDK spans without per-route initialization. The async evaluator uses a fire-and-forget unawaited Promise inside `streamText`'s `onFinish` callback — this avoids the extra auth round-trip of a separate API route and stays within the existing request lifecycle for Next.js 14. Two new files (`instrumentation.ts` at project root, `src/lib/ai/tracing.ts` as a `buildTelemetry()` factory) handle all observability concerns. Zustand `graphStore` gains `bloomLevel` + `setBloomLevel()` to decouple neurogenesis triggering from tool-call events.

**Major components:**
1. `/api/chat` (MODIFY) — pure `streamText`, no tools, `experimental_telemetry` wrapped, `immediateExport` flush; fires Bloom evaluation in `onFinish`
2. `runBloomEvaluation()` (NEW, server-side function) — `generateObject` with cheap model, `maxRetries: 0`, 15s timeout; writes to DB or conversation metadata; failure is graceful
3. `/api/architect` (MODIFY) — 3-step sequential pipeline with independent telemetry per step; returns JSON when full chain completes; never streams
4. `instrumentation.ts` (NEW) — single `NodeTracerProvider` + `LangfuseSpanProcessor` with `immediateExport: true`; loaded by Next.js on server startup automatically
5. `src/lib/ai/tracing.ts` (NEW) — `buildTelemetry()` factory; re-exports `langfuseProcessor` for routes that call `forceFlush()` directly
6. `src/stores/graphStore.ts` (MODIFY) — `bloomLevel: BloomLevel | null` field; `GenerateNeuronButton` subscribes to this instead of reacting to tool-call events

### Critical Pitfalls

1. **Langfuse traces silently dropped on Vercel** — The async batch flush does not complete before serverless function termination. Use `immediateExport: true` in `LangfuseSpanProcessor` for Next.js 14. Do NOT use `after()` — it requires Next.js 15.1. Alternatively, `waitUntil()` from `@vercel/functions` works on Next.js 14 if already deployed on Vercel.

2. **Edge runtime incompatibility with Langfuse Node.js SDK** — Any route with `runtime = 'edge'` that receives Langfuse instrumentation will silently lose all traces. Audit all routes before instrumenting; convert `/api/chat` to Node.js runtime if it has an edge declaration.

3. **Tool call removal breaking persisted message rehydration** — Existing Supabase sessions contain `tool-call` and `tool-result` role messages from `suggest_neurogenesis`. Removing the tool without a migration script causes `useChat` to fail or corrupt message arrays on session load. Write and run the DB migration before the Pure Conversationalist goes live in production.

4. **Silent Observer race condition** — Two evaluator calls in flight simultaneously (user sends rapid follow-up messages) can apply stale `bloom_level` to the button state. Use message sequence number versioning to discard out-of-order evaluator responses, or implement a per-session evaluator lock with AbortController cancellation.

5. **Bloom classification boundary collapse** — Cheap models (Gemini Flash, GPT-4o-mini) misclassify at the Understand/Analyze boundary — exactly where NeuroGraph's gate lives. The evaluator is a UI hint layer only; enforce a 0.75 confidence threshold before illuminating the button. The Bouncer remains the authoritative gate. Calibrate against the 31 golden eval cases before wiring to UI state.

6. **Prompt drift eroding agent contracts** — Model provider silent updates + accumulated prompt edits compound to shift agent behavior without triggering errors. Run promptfoo eval suite on every prompt change in CI. Version all prompts semantically. Log Bloom level distribution in production to detect drift before users report it.

---

## Implications for Roadmap

Based on the dependency graph derived from FEATURES.md Section 5, the build order is strictly constrained. Each phase unblocks the next; parallel execution is only safe within a phase.

### Phase 1: Observability Foundation
**Rationale:** Langfuse instrumentation has zero dependencies and is purely additive. All subsequent work is easier to debug and validate once traces are flowing. This must come first — adding tracing after agent decomposition means retroactively instrumenting code under active change, which is error-prone.
**Delivers:** Full trace visibility across all existing AI calls (chat, architect, bouncer, neurons extract) before any logic changes.
**Addresses:** P1 — Langfuse trace on every LLM call; P1 — session + userId propagation
**Avoids:** Pitfall 11 (trace loss) — configure `immediateExport: true` from day one; Pitfall 12 (Edge runtime) — audit before writing a line of tracing code; Pitfall 13 (PII) — decide self-host vs Cloud with masking before first trace is sent

### Phase 2: Pure Conversationalist
**Rationale:** Cannot strip tools from the chat endpoint until the Bloom evaluator is ready to replace the signal those tools provided. But the tool removal and the DB migration are prerequisites for Phase 3 — the async evaluator cannot launch until the old tool-call message structure is cleaned up in production sessions.
**Delivers:** `/api/chat` as a pure text streamer; no tool-call metadata in new messages; DB migration for existing sessions; updated `CHAT_SYSTEM_PROMPT` without Neurogenesis Policy
**Addresses:** P1 — Strip tool-calling from chat; P2 — Streaming unblocked by eval (latency reduction)
**Avoids:** Pitfall 15 (tool call removal breaking rehydration) — migration scripts must be written and tested before deployment; Anti-Pattern 3 (keeping tool defined but prompt-instructed to ignore it)

### Phase 3: Silent Observer (Async Bloom Evaluator)
**Rationale:** Depends on Phase 2 (chat must be tool-free before the evaluator can take over the neurogenesis signal) and Phase 1 (observability must exist to calibrate and debug evaluator quality). The evaluator introduces the most novel technical risk (race conditions, cheap LLM calibration) so it earns its own phase.
**Delivers:** `runBloomEvaluation()` function in `onFinish`; `bloomLevel` in Zustand; "Generate Neuron" button lit by bloom state; confidence threshold gate at 0.75
**Addresses:** P1 — async Bloom evaluation; P1 — button illumination; P2 — Bloom level as context for architect calls
**Avoids:** Pitfall 14 (race condition) — sequence number versioning built in from the start; Pitfall 16 (cheap LLM reliability) — calibrate against golden cases before wiring to UI; Anti-Pattern 2 (blocking chat on eval)

### Phase 4: Decoupled Architect Pipeline
**Rationale:** The architect endpoint is user-triggered, not on the hot path, and depends on the evaluator's `bloom_level` output (Phase 3). The 3-step Synthesizer → RAG → Inquisitor pipeline restructure is the highest-latency change (~2s to ~8s) but delivers the highest DAG quality. It should land last in the milestone, after the interactive path is proven stable.
**Delivers:** 3-step architect pipeline with independent Langfuse spans per step; `bloom_level` input to Synthesizer; prerequisite inference with conversation context; idempotency via `conversation_id`
**Addresses:** P2 — Architect endpoint Langfuse tracing; P2 — Bloom-calibrated prompt variants; P2 — Conversation context in prerequisite inference
**Avoids:** Pitfall 3 (DAG prerequisite hallucination) — each step traced independently for debugging; Anti-Pattern (streaming architect) — return JSON when full chain completes

### Phase Ordering Rationale

- Observability before logic changes: Phase 1 ensures every refactor in Phases 2-4 is debuggable from day one; tracing the code you are about to change is far easier than retroactive instrumentation
- Migration before cutover: Phase 2's DB migration for tool-call messages is a hard prerequisite for Phase 3 — if skipped, existing user sessions break on the Phase 3 deploy
- Calibrate before wiring: Phase 3 requires Bloom evaluator calibration against the golden eval suite before the button is wired to UI state — this is a quality gate, not a technical constraint
- Architect last: Phase 4 has the highest latency and complexity; it should land after the interactive path (Phases 1-3) is confirmed stable in production

### Research Flags

Phases needing deeper research during planning:
- **Phase 1:** Self-host vs Langfuse Cloud decision — involves GDPR compliance for an edtech product with EU users. Self-hosting Langfuse on Railway/Fly.io is the recommended default; Langfuse Cloud with `mask` function is viable but requires a DPA and explicit GDPR consent infrastructure. This decision must be made before the first trace is sent.
- **Phase 3:** Evaluator calibration — run the 31 promptfoo golden cases through `gemini-2.5-flash` for Bloom classification before the phase begins. If false positive rate at the Understand/Analyze boundary exceeds 20%, the confidence threshold or model choice needs adjustment before wiring to production UI.

Phases with standard patterns (skip deeper research-phase):
- **Phase 1 (instrumentation):** Pattern is fully documented in official Langfuse + Next.js docs; `immediateExport: true` is the known-correct flush pattern for Next.js 14.
- **Phase 2 (chat refactor):** Removing tools from `streamText` is a one-line change; the complex part is the DB migration which follows standard Supabase migration patterns.
- **Phase 4 (architect pipeline):** Sequential `generateObject` chaining is a well-documented pattern; the 3-step structure is already partially built in the existing codebase.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All three new packages verified on npm as of 2026-03-25; version compatibility confirmed against official changelogs; known issue #12643 documented and scoped as LOW severity |
| Features | HIGH (Langfuse) / MEDIUM (async UX) | Langfuse data model derived from official docs; illuminate-on-readiness UX pattern synthesized from general async UX literature with no direct edtech precedent found |
| Architecture | HIGH | Derived from direct codebase audit + official Next.js and Langfuse docs; `instrumentation.ts` pattern and `immediateExport` flush strategy verified; component responsibilities confirmed against existing route files |
| Pitfalls | MEDIUM-HIGH | Pitfalls 11-16 (v2.1 specific) verified against official docs and community sources; Pitfall 14 (race condition) and Pitfall 16 (cheap LLM calibration) are medium-confidence inferences from adjacent research |

**Overall confidence:** HIGH

### Gaps to Address

- **Langfuse self-host vs Cloud:** Both options are viable — this is a product/compliance decision, not a technical research gap. It must be made before Phase 1 begins and affects environment variable configuration, GDPR posture, and operational burden.
- **Evaluator calibration baseline:** The false positive rate of `gemini-2.5-flash` at the Understand/Analyze Bloom boundary for NeuroGraph's actual user message distribution is unknown. The 81% F1 figure from MDPI 2024 is from generic academic text. A 30-minute calibration run against the existing 31 golden cases is needed before Phase 3 ships.
- **`@langfuse/otel` issue #12643:** Trace-level input/output appears empty in the Langfuse Traces tab with `ai@6.0.82`. Monitor the `@langfuse/otel` 5.x changelog; a patch may arrive before this milestone completes. Data is present in the Observations tab as a workaround.
- **Next.js version path:** Research is unambiguous that `after()` requires Next.js 15.1+. If a Next.js upgrade milestone is planned adjacent to v2.1, the `immediateExport: true` pattern should be treated as temporary and replaced with `after()` post-upgrade.

---

## Sources

### Primary (HIGH confidence)
- [Langfuse Vercel AI SDK Integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk) — OTEL setup, `experimental_telemetry` API, deprecated packages
- [Vercel AI SDK Observability: Langfuse](https://ai-sdk.dev/providers/observability/langfuse) — `experimental_telemetry` surface, flush patterns
- [Langfuse TypeScript Instrumentation docs](https://langfuse.com/docs/observability/sdk/typescript/instrumentation) — `instrumentation.ts` pattern, `forceFlush()` usage
- [Langfuse Sessions](https://langfuse.com/docs/observability/features/sessions) — session grouping, userId propagation
- [Next.js `after()` API Reference](https://nextjs.org/docs/app/api-reference/functions/after) — confirms Next.js 15.1+ requirement
- [@langfuse/otel on npm](https://www.npmjs.com/package/@langfuse/otel) — v5.0.1 confirmed March 2026
- [Gemini 2.5 Flash GA on Vertex AI](https://cloud.google.com/blog/products/ai-machine-learning/gemini-2-5-flash-lite-flash-pro-ga-vertex-ai) — model availability and pricing
- [Learning Analytics with Bloom's Taxonomy Labeling — MDPI Computers 2024](https://www.mdpi.com/2073-431X/14/12/555) — gpt-4o-mini 81% F1 on Bloom classification
- Direct codebase audit: `/api/chat/route.ts`, `/api/architect/route.ts`, `src/lib/ai/providers.ts`, `src/lib/ai/prompts.ts`, `src/stores/graphStore.ts`

### Secondary (MEDIUM confidence)
- [Langfuse JS SDK v4 Announcement — GitHub discussions](https://github.com/orgs/langfuse/discussions/8403) — OTEL JS SDK v2 base, `@vercel/otel` incompatibility
- [Multi-Agent Architecture Patterns — Google Developers Blog](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/) — multi-agent decomposition patterns
- [The Multi-Agent Trap — Towards Data Science](https://towardsdatascience.com/the-multi-agent-trap/) — multi-agent complexity amplifies errors 17x without structured contracts
- [UI Patterns for Async Workflows — LogRocket](https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines) — illuminate-on-readiness UX pattern
- [LLM Observability Best Practices 2025 — Maxim AI](https://www.getmaxim.ai/articles/llm-observability-best-practices-for-2025/) — trace structure recommendations
- [Next.js fire-and-forget discussion](https://github.com/vercel/next.js/discussions/14077) — background work patterns in Next.js 14
- [Granular LLM Monitoring — Traceloop](https://www.traceloop.com/blog/granular-llm-monitoring-for-tracking-token-usage-and-latency-per-user-and-feature) — per-user cost analysis patterns

### Known Issues
- [AI SDK v6 + Langfuse v5: Trace input/output empty — Issue #12643](https://github.com/langfuse/langfuse/issues/12643) — active as of March 2026; data present in Observations tab; monitor for patch

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
