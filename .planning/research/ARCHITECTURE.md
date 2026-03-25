# Architecture Research

**Domain:** Multi-Agent LLM Architecture with Observability (v2.1 refactor)
**Researched:** 2026-03-25
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                             │
│                                                                      │
│  ┌────────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
│  │  ChatPanel     │   │  Generate Neuron │   │  HorizonPanel     │  │
│  │  (useChat)     │   │  Button (lit by  │   │  (Architect draft)│  │
│  │                │   │  bloom signal)   │   │                   │  │
│  └───────┬────────┘   └────────┬─────────┘   └─────────┬─────────┘  │
│          │ POST /api/chat      │ fire-and-forget        │ POST       │
│          │                    │ POST /api/bloom-evaluate│ /api/architect
└──────────┼────────────────────┼────────────────────────┼────────────┘
           │                    │                        │
┌──────────▼────────────────────▼────────────────────────▼────────────┐
│                     Next.js App Router (API Layer)                   │
│                                                                      │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │  /api/chat       │  │ /api/bloom-     │  │  /api/architect    │  │
│  │  Pure Socratic   │  │ evaluate        │  │  Synthesizer →     │  │
│  │  Conversationalist  │  Async Observer │  │  RAG → Inquisitor  │  │
│  │  streamText,     │  │ generateObject, │  │  generateObject,   │  │
│  │  no tools        │  │ cheap LLM       │  │  neurogenesis_heavy│  │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬───────────┘  │
│           │                     │                     │              │
│  ┌────────▼─────────────────────▼─────────────────────▼───────────┐  │
│  │                    Langfuse OTEL Layer                          │  │
│  │  instrumentation.ts: NodeTracerProvider + LangfuseSpanProcessor │  │
│  │  experimental_telemetry on every AI call site                   │  │
│  └────────┬────────────────────────────────────────────────────────┘  │
│           │                                                           │
│  ┌────────▼──────────────────────────────────────────────────────┐   │
│  │              Shared AI Infrastructure (src/lib/ai/)            │   │
│  │  providers.ts  rag.ts  embeddings.ts  inferPrerequisites.ts   │   │
│  └────────┬──────────────────────────────────────────────────────┘   │
└───────────┼────────────────────────────────────────────────────────--┘
            │
┌───────────▼───────────────────────────────────────────────────────────┐
│                    Supabase (Postgres + pgvector)                      │
│  conversations  messages  neurons  synapses  knowledge_queue           │
└───────────────────────────────────────────────────────────────────────┘
            │
┌───────────▼───────────────────────────────────────────────────────────┐
│                    Langfuse (External SaaS)                            │
│  Traces: per-request, userId, conversationId, agentName               │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current State | Target State |
|-----------|---------------|---------------|--------------|
| `/api/chat` | Streaming Socratic conversation | Has `suggest_neurogenesis` tool, mixed concerns | Pure `streamText`, no tools, telemetry-wrapped |
| `/api/bloom-evaluate` | Async cognitive state scoring | Does not exist | New endpoint, cheap model, fire-and-forget caller |
| `/api/architect` | Curriculum DAG generation | Single `generateObject` call | Synthesizer → RAG → Inquisitor pipeline, telemetry-wrapped |
| `src/lib/ai/providers.ts` | Model resolution by role | Has `chat`, `synthesis_fast`, `neurogenesis_heavy`, `evaluator` | Add `bloom_evaluator` role defaulting to cheap model |
| `src/lib/ai/prompts.ts` | Prompt contracts | `CHAT_SYSTEM_PROMPT` includes Neurogenesis Policy | Remove Neurogenesis Policy; add `BLOOM_EVALUATOR_PROMPT` |
| `src/lib/ai/tools.ts` | Tool definitions | Has `suggestNeurogenesisTool` | Unchanged code; tool no longer passed to `/api/chat` |
| `instrumentation.ts` (new) | OTEL bootstrap | Does not exist | New file at project root — fires on Next.js server startup |
| `src/lib/ai/tracing.ts` (new) | Telemetry helpers | Does not exist | `buildTelemetry()` factory, `langfuseProcessor` re-export for flush |
| Zustand `graphStore` | UI state, architect draft | Has `leftPanelMode`, horizon state | Add `bloomLevel` field + `setBloomLevel()` action |

## Recommended Project Structure

```
neurograph/
├── instrumentation.ts            # NEW: project root, OTEL + Langfuse init
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts      # MODIFY: strip tools, add telemetry, after() flush
│   │       ├── bloom-evaluate/
│   │       │   └── route.ts      # NEW: async Bloom observer
│   │       ├── architect/
│   │       │   └── route.ts      # MODIFY: 3-step pipeline + telemetry
│   │       └── neurons/
│   │           ├── route.ts      # MODIFY (minor): add telemetry to inferPrerequisites
│   │           └── extract/
│   │               └── route.ts  # MODIFY (minor): add experimental_telemetry
│   ├── lib/
│   │   └── ai/
│   │       ├── providers.ts      # MODIFY: add bloom_evaluator role
│   │       ├── prompts.ts        # MODIFY: split CHAT prompt, add BLOOM_EVALUATOR_PROMPT
│   │       ├── tracing.ts        # NEW: buildTelemetry(), langfuseProcessor re-export
│   │       ├── tools.ts          # UNCHANGED
│   │       ├── rag.ts            # UNCHANGED
│   │       ├── inferPrerequisites.ts  # UNCHANGED (caller adds telemetry)
│   │       └── architect.ts      # UNCHANGED
│   └── stores/
│       └── graphStore.ts         # MODIFY: add bloomLevel, setBloomLevel
```

### Structure Rationale

- **`instrumentation.ts` at project root:** Next.js App Router automatically loads this file on server startup. It is the only correct place to register the OTEL provider — do not init inside individual route files.
- **`src/lib/ai/tracing.ts`:** Centralizes `experimental_telemetry` config construction so routes do not repeat the same object literal. Also re-exports the `langfuseProcessor` reference needed for `forceFlush()` in `after()` callbacks.
- **`bloom-evaluate/route.ts` as a dedicated endpoint:** Keeps bloom evaluation a true fire-and-forget HTTP call. This preserves the chat route's single responsibility (streaming) and makes the Bloom evaluator independently testable.

## Architectural Patterns

### Pattern 1: Langfuse via instrumentation.ts + experimental_telemetry

**What:** Register a single `LangfuseSpanProcessor` once in `instrumentation.ts`. Every AI SDK call opts in with `experimental_telemetry: { isEnabled: true, metadata }`. No per-call SDK init.

**When to use:** Any Next.js App Router project. The `instrumentation.ts` hook fires on cold start; the processor persists across warm invocations on Vercel.

**Trade-offs:** Requires four new packages (`@langfuse/tracing`, `@langfuse/otel`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`). Cannot use `@vercel/otel` — it is incompatible with OTEL JS SDK v2 that Langfuse JS SDK v4 requires. Must flush explicitly per route using `after()` from `next/server` to avoid trace loss.

**Example:**
```typescript
// instrumentation.ts (project root)
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/tracing';

export const langfuseProcessor = new LangfuseSpanProcessor({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL,
});

const provider = new NodeTracerProvider({
  spanProcessors: [langfuseProcessor],
});
provider.register();
```

```typescript
// src/lib/ai/tracing.ts
import { langfuseProcessor } from '../../instrumentation';

export { langfuseProcessor };

export function buildTelemetry(
  agentName: string,
  userId: string,
  extra?: Record<string, string>
) {
  return {
    isEnabled: true,
    functionId: agentName,
    metadata: { userId, ...extra },
  };
}
```

```typescript
// In any route handler
import { after } from 'next/server';
import { langfuseProcessor, buildTelemetry } from '@/lib/ai/tracing';

const response = streamText({
  model,
  system: systemPrompt,
  messages: modelMessages,
  experimental_telemetry: buildTelemetry('chat', user.id, { conversationId }),
});

after(async () => {
  await langfuseProcessor.forceFlush();
});

return response.toUIMessageStreamResponse({ ... });
```

### Pattern 2: Fire-and-Forget Bloom Evaluation

**What:** After the client receives the streamed chat response, it immediately fires a second `fetch` to `/api/bloom-evaluate` with the last 3 messages. The response carries `{ bloom_level, confidence }`. The client writes this to Zustand — the Generate Neuron button reacts.

**When to use:** Any ambient cognitive signal that must not block the primary interaction. The bloom level is an ambient indicator, not a hard gate at the HTTP layer.

**Trade-offs:** Two round trips instead of one. The button lags one message behind the actual cognitive depth — acceptable because the user must compose the next message before they can trigger neurogenesis anyway.

**Example data flow:**
```
[Chat stream ends, client onFinish()]
    → fetch('/api/bloom-evaluate', { messages: last3 })  // non-blocking
        → generateObject(evaluator model, last3 messages)
        → { bloom_level: 'Analyze', confidence: 0.87 }
    → graphStore.setBloomLevel('Analyze')
    → GenerateNeuronButton: lit when bloom_level in ['Analyze','Evaluate','Create']
```

### Pattern 3: Architect Pipeline (Synthesizer → RAG → Inquisitor)

**What:** Replace the single-pass `generateObject` in `/api/architect` with a 3-step sequential pipeline. Step 1 (Synthesizer) distills a conversation-anchored concept target. Step 2 (RAG) retrieves existing neurons for context. Step 3 (Inquisitor/Architect) generates the acyclic DAG.

**When to use:** User-triggered actions where latency is acceptable (5–10s). Not suitable for the hot path.

**Trade-offs:** 3x LLM calls. Latency increases from ~2s to ~8s. The DAG quality improves significantly because the Architect receives synthesized, RAG-enriched context rather than a raw topic string. Each step is traced independently in Langfuse.

**Example:**
```typescript
// /api/architect/route.ts — pipeline sketch
// Step 1: Synthesizer
const { object: synthesis } = await generateObject({
  model: getModelForRole('synthesis_fast'),
  experimental_telemetry: buildTelemetry('architect_synthesizer', userId),
  schema: synthesizerSchema,
  prompt: buildSynthesizerPrompt(conversationMessages),
});

// Step 2: RAG
const { ragContext } = await getRelevantContext(synthesis.canonicalTarget, userId, supabase);

// Step 3: Inquisitor
const { object } = await generateObject({
  model: getModelForRole('neurogenesis_heavy'),
  experimental_telemetry: buildTelemetry('architect_inquisitor', userId),
  schema: architectResponseSchema,
  system: `${ARCHITECT_SYSTEM_PROMPT}\n\n${ragContext}`,
  prompt: buildArchitectPrompt(synthesis.canonicalTarget),
});
```

## Data Flow

### Chat Flow (After Refactor)

```
User sends message
    ↓
POST /api/chat
    ├── Auth + rate limit
    ├── Persist user message to DB
    ├── RAG: getRelevantContext()
    ├── streamText(no tools) + experimental_telemetry
    │       ↓ streaming response to client
    │   onFinish: persist assistant message to DB
    └── after(): langfuseProcessor.forceFlush()
    ↓
Client stream complete
    ↓
Client fires POST /api/bloom-evaluate({ messages: last3 })  [non-blocking]
    ├── generateObject(bloom_evaluator model) + telemetry
    └── after(): flush
    ↓
{ bloom_level, confidence }
    ↓
graphStore.setBloomLevel(bloom_level)
    ↓
GenerateNeuronButton illuminates if bloom_level in ['Analyze','Evaluate','Create']
```

### Architect Flow (After Refactor)

```
User clicks "Build Curriculum" with a target concept
    ↓
POST /api/architect { target, conversationId? }
    ├── Step 1: Synthesizer generateObject → { canonicalTarget, intent }
    ├── Step 2: getRelevantContext(canonicalTarget) → ragContext
    ├── Step 3: Inquisitor generateObject → { nodes, synapses }
    ├── Each step: experimental_telemetry tagged with agentName
    └── after(): flush
    ↓
{ target, draft: ArchitectResponse }
    ↓
graphStore.setHorizonDraft() → ghost nodes in ReactFlow
```

### State Management

```
Zustand graphStore
    bloomLevel: BloomLevel | null          ← NEW
    setBloomLevel(level: BloomLevel | null) ← NEW
    ↓ (subscribe)
GenerateNeuronButton
    lit = bloomLevel in ['Analyze','Evaluate','Create']
    (replaces: tool-call event from suggest_neurogenesis)
```

## Integration Points

### What Changes vs What Stays

| Item | Change Type | Details |
|------|-------------|---------|
| `instrumentation.ts` | NEW | OTEL + Langfuse bootstrap at project root |
| `src/lib/ai/tracing.ts` | NEW | `buildTelemetry()` helper + `langfuseProcessor` re-export |
| `/api/bloom-evaluate/route.ts` | NEW | Async Bloom observer, `evaluator` or `bloom_evaluator` model role |
| `/api/chat/route.ts` | MODIFY | Remove `tools` object, add `experimental_telemetry`, add `after()` flush |
| `/api/architect/route.ts` | MODIFY | 3-step Synthesizer→RAG→Inquisitor pipeline, telemetry on each step |
| `/api/neurons/route.ts` | MODIFY (minor) | Add `experimental_telemetry` to the `inferPrerequisites` call chain |
| `/api/neurons/extract/route.ts` | MODIFY (minor) | Add `experimental_telemetry` |
| `src/lib/ai/prompts.ts` | MODIFY | Remove Neurogenesis Policy section from `CHAT_SYSTEM_PROMPT`; add `BLOOM_EVALUATOR_PROMPT` |
| `src/lib/ai/providers.ts` | MODIFY (minor) | Add `bloom_evaluator` role; default to `google:gemini-1.5-flash` or `openai:gpt-4o-mini` |
| `src/stores/graphStore.ts` | MODIFY | Add `bloomLevel: BloomLevel \| null`, `setBloomLevel()` action |
| `src/lib/ai/tools.ts` | NO CHANGE | `suggestNeurogenesisTool` stays defined; just not passed to chat any more |
| `src/lib/ai/rag.ts` | NO CHANGE | Unchanged; called by both chat and architect |
| `src/lib/ai/inferPrerequisites.ts` | NO CHANGE | Logic unchanged; caller adds telemetry |
| `src/lib/ai/architect.ts` | NO CHANGE | Schema + prompt builders unchanged |
| `package.json` | ADD DEPS | `@langfuse/tracing`, `@langfuse/otel`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node` |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Langfuse | Single `LangfuseSpanProcessor` in `instrumentation.ts`; `experimental_telemetry` per call; `after()` flush | Do NOT use `@vercel/otel` — incompatible with Langfuse JS SDK v4 (OTEL JS SDK v2 base). Use `NodeTracerProvider` directly. Env vars: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASEURL` |
| Supabase | Unchanged | No DB schema changes required |
| OpenAI / Google / Anthropic | Unchanged via `providers.ts` | Add `bloom_evaluator` role; Gemini Flash preferred for cost |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client → `/api/chat` | POST, streaming | Unchanged call contract; client initiates bloom-evaluate after stream ends |
| Client → `/api/bloom-evaluate` | POST, JSON, fire-and-forget | Client calls `fetch()` without `await` on the result; reads response async to update store |
| Client → `/api/architect` | POST, blocking JSON | Call site unchanged; only implementation pipeline changes |
| `graphStore.bloomLevel` → `GenerateNeuronButton` | Zustand subscription | Button replaced from reacting to tool-call events to reacting to `bloomLevel` |
| `/api/chat` → LLM | `streamText` without `tools` | Removes tool-calling entirely from the chat agent |

## Anti-Patterns

### Anti-Pattern 1: Initializing Langfuse per Route Handler

**What people do:** `const langfuse = new Langfuse(...)` inside individual route files, or inside the handler function body.

**Why it's wrong:** Creates a new OTEL provider per request. On Vercel serverless, warm reuses accumulate processors causing duplicate traces and unreliable flushing. Global OTEL state is not designed for per-request initialization.

**Do this instead:** Single `NodeTracerProvider` in `instrumentation.ts`, flushed once per request via `after()`.

### Anti-Pattern 2: Blocking Chat Response on Bloom Evaluation

**What people do:** Call bloom evaluation inside `/api/chat`'s `onFinish` handler, or chain it as a sequential step before returning the stream.

**Why it's wrong:** Adds 1–3s LLM latency to every chat turn. The bloom level is an ambient signal — it does not need to be available before the current message is rendered. Degrading interactive latency for a non-blocking concern is the wrong trade-off.

**Do this instead:** Client-side fire-and-forget `fetch` after the stream completes. The button updates on the evaluation response, which arrives while the user is reading the reply.

### Anti-Pattern 3: Keeping `suggest_neurogenesis` Tool in Chat but Instructing the Prompt to Ignore It

**What people do:** Pass the tool to `streamText` but add prompt instructions like "do not call suggest_neurogenesis."

**Why it's wrong:** The model still sees the tool in its context window. There is a non-zero probability of spurious calls, producing ghost tool-call metadata in the messages table and confusing the client-side tool-result handling.

**Do this instead:** Remove the `tools` key from `streamText` entirely. No tool declaration = no tool calls. The chat route becomes a pure text streamer with zero tool surface.

### Anti-Pattern 4: Skipping `after()` Flush on Vercel

**What people do:** Skip flushing, assuming the OTEL batch processor handles it, or call `flushAsync()` inside the handler before `return response`.

**Why it's wrong:** Vercel serverless functions stop execution when the response is returned. Spans still in the batch buffer are silently dropped. Calling `flushAsync()` before returning blocks the response unnecessarily.

**Do this instead:** `after(async () => { await langfuseProcessor.forceFlush(); })` — `after()` runs after the response is sent and before the function terminates, which is the correct window for flushing.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Current pattern is sufficient. Langfuse adds ~5ms overhead per request for span export. Bloom evaluation adds one LLM call per message turn. |
| 1k–10k users | Bloom evaluator cost becomes noticeable ($0.01–0.05 per session depending on model). Add client-side debounce: evaluate every 3rd message or only after 500ms idle. |
| 10k+ users | Replace LLM-based Bloom evaluation with a fine-tuned embedding classifier or rule-based heuristic on message length/vocabulary to reduce per-evaluation cost to near-zero. |

### Scaling Priorities

1. **First bottleneck:** Bloom evaluator LLM cost at scale — debounce before this is a problem.
2. **Second bottleneck:** Architect 3-step pipeline latency under high concurrent usage — each step is a separate LLM call with its own cold-start latency on the provider side.

## Sources

- [Langfuse Vercel AI SDK Integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk) — OTEL + experimental_telemetry pattern, flush guidance — MEDIUM confidence (official docs, not independently verified via WebFetch)
- [Vercel AI SDK Observability: Langfuse](https://ai-sdk.dev/providers/observability/langfuse) — experimental_telemetry API surface — MEDIUM confidence
- [Langfuse JS SDK v4 Announcement](https://github.com/orgs/langfuse/discussions/8403) — confirms OTEL JS SDK v2 base, incompatibility with @vercel/otel — MEDIUM confidence (GitHub discussion)
- [Langfuse Instrumentation Docs](https://langfuse.com/docs/observability/sdk/typescript/instrumentation) — NodeTracerProvider setup — MEDIUM confidence
- [Next.js `after()` API Reference](https://nextjs.org/docs/app/api-reference/functions/after) — post-response flush pattern — HIGH confidence (official Next.js docs)
- [Langfuse Next.js Example Repo](https://github.com/langfuse/langfuse-vercel-ai-nextjs-example) — reference implementation
- Direct codebase audit: `/api/chat/route.ts`, `/api/architect/route.ts`, `/api/neurons/route.ts`, `src/lib/ai/providers.ts`, `src/lib/ai/prompts.ts`, `src/lib/ai/tools.ts`, `src/stores/graphStore.ts` — HIGH confidence

---
*Architecture research for: NeuroGraph v2.1 Multi-Agent Refactor + Observability*
*Researched: 2026-03-25*
