# Domain Pitfalls: Production-Hardening AI Tutoring Agents

**Domain:** AI tutoring platform with Bloom-gated agents, knowledge graph, and Socratic coaching
**System:** NeuroGraph 2.0 (Next.js 14, Supabase/pgvector, Vercel AI SDK v6, TipTap v3, Zustand, promptfoo)
**Researched:** 2026-03-24
**Confidence:** MEDIUM-HIGH (verified across multiple sources; some findings specific to this system configuration)

---

## Critical Pitfalls

Mistakes that require rewrites, compromise data integrity, or silently corrupt user state.

---

### Pitfall 1: Silent Prompt Drift Eroding Agent Contracts

**What goes wrong:** Prompt quality degrades gradually without triggering any alarms. The Socratic agent begins giving hints instead of asking questions. The Bouncer starts approving shallow summaries. The Architect generates incorrect prerequisite chains. None of this produces errors — scores look fine in promptfoo because golden cases were written against the original behavior.

**Why it happens:** Three independent drift vectors operate simultaneously:
- **Model behavior drift** — the underlying LLM (Claude, GPT-4) receives silent updates from the provider that shift output distributions. Anthropic and OpenAI both update models without version-bumping the API endpoint.
- **Prompt context drift** — the system prompt accumulates small iterative edits across phases. Each change seems local, but their interaction shifts the emergent behavior of the whole contract.
- **Input distribution drift** — real users ask questions different from golden cases. A Socratic agent calibrated on synthetic Bloom-level inputs may fail on actual user phrasings.

**Consequences:** Users receive passive knowledge delivery (exactly what NeuroGraph is designed to prevent). The Bloom gate passes incorrect levels. Prerequisite links are wrong. Trust in the system erodes silently.

**Prevention:**
1. Pin prompts to versioned strings in code (not hardcoded inline). Tag each agent prompt with a semantic version (`v2.1.0-socratic`). Track which commit changed each prompt.
2. Run the promptfoo eval suite on every prompt change in CI, not just on release. Configure it as a GitHub Actions gate.
3. Add a "canary eval" tier: 5-10 cases per agent that capture the core behavioral contract (not edge cases). These must pass 100% at all times.
4. Log agent-level behavioral metrics in production: Bloom level distribution, neurogenesis acceptance rate, DAG link count per session. Sudden shifts in these distributions signal drift before users report it.
5. Schedule a monthly "prompt health check": run all golden cases, review 10 real sessions manually, compare Bloom distribution to baseline.

**Detection warning signs:**
- Neurogenesis acceptance rate climbs above historical baseline (Bouncer is accepting more — Bouncer is getting softer)
- DAG link count per node deviates from the 3-7 range expected for typical concepts
- Chat sessions that historically produced node proposals within 4-6 turns now take 2 turns (Socratic agent caving early)
- promptfoo behavioral scores trend downward across consecutive runs without a prompt change

**Phase to address:** Immediately — instrument before adding new agent features.

---

### Pitfall 2: Bloom Classification Boundary Collapse

**What goes wrong:** The Bloom gating system fails at the Remember/Understand/Apply vs Analyze/Evaluate/Create boundary — exactly where NeuroGraph's neurogenesis gate lives. The LLM-as-judge that classifies Bloom level assigns "Analyze" to what is actually shallow "Understand." Result: the system creates nodes for passive recall, violating the core Active Extraction value.

**Why it happens:** Research confirms misclassifications cluster at adjacent Bloom levels — the model distinguishes remote levels (Remember vs Create) reliably, but the Analyze/Evaluate boundary is fundamentally ambiguous even for human experts. The distinction between "explaining a concept in your own words" (Understand) vs "breaking down the structure of a concept" (Analyze) is highly context-dependent.

**Specific failure modes:**
- **Paraphrasing masquerade**: The user restates a definition they read. The agent, reading confident prose, scores it Analyze. This is the highest-frequency false positive.
- **Length/confidence bias**: Long, fluent user responses receive higher Bloom ratings regardless of depth. LLMs reward surface fluency over genuine insight.
- **Single-domain calibration failure**: A Bloom classifier trained or calibrated on generic academic text may fail on NeuroGraph's domain mix (CS, math, history, philosophy). The lexical signals for "analysis" differ by domain.
- **Borderline prompt injection**: A user who has learned the system can phrase shallow understanding as "analysis" ("I'm breaking down the structure of...") and trigger neurogenesis.

**Consequences:** Graph pollution with shallow nodes. Spaced repetition system scheduling reviews for low-quality content. Core value proposition ("AI as bouncer") defeated without anyone noticing.

**Prevention:**
1. The Bouncer LLM contract must include explicit negative examples in its system prompt: "Restating a definition in different words is Understand, not Analyze — even if phrased with confidence. Do not be fooled by fluency."
2. Add a second-pass structural check: after the LLM classifies, apply a rule-based heuristic that checks for the presence of actual analytical signals (comparisons, causal claims, structural decomposition, application to novel context). If absent, downgrade to Understand regardless of LLM confidence.
3. Track the Bloom level distribution of approved nodes over time. If >40% of nodes are landing at Analyze (vs Evaluate or Create), the gate is too loose.
4. Include borderline cases in the golden suite: cases that look like Analyze but are actually Understand, and cases that look shallow but qualify. These are the cases that reveal regression fastest.

**Detection warning signs:**
- Node approval rate climbs without a corresponding change in user behavior
- Approved nodes contain no novel connections, comparisons, or structural claims — just rephrased definitions
- Graph density drops (few prerequisite links per node) despite many new nodes

**Phase to address:** Prompt engineering phase for the Bouncer and Socratic agents.

---

### Pitfall 3: DAG Prerequisite Hallucination and Cycle Injection

**What goes wrong:** The Architect (DAG agent) invents prerequisite links that do not reflect actual learning dependencies, or creates transitive chains so long that the "fog of war" ghost node system exposes irrelevant curriculum to users. Worse: it may introduce cycles that are topologically invalid (A requires B requires C requires A) even though the cycle refusal prompt is present.

**Why it happens:** Research confirms LLMs show strong performance on single-path DAG reasoning but fail systematically on multi-path disjunctive tasks and long transitive chains. Two specific failure modes:

- **Plausibility bias**: LLMs generate the most "educationally plausible" prerequisites based on training data, not the actual structural dependencies of the user's specific knowledge graph. "Linear Algebra" always precedes "Neural Networks" in textbooks — but a user who has already mastered matrix operations from a different path doesn't need the full linear algebra curriculum.
- **Context window compression**: When the existing graph has >30 nodes, the Architect must reason over a large context. Research shows multi-step reasoning quality degrades when relevant dependencies are buried in long context windows. The LLM may miss existing nodes and suggest redundant prerequisites.

**Specific failure modes:**
- Hallucinated prerequisite to a non-existent concept (ghost node pointing to nothing in the graph)
- Prerequisite chain depth > 5 (user sees 5 ghost nodes they must unlock before reaching their target — abandonable UX)
- Soft cycle: A → B → C → D → A where no individual 2-step link looks like a cycle, but the full chain creates one
- Cross-domain false prerequisites: "You need to understand thermodynamics before understanding information theory" (Shannon entropy connection plausible but not a hard prerequisite)

**Consequences:** User sees a misleading learning roadmap. Ghost nodes accumulate without ever being unlockable. The FSRS review queue becomes polluted with incorrectly connected concepts.

**Prevention:**
1. The Architect prompt must include the full current adjacency list, not just a summary. When context grows long, summarize node content but preserve the full edge list.
2. Add server-side cycle detection after every DAG update (Kahn's algorithm on the adjacency list). The LLM's cycle refusal is a first line of defense, not a guarantee — structural validation must be the second.
3. Limit Architect to proposing a maximum of 3 new prerequisite links per neurogenesis event. Unbounded output leads to hallucinated chains.
4. Add a "prerequisite confidence" field to the Architect output contract. Links below 0.8 confidence should be surfaced to the user as "suggested" ghost nodes, not injected as hard dependencies.
5. The widened vector search (0.15/10 similarity threshold) increases recall of relevant existing nodes but also increases false-positive candidate noise. Monitor precision: if >60% of candidate nodes the Architect receives are not used in its final output, the search is too broad.

**Detection warning signs:**
- Ghost node count per user exceeds 2x the active node count
- Any cycle validation errors in server logs (even one indicates the LLM cycle refusal failed)
- Prerequisite link depth > 5 anywhere in the graph
- User sessions that hit a ghost node and never return (indicates an unresolvable prerequisite chain)

**Phase to address:** DAG agent hardening — structural validation before production wiring.

---

## Moderate Pitfalls

---

### Pitfall 4: TipTap v3 Silent Content Corruption

**What goes wrong:** TipTap v3 silently strips or transforms content when the stored JSON does not match the current extension schema. This happens when extensions are added, removed, or upgraded between editor versions without a migration step.

**Why it happens:** TipTap does not validate content against its schema by default. When invalid content is detected during editor initialization, it discards the invalid marks or nodes without throwing an error or warning in the console. The `enableContentCheck` option (v3) exists but is not enabled by default.

**Specific failure modes:**
- A custom slash command extension is updated and its node type is renamed. Old saved content references the old type. On load, those nodes are silently dropped.
- The Collaboration extension (Y.js) and the standard History extension conflict. Both attempt to manage document state — only one should be active at a time. Using both causes undo/redo corruption.
- Multiple `prosemirror-model` versions installed (caused by different TipTap extensions pulling different ProseMirror versions via transitive dependencies). Node types from one version are not recognized by the other, causing silent drops at persistence time.
- The `CollaborationCaret` extension crashes when initialized with HTML content alongside tables (fixed in `@tiptap/y-tiptap@3.0.2` — but only if you are on that version or later).

**Consequences:** User neuron content is silently truncated or corrupted. Markdown editor saves an incomplete version. The user discovers missing content only after the fact, with no recovery path.

**Prevention:**
1. Enable `enableContentCheck: true` in editor initialization and wire the `onContentError` callback to a Sentry/logging call. Never let content errors fail silently.
2. Store the TipTap extension version hash alongside saved content in the database. On load, compare the hash — if mismatched, show a "content may need migration" warning before allowing edits.
3. Lock ProseMirror to a single version in `package.json` resolutions: `"prosemirror-model": "x.y.z"`. Validate with `npm ls prosemirror-model` in CI.
4. Do not use Collaboration + History simultaneously. Since NeuroGraph does not appear to use real-time collaboration, confirm History extension is used and Collaboration is excluded.
5. Write a content migration script for any slash command node type renames. Run it as a Supabase migration, not a lazy on-load patch.

**Detection warning signs:**
- User-reported "my content disappeared" issues
- `onContentError` firing in production logs
- `npm ls prosemirror-model` shows multiple versions in node_modules tree

**Phase to address:** TipTap hardening — before adding new slash commands or editor extensions.

---

### Pitfall 5: Eval Suite Drift and False Confidence

**What goes wrong:** The promptfoo eval suite achieves 100% pass rate — but the system is actually regressing in ways the suite cannot detect. The suite has become a measure of how well the system matches its own test cases, not a measure of real-world quality.

**Why it happens:** Four mechanisms cause eval suite brittleness:

- **Goodhart's Law applied to LLM evals**: Once a metric becomes the target (100% pass rate on golden cases), it ceases to be a good measure. Prompts get iteratively tuned to pass the specific test cases rather than to improve general behavior.
- **Distribution mismatch**: Golden cases written during development (v1.2) may not represent the distribution of real user inputs that arrive in v2.0. Users who have used the system for 3+ months develop distinct interaction patterns that no synthetic golden case covers.
- **LLM-as-judge circularity**: When promptfoo uses an LLM to judge outputs (llm-rubric assertions), changing the judge model version can flip pass/fail results on cases that haven't changed. The eval results are only meaningful relative to a specific judge model.
- **Overfitting to pass/fail thresholds**: A behavioral score of 0.7/1.0 that barely passes today may reflect genuine degradation. Threshold-only monitoring misses gradual quality erosion.

**Consequences:** False confidence that agent contracts are holding. Real prompt regressions go undetected until a user reports broken behavior or a qualitative review is done.

**Prevention:**
1. Retire the "100% pass rate" framing. Track score distributions over time — a passing suite where mean behavioral scores trend from 0.95 to 0.75 is a regression signal even if nothing formally fails.
2. Reserve a "quarantine" tier of golden cases: cases drawn from actual production sessions (anonymized), not synthetic inputs. Never tune prompts against this tier — it exists only to detect real-world drift.
3. Pin the judge model version in promptfoo config. Do not allow automatic updates to the judge. Treat a judge version change as a calibration event requiring full suite re-baselining.
4. Add adversarial cases to each suite: inputs specifically designed to trigger the failure modes described in this document (paraphrasing-as-analysis for Bouncer, fluent-wrong-prerequisites for Architect, answer-giving for Socratic). These cases should always fail the bad behavior and pass the correct behavior — they are regression detectors, not pass/fail metrics.
5. Refresh golden cases quarterly: add 3-5 cases per agent from real production traffic, retire 3-5 cases that no longer represent actual usage.

**Detection warning signs:**
- Mean behavioral score trends downward across 3+ consecutive runs
- All 31 cases pass with high confidence — but manual review of 5 real sessions reveals issues
- A prompt change causes >10% of cases to change score in either direction (suggests cases were written too close to the specific phrasing of the old prompt)

**Phase to address:** Eval hardening — run before any enterprise-grade prompt engineering begins.

---

### Pitfall 6: Zustand Stale Closure in Real-Time Chat State

**What goes wrong:** Event handlers and async callbacks in the chat interface capture stale Zustand state from their creation time. This is particularly acute in the streaming chat flow where Vercel AI SDK streams tokens via SSE while optimistic mutations update local state — two concurrent update paths that can race and overwrite each other.

**Why it happens:** Specific scenarios in the NeuroGraph architecture:

- **Neurogenesis trigger race**: The `onFinish` callback in `useChat` fires after streaming completes. If the user navigated away and back during streaming, the Zustand store reference in that callback is stale. The neurogenesis trigger fires against old state.
- **Optimistic queue triage + streaming chat overlap**: The queue triage UI uses optimistic mutations (shipped in v1.1). If a queue item is being crystallized while a chat session is streaming, both are writing to Zustand concurrently. Without explicit serialization, one write can shadow the other.
- **Chat message array mutation**: Vercel AI SDK's `useChat` manages its own `messages` array internally. If the app also syncs messages to Zustand (for persistence or cross-component access), the two sources of truth can diverge when streaming is interrupted and resumed.
- **Supabase Realtime subscription + Zustand**: If node state from the knowledge graph is subscribed via Supabase Realtime, updates arriving during a chat stream can trigger re-renders that create new closure contexts, invalidating callbacks registered before the update.

**Prevention:**
1. For any callback that fires after an async operation (streaming `onFinish`, Supabase subscription handlers), use `useStore.getState()` inside the callback body rather than relying on closure-captured state. This reads current state at call time.
2. Treat Vercel AI SDK's `messages` array as the single source of truth for chat state. Do not mirror it into Zustand. If cross-component access is needed, derive it from the `useChat` hook via context rather than duplicating it.
3. For the neurogenesis flow specifically: gate the neurogenesis trigger on a stable identifier (session ID + message sequence number) stored in a ref, not on Zustand state. This prevents double-triggers when state updates happen concurrently.
4. In the optimistic queue triage, cancel in-flight mutations before starting a new one (React Query pattern: `queryClient.cancelQueries`). Do not allow two optimistic updates to the same item simultaneously.
5. Add a development-mode assertion: after every streaming completion, verify that Zustand state and Vercel AI SDK state are consistent. Log divergence. Remove before production.

**Detection warning signs:**
- Neurogenesis triggering twice for a single chat completion
- Queue item state reverting to a previous value after an optimistic update
- Chat messages appearing out of order after stream interruption and reconnect
- State updates in Zustand not reflected in components subscribed to those slices

**Phase to address:** Integration testing phase — write explicit state transition tests for the streaming -> neurogenesis -> graph update pipeline.

---

## Minor Pitfalls

---

### Pitfall 7: pgvector Embedding Model Mismatch After Model Upgrade

**What goes wrong:** An embedding model upgrade (e.g., from `text-embedding-ada-002` to a newer model) silently invalidates all stored embeddings. Vector similarity searches return wrong results because old and new embeddings occupy different geometric spaces. This directly corrupts the DAG agent's vector search (which was already widened to 0.15/10 for broader recall).

**Prevention:** Version the embedding model as a column on every vector row in Supabase. Write a re-embedding job that runs as a migration. The re-embedding job must be idempotent (can be re-run safely). Never mix embeddings from different models in the same similarity query.

**Detection warning signs:** Vector search recall collapses (few candidate nodes returned despite large graph). Similarity scores cluster around 0.5 rather than showing a clear distribution.

---

### Pitfall 8: FSRS Timezone and Clock Drift in Review Scheduling

**What goes wrong:** The ts-fsrs library uses UTC for all scheduling computations. If the application layer passes local time without UTC normalization, review intervals are calculated incorrectly. A user in UTC+9 who reviews at 11 PM local time may have their next review scheduled as if they reviewed at 2 PM UTC — a 9-hour scheduling error that compounds over repeated reviews.

**Prevention:** Normalize all review timestamps to UTC at the API boundary, before they reach the FSRS scheduler. Add a server-side assertion: if the timestamp timezone offset is not zero, throw an error before passing it to FSRS. Store all `due` and `last_review` fields in the database as `TIMESTAMPTZ` with explicit UTC.

**Detection warning signs:** Users in non-UTC timezones reporting review cards appearing at unexpected times. FSRS `stability` parameter values outside the expected 0.4-200 day range for a given review count.

---

### Pitfall 9: 14-Day Chat TTL Silent Cascade

**What goes wrong:** The ephemeral 14-day chat TTL is a core design decision. But a cron job or Supabase scheduled function that hard-deletes rows may cascade-delete referenced data (images, uploaded context) that was not intended to be TTL-scoped. Alternatively, if the deletion job fails silently, stale chat history accumulates and users see old sessions that should have expired.

**Prevention:** Use soft-delete (set `expired_at` timestamp) rather than hard-delete for the TTL mechanism. Hard-delete in a separate scheduled job that runs after a verification step. Log the count of rows deleted per run. Alert on zero deletions if the graph has active users.

**Detection warning signs:** Supabase table size growing unboundedly despite TTL being "active." Users seeing chat sessions older than 14 days. Foreign key constraint errors in unrelated queries (indicates cascade deletion ran too broadly).

---

### Pitfall 10: React Flow Knowledge Graph Performance Cliff

**What goes wrong:** React Flow renders well up to approximately 100 nodes. Beyond that, re-rendering the entire graph on every Zustand state update (triggered by FSRS decay changes, new neurogenesis events, Supabase Realtime updates) causes noticeable jank. The FIRe decay visualization (terracotta color updates) is particularly expensive if it triggers full graph re-renders.

**Prevention:** Memoize React Flow node and edge arrays. Compute FIRe decay scores outside the render cycle using a stable selector, and only update nodes whose decay score has actually changed. Use React Flow's `nodesDraggable`, `nodesConnectable`, and `elementsSelectable` props to disable interactions that trigger expensive re-layout calculations when not needed.

**Detection warning signs:** Frame rate drop below 60fps when graph has >50 nodes. Re-render profiler showing full graph re-render on single node FIRe score change.

---

---

# v2.1 Milestone Pitfalls: Multi-Agent Architecture, Langfuse Observability, Async Evaluation

**Researched:** 2026-03-25
**Confidence:** MEDIUM-HIGH (Langfuse and Vercel SDK verified against official docs; async eval patterns verified via community sources)

These pitfalls are specific to the v2.1 work: adding Langfuse tracing, converting the monolithic chat endpoint into a Pure Conversationalist, introducing the Silent Observer (async Bloom evaluator), and decoupling the Architect into a dedicated endpoint.

---

## Critical Pitfalls (v2.1)

---

### Pitfall 11: Langfuse Traces Silently Dropped in Serverless Functions

**What goes wrong:** Langfuse batches trace events in a background thread with a ~2-second collection window before flushing to the API. In Vercel serverless functions (including Next.js API routes), the function runtime terminates immediately after the response is sent — before the background flush completes. The result is silent trace loss: no errors, no warnings, just missing traces in the Langfuse dashboard.

**Why it happens:** This is a fundamental mismatch between Langfuse's async batching design (optimized for long-lived processes) and the stateless, short-lived nature of serverless functions. Developers add Langfuse, see traces appearing in local development (Node.js process stays alive), then deploy to Vercel and wonder why production traces are sparse or missing entirely. The Langfuse FAQ documents this explicitly as the most common cause of missing traces.

**Consequences:** Observability is broken in the environment where it matters most — production. The entire rationale for adding Langfuse (tracing real user sessions) is defeated. Debugging production issues is impossible without trace data.

**Prevention:**
1. **Use `after()` from Next.js — but NOT on Next.js 14.** The `after()` API that schedules work after response completion only became stable in Next.js 15.1. NeuroGraph is on Next.js 14.2.x. This is a critical version gap. Two options:
   - **Option A (recommended):** Upgrade to Next.js 15.1+ before adding Langfuse. This unblocks the idiomatic `after(() => langfuse.flushAsync())` pattern.
   - **Option B:** Use Vercel's `waitUntil()` from `@vercel/functions` package directly: `import { waitUntil } from '@vercel/functions'; waitUntil(langfuse.flushAsync())`. This works on Next.js 14 but requires Vercel deployment (not self-hosted).
2. In every API route that creates Langfuse traces, call `await langfuse.flushAsync()` before returning the response as a fallback — this adds latency but guarantees delivery. Use this only for low-frequency routes (Architect endpoint). For the streaming chat route, use `waitUntil` exclusively to avoid blocking the stream.
3. Do not rely on `endOnExit: true` (Langfuse SDK default) in serverless environments. The process does not exit cleanly in Lambda-style runtimes — it freezes. Explicit flush is required.

**Warning signs:**
- Traces visible in local dev but absent in Vercel production dashboard
- Langfuse dashboard shows traces starting but never completing (span opened, no close event)
- Trace count in dashboard does not match expected request volume

**Phase to address:** Langfuse integration phase — resolve the Next.js version question before writing a single line of tracing code.

---

### Pitfall 12: Langfuse Edge Runtime Incompatibility

**What goes wrong:** If any API route that uses Langfuse is configured with `export const runtime = 'edge'`, Langfuse's Node.js SDK will fail silently or throw at runtime. Edge runtime does not support Node.js APIs (`fetch` only, no `net`, no Node timers, no background threads). Langfuse's SDK relies on Node.js background threading for its async batching mechanism.

**Why it happens:** The Vercel AI SDK documentation recommends Edge runtime for streaming endpoints as it provides lower cold-start latency. Developers add `runtime = 'edge'` to the chat route for performance, then add Langfuse tracing to the same route — the combination silently breaks tracing. The Langfuse Vercel AI SDK integration docs specifically warn against using the OpenTelemetry path with `@vercel/otel` because it does not yet support OpenTelemetry JS SDK v2.

**Consequences:** Chat streaming works, but all Langfuse traces are silently lost. The route appears healthy in logs but has zero observability.

**Prevention:**
1. Audit all API routes before Langfuse integration. Any route with `runtime = 'edge'` that will receive Langfuse instrumentation must be converted to Node.js runtime (`runtime = 'nodejs'` or removed from edge).
2. For the `/api/chat` streaming route specifically: switch to Node.js runtime. Modern Vercel Node.js serverless functions handle streaming fine and have no meaningful latency disadvantage for this use case.
3. Do not use `@vercel/otel` as the OpenTelemetry provider for Langfuse on Next.js. Use the direct Langfuse SDK (`langfuse`) or its Vercel AI SDK integration (`@langfuse/vercel-ai-sdk`) instead.

**Warning signs:**
- Langfuse traces absent for specific routes but present for others
- Console error: `The Edge runtime does not support Node.js 'net' module`
- Vercel build warning about unsupported Node.js modules in edge bundle

**Phase to address:** Langfuse integration phase — run a runtime audit before instrumenting any routes.

---

### Pitfall 13: Prompt and User Message PII Logged to Langfuse Cloud

**What goes wrong:** Langfuse by default logs the full content of every LLM call — system prompts, user messages, and model outputs. For NeuroGraph's chat sessions, this means verbatim user cognitive reflections, personal study notes, and potentially identifying context are transmitted to Langfuse Cloud servers. For an edtech product, this creates GDPR exposure and a serious trust problem.

**Why it happens:** The Langfuse SDK integration is designed to be "add and go" — it traces everything by default. The developer instructs, "Wire up Langfuse," and the immediate outcome is that all user data flows to the observability service. GDPR compliance for edtech requires explicit user consent for this type of data transfer, a Data Processing Agreement (DPA) with Langfuse, and either masking or self-hosting.

**Consequences:** GDPR violation exposure if users are EU-based. Breach of user trust if they discover their private study reflections are on a third-party cloud. Potential compliance requirement to delete all historical traces if consent infrastructure is not in place from day one.

**Prevention:**
1. **Self-host Langfuse** from the start. Langfuse is open-source (MIT) and deployable on a self-managed Postgres instance (e.g., Railway, Fly.io, or Supabase itself). This eliminates the data transfer problem entirely. For a MicroSaaS, this is the correct default choice.
2. If using Langfuse Cloud, implement a mask function during SDK initialization that redacts user message content: log token counts, Bloom level classifications, and latency — but strip the literal text of user messages. Langfuse supports this via the `mask` option at client initialization.
3. Attach a `userId` to all traces (Langfuse supports this natively). This enables GDPR right-to-erasure: when a user requests deletion, you can delete all their traces via the Langfuse API.
4. Do not log raw system prompts in production if they contain business-sensitive prompt engineering. Use metadata fields for identifiers, not prompt bodies.

**Warning signs:**
- User messages appearing verbatim in the Langfuse Cloud dashboard
- No DPA signed with Langfuse if on their Cloud plan
- Trace `input` field contains full conversation history with personal content

**Phase to address:** Langfuse integration phase — infrastructure decision (self-host vs cloud) must be made before the first trace is sent. Retrofitting masking after traces are already stored requires deletion of existing data.

---

### Pitfall 14: Silent Observer Race Condition Against Chat Stream

**What goes wrong:** The Silent Observer (async Bloom evaluator) fires a background LLM call after each user message completes. If the user types a follow-up message before the evaluator response returns, two evaluator calls can be in flight simultaneously for adjacent messages. The second evaluation may arrive before the first, updating the "Generate Neuron" button state with stale data — either flashing the button when it should not appear, or suppressing it when it should.

**Why it happens:** The evaluator is designed to be "fire and forget" — it does not block the chat stream. But its output (bloom_level, enable_generate_button) writes to shared client state (Zustand or React state). Two concurrent writes to the same state field from two independent background fetches are a classic race condition. The completion order of two 200ms Gemini Flash calls is non-deterministic.

**Consequences:** The "Generate Neuron" button flickers or shows incorrect state. In the worst case, a user clicks the generate button while the evaluator's state is stale, triggering the Architect endpoint with incomplete or incorrect cognitive context.

**Prevention:**
1. Version every evaluator response with the message sequence number. When the evaluator response arrives, check if its sequence number is still the latest. If a newer evaluation has already been dispatched, discard the stale result entirely. Never apply an out-of-order evaluation result.
2. Use a per-session evaluator lock: only allow one evaluator call per chat session at a time. If a new message arrives before the previous evaluation completes, cancel the previous evaluation (AbortController) and start fresh. This trades completeness for consistency.
3. Store the evaluator state in a ref-based structure (not reactive Zustand state) for the sequencing logic. Only push to Zustand once the correct in-order result is confirmed.
4. Debounce the evaluator trigger: if the user is typing rapidly, do not fire an evaluation after each message — wait 1-2 seconds of silence. The Bloom classification of message N-1 is less useful than message N if the user immediately continued.

**Warning signs:**
- "Generate Neuron" button appearing and disappearing rapidly during conversation
- Evaluator results in Langfuse traces showing out-of-order completion timestamps relative to message sequence
- Two concurrent evaluator API calls visible in the network tab for the same session

**Phase to address:** Silent Observer implementation phase — the sequencing logic must be built in from the start, not retrofitted.

---

### Pitfall 15: Tool Call Removal Breaking Persisted Message Rehydration

**What goes wrong:** The existing `/api/chat` endpoint uses AI SDK tool calls (`suggest_neurogenesis`) that are persisted to Supabase as part of the message metadata. When the Pure Conversationalist removes all tools from the chat endpoint, any existing chat sessions in the database that contain tool call messages will fail to rehydrate correctly — the UI expects a specific message structure that no longer exists.

**Why it happens:** The CONCERNS.md already flags persisted tool call reliability as a high-complexity risk: "If the AI SDK format changes... the UI will fail to render the In-Place Extraction UI tools correctly on reload." Removing tools is a more drastic version of this. The `useChat` hook from Vercel AI SDK re-renders the full message history from the database on session load. If a message contains a `tool-call` role that the new Pure Conversationalist does not handle, the SDK may throw, render nothing, or corrupt the message array.

**Consequences:** Users with existing chat sessions (stored in Supabase) see broken or empty conversation history after the migration. Mid-conversation users lose their session context. The neurogenesis extraction toolbar that depends on `suggest_neurogenesis` tool call messages disappears.

**Prevention:**
1. Write a Supabase migration that transforms existing `tool-call` and `tool-result` messages into assistant-role text messages before the Pure Conversationalist goes live. The transformation should preserve the intent: convert "I suggest creating a node about X" tool calls into plain assistant messages with the same content.
2. Add a schema version field to the chat sessions table. On load, check if the session schema version matches the current app version. If mismatched, run the migration client-side before passing messages to `useChat`.
3. The In-Place Extraction toolbar (highlight text → create neuron) must be redesigned to not depend on `suggest_neurogenesis` tool calls if those tools are removed. The new flow is: user reads the Conversationalist's response, decides to extract, clicks "Generate Neuron" button (illuminated by the Silent Observer). The toolbar's dependency on tool call messages must be unwired before the migration.
4. Test against a seed database with real tool-call messages from production. Do not test only against fresh sessions.

**Warning signs:**
- `useChat` throwing on session load after deployment
- In-Place Extraction toolbar disappearing from existing sessions
- Error logs showing unknown message role or tool name during history rehydration

**Phase to address:** Pure Conversationalist phase — migration scripts must be written and tested before any changes to the chat endpoint go to production.

---

### Pitfall 16: Cheap LLM Evaluator Reliability for Bloom Classification

**What goes wrong:** The Silent Observer uses Gemini Flash or GPT-4o-mini to classify Bloom cognitive level cheaply. These models exhibit systematic positional bias, verbosity bias, and self-enhancement bias in judge tasks. For Bloom classification specifically: small models misclassify adjacent levels (the exact boundary NeuroGraph cares about) more frequently than larger models, and they reward fluency over depth — exactly the failure mode described in Pitfall 2.

**Why it happens:** Research from 2025 confirms LLM judges achieve 80% agreement with human preferences on average, but performance degrades significantly at the boundaries that matter most for NeuroGraph (Understand vs Analyze). Small models (Gemini Flash, GPT-4o-mini tier) show higher Intra-Pair Instability (IPI) than frontier models — the same input evaluated twice may return different Bloom levels if phrasing varies slightly. For a background evaluator that illuminates a UI element, this instability translates directly to flickering behavior.

**Consequences:** The "Generate Neuron" button illuminates for shallow responses (false positives) or stays dark for genuinely deep insights (false negatives). False positives are the more damaging failure mode: they undermine the Bloom gating that is NeuroGraph's core value. If cheap-LLM false positive rates exceed 15-20%, the evaluator is net-negative for product integrity.

**Prevention:**
1. Do not treat the cheap evaluator as the authority on Bloom level. It is a UI hint layer, not a gate. The gate lives in the Bouncer when the user triggers the Architect. The evaluator's job is to light up a button — the Bouncer's job is to reject shallow work. Architect these as two separate contracts, not one.
2. Establish a calibration baseline before shipping: run the same 31 golden cases used for the Bouncer through the cheap evaluator model. Measure false positive rate at the Understand/Analyze boundary. If >20%, upgrade to a more capable model (the cost difference between Flash and Flash-Thinking or GPT-4o is small at this call volume).
3. Add a confidence threshold to the evaluator output contract. Only illuminate the button if the model returns Analyze/Evaluate/Create with confidence > 0.75. Below that threshold, treat as Understand (button stays dark). This converts calibration uncertainty into false negatives, which is the safer failure mode.
4. Log evaluator predictions alongside eventual Bouncer decisions to Langfuse. Track the evaluator's precision (how often "button illuminated" leads to "Bouncer approves"). If precision drops below 60%, the evaluator needs recalibration.

**Warning signs:**
- "Generate Neuron" button frequently illuminating during casual recall exchanges
- Evaluator predictions in Langfuse traces showing inconsistent levels for similar conversation depth
- Bouncer rejection rate spiking after the evaluator is live (users triggering Architect on evaluator false positives)

**Phase to address:** Silent Observer implementation phase — calibrate before wiring to UI state.

---

## Integration Gotchas (v2.1)

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Langfuse + Vercel serverless | No explicit flush — traces lost on function termination | Call `waitUntil(langfuse.flushAsync())` on every instrumented route; upgrade to Next.js 15.1 to use `after()` |
| Langfuse + Edge Runtime | Adding Langfuse to an `runtime = 'edge'` route | Convert all Langfuse-instrumented routes to Node.js runtime |
| Langfuse Cloud + edtech | User messages logged verbatim to third-party | Self-host Langfuse or implement `mask` function to strip user content before transmission |
| Silent Observer + Zustand | Two evaluator calls racing to update button state | Version responses with message sequence numbers; discard out-of-order results |
| Tool removal + existing sessions | `useChat` rehydration failing on old tool-call messages | Write Supabase migration before deployment; transform tool-call messages to assistant-role text |
| Cheap LLM evaluator + Bloom | False positives at Understand/Analyze boundary | Confidence threshold gate + Bouncer as hard gate; evaluator is hint only, not authority |
| `/api/architect` + streaming chat | Concurrent POST to Architect while chat stream is live | Disable "Generate Neuron" button while a chat stream is in progress; re-enable on `onFinish` |

---

## Performance Traps (v2.1)

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Langfuse tracing every token in streaming | 10x trace volume, dashboard becomes unusable | Trace at the span level (request start/end), not per-token; use `generationId` grouping | From first day in production with active users |
| Background evaluator on every keypress | API cost explosion, Gemini rate limits | Trigger evaluator only on `onFinish` (stream complete), not mid-stream | With users who type quickly |
| Synchronous Langfuse flush blocking stream | Added latency on every chat message | Never call `await langfuse.flush()` inside the streaming path; use `waitUntil` only | Every request |
| Langfuse trace data volume at scale | Storage costs and dashboard query slowness | Set data retention policy (30-day default); do not log full conversation history as trace input — log message IDs only | At ~1000 active sessions/day |

---

## Security Mistakes (v2.1)

| Mistake | Risk | Prevention |
|---------|------|------------|
| Langfuse public key exposed client-side | Anyone can write fake traces to your project | Langfuse public key is actually safe for client use (write-only); secret key must stay server-only — never pass to browser |
| System prompts logged to Langfuse Cloud | Prompt engineering IP exposed | Mask system prompt content or self-host; log prompt version identifier only |
| `/api/architect` endpoint without auth gate | Any authenticated user can trigger expensive architect calls arbitrarily | Rate-limit per user (5 calls/session); gate on Silent Observer state (button must be illuminated before call is accepted) |
| Evaluator results stored in unprotected Supabase table | Users can read each other's Bloom evaluation history | Apply RLS to any `bloom_evaluations` table using `auth.uid()` ownership check |

---

## "Looks Done But Isn't" Checklist (v2.1)

- [ ] **Langfuse integration:** Traces appear in local dev — but verify production traces are arriving in Vercel deployment (serverless flush is the gap)
- [ ] **Pure Conversationalist:** Tool calls removed from route — but verify existing sessions with `suggest_neurogenesis` messages still load without errors
- [ ] **Silent Observer:** Evaluator API call succeeds — but verify button state is consistent when two messages are sent in rapid succession
- [ ] **Decoupled Architect endpoint:** POST `/api/architect` returns correctly — but verify it is gated behind auth AND the Silent Observer state (not callable without button illumination)
- [ ] **Langfuse PII:** Traces flowing to dashboard — but verify user message content is masked or self-host is confirmed before any real user data is logged
- [ ] **Bloom evaluator calibration:** Evaluator returns a Bloom level — but verify false positive rate at Understand/Analyze boundary against the existing 31 golden cases

---

## Pitfall-to-Phase Mapping (v2.1)

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Langfuse traces lost in serverless (Pitfall 11) | Langfuse integration phase (Phase 1) | Verify trace count in dashboard matches request volume in Vercel logs |
| Edge runtime incompatibility (Pitfall 12) | Langfuse integration phase (Phase 1) — runtime audit before first trace | No Langfuse errors in Vercel function logs; all routes on Node.js runtime |
| PII logged to Langfuse Cloud (Pitfall 13) | Langfuse integration phase (Phase 1) — infrastructure decision before first trace | Verify user message content is absent from trace inputs in dashboard |
| Silent Observer race condition (Pitfall 14) | Silent Observer phase — sequencing built in from day one | Rapid-fire message test: send 5 messages in 2 seconds, verify button state is consistent |
| Tool removal breaking rehydration (Pitfall 15) | Pure Conversationalist phase — migration before deployment | Load 10 existing sessions with tool-call messages; verify history renders without errors |
| Cheap LLM evaluator false positives (Pitfall 16) | Silent Observer phase — calibrate before wiring to UI | Run 31 golden cases through evaluator; false positive rate at Understand/Analyze boundary < 20% |

---

## Phase-Specific Warnings (v2.1)

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Langfuse integration | Traces lost in serverless + Next.js 14 `after()` unavailable | Use `@vercel/functions` `waitUntil` or upgrade to Next.js 15.1 first |
| Langfuse integration | Edge runtime breaks Node.js SDK | Audit and convert all routes to Node.js runtime |
| Langfuse integration | User messages logged verbatim | Decide self-host vs cloud + mask function before first trace |
| Pure Conversationalist | Existing tool-call sessions break on load | Write and test migration script before any endpoint changes |
| Silent Observer | Race condition between concurrent evaluator calls | Implement sequence versioning; evaluator result is hint not gate |
| Async Bloom evaluation | Cheap LLM false positive rate too high | Calibrate against golden suite; use confidence threshold 0.75+ |
| Architect decoupling | Endpoint callable without auth + button state gate | Rate limit + dual gate: auth AND illuminated button state required |

---

## Phase-Specific Warnings (original v1.x — preserved)

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Enterprise-grade Socratic prompt engineering | Bloom boundary collapse (Pitfall 2) + prompt drift groundzero (Pitfall 1) | Establish canary eval tier before changing prompts |
| DAG agent hardening | Cycle injection under long context (Pitfall 3) | Add server-side Kahn's algorithm cycle check |
| TipTap editor production hardening | Silent content corruption on node type changes (Pitfall 4) | Enable `enableContentCheck`, lock ProseMirror version |
| Bouncer LLM wired to production | Paraphrasing masquerade false positives (Pitfall 2) | Add structural signal heuristic as second-pass check |
| Eval suite expansion | Suite overfitting and false confidence (Pitfall 5) | Add production-traffic quarantine cases, track score distributions |
| Canvas Mode / new React Flow features | Performance cliff under increased node count (Pitfall 10) | Profile before shipping; memoize node array selectors |
| Full E2E flow validation | Streaming state race in neurogenesis trigger (Pitfall 6) | Test streaming -> neurogenesis pipeline with concurrent queue mutations |
| FSRS decay / FIRe healing implementation | Timezone normalization (Pitfall 8) + performance cliff (Pitfall 10) | UTC assertion at API boundary, memoize decay selectors |

---

## Integration-Specific Pitfalls (original — preserved)

### Vercel AI SDK v6 + Zustand: The Dual Source of Truth Trap

Vercel AI SDK's `useChat` hook manages its own internal message state. If the application stores a copy of messages in Zustand for cross-component access, the two stores will diverge when: (a) a stream is interrupted and continued, (b) message history is loaded from Supabase on mount, (c) optimistic updates are applied. Rule: `useChat` owns messages. Zustand owns application UI state (panel open/closed, selected node, neurogenesis modal). Never mirror one into the other.

### promptfoo + Claude Model Updates: Judge Version Lock

NeuroGraph's eval suite uses `llm-rubric` assertions. If the judge model is updated by Anthropic without a version lock in the promptfoo config, the same test case can flip from pass to fail or vice versa with no change to the application. Rule: Treat judge model version as a pinned dependency. Document the judge model in `promptfooconfig.yaml`. Re-baseline all scores when the judge model is intentionally updated.

### pgvector Widened Search + DAG Architect: Noise Amplification

The recent widening of vector search from `(0.3, 5)` to `(0.15, 10)` increases recall but also delivers noisier candidate sets to the Architect. A weakly similar node in the candidate set may appear as a spurious prerequisite. Rule: The Architect must explicitly reject candidates below its own internal confidence threshold, even if they were returned by the vector search. Do not assume that "returned by vector search = relevant."

### TipTap v3 + Supabase Realtime: Editor State vs. Database State

If a neuron's content is being edited in TipTap while a Supabase Realtime subscription fires an update to the same row (triggered by FSRS decay or FIRe cascade), the application must resolve the conflict explicitly. Silently overwriting the editor's in-progress content with the server update will lose user edits. Rule: Hold server updates while the editor has unsaved changes (`editor.isEditable && isDirty`). Apply them after save or discard.

---

## Sources

- Bloom classification boundary ambiguity: [LLMs meet Bloom's Taxonomy (COLING 2025)](https://aclanthology.org/2025.coling-main.350/) — misclassifications cluster at adjacent levels; [Mechanistic Interpretability via Linear Probing (2026)](https://arxiv.org/html/2602.17229)
- LLM hallucination in constraint-satisfaction tasks: [Failure Modes in LLM Systems (arXiv 2511.19933)](https://arxiv.org/abs/2511.19933) — 67-94% of impossible errors are hallucinated constraints
- TipTap invalid schema handling: [TipTap Invalid Schema Guide](https://tiptap.dev/docs/guides/invalid-schema); [TipTap GitHub Releases](https://github.com/ueberdosis/tiptap/releases); [Liveblocks TipTap Best Practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips)
- Eval suite golden dataset pitfalls: [Building a Golden Dataset (Maxim AI)](https://www.getmaxim.ai/articles/building-a-golden-dataset-for-ai-evaluation-a-step-by-step-guide/); [LLM Evaluation Guide (Braintrust)](https://www.braintrust.dev/articles/llm-evaluation-guide)
- Agent nondeterminism in CI: [Measuring Agents in Production (arXiv 2512.04123)](https://arxiv.org/html/2512.04123v1)
- Prompt drift monitoring: [How to Monitor LLM Drift in Production (dasroot.net, 2026)](https://dasroot.net/posts/2026/02/monitor-llm-drift-production/); [Top 5 LLM Monitoring Tools 2026 (Confident AI)](https://www.confident-ai.com/knowledge-base/top-5-llm-monitoring-tools-for-ai)
- Prompt versioning: [Prompt Versioning Best Practices (Maxim AI, 2025)](https://www.getmaxim.ai/articles/prompt-versioning-best-practices-for-ai-engineering-teams/)
- Zustand stale closure: [pmndrs/zustand Discussion #784](https://github.com/pmndrs/zustand/discussions/784); [pmndrs/zustand Discussion #2194](https://github.com/pmndrs/zustand/discussions/2194)
- Optimistic updates race conditions: [Concurrent Optimistic Updates (TkDodo)](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- pgvector embedding versioning: [pgvector Deep Dive (Severalnines)](https://severalnines.com/blog/vector-similarity-search-with-postgresqls-pgvector-a-deep-dive/)
- Langfuse serverless flush: [Langfuse — Serverless Functions FAQ](https://langfuse.com/faq/all/aws-lambda-and-serverless-functions); [Langfuse Missing Traces FAQ](https://langfuse.com/faq/all/missing-traces); [Langfuse Queuing/Batching Docs](https://langfuse.com/docs/observability/features/queuing-batching)
- Langfuse edge runtime and Next.js setup: [Langfuse Vercel AI SDK Integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk); [Vercel AI SDK Observability — Langfuse](https://ai-sdk.dev/providers/observability/langfuse)
- Langfuse privacy and GDPR: [Langfuse Managing Personal Data](https://langfuse.com/security/manage-personal-data); [Langfuse GDPR Compliance](https://langfuse.com/security/gdpr); [Langfuse Advanced Features — mask function](https://langfuse.com/docs/observability/sdk/advanced-features)
- LLM judge bias and small model reliability: [LLM-as-a-Judge biases (Sebastian Sigl, 2025)](https://www.sebastiansigl.com/blog/llm-judge-biases-and-how-to-fix-them); [A Survey on LLM-as-a-Judge (arXiv 2411.15594)](https://arxiv.org/html/2411.15594v6)
- Next.js `after()` API availability: [Next.js 15.1 Blog Post](https://nextjs.org/blog/next-15-1); [Next.js `after()` API Reference](https://nextjs.org/docs/app/api-reference/functions/after)
- Vercel `waitUntil`: [waitUntil is now available for Vercel Functions](https://vercel.com/changelog/waituntil-is-now-available-for-vercel-functions); [What is waitUntil (Inngest)](https://www.inngest.com/blog/vercel-cloudflare-wait-until)
- Vercel Edge Runtime streaming: [UI Update Failure in Production with AI SDK on Vercel Edge Runtime (GitHub issue #2131)](https://github.com/vercel/ai/issues/2131)
