# Phase 22: Observability Foundation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Instrument all AI call sites with Langfuse Cloud OpenTelemetry tracing. Every streamText/generateObject call emits a named, session-correlated span with RAG context metadata. No AI logic changes — pure observability infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Langfuse Integration Pattern
- Use `@langfuse/otel@5.0.1` + `@langfuse/tracing@5.0.1` + `@opentelemetry/sdk-node` — the 3-package official stack
- Create `src/instrumentation.ts` with `NodeTracerProvider` + `LangfuseSpanProcessor` with `immediateExport: true` (Next.js 14 does not have `after()`)
- Add `experimental_telemetry: { isEnabled: true }` to every `streamText` and `generateObject` call
- Langfuse Cloud (not self-hosted) — env vars: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASEURL`
- No edge runtime detected in any route — no migration needed

### AI Call Sites to Instrument (8 total)
- `src/app/api/chat/route.ts` — streamText (Conversationalist)
- `src/app/api/architect/route.ts` — generateObject (Architect)
- `src/app/api/neurons/extract/route.ts` — generateObject (Neurons Extract)
- `src/app/api/neurons/ai-action/route.ts` — streamText (AI Action)
- `src/app/api/neurons/curriculum/route.ts` — generateObject (Curriculum)
- `src/app/api/neurons/[id]/synthesize/route.ts` — generateObject/streamText (Synthesize)
- `src/lib/ai/inferPrerequisites.ts` — generateObject (Inquisitor)
- `src/lib/crystallize/seed.ts` — generateObject/streamText (Crystallize Seed)

### Span Naming & Correlation
- Each call site gets a `functionId` in experimental_telemetry metadata identifying the agent name
- Pass `conversationId` and `userId` as metadata for session/user correlation
- RAG context (retrieved neurons, vector results) logged as custom span attributes

### Claude's Discretion
- Exact OTel span attribute naming conventions
- Whether to create a shared `tracing.ts` helper for common metadata injection vs inline at each call site
- Log level for trace debugging during development

</decisions>

<canonical_refs>
## Canonical References

- `src/lib/ai/providers.ts` — getModelForRole, model resolution
- `src/app/api/chat/route.ts` — streamText call site
- `src/app/api/architect/route.ts` — generateObject call site
- `src/lib/ai/inferPrerequisites.ts` — generateObject call site
- `.planning/research/STACK.md` — Langfuse v5 integration patterns
- `.planning/research/ARCHITECTURE.md` — OTel setup architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getModelForRole` in providers.ts already handles model resolution — telemetry wraps around it
- Existing `maxRetries` and `AbortSignal.timeout` patterns from Phase 18 — telemetry is additive

### Established Patterns
- Route handlers use try/catch with JSON error responses
- `console.warn` for non-fatal, `console.error` for fatal
- All AI calls already go through Vercel AI SDK v6 (`streamText`, `generateObject`)

### Integration Points
- `src/instrumentation.ts` is the Next.js instrumentation entry point (auto-loaded by Next.js)
- Each route handler's AI call needs `experimental_telemetry` added to its options object

</code_context>

<specifics>
## Specific Ideas

- Research: Known issue #12643 — trace-level I/O appears empty in Traces tab but data IS in Observations tab. Use `immediateExport: true` as workaround.
- Research: `langfuse-vercel` package is DEPRECATED — use the OTel-native stack instead
- The user explicitly chose Langfuse Cloud, not self-hosted

</specifics>

<deferred>
## Deferred Ideas

- Custom Langfuse dashboards/alerts
- Trace-level cost tracking per user
- PII masking functions for user message content

</deferred>

---

*Phase: 22-observability-foundation*
*Context gathered: 2026-03-25*
