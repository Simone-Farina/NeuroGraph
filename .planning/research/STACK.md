# Stack Research

**Domain:** Cognitive MicroSaaS / Graph-based Knowledge Management
**Researched:** 2026-03-21 (updated 2026-03-22 for v1.1 Staging Area milestone; updated 2026-03-24 for v2.0 MVP Core Stability — production hardening; updated 2026-03-25 for v2.1 Multi-Agent Architecture & Observability)
**Confidence:** HIGH

---

## v2.1 Multi-Agent Architecture & Observability (2026-03-25)

This section covers **new dependencies and integration patterns** for:
1. Langfuse LLM observability (tracing all agent calls)
2. Async Bloom Evaluator (background cheap-LLM cognitive state detection)
3. Decoupled Architect endpoint (no new packages needed — architecture change only)

All version numbers verified against npm registry as of 2026-03-25.

---

### New Dependencies Required

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@langfuse/otel` | `^5.0.1` | `LangfuseSpanProcessor` — receives OTel spans from AI SDK and exports them to Langfuse | Current GA package (v5.0.1 published March 2026). The old `langfuse-vercel` package is explicitly deprecated. `@vercel/otel` is incompatible (does not support OTel JS SDK v2). |
| `@langfuse/tracing` | `^5.0.1` | `observe()` wrapper for adding user IDs, session metadata, and custom attributes to spans | Required for RAG context logging and enriching auto-generated spans from `experimental_telemetry`. Must be kept at same major.minor as `@langfuse/otel`. |
| `@opentelemetry/sdk-node` | `^0.214.0` | `NodeTracerProvider` — bootstraps the OTel pipeline and registers `LangfuseSpanProcessor` | Required peer of `@langfuse/otel`. Must be initialized before any `streamText`/`generateObject` call. |

**No new packages for multi-agent or async evaluation.** The existing `@ai-sdk/google` and `@ai-sdk/openai` providers already support the `evaluator` role. Async execution uses a pattern described below.

---

### Installation

```bash
# All three required together — Langfuse observability stack
npm install @langfuse/otel @langfuse/tracing @opentelemetry/sdk-node
```

No dev-only observability dependencies are needed. Traces are sent in both production and development environments.

---

### Integration Pattern 1: OTel Initialization (`src/instrumentation.ts`)

Create `src/instrumentation.ts` at the project root. Next.js 14 automatically loads this file once on server startup before any route handler runs (no config needed — it is a Next.js convention).

```typescript
// src/instrumentation.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

// Export the processor so route handlers can call forceFlush() directly
export const langfuseProcessor = new LangfuseSpanProcessor({
  // Suppress internal Next.js infrastructure spans (reduces noise in Langfuse dashboard)
  shouldExport: (span) => !span.name.startsWith('next.'),
});

export async function register() {
  // Only run on Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const provider = new NodeTracerProvider({
      spanProcessors: [langfuseProcessor],
    });
    provider.register();
  }
}
```

Required environment variables:
- `LANGFUSE_PUBLIC_KEY` — from Langfuse project settings
- `LANGFUSE_SECRET_KEY` — from Langfuse project settings
- `LANGFUSE_BASEURL` — omit to use Langfuse Cloud (`https://cloud.langfuse.com`)

---

### Integration Pattern 2: Enabling Telemetry on AI SDK Calls

Add `experimental_telemetry` to every `streamText` and `generateObject` call. The `LangfuseSpanProcessor` automatically captures the spans.

**In `/api/chat/route.ts`:**

```typescript
const response = streamText({
  model,
  system: systemPrompt,
  messages: modelMessages,
  tools: { suggest_neurogenesis: suggestNeurogenesisTool },
  experimental_telemetry: {
    isEnabled: true,
    metadata: {
      userId: user.id,
      conversationId,
    },
  },
  maxRetries: 1,
  abortSignal: AbortSignal.timeout(60_000),
  onError: ({ error }) => {
    console.error('[chat/stream] Provider error during stream:', error);
  },
  onFinish: async (event) => {
    // ... existing DB persistence unchanged
  },
});
```

**In `/api/architect/route.ts`:**

```typescript
const { object } = await generateObject({
  model,
  schema: architectResponseSchema,
  system: ARCHITECT_SYSTEM_PROMPT,
  prompt: buildArchitectPrompt(target),
  experimental_telemetry: {
    isEnabled: true,
    metadata: { userId: user.id, target },
  },
  maxRetries: 2,
  abortSignal: AbortSignal.timeout(25_000),
});
```

Apply `experimental_telemetry: { isEnabled: true }` to all other `generateObject` calls (bouncer in `/api/neurons/extract`, synthesizer in `/api/neurons/[id]/synthesize`, etc.).

---

### Integration Pattern 3: RAG Context Logging (Custom Spans)

Use `observe()` from `@langfuse/tracing` to wrap the RAG retrieval and attach the retrieved documents as span metadata. This is the primary value-add over raw OTel — it logs what context the model actually received.

```typescript
// In /api/chat/route.ts — replace the plain getRelevantContext() call with:
import { observe } from '@langfuse/tracing';

const { ragContext, ragCatalog } = await observe(
  {
    name: 'rag-retrieval',
    userId: user.id,
    sessionId: conversationId,
    metadata: { query: latestUserText },
  },
  () => getRelevantContext(latestUserText, user.id, supabase)
);
```

---

### Integration Pattern 4: Flushing Traces in Next.js 14

**Critical constraint:** The project uses Next.js 14.2.35. The `after()` / `unstable_after` API (for scheduling work after the response completes) is only available in Next.js 15+. Do NOT attempt to import it.

**Correct pattern for Next.js 14:** Use `immediateExport: true` in the `LangfuseSpanProcessor` configuration to flush spans synchronously at completion, or call `langfuseProcessor.forceFlush()` inside `onFinish` for the streaming chat endpoint.

```typescript
// Option A (recommended): Immediate export — configure in instrumentation.ts
export const langfuseProcessor = new LangfuseSpanProcessor({
  immediateExport: true,  // flushes each span as it completes; slight latency overhead
  shouldExport: (span) => !span.name.startsWith('next.'),
});

// Option B: Manual flush in streamText onFinish (for streaming routes only)
onFinish: async (event) => {
  // flush BEFORE returning — in Next.js 14 there is no post-response hook
  await langfuseProcessor.forceFlush();
  // ... existing DB persistence
}
```

Option A is simpler and works for all routes. Option B gives more control but requires importing `langfuseProcessor` from `instrumentation.ts` into each route.

---

### Integration Pattern 5: Async Bloom Evaluator (No New Packages)

The evaluator runs as a non-blocking Promise inside the `streamText` `onFinish` callback. It uses the existing `evaluator` model role from `getModelForRole()`. No new dependencies, no new API route.

**Why `onFinish` and not a separate endpoint:** `onFinish` already runs server-side after the stream completes. Adding a separate `/api/bloom-eval` route adds an auth round-trip and network hop for a purely internal background job.

```typescript
// In /api/chat/route.ts onFinish callback (after DB persistence):
onFinish: async (event) => {
  const assistantText = event.text.trim();

  // 1. Persist assistant message (awaited — must complete)
  if (assistantText || event.toolCalls.length > 0) {
    await supabase.from('messages').insert({ ... });
  }

  // 2. Fire-and-forget Bloom evaluation (NOT awaited)
  // In Next.js 14, unawaited Promises inside onFinish complete because
  // the streamText runtime awaits onFinish itself before the function exits.
  // This is safe for serverless (Vercel) — the promise resolves within the
  // existing request lifecycle.
  runBloomEvaluation({
    userId: user.id,
    conversationId: conversationId!,
    assistantText,
    userText: latestUserText,
  }).catch((err) => console.error('[bloom-eval] Error:', err));
},
```

The `runBloomEvaluation` function:
- Calls `generateObject` with `getModelForRole('evaluator')` (Gemini Flash or GPT-4o-mini)
- Uses `maxRetries: 0` and `AbortSignal.timeout(15_000)` — failure is acceptable, never block chat
- Writes Bloom level result to a `bloom_evaluations` table or updates `conversations.metadata`
- Sets `experimental_telemetry: { isEnabled: true }` for observability

---

### Recommended Evaluator Model for Bloom Assessment

Set `AI_MODEL_EVALUATOR=google:gemini-2.5-flash` in `.env`. The `@ai-sdk/google` provider is already installed and `providers.ts` already handles the `evaluator` role. No code changes needed in `providers.ts`.

| Model | Cost (per 1M tokens input/output) | Latency | Notes |
|-------|-----------------------------------|---------|-------|
| `gemini-2.5-flash` | ~$0.075 / $0.30 | Very fast | GA March 2026; best price-performance for high-volume background evaluation |
| `gpt-4o-mini` | $0.15 / $0.60 | Fast | Already wired as default in `providers.ts`; viable fallback if Google quota issues |

Gemini 2.5 Flash is ~2x cheaper than GPT-4o-mini and faster for single-classification tasks. For Bloom level detection (a 6-class classification with brief reasoning), the quality difference from GPT-4o is negligible.

---

### Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@langfuse/otel` + `@opentelemetry/sdk-node` | `langfuse-vercel` | Explicitly deprecated by Langfuse; migration guide redirects to `@langfuse/otel` |
| `@langfuse/otel` + `@opentelemetry/sdk-node` | `@vercel/otel` | Incompatible with OTel JS SDK v2, which `@langfuse/otel` v5 requires |
| `observe()` from `@langfuse/tracing` for RAG | Raw OTel span API | `observe()` automatically propagates Langfuse context (userId, sessionId) without boilerplate |
| Unawaited Promise inside `onFinish` | Separate `/api/bloom-eval` endpoint | Extra auth roundtrip and network overhead for an internal background job |
| Unawaited Promise inside `onFinish` | `unstable_after` from `next/server` | Only available in Next.js 15+; project is on 14.2.35 |
| Unawaited Promise inside `onFinish` | Inngest / Trigger.dev / queues | Bloom evaluation is lightweight (<2s, single generateObject call) — full queue infrastructure is overkill |

---

### What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `langfuse-vercel` | Deprecated since Langfuse TypeScript SDK v4 (Aug 2025). Docs explicitly say to migrate. | `@langfuse/otel` + `@langfuse/tracing` |
| `@vercel/otel` | Incompatible with OTel JS SDK v2 that `@langfuse/otel` v5 requires. Using both causes span processor conflicts. | `@opentelemetry/sdk-node` directly |
| Any job queue (Inngest, BullMQ, Trigger.dev) | Bloom evaluation is a fast, non-critical background classification. Queue infrastructure adds infra complexity for a <2s task. | Unawaited Promise pattern inside `onFinish` |
| Next.js upgrade to v15 as part of this milestone | Upgrading Next.js is a separate milestone. v2.1 does not require any Next.js 15 features. | Use the `immediateExport: true` flush pattern for Next.js 14 compatibility |
| Separate Bloom evaluator API route | Extra network round-trip, auth overhead, and cold start risk for an internal background computation already on the server | Run inside `onFinish` callback |

---

### Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@langfuse/otel@5.0.1` | `@opentelemetry/sdk-node@^0.214.0` | Requires OTel JS SDK v2. Do NOT use with `@vercel/otel`. |
| `@langfuse/otel@5.0.1` | `ai@6.0.82` | Known active issue #12643: trace-level input/output may appear empty in the Langfuse Traces tab. Data IS correctly visible in the Observations tab. Severity: LOW (data is present, just not surfaced at trace root). Monitor `@langfuse/otel` 5.x changelog for fix. |
| `@langfuse/tracing@5.0.1` | `@langfuse/otel@5.0.1` | Always keep these at the same major.minor version. |
| `@ai-sdk/google@^3.0.26` | `gemini-2.5-flash` model string | GA model as of March 2026. Model string: `google:gemini-2.5-flash`. |

---

### New Environment Variables (v2.1)

```bash
# Langfuse observability (required)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
# Optional — defaults to Langfuse Cloud if omitted
# LANGFUSE_BASEURL=https://cloud.langfuse.com

# Evaluator model — use Gemini 2.5 Flash for cost efficiency
AI_MODEL_EVALUATOR=google:gemini-2.5-flash
# GOOGLE_GENERATIVE_AI_API_KEY must also be set (already required for @ai-sdk/google)
```

---

### v2.1 Sources

- [Langfuse Vercel AI SDK Integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk) — Official integration guide; confirms `langfuse-vercel` deprecated — HIGH confidence
- [Vercel AI SDK Observability: Langfuse](https://ai-sdk.dev/providers/observability/langfuse) — Official AI SDK docs on Langfuse OTel setup, `experimental_telemetry` usage — HIGH confidence
- [Langfuse TypeScript SDK v4 GA announcement](https://langfuse.com/changelog/2025-08-28-typescript-sdk-v4-ga) — v4 architecture, `@langfuse/otel` package structure — HIGH confidence
- [@langfuse/otel on npm](https://www.npmjs.com/package/@langfuse/otel) — Version 5.0.1 (published ~12 days ago, March 2026) — HIGH confidence
- [@langfuse/tracing on npm](https://www.npmjs.com/package/@langfuse/tracing) — Version 5.0.1 (same release cadence) — HIGH confidence
- [Langfuse TypeScript Instrumentation docs](https://langfuse.com/docs/observability/sdk/typescript/instrumentation) — `instrumentation.ts` setup pattern, `forceFlush()` pattern — HIGH confidence
- [AI SDK v6 + Langfuse v5: Trace input/output empty — Issue #12643](https://github.com/langfuse/langfuse/issues/12643) — Active known issue (reported ~1 week ago); data present in Observations — MEDIUM confidence (issue may be fixed in future patch)
- [Next.js 15 blog: `unstable_after`](https://nextjs.org/blog/next-15) — Confirms `after()` is Next.js 15+ only; not available in 14.2.x — HIGH confidence
- [Next.js fire-and-forget discussion](https://github.com/vercel/next.js/discussions/14077) — Community patterns for background work in Next.js 14 — MEDIUM confidence
- [Gemini 2.5 Flash GA on Vertex AI](https://cloud.google.com/blog/products/ai-machine-learning/gemini-2-5-flash-lite-flash-pro-ga-vertex-ai) — Model availability confirmed March 2026 — HIGH confidence
- [AI API Pricing Comparison 2026](https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude) — Gemini 2.5 Flash vs GPT-4o-mini pricing — MEDIUM confidence (third-party source)

---

## v2.0 MVP Core Stability — Production Hardening (2026-03-24)

This section covers only **production hardening changes** for existing stack. No new libraries.
All version numbers verified against `package.json` as of 2026-03-24.

Installed versions: `ai@6.0.82`, `@tiptap/react@3.20.4`, `@xyflow/react@12.10.0`, `promptfoo@0.121.2`

---

### (1) Vercel AI SDK v6 — Structured Output Production Reliability

**Current state (gaps found in codebase):**

- `generateObject` in `/api/architect/route.ts` has no `maxRetries`, no `abortSignal`, no error type narrowing, and no `repairText` fallback. A single provider hiccup causes a hard 500.
- `streamText` in `/api/chat/route.ts` has no `onError` callback — streaming errors are silently swallowed (confirmed AI SDK GitHub issue #4726). The `onFinish` handler has no `AbortError` guard.
- No timeouts are set on any AI call — Vercel's 10-second serverless function timeout will kill long completions silently.

**Changes required:**

#### 1a. `generateObject` — add `maxRetries`, `abortSignal`, `repairText`, and typed error handling

```typescript
import { generateObject, NoObjectGeneratedError } from 'ai';

const { object } = await generateObject({
  model,
  schema: architectResponseSchema,
  system: ARCHITECT_SYSTEM_PROMPT,
  prompt: buildArchitectPrompt(target),
  maxRetries: 2,                              // SDK default is 2; explicit is intentional
  abortSignal: AbortSignal.timeout(25_000),   // 25s hard cap — Architect is a heavy call
  // repairText: attempts JSON repair before throwing NoObjectGeneratedError
  // Use when cheaper models (gpt-4o-mini) hallucinate trailing commas or truncated JSON
  experimental_repairText: async ({ text }) => {
    // Strip common LLM JSON contamination patterns
    const cleaned = text
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    return cleaned;
  },
});
```

**Error narrowing in the catch block:**

```typescript
import { NoObjectGeneratedError, APICallError } from 'ai';

catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    // Access raw model output for debugging — available since AI SDK 4.1
    console.error('[architect] NoObjectGeneratedError — raw text:', error.text);
    return NextResponse.json(
      { error: 'AI failed to produce a valid knowledge structure. Please rephrase your target.' },
      { status: 422 }
    );
  }
  if (APICallError.isInstance(error)) {
    console.error('[architect] APICallError — status:', error.statusCode, error.message);
    return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
  }
  // ...existing generic handler
}
```

**Why:** `NoObjectGeneratedError.isInstance()` is the SDK-provided type guard (not `instanceof`) — required because the SDK bundles its own error classes. Without it, you cannot distinguish "model refused to produce JSON" from a network timeout from a 429 rate-limit, so every failure returns the same opaque 500.

**Confidence:** HIGH — verified from `ai-sdk.dev/docs/reference/ai-sdk-core/generate-object` and AI SDK 4.1 release notes confirming `NoObjectGeneratedError` API shape.

---

#### 1b. `streamText` — add `onError`, `maxRetries`, and timeout

```typescript
const response = streamText({
  model,
  system: systemPrompt,
  messages: modelMessages,
  tools: { suggest_neurogenesis: suggestNeurogenesisTool },
  maxRetries: 1,                              // Chat streams: 1 retry max (user is waiting)
  abortSignal: AbortSignal.timeout(60_000),   // 60s — allows long Socratic exchanges
  onError: ({ error }) => {
    // This is the ONLY reliable way to log stream errors — they are NOT thrown
    console.error('[chat/stream] Provider error during stream:', error);
  },
  onFinish: async (event) => {
    // Guard: if the stream was aborted mid-flight, event.text may be empty
    // Do NOT persist empty assistant messages
    if (!event.text.trim() && event.toolCalls.length === 0) return;
    // ...existing persistence logic unchanged
  },
});
```

**Why the `onError` callback is mandatory:** The AI SDK intentionally does not `throw` streaming errors to the outer `try/catch` — they are emitted into the stream to prevent servers from crashing. Without `onError`, a 429 rate-limit during streaming produces zero logs. This was a known production bug (GitHub issue #4726) that `onError` resolves.

**Why `maxRetries: 1` for chat vs `maxRetries: 2` for architect:** Chat is interactive — the user is watching the cursor. A second retry adds ~2-3 seconds of dead silence. Architect is a background call where correctness matters more than latency.

**Confidence:** HIGH — `onError` callback documented in `ai-sdk.dev/docs/reference/ai-sdk-core/stream-text` and confirmed from AI SDK 4.2 blog post.

---

#### 1c. Bouncer call in `/api/neurons/extract` — add timeout guard

The bouncer uses `generateObject` with the Bouncer schema. Apply the same pattern as 1a with `abortSignal: AbortSignal.timeout(15_000)` (bouncer is a simpler call, 15s is sufficient).

```typescript
// In bouncer's generateObject call
abortSignal: AbortSignal.timeout(15_000),
maxRetries: 2,
```

---

#### 1d. `streamText` for AI actions in `/api/neurons/ai-action`

This endpoint streams AI text actions (slash commands from `LiquidDocumentEditor`). Apply `onError` and `abortSignal`:

```typescript
abortSignal: AbortSignal.timeout(30_000),
onError: ({ error }) => {
  console.error('[neurons/ai-action] Stream error:', error);
},
```

---

### (2) Prompt Engineering — Enterprise-Grade Agent Contracts

**Philosophy:** The current prompts are functionally correct (100% pass rate on golden cases) but lack production hardening against adversarial inputs, model regressions, and edge cases. The changes below do not alter behavior on happy-path cases — they add explicit guardrails for failure modes.

**Confidence:** MEDIUM-HIGH — based on Anthropic's published prompt engineering guide and OpenAI's prompt engineering documentation, verified against the specific agent contracts in `src/lib/ai/prompts.ts`.

---

#### 2a. BOUNCER prompt — add explicit JSON schema anchor and output format enforcement

**Problem:** The bouncer prompt says "Return JSON only" but does not describe the schema inline. When model temperature increases or the model changes, it sometimes wraps JSON in markdown code fences (```json), which causes `JSON.parse` failures.

**Change:** Add an explicit output contract section at the bottom of `BOUNCER_SYSTEM_PROMPT`:

```
## Output Contract
Your entire response MUST be a single JSON object with no surrounding text, no code fences, no explanation.
The response MUST begin with { and end with }.
Required keys: decision, confidence, rationale, match_title.
Conditional keys: extracted_definition and extracted_core_insight (ONLY when decision is allow_new).
```

**Why:** Anthropic's documentation explicitly recommends adding an output contract as the last thing in the system prompt because it acts as the most recency-biased instruction. This is especially effective for JSON-only agents where any contamination breaks parsing.

---

#### 2b. ARCHITECT prompt — add Bloom level distribution guidance

**Problem:** The Architect frequently assigns `Remember` to all prerequisite nodes and `Understand` to all primary nodes, producing flat Bloom distributions. The cognitive scaffold should vary.

**Change:** Add to `ARCHITECT_SYSTEM_PROMPT`:

```
## Bloom Distribution Policy
Assign Bloom levels that reflect the actual cognitive demand of understanding each concept:
- Foundation prerequisites (pure facts, vocabulary): Remember or Understand
- Procedural or application concepts: Apply
- Target concept itself and analytical frameworks: Analyze or Evaluate
- Creative synthesis or design concepts: Create
Avoid assigning the same Bloom level to more than 60% of nodes in a single response.
```

**Why:** This is a behavioral constraint, not a structural one, so it belongs in the system prompt (not the Zod schema). The Zod schema already enforces valid enum values — this governs the *distribution* of those values for pedagogical quality.

---

#### 2c. CONVERSATIONALIST (CHAT) prompt — add Bloom cognitive load indicator pattern

**Problem:** The current prompt identifies Bloom-level moments but does not track conversation depth over time. The Bloom indicator in the UI is static — it does not update to reflect progression.

**Change:** Add to `CHAT_SYSTEM_PROMPT` after the Neurogenesis Policy section:

```
## Bloom Progress Tracking
At the END of responses where you observe a change in the user's demonstrated reasoning level,
include a structured marker on its own line:
[BLOOM:Analyze] or [BLOOM:Evaluate] or [BLOOM:Create]
Only emit this marker when the user demonstrates a clear step up in cognitive engagement.
Do NOT emit it on every turn — only when a genuine Bloom transition occurs.
Do NOT emit it when calling suggest_neurogenesis (the tool call is already the signal).
```

**Why:** This gives the UI a parseable signal to update the Bloom indicator without requiring a separate LLM call. The marker is on its own line, making it easy to strip from displayed text via a `.replace(/\[BLOOM:[^\]]+\]\n?/g, '')` before rendering to the user.

**Implementation note:** The `onFinish` handler in `/api/chat/route.ts` must strip this marker from `event.text` before persisting to `messages.content` to prevent marker accumulation in the stored conversation.

---

#### 2d. Socratic enrichment — add anti-repetition guardrail

**Problem:** In long conversations (20+ turns), the Conversationalist repeats the same "enrichment" facts or circles back to earlier questions. This undermines the "build on prior messages" directive.

**Change:** Add to the Behavior section of `CHAT_SYSTEM_PROMPT`:

```
- Never repeat an enrichment fact, analogy, or question you have already used in this conversation.
  Each response must introduce information not present in any prior assistant turn.
- If the conversation history shows the user has already demonstrated understanding of a concept,
  do not re-explain it. Build forward.
```

**Why:** At 20+ turns, GPT-4o without this constraint regresses to re-summarizing earlier points. This is a documented failure mode for long Socratic conversations. The constraint has negligible impact on short conversations (≤5 turns).

---

### (3) TipTap v3 Production Hardening

**Current state (gaps found in codebase):**

The `LiquidDocumentEditor` saves via `editor.getHTML()` to the `content` column. `NeuronTipTapEditor` uses `editor.getText()` in its `onChange` callback. These are two different serialization formats in two different components for the same data type. This is a production data consistency hazard.

Additionally, the content sync `useEffect` compares `neuron.content` (HTML) to `editor.getText()` (plain text) — these will never be equal, causing unnecessary `setContent` calls on every render cycle where the neuron prop updates.

**Changes required:**

#### 3a. Standardize on `getJSON()` as the source of truth

Store content as Tiptap JSON in the database column. Render as HTML using `generateHTML()` (from `@tiptap/html`) when needed for display outside the editor.

**Rationale:** JSON is the editor's internal ProseMirror representation — it has zero serialization loss. HTML introduces XSS surface area, schema drift if extension set changes, and cannot round-trip reliably if you add new extensions later. JSON can be converted to HTML server-side or client-side without an editor instance.

```typescript
// In LiquidDocumentEditor — save handler change:
content: editor.getJSON(), // was: editor.getHTML()

// In NeuronTipTapEditor — onChange change:
onChange: (json: object) => void  // was: (markdown: string) => void
// Inside onUpdate:
if (onChange) {
  onChange(editor.getJSON());
}

// Content loading — fix the broken equality check:
// was: if (content !== currentText && !editor.isFocused)
// this compared HTML to plain text — always triggered
// fix:
useEffect(() => {
  if (!editor || editor.isFocused) return;
  // Compare JSON serializations to detect actual content change
  const currentJson = JSON.stringify(editor.getJSON());
  const incomingJson = typeof content === 'string'
    ? content  // legacy HTML — let setContent handle it
    : JSON.stringify(content);
  if (currentJson !== incomingJson) {
    editor.commands.setContent(content, false); // false = don't emit update event
  }
}, [editor, content]);
```

**Why the second argument `false` to `setContent` matters:** In TipTap v3, `setContent` emits an `update` event by default (changed from v2 where it was `false`). Without `false`, programmatic content sync triggers `onUpdate`, which sets `isDirty = true` and reschedules the 2.5s extraction debounce — causing a false extraction on every neuron switch.

**Confidence:** HIGH — verified from TipTap v3 upgrade guide noting the `emitUpdate` default change, and GitHub issue #4828 documenting the unexpected update emission pattern.

---

#### 3b. Fix the `editor.getText()` vs `editor.getHTML()` mismatch for the extraction trigger

In `triggerExtraction`, the content length check uses `editor.getText().trim()` which strips formatting. This is correct for the length check. But the extraction API (`/api/neurons/extract`) receives the result of `editor.getText()` — plain text — while the save API receives `editor.getHTML()`. The extraction model therefore sees a different representation than what is saved.

**Change:** Pass `editor.getHTML()` (or JSON) to the extraction API so the model sees headings, bullets, and emphasis — these carry semantic signal for Bloom classification.

```typescript
// In triggerExtraction:
const content = editor.getHTML().trim();  // was: editor.getText().trim()
if (!title.trim() || editor.getText().length < 40) return;  // still use getText for length
```

---

#### 3c. `immediatelyRender: false` is already correct — keep it

Both editors have `immediatelyRender: false`. This is the correct SSR hydration guard for Next.js. Do not remove it.

---

#### 3d. Extension set must match between edit and display contexts

The `NeuronTipTapEditor` and `LiquidDocumentEditor` have slightly different extension sets (the Liquid editor adds slash commands and bubble menu). When rendering read-only content with `generateHTML()` server-side, you must pass the same extension set or nodes from the advanced editor will fail to render.

**Change:** Extract the base extension set into a shared constant:

```typescript
// src/lib/editor/extensions.ts
export const BASE_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, ... }),
  Typography,
  Link.configure({ ... }),
];

// Both editors import BASE_EXTENSIONS and spread it
// LiquidDocumentEditor adds slashExtension on top
// Server-side generateHTML uses BASE_EXTENSIONS
```

---

### (4) React Flow Performance Optimization

**Current state (gaps found in codebase):**

The `GraphCanvas` component has three performance issues that will manifest at 50+ nodes:

1. `nodeTypes` and `edgeTypes` are defined at module level (correct) but `onNodeClick` and `handleTargetSubmit` are `useCallback` inside the component — React Flow re-renders the entire graph when these change reference.
2. `getLayoutedElements` runs synchronously on the render thread every time `combinedNodes` or `combinedEdges` changes — dagre layout for 100 nodes takes ~20ms, causing frame drops.
3. `onlyRenderVisibleElements` is not set — all 200 nodes render DOM elements even when panned out of view.

**Changes required:**

#### 4a. Add `onlyRenderVisibleElements` to `ReactFlow`

```tsx
<ReactFlow
  nodes={flowNodes}
  edges={flowEdges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onNodeClick={onNodeClick}
  nodeTypes={nodeTypes}           // already outside component — correct
  edgeTypes={edgeTypes}           // already outside component — correct
  nodesConnectable={false}
  fitView
  fitViewOptions={{ padding: 0.3, maxZoom: 0.7 }}
  onlyRenderVisibleElements       // ADD THIS — lazy DOM rendering
  className="bg-[#0c0c0e]"
  proOptions={{ hideAttribution: true }}
>
```

**Why:** At 50+ nodes, React Flow renders ~50 React component trees even when nodes are zoomed out and invisible. `onlyRenderVisibleElements` skips DOM creation for off-viewport nodes. The official React Flow stress test shows this is the single highest-impact flag for large graphs.

**Caveat:** `onlyRenderVisibleElements` disables node animations during pan/zoom (nodes pop in instead of fading). For NeuroGraph's dark-background aesthetic, this is acceptable — the existing node design is designed for instantaneous rendering.

**Confidence:** HIGH — documented in `reactflow.dev/learn/advanced-use/performance` and confirmed in community performance guide.

---

#### 4b. Move dagre layout to `requestAnimationFrame` (already present, but needs deferral)

The current code uses `requestAnimationFrame` inside `onLayout` for `fitView`, but the dagre computation itself still runs synchronously before `setFlowNodes`. For 100+ nodes, move the entire layout to a `setTimeout(fn, 0)` to yield to the browser paint cycle:

```typescript
const onLayout = useCallback(
  (nextNodes: Node[], nextEdges: Edge[]) => {
    // Defer layout to avoid blocking the render thread
    setTimeout(() => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nextNodes, nextEdges);
      setFlowNodes([...layoutedNodes]);
      setFlowEdges([...layoutedEdges]);
      window.requestAnimationFrame(() => {
        fitView({ padding: 0.3, maxZoom: 0.7 });
      });
    }, 0);
  },
  [setFlowNodes, setFlowEdges, fitView]
);
```

**Why:** `setTimeout(fn, 0)` yields to the event loop between the React render that triggers `onLayout` and the layout computation. This prevents the UI from freezing while dagre processes edge crossings. It is not async (no worker overhead) but it is non-blocking for the paint.

**Confidence:** MEDIUM — standard JS concurrency pattern, but confirmed by React Flow community guides noting synchronous layout as a common jank source.

---

#### 4c. Wrap custom node components in `React.memo`

The `NeuronNode`, `GhostNeuronNode`, and `SynapseEdge` components should be wrapped in `React.memo`. Without this, React Flow re-renders all nodes whenever any node in the graph changes state (e.g., retrievability tick updates one node, which triggers re-renders of all 200 nodes).

```typescript
// In NeuronNode.tsx
export const NeuronNode = React.memo(function NeuronNode({ data, ... }) { ... });

// In GhostNeuronNode.tsx
export const GhostNeuronNode = React.memo(function GhostNeuronNode({ data, ... }) { ... });

// In SynapseEdge.tsx
export const SynapseEdge = React.memo(function SynapseEdge({ data, ... }) { ... });
```

**Why:** The retrievability interval runs every 60 seconds and calls `updateNode` for every node whose value changed by more than 0.001. If 30 nodes update simultaneously, React Flow without `React.memo` re-renders all 200 nodes. With `React.memo`, only the 30 nodes with changed data props re-render.

**Confidence:** HIGH — official React Flow performance docs state: "FPS improved from 2 FPS to 60 FPS with proper memoization" for custom nodes.

---

#### 4d. Memoize `defaultEdgeOptions` object

Currently `ReactFlow` does not receive `defaultEdgeOptions` — edge styles are set per-edge in `mappedEdges`. This is fine. Ensure the `nodeTypes` and `edgeTypes` objects remain outside the component (they currently are — confirmed in `GraphPanel.tsx` lines 29-36).

---

### (5) promptfoo Advanced Assertion Patterns

**Current state:** 31 golden cases across 3 agents. Existing assertions cover structure (is-json), field presence, decision correctness, and Socratic tone scoring. Missing: multi-turn behavioral testing and Bloom level regression detection.

**Confidence:** MEDIUM-HIGH — based on promptfoo official docs for `storeOutputAs`, `conversation-relevance`, and `llm-rubric` assertion types.

---

#### 5a. Add multi-turn Neurogenesis sequencing test cases to the Conversationalist suite

The current conversationalist suite tests single-turn responses. The key behavioral contract — "do not trigger Neurogenesis before 2 substantive exchanges" — is untestable with single-turn cases.

**Pattern: `storeOutputAs` for turn sequencing**

```yaml
# In prompt-eval/conversationalist/cases.yaml — add these cases:

- vars:
    message: "What is gradient descent?"
    conversation_history: []
    expected_neurogenesis: false
  description: "Turn 1 — recall question must NOT trigger neurogenesis"

- vars:
    message: "I think it's like rolling a ball down a hill to find the lowest point"
    conversation_history:
      - role: user
        content: "What is gradient descent?"
      - role: assistant
        content: "{{prior_turn_1}}"  # injected via storeOutputAs
    expected_neurogenesis: false
  description: "Turn 2 — analogy without evaluation — must NOT trigger neurogenesis"

- vars:
    message: "I realize that gradient descent can get stuck in local minima because the loss landscape for neural nets is non-convex — so the ball metaphor breaks down for deep nets"
    conversation_history: "{{multi_turn_history_3}}"
    expected_neurogenesis: true
  description: "Turn 3 — critique of the analogy (Evaluate level) — MUST trigger neurogenesis"
```

**Provider change needed:** The `neurograph-conversationalist-provider.mjs` must handle `conversation_history` arrays in vars and pass them as the `messages` context to the AI call. The provider already passes vars to the chat API — extend it to include history.

---

#### 5b. Add `llm-rubric` assertion for Bloom level anti-repetition

The biggest behavioral gap is detecting when the Conversationalist repeats itself at turn N. Add a rubric assertion:

```yaml
# Add to defaultTest.assert in conversationalist/promptfooconfig.yaml:

- type: llm-rubric
  value: >
    The assistant response must introduce at least one piece of information or perspective
    that was NOT present in the prior conversation history.
    If the response only summarizes, paraphrases, or repeats what was already said,
    score this FAIL. If it introduces new context, examples, analogies, or connections,
    score this PASS.
  threshold: 0.8
```

**Why `llm-rubric` here and not `javascript`:** "Does this introduce new information" requires semantic reasoning, not syntactic pattern matching. A `javascript` assertion checking for repeated strings would fail on valid paraphrases that introduce new frames. `llm-rubric` with an evaluator model (currently `gpt-4o-mini` via `AI_MODEL_EVALUATOR`) is the correct tool.

---

#### 5c. Add `conversation-relevance` assertion for Socratic coherence

The `conversation-relevance` assertion type evaluates whether each assistant turn stays relevant to the thread. Add it to the conversationalist suite:

```yaml
# Add to defaultTest.assert:

- type: conversation-relevance
  threshold: 0.85
```

This uses promptfoo's built-in sliding-window evaluation: for each assistant turn, it checks that the response is relevant to the preceding N messages. At threshold 0.85, it catches responses where the model drifts topic.

**Confidence:** HIGH — `conversation-relevance` is a documented promptfoo assertion type from `promptfoo.dev/docs/configuration/expected-outputs/model-graded/conversation-relevance/`.

---

#### 5d. Add structural DAG integrity assertion to Architect suite

The existing Architect assertions catch cycle detection and synapse-node title mismatches. Add a Bloom distribution assertion to catch the flat-bloom regression described in section 2b:

```yaml
# Add to architect/promptfooconfig.yaml defaultTest.assert:

- type: javascript
  value: |
    const result = JSON.parse(output);
    if (!result.isValid || result.nodes.length < 3) return true; // skip refusal cases
    const levelCounts = {};
    for (const node of result.nodes) {
      levelCounts[node.bloom_level] = (levelCounts[node.bloom_level] || 0) + 1;
    }
    const maxCount = Math.max(...Object.values(levelCounts));
    // No single Bloom level should dominate more than 60% of nodes
    return maxCount / result.nodes.length <= 0.6;
  description: "Bloom distribution — no single level > 60% of nodes"
```

---

#### 5e. Add a Bouncer confidence calibration assertion

The existing bouncer assertions check `decision` and `match_title` correctness, but `confidence` is unchecked. A `confidence: 0.99` for a borderline case is a miscalibration signal.

```yaml
# Add to bouncer/promptfooconfig.yaml defaultTest.assert:

- type: javascript
  value: |
    const result = JSON.parse(output);
    // Confidence must be a number between 0 and 1 inclusive
    if (typeof result.confidence !== 'number') return false;
    if (result.confidence < 0 || result.confidence > 1) return false;
    // For expected borderline cases (vars.is_borderline === true),
    // confidence should be < 0.9 (model should express uncertainty)
    if (context.vars.is_borderline === true && result.confidence >= 0.9) {
      return { pass: false, score: 0, reason: `Overconfident on borderline case: ${result.confidence}` };
    }
    return true;
```

Add `is_borderline: true` to the relevant test cases in `bouncer/cases.csv`.

---

## Summary of Changes by File

| File | Change | Impact |
|------|--------|--------|
| `src/instrumentation.ts` | NEW — OTel init with `LangfuseSpanProcessor` | Enables all Langfuse tracing |
| `src/app/api/chat/route.ts` | Add `experimental_telemetry`, `observe()` for RAG, `forceFlush()` in `onFinish`, Bloom evaluator fire-and-forget | Full chat observability + async evaluation |
| `src/app/api/architect/route.ts` | Add `experimental_telemetry` | Architect traces visible in Langfuse |
| `src/app/api/neurons/extract/route.ts` | Add `experimental_telemetry` | Bouncer traces visible in Langfuse |
| `src/app/api/neurons/[id]/synthesize/route.ts` | Add `experimental_telemetry` | Synthesizer traces visible in Langfuse |
| `src/lib/ai/bloom-evaluator.ts` | NEW — `runBloomEvaluation()` function | Async Bloom evaluator implementation |
| `src/app/api/architect/route.ts` | Add `maxRetries`, `abortSignal`, typed error narrowing | Eliminates silent 500s on provider hiccup |
| `src/app/api/chat/route.ts` | Add `maxRetries`, `abortSignal`, `onError` callback, `onFinish` guard | Eliminates silent stream failures |
| `src/app/api/neurons/extract/route.ts` | Add `abortSignal` to bouncer generateObject call | Prevents hanging requests |
| `src/app/api/neurons/ai-action/route.ts` | Add `onError`, `abortSignal` to streamText | Surfaces slash command failures |
| `src/lib/ai/prompts.ts` | Add output contract to Bouncer, Bloom distribution policy to Architect, anti-repetition to Chat, Bloom marker pattern | Improves behavioral reliability |
| `src/components/editor/LiquidDocumentEditor.tsx` | Switch `getHTML()` to `getJSON()`, fix `setContent(content, false)`, fix content equality check | Eliminates false dirty state, data consistency |
| `src/components/editor/NeuronTipTapEditor.tsx` | Switch `getText()` to `getJSON()` in onChange, fix equality check | Consistent serialization format |
| `src/lib/editor/extensions.ts` | New file — shared base extension set | Prevents schema drift between editors |
| `src/components/graph/GraphPanel.tsx` | Add `onlyRenderVisibleElements`, defer dagre to `setTimeout(fn, 0)` | Eliminates frame drops at 50+ nodes |
| `src/components/graph/NeuronNode.tsx` | Wrap in `React.memo` | Eliminates cascading re-renders on retrievability tick |
| `src/components/graph/GhostNeuronNode.tsx` | Wrap in `React.memo` | Same as above |
| `src/components/graph/SynapseEdge.tsx` | Wrap in `React.memo` | Same as above |
| `prompt-eval/conversationalist/cases.yaml` | Add multi-turn Neurogenesis test cases | Tests core behavioral contract |
| `prompt-eval/conversationalist/promptfooconfig.yaml` | Add `llm-rubric` and `conversation-relevance` assertions | Catches repetition and topic drift |
| `prompt-eval/architect/promptfooconfig.yaml` | Add Bloom distribution assertion | Catches flat-bloom regression |
| `prompt-eval/bouncer/promptfooconfig.yaml` | Add confidence calibration assertion | Detects overconfidence on borderlines |

---

## No New Packages Required (v2.0)

All v2.0 changes use the existing installed packages. No new installs needed.

| Capability | Already Available In |
|-----------|---------------------|
| `NoObjectGeneratedError`, `APICallError` | `ai@6.0.82` (re-exported from AI SDK core) |
| `AbortSignal.timeout()` | Node.js 18+ built-in |
| `editor.getJSON()`, `setContent(content, false)` | `@tiptap/react@3.20.4` |
| `onlyRenderVisibleElements` | `@xyflow/react@12.10.0` |
| `React.memo` | `react@18.3.1` |
| `conversation-relevance`, `llm-rubric` assertions | `promptfoo@0.121.2` |

---

## v2.0 Sources

- [AI SDK Core: generateObject reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) — `maxRetries`, `abortSignal`, `experimental_repairText`, `NoObjectGeneratedError` — HIGH confidence
- [AI SDK 4.1 release: NoObjectGeneratedError](https://vercel.com/blog/ai-sdk-4-1) — error type guard API shape — HIGH confidence
- [AI SDK Core: streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) — `onError`, `abortSignal`, `maxRetries` — HIGH confidence
- [AI SDK Core: Error Handling](https://ai-sdk.dev/docs/ai-sdk-core/error-handling) — stream error swallowing pattern — HIGH confidence
- [GitHub issue #4726: stream functions fail silently](https://github.com/vercel/ai/issues/4726) — confirmed `onError` necessity — HIGH confidence
- [Anthropic: Use XML tags to structure prompts](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags) — output contract placement — HIGH confidence
- [Anthropic: Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — system prompt placement guidance — HIGH confidence
- [TipTap: Export to JSON and HTML](https://tiptap.dev/docs/guides/output-json-html) — `getJSON()` as source of truth — HIGH confidence
- [TipTap: setContent command](https://tiptap.dev/docs/editor/api/commands/content/set-content) — `emitUpdate` default change in v3 — HIGH confidence
- [TipTap GitHub issue #4828: Update event triggered unexpectedly](https://github.com/ueberdosis/tiptap/issues/4828) — `setContent` false arg — MEDIUM confidence
- [React Flow: Performance](https://reactflow.dev/learn/advanced-use/performance) — `onlyRenderVisibleElements`, `React.memo` for custom nodes — HIGH confidence
- [React Flow: Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) — `nodeTypes` outside component warning — HIGH confidence
- [Synergy Codes: React Flow performance guide](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance) — FPS improvement numbers — MEDIUM confidence
- [promptfoo: Conversation Relevance](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/conversation-relevance/) — assertion type confirmed — HIGH confidence
- [promptfoo: LLM Rubric](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/) — threshold parameter — HIGH confidence
- [promptfoo: Chat Conversations](https://www.promptfoo.dev/docs/configuration/chat/) — `storeOutputAs` for multi-turn vars — HIGH confidence

---

## Historical Stack Research (v1.0 — v1.1)

*(Sections below are from prior milestones and remain valid. See git history for full context.)*

---
*Stack research for: Cognitive MicroSaaS — v2.1 Multi-Agent Architecture & Observability milestone*
*Researched: 2026-03-25*
