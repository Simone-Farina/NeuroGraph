# Phase 18: AI Reliability - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden every AI call site with timeouts, retries, typed error handling, and non-fatal post-insert degradation. No prompt changes — this is infrastructure resilience only.

</domain>

<decisions>
## Implementation Decisions

### AI Call Site Hardening
- All `generateObject` calls get `maxRetries: 2` and `AbortSignal.timeout(25000)` (25s)
- All `streamText` calls get an `onError` callback that logs structured errors and surfaces a visible error state to the user
- Error type discrimination uses `NoObjectGeneratedError.isInstance()` and `APICallError` — SDK-provided type guards, not instanceof
- Call sites affected: `/api/architect`, `/api/neurons/extract`, `/api/neurons/curriculum`, `/api/neurons/ai-action`, `/api/chat`, `inferPrerequisites.ts`

### Neurons Route Post-Insert Resilience
- Return 201 with neuron + empty enrichment when post-insert operations fail — the neuron was successfully created
- Vector search failure → skip prerequisite inference, return neuron as orphan
- Single try/catch around all post-insert operations (vector search → inferPrerequisites → ghostNodes), all non-fatal
- The existing try/catch around the Phase 2 prerequisite inference block is already partially doing this — extend to cover vector search too

### Claude's Discretion
- Exact error message wording for user-facing error states
- Whether to add a shared `safeGenerateObject` wrapper vs inline at each call site
- Log format for structured error entries

</decisions>

<canonical_refs>
## Canonical References

### AI call sites
- `src/app/api/chat/route.ts` — `streamText` (line 193), no `onError`
- `src/app/api/architect/route.ts` — `generateObject` (line 37), no timeout/retry
- `src/app/api/neurons/extract/route.ts` — `generateObject` (line 52)
- `src/app/api/neurons/curriculum/route.ts` — `generateObject` (line 86)
- `src/app/api/neurons/ai-action/route.ts` — `streamText` (line 76)
- `src/lib/ai/inferPrerequisites.ts` — `generateObject` (line 45)

### Neurons route
- `src/app/api/neurons/route.ts` — POST handler, post-insert operations (lines 157-224)

### Research
- `.planning/research/STACK.md` — AI SDK v6 hardening patterns
- `.planning/research/ARCHITECTURE.md` — Error handling architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing try/catch around inferPrerequisites in neurons/route.ts — extend pattern
- `getModelForRole` in providers.ts — already handles provider resolution

### Established Patterns
- Route handlers use try/catch with JSON error responses
- `console.warn` for non-fatal, `console.error` for fatal

### Integration Points
- 6 AI call sites across 5 route files + 1 lib file
- neurons/route.ts post-insert block needs restructuring

</code_context>

<specifics>
## Specific Ideas

- Research found: "A single provider timeout produces an opaque 500 with no logs"
- Research found: "streamText errors are NOT thrown to outer try/catch — they silently swallow"
- The neurons route critical bug: returns 500 to client after neuron is already successfully inserted

</specifics>

<deferred>
## Deferred Ideas

- Supabase RPC retry helper (deferred to later)
- Connection pooling/timeout configuration
- `experimental_repairText` for partial response recovery

</deferred>

---

*Phase: 18-ai-reliability*
*Context gathered: 2026-03-24*
