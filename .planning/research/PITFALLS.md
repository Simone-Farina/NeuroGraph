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

## Phase-Specific Warnings

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

## Integration-Specific Pitfalls

These pitfalls arise specifically from the combination of technologies in NeuroGraph, not from any single technology in isolation.

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
