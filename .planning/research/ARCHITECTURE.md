# Architecture Patterns: Production Hardening

**Domain:** Production-hardening existing AI agents and editor
**Researched:** 2026-03-24
**Overall confidence:** HIGH (based on direct codebase audit + verified docs)

---

## Preamble: What Was Audited

Every hardening recommendation below is grounded in the actual code at the time of research. File paths and line numbers are cited so the implementer can navigate directly to the integration point.

Files audited:
- `src/app/api/chat/route.ts` — streamText, onFinish persistence
- `src/app/api/neurons/route.ts` — embedding → bouncer → insert → inferPrerequisites → ghostNodes
- `src/app/api/architect/route.ts` — generateObject, no retry/timeout today
- `src/lib/ai/inferPrerequisites.ts` — generateObject for prerequisite inference
- `src/lib/ai/embeddings.ts` — bare embed() call, no error handling
- `src/lib/ai/bouncer.ts` — find_similar_neurons RPC, swallows errors silently (returns null)
- `src/lib/ai/providers.ts` — model resolution, fallback logic
- `src/components/editor/NeuronTipTapEditor.tsx` — getText() serialization (lossy)
- `src/components/editor/LiquidDocumentEditor.tsx` — getHTML() on save, content sync
- `src/components/graph/GraphPanel.tsx` — inline dagre layout, no memoization on node components
- `src/components/graph/layout.worker.ts` — worker exists but is NOT wired to GraphPanel
- `src/stores/graphStore.ts` — Zustand, no persistence, interval leak risk
- `src/lib/db/queries.ts` — no retry wrapper on any Supabase call

Stack versions (from `package.json`):
- `ai`: ^6.0.82 (Vercel AI SDK v6)
- `@xyflow/react`: ^12.10.0
- `@tiptap/*`: ^3.20.4
- `@supabase/supabase-js`: ^2.95.3
- `zustand`: ^5.0.11
- `next`: ^14.2.35

---

## 1. LLM API Failure: Error Boundaries and Graceful Degradation

### Current state

**`/api/chat` (streamText):** The outer `try/catch` catches synchronous errors before streaming begins and returns a 500 JSON response. However, errors that occur mid-stream (network drop, provider 503, rate-limit mid-response) are NOT caught — `streamText` propagates them via the stream itself and the client sees a partial response or a silent cut. The `onFinish` callback has its own inner `try/catch` that only logs DB write failures; it does not communicate back to the client.

**`/api/architect` and `inferPrerequisites` (generateObject):** No retry, no timeout, no error-type discrimination. A single transient 529 (overloaded) from OpenAI causes the entire neurogenesis POST to surface a 500 to the user.

**`/api/neurons` (composite):** The `inferPrerequisites` + `projectGhostNodes` block is correctly wrapped in `try/catch` and logged as non-fatal (line 232). The embedding call (`generateEmbedding`) on line 108 is NOT wrapped — an OpenAI failure here kills the entire neuron creation request, including the DB insert which has not happened yet. This is the correct behavior semantically, but the error message surfaced is opaque.

### Recommended patterns

#### A. streamText — client-visible error surface (MODIFY `chat/route.ts`)

The Vercel AI SDK v6 `streamText` call should receive `maxRetries` and an `onError` handler for mid-stream provider failures.

```typescript
// MODIFY: src/app/api/chat/route.ts, streamText call (~line 193)
const response = streamText({
  model,
  system: systemPrompt,
  messages: modelMessages,
  tools: { suggest_neurogenesis: suggestNeurogenesisTool },
  maxRetries: 2,                    // retry transient provider errors automatically
  onError: (event) => {
    // Mid-stream provider failure — log for observability
    console.error('[chat/stream] provider error:', event.error);
  },
  onFinish: async (event) => { /* existing */ },
});
```

The `maxRetries: 2` is the primary lever. The SDK retries on 429/500/503 with exponential backoff automatically. Confidence: HIGH per AI SDK v6 core docs.

#### B. generateObject — explicit error-type handling (MODIFY `architect/route.ts`, `inferPrerequisites.ts`)

AI SDK v6 exposes typed errors. The recommended pattern for `generateObject` in production:

```typescript
// MODIFY: src/app/api/architect/route.ts and src/lib/ai/inferPrerequisites.ts
import { generateObject, NoObjectGeneratedError, APICallError } from 'ai';

try {
  const { object } = await generateObject({
    model,
    schema: architectResponseSchema,
    system: ARCHITECT_SYSTEM_PROMPT,
    prompt: buildArchitectPrompt(target),
    maxRetries: 2,
  });
  // ...
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    // Schema validation failed — model returned unparseable output
    return NextResponse.json(
      { error: 'Could not generate a valid curriculum. Try a more specific topic.' },
      { status: 422 }
    );
  }
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return NextResponse.json(
      { error: 'AI service is busy. Please wait a moment.' },
      { status: 429 }
    );
  }
  return NextResponse.json({ error: 'Architect request failed' }, { status: 500 });
}
```

`NoObjectGeneratedError` and `APICallError` are stable exports in AI SDK v6 (confirmed HIGH confidence from ai-sdk.dev docs).

#### C. Embedding failure — distinguish fatal vs recoverable (MODIFY `neurons/route.ts`)

The `generateEmbedding` call on line 108 of `neurons/route.ts` failing kills neuron creation. This is semantically correct (the neuron cannot be stored without its vector). The error message should be user-readable:

```typescript
// MODIFY: src/app/api/neurons/route.ts ~line 108
let embedding: number[];
try {
  embedding = await generateEmbedding(embeddingInput);
} catch (embeddingError) {
  console.error('[neurons/POST] Embedding generation failed:', embeddingError);
  return NextResponse.json(
    { error: 'Could not generate knowledge vector. Check OpenAI key or try again.' },
    { status: 503 }
  );
}
```

The bouncer's `checkNeuronCollision` already returns `null` on error (line 39 in `bouncer.ts`) — this is the right fail-open behavior and must be preserved.

#### D. `lib/ai/embeddings.ts` — add maxRetries (MODIFY)

```typescript
// MODIFY: src/lib/ai/embeddings.ts
import { embed } from 'ai';
import { getEmbeddingModel } from './providers';

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
    maxRetries: 2,   // embeddings are cheap to retry; this covers transient OpenAI blips
  });
  return embedding;
}
```

---

## 2. Retry/Timeout Patterns for generateObject and streamText

### Current state

No timeout is set on any LLM call. Vercel Fluid Compute sets a 5-minute function timeout across all plans. A stalled OpenAI stream will block for up to 5 minutes before timing out, making the user wait silently.

The layout worker (`layout.worker.ts`) exists but is not wired into `GraphPanel.tsx`. The graph still runs dagre layout synchronously on the main thread.

### Recommended patterns

#### A. Stream chunk timeout for streamText (MODIFY `chat/route.ts`)

AI SDK v6 honors the standard Web API `AbortSignal.timeout()` as the `abortSignal` prop:

```typescript
// MODIFY: src/app/api/chat/route.ts streamText call
const response = streamText({
  model,
  // ...
  maxRetries: 2,
  abortSignal: AbortSignal.timeout(55_000), // 55s total — safely under Vercel 60s limit
});
```

If the stream does not complete in 55 seconds it aborts cleanly and the client `useChat` hook receives an error that can trigger a retry prompt.

Confidence: MEDIUM — `abortSignal` prop is documented; the 55s limit is community convention for Vercel, not a hard rule.

#### B. generateObject timeout (MODIFY `architect/route.ts`, `inferPrerequisites.ts`)

```typescript
const { object } = await generateObject({
  model,
  // ...
  maxRetries: 2,
  abortSignal: AbortSignal.timeout(30_000), // 30s — curriculum generation should not stall
});
```

The architect is called interactively from the graph panel. A 30-second timeout with the existing `isHorizonLoading` spinner is acceptable UX.

#### C. Wire the layout worker to GraphPanel (MODIFY `GraphPanel.tsx`)

The `layout.worker.ts` file at `src/components/graph/layout.worker.ts` exists but is unused. `GraphPanel.tsx` calls `getLayoutedElements` synchronously on the React render thread every time `combinedNodes` or `combinedEdges` change (line 204). With 200 nodes, dagre layout can block the main thread for 50-200ms.

Critical mismatch to fix first: the worker uses `rankdir: 'LR'` while `GraphPanel.tsx` uses `rankdir: 'TB'`. Update the worker to `TB` before wiring.

```typescript
// ADD to GraphPanel.tsx: replace synchronous onLayout with worker-based layout
const layoutWorkerRef = useRef<Worker | null>(null);

useEffect(() => {
  layoutWorkerRef.current = new Worker(
    new URL('../../components/graph/layout.worker.ts', import.meta.url)
  );
  layoutWorkerRef.current.onmessage = (event) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = event.data;
    setFlowNodes([...layoutedNodes]);
    setFlowEdges([...layoutedEdges]);
    window.requestAnimationFrame(() => fitView({ padding: 0.3, maxZoom: 0.7 }));
  };
  return () => layoutWorkerRef.current?.terminate();
}, [fitView, setFlowNodes, setFlowEdges]);
```

Remove the existing synchronous `onLayout` callback and the `useEffect` that calls it. Send layout requests to the worker instead:

```typescript
useEffect(() => {
  if (layoutWorkerRef.current) {
    layoutWorkerRef.current.postMessage({
      nodes: combinedNodes,
      edges: combinedEdges,
      requestId: Date.now(),
    });
  }
}, [combinedNodes, combinedEdges]);
```

---

## 3. TipTap v3 Content Serialization Reliability

### Current state

**`NeuronTipTapEditor.tsx`** calls `editor.getText()` in the `onUpdate` callback and passes plain text to the `onChange` prop. This is lossy — all formatting (headings, lists, code blocks, bold) is stripped. For the current use case (feeding extraction endpoints), this is acceptable, but any future consumer of `onChange` must know they receive plain text.

**`LiquidDocumentEditor.tsx`** calls `editor.getHTML()` on save (line 222). This is the canonical serialization path for persisted content. The `neuron.content` field is HTML. On load, content is restored via `editor.commands.setContent(neuron.content || '')`.

**SSR hydration:** Both editors correctly set `immediatelyRender: false` — the required TipTap v3 setting to prevent hydration mismatch. This is correct.

**Content sync race condition (BUG):** `LiquidDocumentEditor` has two separate effects managing content sync:
- Line 202-208: reacts to `neuron.id` change — resets state vars but does NOT call `editor.commands.setContent`
- Line 210-216: reacts to `neuron.content` change but guards with `!editor.isFocused`

If a user navigates from neuron A to neuron B while the editor is focused, the content displayed remains neuron A's content until the editor loses focus. The `neuron.id` effect resets `title` and `isDirty` state but leaves the editor content stale. This is a real, reproducible bug.

**Schema mismatch risk:** TipTap v3 introduced `enableContentCheck` for detecting when stored HTML is incompatible with the current extension schema. Neither editor enables this check. If extensions change in a future milestone, silently invalid content will load without warning.

### Recommended patterns

#### A. Fix content sync race on neuron switch (MODIFY `LiquidDocumentEditor.tsx`)

Replace the two separate effects with one unified effect keyed on `neuron.id`:

```typescript
// MODIFY: src/components/editor/LiquidDocumentEditor.tsx
// Replace the effect at ~line 202 and the effect at ~line 210 with:
useEffect(() => {
  if (!editor) return;
  // Force-sync content on neuron ID change regardless of focus state
  editor.commands.setContent(neuron.content || '');
  setTitle(neuron.title || '');
  setIsDirty(false);
  setExtractedMeta(null);
  setExtractionState('idle');
  setAiOutput(null);
}, [neuron.id, editor]); // neuron.id is the authoritative switch signal
```

The `isFocused` guard was protecting against overwriting in-progress edits within the same neuron. That protection is no longer needed when the trigger is `neuron.id` change — an ID change always means a different neuron, and the current content should be discarded.

#### B. Add enableContentCheck for schema-invalid content detection (MODIFY both editors)

```typescript
// MODIFY: src/components/editor/LiquidDocumentEditor.tsx and NeuronTipTapEditor.tsx
// Add to useEditor config:
enableContentCheck: true,
onContentError: () => {
  console.warn('[TipTap] Schema mismatch detected — some content nodes may not render correctly');
},
```

This does not block functionality. It surfaces schema drift that would otherwise be invisible. Confidence: HIGH per TipTap v3 docs.

#### C. Keep HTML serialization for this milestone (DECISION)

The current stack stores HTML in `neuron.content`. Switching to `getJSON()` would be more resilient to schema changes but requires a migration to convert all existing content. Do not change the serialization format in this milestone. Flag for v2.1.

---

## 4. React Flow Performance with 50-200 Nodes

### Current state

`GraphPanel.tsx` has these performance risks, identified by direct code audit:

1. **`nodeTypes` and `edgeTypes` defined outside the component** (lines 29-36) — this is already correct and avoids the most common re-render trap.

2. **`getLayoutedElements` runs synchronously on the React thread** every time `combinedNodes` or `combinedEdges` changes (line 204-205). With 200 nodes, dagre layout takes ~100ms on the main thread.

3. **`onlyRenderVisibleElements` not set** — all nodes render regardless of viewport position. React Flow does NOT virtualize by default.

4. **`NeuronNode` and `GhostNeuronNode` are not wrapped in `React.memo`**. Per React Flow docs, custom node components must be memoized or they trigger full graph re-renders on any state change.

5. **The `updateNode` loop** (lines 208-230) iterates all nodes every minute and calls `updateNode` once per changed node. Each call triggers a Zustand `set()` which re-renders the entire graph. With 200 nodes this means up to 200 individual re-renders per minute.

6. **Soft-FIRe BFS traversal** (lines 282-310) runs on the main thread every 5 minutes when `loadGraph` fires. At 200 nodes it is O(V+E) and fast, but it mutates `node.data` in-place before `setGraph` — a pattern that bypasses React's immutability checks and can cause missed updates.

### Recommended patterns

#### A. Memoize NeuronNode and GhostNeuronNode (MODIFY both files)

```typescript
// MODIFY: src/components/graph/NeuronNode.tsx
import { memo } from 'react';
export const NeuronNode = memo(NeuronNodeComponentImpl);

// MODIFY: src/components/graph/GhostNeuronNode.tsx
export const GhostNeuronNode = memo(GhostNeuronNodeImpl);
```

This is the #1 documented optimization from the React Flow team. Confidence: HIGH.

#### B. Enable onlyRenderVisibleElements (MODIFY `GraphPanel.tsx`)

```typescript
// MODIFY: src/components/graph/GraphPanel.tsx ReactFlow props (~line 459)
<ReactFlow
  // ...existing props...
  onlyRenderVisibleElements={true}
/>
```

Known caveat: there is a reported bug (GitHub issue #4516) where edges with one off-screen endpoint may not render. The current `fitView` approach lays out all nodes to fit the viewport, so this is unlikely to manifest during normal use. Test with panning and zooming before shipping.

Confidence: MEDIUM — effective for large graphs, but edge rendering bug is real.

#### C. Batch the retrievability update loop (MODIFY `graphStore.ts` + `GraphPanel.tsx`)

Replace N individual `updateNode()` calls with a single batched store update:

```typescript
// ADD to src/stores/graphStore.ts GraphStore type:
batchUpdateNodeRetrievability: (updates: Array<{ id: string; retrievability: number }>) => void;

// ADD implementation:
batchUpdateNodeRetrievability: (updates) =>
  set((state) => {
    const updateMap = new Map(updates.map((u) => [u.id, u.retrievability]));
    return {
      nodes: state.nodes.map((node) =>
        updateMap.has(node.id)
          ? { ...node, data: { ...node.data, retrievability: updateMap.get(node.id) } }
          : node
      ),
    };
  }),
```

```typescript
// MODIFY: src/components/graph/GraphPanel.tsx updateRetrievability function (~line 207)
const updateRetrievability = () => {
  const now = new Date();
  const currentNodes = useGraphStore.getState().nodes;
  const updates: Array<{ id: string; retrievability: number }> = [];

  currentNodes.forEach((node) => {
    // ... compute newRetrievability as before ...
    if (Math.abs(newRetrievability - previousRetrievability) > 0.001) {
      updates.push({ id: node.id, retrievability: newRetrievability });
    }
  });

  if (updates.length > 0) {
    useGraphStore.getState().batchUpdateNodeRetrievability(updates);
  }
};
```

This reduces re-renders from N to 1 per minute cycle.

#### D. Wire layout.worker.ts to GraphPanel (MODIFY `GraphPanel.tsx`)

See Section 2C. This is the highest-impact React performance change — moving dagre off the main thread.

---

## 5. Supabase RPC Call Reliability

### Current state

Three critical RPC call sites and their current error handling:

| Site | Call | Error handling | Consequence of failure |
|------|------|---------------|------------------------|
| `bouncer.ts` line 31 | `find_similar_neurons` | Returns null, logs | Fail-open: correct |
| `neurons/route.ts` line 168 | `find_similar_neurons` (post-insert) | Returns 500 to client | WRONG: neuron already inserted |
| `queries.ts` line 89 | `find_similar_neurons` | Throws | Depends on caller |
| `queries.ts` line 124 | `get_neuron_neighborhood` | Throws | Depends on caller |

**Critical bug in `neurons/route.ts`:** The `find_similar_neurons` call at line 168 runs AFTER the neuron has been inserted into the database (line 127-148). If this RPC call fails, the current code returns a 500 to the client. The client then shows an error. But the neuron was successfully created. The user may retry, creating a duplicate. This is the highest-priority reliability fix in the entire codebase.

**Known platform issue:** The Supabase-js SDK has a 3-second API statement timeout enforced at the PostgREST layer. For pgvector similarity search on a cold start with 1000+ vectors, this can be reached. There is no client-side configuration option — it must be overridden with `SET LOCAL statement_timeout` inside the Postgres function body.

**Connection pooling:** The current `createServerSupabaseClient()` pattern creates one Supabase client per request via the REST/PostgREST layer. This is correct for serverless. Supabase's Supavisor handles pooling server-side. No client-side changes needed.

### Recommended patterns

#### A. Make post-insert find_similar_neurons non-fatal (MODIFY `neurons/route.ts`) — CRITICAL

```typescript
// MODIFY: src/app/api/neurons/route.ts ~line 168
const { data: similarNeurons, error: similarError } = await supabase.rpc('find_similar_neurons', {
  query_embedding: embedding,
  match_user_id: user.id,
  match_count: 10,
  match_threshold: 0.15,
});

if (similarError) {
  // NON-FATAL: neuron is already inserted. Log and return success without prerequisites.
  console.warn('[neurons/POST] find_similar_neurons failed (non-fatal):', similarError.message);
  return NextResponse.json(
    {
      neuron,
      prerequisite_links: [],
      projected_ghosts: [],
      mastered_queue_item_id: masteredQueueItemId,
    },
    { status: 201 }
  );
}
```

This is the single most impactful reliability fix in the codebase.

#### B. Add a lightweight retry helper for RPC calls (NEW `src/lib/db/rpc-retry.ts`)

```typescript
// NEW: src/lib/db/rpc-retry.ts
export async function withRpcRetry<T>(
  fn: () => Promise<{ data: T | null; error: unknown }>,
  maxAttempts = 2,
  delayMs = 500
): Promise<{ data: T | null; error: unknown }> {
  let lastResult = await fn();
  if (!lastResult.error) return lastResult;

  for (let attempt = 1; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delayMs * attempt));
    lastResult = await fn();
    if (!lastResult.error) return lastResult;
  }

  return lastResult;
}
```

Apply to: `bouncer.ts` find_similar_neurons (before insert, safe to retry). Do NOT apply to the post-insert call — the fix there is to make it non-fatal, not to retry.

#### C. Override statement_timeout in the find_similar_neurons Postgres function (NEW migration)

```sql
-- MIGRATION: Modify find_similar_neurons function
-- Add at the start of the function body:
SET LOCAL statement_timeout = '8000'; -- 8 seconds, overrides the 3s PostgREST default
```

This requires a Supabase SQL migration. The `SET LOCAL` approach is confirmed to work inside Postgres functions (per Supabase GitHub discussion #27421). Confidence: MEDIUM.

---

## 6. Zustand Store Resilience

### Current state

**`graphStore.ts`:** No persistence middleware. Store resets on page refresh. All graph state is loaded fresh from the API on mount. This is intentional and correct — freshness matters more than instant load for a learning app.

Specific risks identified:

**Interval leak on fast remounts:** The `setInterval(loadGraph, 5 * 60 * 1000)` in `GraphPanel.tsx` is created inside a `useEffect` with `[setGraph]` as dependency. `setGraph` is a Zustand action with a stable reference, so this does not cause duplicate intervals in normal usage. However, the `loadGraph` async function inside the effect does not check if the component is still mounted before calling `setGraph`. On fast navigation (route A → route B before the initial fetch completes), the stale response arrives and writes to the store after the component unmounts.

**Horizon loading orphan:** If the component unmounts while `isHorizonLoading: true` (user navigates away mid-architect-request), the store retains `isHorizonLoading: true`. On remount, the UI shows a permanent spinner.

**React 18 StrictMode double-invocation:** In development, React 18 mounts → unmounts → remounts every component. The cleanup function correctly clears intervals. No production issue.

**`queueStore.ts`:** `pendingById` optimistic state would be lost on remount. This is brief and acceptable — the pending state will re-sync on the next mutation.

### Recommended patterns

#### A. Abort controller for loadGraph (MODIFY `GraphPanel.tsx`)

```typescript
// MODIFY: src/components/graph/GraphPanel.tsx loadGraph useEffect (~line 238)
useEffect(() => {
  let aborted = false;

  const loadGraph = async () => {
    const response = await fetch('/api/neurons', { cache: 'no-store' });
    if (!response.ok || aborted) return;

    const payload = await response.json();
    if (aborted) return; // guard against unmount between fetch and .json()

    // ... existing mapping logic ...
    setGraph(mappedNodes, mappedEdges);
  };

  loadGraph();
  const interval = setInterval(loadGraph, 5 * 60 * 1000);

  return () => {
    aborted = true;
    clearInterval(interval);
  };
}, [setGraph]);
```

The `aborted` boolean prevents stale fetch responses from writing to the store after unmount.

#### B. Clear horizon loading state on unmount (MODIFY `GraphPanel.tsx`)

```typescript
// ADD to GraphCanvas component in GraphPanel.tsx:
useEffect(() => {
  return () => {
    // Prevent orphaned loading spinner if component unmounts mid-architect-request
    if (useGraphStore.getState().isHorizonLoading) {
      useGraphStore.getState().setHorizonError('Request cancelled');
    }
  };
}, []); // empty deps — runs cleanup only on unmount
```

`setHorizonError` already sets `isHorizonLoading: false` (confirmed in `graphStore.ts` line 177).

#### C. Do not add persist middleware (DECISION)

The store is deliberately ephemeral. Adding `persist` would cause stale graph state to display on load, overriding the fresh API response with potentially deleted or modified neurons. The flash of empty state on load is acceptable and intentional for correctness.

---

## Integration Point Summary

| Integration Point | File(s) | Type | Priority |
|-------------------|---------|------|----------|
| Post-insert find_similar_neurons non-fatal | `api/neurons/route.ts` ~line 168 | MODIFY | Critical |
| TipTap content sync race on neuron switch | `components/editor/LiquidDocumentEditor.tsx` | MODIFY | Critical |
| generateEmbedding maxRetries + error message | `lib/ai/embeddings.ts`, `api/neurons/route.ts` | MODIFY | High |
| streamText maxRetries + abortSignal | `api/chat/route.ts` | MODIFY | High |
| generateObject typed errors + maxRetries | `api/architect/route.ts`, `lib/ai/inferPrerequisites.ts` | MODIFY | High |
| NeuronNode + GhostNeuronNode React.memo | `components/graph/NeuronNode.tsx`, `GhostNeuronNode.tsx` | MODIFY | High |
| Batch retrievability update | `stores/graphStore.ts` + `GraphPanel.tsx` | MODIFY | Medium |
| Wire layout.worker.ts to GraphPanel | `components/graph/GraphPanel.tsx` + `layout.worker.ts` | MODIFY | Medium |
| loadGraph abort controller | `components/graph/GraphPanel.tsx` | MODIFY | Medium |
| Horizon loading orphan guard on unmount | `components/graph/GraphPanel.tsx` | MODIFY | Medium |
| Add enableContentCheck to both editors | `LiquidDocumentEditor.tsx`, `NeuronTipTapEditor.tsx` | MODIFY | Low |
| RPC retry helper | `lib/db/rpc-retry.ts` | NEW | Medium |
| statement_timeout in find_similar_neurons | Supabase migration | NEW | Medium |

---

## Build Order

Build in this order to avoid regressions and respect dependencies:

```
Phase A — AI reliability (no React dependencies, safest first):
  1. src/lib/ai/embeddings.ts
     Add maxRetries: 2 to embed() call. Trivial change, no side effects.

  2. src/app/api/neurons/route.ts
     - Fix embedding error message (~line 108)
     - Fix find_similar_neurons post-insert non-fatal (~line 168-177)
     Depends on: embeddings.ts change.

  3. src/lib/ai/inferPrerequisites.ts
     Add maxRetries + typed error handling to generateObject.

  4. src/app/api/architect/route.ts
     Add maxRetries + typed error handling to generateObject.
     Same pattern as step 3 — do together.

  5. src/app/api/chat/route.ts
     Add maxRetries + abortSignal to streamText.

Phase B — Editor reliability (independent of Phase A):
  6. src/components/editor/LiquidDocumentEditor.tsx
     - Fix neuron.id content sync race
     - Add enableContentCheck
     No dependencies on Phase A. Can be built in parallel.

Phase C — Graph performance (depends on each other, do in sequence):
  7. src/components/graph/NeuronNode.tsx + GhostNeuronNode.tsx
     Add React.memo. Pure wraps, no logic change.

  8. src/stores/graphStore.ts
     Add batchUpdateNodeRetrievability action.

  9. src/components/graph/layout.worker.ts
     Update rankdir from 'LR' to 'TB' to match GraphPanel.

  10. src/components/graph/GraphPanel.tsx
      - Wire layout worker (depends on step 9)
      - Batch retrievability (depends on step 8)
      - Abort controller for loadGraph
      - Horizon orphan guard on unmount
      Depends on: steps 7, 8, 9.

Phase D — Supabase (requires DB migration, do last):
  11. src/lib/db/rpc-retry.ts
      New file, no dependencies.

  12. Supabase SQL migration
      Add SET LOCAL statement_timeout to find_similar_neurons.
      Requires dashboard access and migration deployment.
```

---

## Anti-Patterns to Avoid

### 1. Retry-wrapping the entire neurons POST handler

The handler performs a DB INSERT. Retrying the entire handler on any failure risks duplicate inserts. Only pre-insert operations (embedding, bouncer check) should retry. The insert itself is protected by the unique constraint on title.

### 2. Setting onlyRenderVisibleElements without testing edge rendering

This prop has a known bug (GitHub #4516) with edges where one endpoint is off-screen. Test with a real 100-node graph and deliberately pan nodes off-screen before shipping.

### 3. Switching content storage from HTML to JSON in this milestone

HTML is the current storage format for `neuron.content`. Switching to `getJSON()` without a migration to convert existing content will cause TipTap to render raw HTML strings as plain text nodes. This is a v2.1 concern, not a v2.0 concern.

### 4. Adding persist middleware to graphStore or queueStore

Both stores are deliberately ephemeral. Persist middleware would cause stale cache bugs where deleted neurons continue to appear until the next TTL expiry. The loading flash is intentional.

### 5. Using a generic try/catch around inferPrerequisites for retry

`inferPrerequisites` creates synapses in the DB on success. Retrying it after a partial failure (generateObject succeeds, synapse insert fails) could create duplicate synapses. The synapse insert already uses `upsert` with `ignoreDuplicates: true`, so this is actually safe — but the intent should be explicit.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| AI SDK v6 error types (NoObjectGeneratedError, APICallError) | HIGH | ai-sdk.dev reference docs confirm as stable exports |
| maxRetries behavior and exponential backoff | HIGH | AI SDK v6 core docs |
| abortSignal on streamText + generateObject | MEDIUM | Documented prop; Vercel 55s convention is community practice |
| React Flow React.memo requirement | HIGH | Official React Flow performance docs |
| onlyRenderVisibleElements edge bug | HIGH | Confirmed in xyflow GitHub issue #4516 |
| TipTap enableContentCheck API | HIGH | TipTap v3.0 stable release notes |
| TipTap content sync race (LiquidDocumentEditor) | HIGH | Identified directly by code audit, reproducible |
| Supabase 3s PostgREST statement timeout | MEDIUM | Confirmed in Supabase GitHub discussion #27421, not primary docs |
| SET LOCAL statement_timeout workaround | MEDIUM | Reported working in Supabase discussions, not in primary docs |
| Zustand abort controller pattern | HIGH | Standard React cleanup pattern; no Zustand-specific concerns |

---

## Sources

- [AI SDK Core: Error Handling](https://ai-sdk.dev/docs/ai-sdk-core/error-handling)
- [AI SDK Errors: AI_APICallError](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-api-call-error)
- [AI SDK Errors: AI_NoObjectGeneratedError](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-object-generated-error)
- [AI SDK Core: Settings (maxRetries, abortSignal)](https://ai-sdk.dev/docs/ai-sdk-core/settings)
- [Troubleshooting: Timeouts on Vercel](https://ai-sdk.dev/docs/troubleshooting/timeout-on-vercel)
- [React Flow: Performance](https://reactflow.dev/learn/advanced-use/performance)
- [React Flow: onlyRenderVisibleElements edge rendering bug #4516](https://github.com/xyflow/xyflow/issues/4516)
- [TipTap: Invalid Schema Handling](https://tiptap.dev/docs/guides/invalid-schema)
- [TipTap 3.0 Stable Release Notes](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable)
- [Supabase: API statement timeout discussion #27421](https://github.com/orgs/supabase/discussions/27421)
- [Supabase: Connection pooling for serverless Next.js](https://needthisdone.com/blog/supabase-connection-pooling-production-nextjs)
- [Zustand: React 18 mount/unmount behavior #1683](https://github.com/pmndrs/zustand/discussions/1683)
