# Project Research Summary

**Project:** NeuroGraph v2.0 MVP Core Stability
**Domain:** Cognitive MicroSaaS — Graph-based AI Tutoring Platform
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

NeuroGraph is a production AI tutoring platform built on a well-established but fragile stack: Next.js 14, Vercel AI SDK v6, Supabase/pgvector, TipTap v3, React Flow, and Zustand. The v2.0 milestone is a production hardening sprint — no new features, only making existing features work reliably at scale. The research establishes that the system's architecture is sound and its agent contracts are pedagogically grounded, but the codebase has a consistent pattern of missing error handling across every major subsystem: AI calls have no timeouts, no retry logic, and no typed error handling; the TipTap editor has a reproducible content sync race bug; the knowledge graph re-renders expensively on every state change; and the most critical reliability bug is a post-insert failure path that can return a 500 error to the client while the neuron already exists in the database.

The recommended approach is to address reliability in a clear build order: AI call hardening first (since it involves no React dependencies and the consequences of getting it wrong are silent production 500s), then editor reliability (independent, can be parallelized), then graph performance (sequential — each change depends on the prior), then Supabase-level fixes requiring schema migrations last. Alongside code changes, prompt engineering is a first-class concern: the Socratic agent lacks Khanmigo-proven calibration patterns (mistake handling, Goldilocks edge, anti-loop variation), the Bouncer has no explicit output contract to prevent JSON contamination, and the Architect produces flat Bloom distributions. These are all pure prompt changes — testable immediately via the existing promptfoo golden suite.

The key risks are behavioral rather than technical: prompt drift and Bloom classification boundary collapse are the two failure modes most likely to go undetected, because they do not produce errors — they silently degrade pedagogical quality. The mitigation is instrumentation before hardening: establish canary eval tiers, add behavioral production metrics (neurogenesis acceptance rate, Bloom distribution, DAG link count), and track score distributions over time rather than relying on binary pass/fail thresholds.

---

## Key Findings

### Recommended Stack

The stack requires no new dependencies for v2.0. All hardening is achievable with packages already installed. The Vercel AI SDK v6 (`ai@6.0.82`) exposes `NoObjectGeneratedError`, `APICallError`, `maxRetries`, `abortSignal`, and `onError` as production-ready APIs — they are simply not used in the current codebase. `AbortSignal.timeout()` is a Node.js 18+ built-in. `React.memo` is already available. `onlyRenderVisibleElements` is in `@xyflow/react@12.10.0`. `editor.getJSON()` and `setContent(content, false)` are in `@tiptap/react@3.20.4`.

**Core technologies and v2.0 hardening role:**
- `ai@6.0.82` (Vercel AI SDK v6) — add `maxRetries`, `abortSignal`, `onError`, typed error narrowing to all 4 AI call sites
- `@tiptap/react@3.20.4` — standardize on `getJSON()`, fix `setContent` emission default change (v3 breaking change), fix content sync race on neuron switch
- `@xyflow/react@12.10.0` — add `onlyRenderVisibleElements`, wire existing but unused `layout.worker.ts`, wrap node components in `React.memo`
- `promptfoo@0.121.2` — add multi-turn sequencing tests, `llm-rubric` anti-repetition assertions, `conversation-relevance`, Bloom distribution assertions, Bouncer confidence calibration
- `zustand@5.0.11` — add batch retrievability update action, abort controller for load loop, horizon loading orphan guard
- `@supabase/supabase-js@2.95.3` — make post-insert `find_similar_neurons` failure non-fatal; add `SET LOCAL statement_timeout` in Postgres function; add RPC retry helper

### Expected Features

This milestone is a hardening sprint, not a feature sprint. The research maps existing features against production standards and identifies specific gaps.

**Must have — behavioral table stakes for AI tutoring agents:**
- Never-give-answers enforcement — core Socratic contract; partially present, needs explicit edge case rules
- One-question-at-a-time discipline — present but not strictly enforced
- Calibrated question difficulty (Khanmigo Goldilocks pattern) — missing entirely from CHAT_SYSTEM_PROMPT
- Mistake handling without correction — missing; must not correct errors directly, must ask "how did you get there"
- Anti-loop variation — missing; LLMs repeat question types across turns without explicit instruction
- Structured output resilience — `NoObjectGeneratedError` handling absent at all 3 `generateObject` call sites
- Cycle detection as hard server-side guarantee — present in code (DFS), but LLM refusal is first line only, not sufficient on its own

**Should have — differentiators NeuroGraph can activate now:**
- Bloom real-time depth indicator — client-side keyword scan plus neurogenesis tool call as high-confidence update; zero additional API calls required
- Bloom escalation prompting — agent actively pulls user from Understand to Analyze; prompt-only change
- Neurogenesis priming language — "that's an insight worth preserving"; prompt-only change
- Knowledge-graph-aware enrichment explicitly instructed — RAG context already injected but prompt does not name it
- Meta-question technique — prompt addition: "what assumption is underneath that claim"
- Bloom progress tracking via inline `[BLOOM:Level]` marker — parseable by `onFinish`, zero extra API calls

**Defer to v2.1+:**
- Per-session Bloom trajectory log — requires new data model and schema migration
- Multi-model fallback — adds dependency; no production failure data to justify yet
- Fine-tuned Bloom classifier — requires curated training data pipeline
- Duolingo-style persistent "List of Facts" across sessions — significant architecture change; current RAG covers the core need
- TipTap content storage migration from HTML to JSON — correct long-term direction but requires migration of all existing `neuron.content` rows

### Architecture Approach

All hardening follows a consistent architectural pattern: separate concerns by failure domain. AI call failures are handled at the route handler level with typed SDK errors and should never surface as opaque 500s. Editor state has a single serialization format and a single content sync trigger (`neuron.id` change, not focus state). Graph state has one batched update path for retrievability and an off-thread layout worker for dagre. Supabase calls have explicit non-fatal vs. fatal designations — the post-insert similarity search is non-fatal because the neuron already exists; the pre-insert embedding call is fatal because the neuron cannot be stored without its vector.

**Major components and their v2.0 hardening responsibilities:**
1. **AI Route Handlers** (`/api/chat`, `/api/architect`, `/api/neurons/extract`, `/api/neurons/ai-action`) — `maxRetries`, `abortSignal`, `onError`, typed `NoObjectGeneratedError`/`APICallError` handling at all 4 call sites
2. **Prompt Engineering Layer** (`src/lib/ai/prompts.ts`) — Bouncer output contract, Architect Bloom distribution policy, Chat calibrated difficulty + mistake handling + anti-repetition + Bloom marker, DAG comprehension test + boundary examples + topological self-check
3. **TipTap Editor Components** (`LiquidDocumentEditor`, `NeuronTipTapEditor`) — unified neuron-switch effect keyed on `neuron.id`, `setContent(content, false)` to prevent false update emissions, shared `BASE_EXTENSIONS` constant, `enableContentCheck: true`
4. **React Flow Graph** (`GraphPanel`, `NeuronNode`, `GhostNeuronNode`, `SynapseEdge`) — `React.memo` on all custom node/edge types, `onlyRenderVisibleElements`, layout worker wiring (fix `rankdir: LR → TB` mismatch first), batched retrievability updates
5. **Zustand Stores** (`graphStore`, via `GraphPanel`) — `batchUpdateNodeRetrievability` action, abort controller for `loadGraph` async loop, horizon loading orphan guard on unmount
6. **Supabase Layer** (`neurons/route.ts`, `rpc-retry.ts`, SQL migration) — non-fatal post-insert similarity search, RPC retry helper, `SET LOCAL statement_timeout = 8000` in `find_similar_neurons` function
7. **promptfoo Eval Suite** (`prompt-eval/`) — multi-turn test cases, `llm-rubric` anti-repetition, `conversation-relevance`, Bloom distribution assertion, Bouncer confidence calibration

### Critical Pitfalls

1. **Silent prompt drift eroding agent contracts** — Prompts degrade without triggering errors. The Socratic agent starts giving hints; the Bouncer accepts shallow summaries. Mitigation: establish canary eval tier (5–10 cases per agent that must pass 100% at all times), run promptfoo in CI on every prompt change, track Bloom distribution and neurogenesis acceptance rate as behavioral production metrics.

2. **Bloom classification boundary collapse** — The Analyze/Understand boundary is the most failure-prone in research literature. LLMs reward fluent prose over genuine insight ("paraphrasing masquerade"). Mitigation: add negative examples explicitly to Bouncer prompt ("restating a definition is Understand, not Analyze — even if phrased with confidence"), add second-pass structural heuristic for analytical signals, track node Bloom level distribution over time.

3. **DAG prerequisite hallucination and cycle injection** — LLMs generate plausible-sounding prerequisites that are not actual learning dependencies, especially under long context (>30 nodes). The LLM cycle refusal prompt is not a guarantee. Mitigation: server-side Kahn's algorithm cycle check after every DAG update, cap Architect at 3 new prerequisite links per neurogenesis event, comprehension test formulation in system prompt.

4. **Post-insert RPC failure creating duplicate neurons** — The `find_similar_neurons` call at `neurons/route.ts ~line 168` runs after the neuron is inserted. If it fails, the current code returns 500 to the client — the user retries and creates a duplicate. This is the single highest-priority reliability fix in the codebase. Mitigation: make the post-insert call non-fatal; return success with empty arrays if it fails.

5. **Eval suite false confidence (Goodhart's Law on evals)** — A 100% pass rate on golden cases can mask real behavioral regression. Cases get tuned to pass specific phrasings, not to detect general behavior. Mitigation: retire binary pass/fail framing, track score distributions across runs, add adversarial cases designed to catch specific failure modes, never tune prompts against the quarantine tier.

---

## Implications for Roadmap

Based on combined research, the natural build order is four sequential phases, each a prerequisite for the next in terms of safety and testability. The AI and prompt work can be validated in isolation via promptfoo; the editor and graph work can be validated via manual testing; the Supabase work requires a staging migration before production deployment.

### Phase 1: AI Reliability and Prompt Hardening

**Rationale:** The AI call sites are the highest risk surface — silent production 500s, stale hanging requests under Vercel's function limits, and no error type discrimination. Fixing these first means all subsequent testing of prompts and behavior happens on a stable foundation. Prompt engineering belongs here because prompts and their eval suite must be validated before graph and editor work begins — the Architect and Bouncer prompts directly affect the quality of data flowing into the graph.

**Delivers:** Production-resilient AI calls with typed error handling, user-readable error messages, timeout bounds on all LLM calls, hardened Socratic/Bouncer/Architect/DAG prompts with Khanmigo patterns, and an expanded promptfoo eval suite with multi-turn tests, behavioral assertions, and Bloom distribution checks.

**Addresses (from FEATURES.md):**
- CHAT_SYSTEM_PROMPT: calibrated difficulty, mistake handling, anti-loop variation, meta-question, neurogenesis priming, Bloom marker, anti-repetition
- Bouncer prompt: output contract, negative Bloom boundary examples
- Architect prompt: Bloom distribution policy
- DAG/inferPrerequisites prompt: comprehension test, 4-example boundary set, topological self-check, domain calibration
- All `generateObject` call sites: `maxRetries`, `abortSignal`, `NoObjectGeneratedError` handling
- All `streamText` call sites: `onError`, `abortSignal`, `maxRetries`, `onFinish` guard

**Avoids:** Silent production 500s (Pitfall 1 root infrastructure), Bloom boundary collapse before production (Pitfall 2), Goodhart's Law on evals (Pitfall 5).

**Research flag:** No additional research needed. All Vercel AI SDK v6 error handling APIs are HIGH confidence from official docs. Khanmigo patterns are from a publicly disclosed source.

---

### Phase 2: Editor Reliability

**Rationale:** The TipTap content sync race bug is reproducible and corrupts UX — a user switching neurons while focused sees wrong content until they blur the editor. This is independent of Phase 1 and can be built in parallel, but is logically ordered here because it affects the data quality of everything the Architect and Bouncer process. Fixing it before graph work ensures the content fed into AI calls is authoritative.

**Delivers:** Correct neuron content on every navigation event regardless of focus state; `enableContentCheck` surfacing schema drift before it corrupts user data; shared `BASE_EXTENSIONS` constant preventing schema mismatch between editor contexts.

**Addresses (from ARCHITECTURE.md §3):**
- `LiquidDocumentEditor`: unified `neuron.id`-keyed effect replacing two conflicting effects, `setContent(content, false)` to prevent false update event emission (TipTap v3 breaking change)
- Both editors: `enableContentCheck: true`, `onContentError` logging
- New file `src/lib/editor/extensions.ts`: shared base extension set

**Avoids:** TipTap silent content corruption (Pitfall 4), content sync race corrupting editor state on fast neuron navigation.

**Research flag:** No additional research needed. TipTap v3 APIs are HIGH confidence from official docs and confirmed by direct codebase audit.

---

### Phase 3: Graph Performance

**Rationale:** React Flow performance work must be sequential: `React.memo` on node components first, then the batch update store action, then the layout worker `rankdir` fix, then all `GraphPanel.tsx` changes that depend on them. The `onlyRenderVisibleElements` flag has a known edge rendering bug (GitHub #4516) that must be tested with a real large graph before shipping. This phase is ordered after editor work because the graph performance changes require a coherent test environment with valid editor data.

**Delivers:** Graph rendering that maintains 60fps at 200 nodes; dagre layout off the main thread via the existing but unwired layout worker; batch retrievability updates that trigger 1 re-render per minute instead of N; abort controller preventing stale data from writing to the store after unmount; horizon loading orphan guard preventing a permanent spinner on navigate-away.

**Addresses (from ARCHITECTURE.md §4 and §6):**
- `NeuronNode.tsx`, `GhostNeuronNode.tsx`, `SynapseEdge.tsx`: `React.memo`
- `graphStore.ts`: `batchUpdateNodeRetrievability` action
- `layout.worker.ts`: fix `rankdir: LR → TB`
- `GraphPanel.tsx`: wire layout worker, enable `onlyRenderVisibleElements`, batch retrievability, abort controller, horizon orphan guard

**Avoids:** React Flow performance cliff at 50–100 nodes (Pitfall 10), Zustand stale closure in async callbacks (Pitfall 6).

**Research flag:** `onlyRenderVisibleElements` requires hands-on testing with a real 100+ node graph before shipping — the edge rendering bug (GitHub #4516) is confirmed but reproduction conditions are not fully documented. Flag for validation step before this phase closes.

---

### Phase 4: Supabase Reliability

**Rationale:** Supabase work is ordered last because it requires a database migration (not trivially reversible) and the most critical fix — making the post-insert similarity search non-fatal — is a semantic change to the API contract that should be made after all other reliability work is stable and testable. The `SET LOCAL statement_timeout` migration requires staging validation before production deployment.

**Delivers:** Elimination of the duplicate-neuron creation bug (most critical reliability issue in the codebase); RPC retry helper for pre-insert calls; 8-second statement timeout override in `find_similar_neurons` to prevent pgvector cold-start failures on large vector sets.

**Addresses (from ARCHITECTURE.md §5):**
- `api/neurons/route.ts ~line 168`: post-insert `find_similar_neurons` made non-fatal — return `{ neuron, prerequisite_links: [], projected_ghosts: [] }` on RPC failure
- New `src/lib/db/rpc-retry.ts`: generic retry helper for pre-insert calls (bouncer)
- Supabase SQL migration: `SET LOCAL statement_timeout = '8000'` in `find_similar_neurons` function body

**Avoids:** Duplicate neuron creation from client retry after false 500 (most critical reliability bug), pgvector cold-start timeout on large graphs.

**Research flag:** The `SET LOCAL statement_timeout` workaround is MEDIUM confidence (confirmed in Supabase community discussion, not in primary docs). Validate in staging before applying to production. The non-fatal post-insert fix is HIGH confidence and can be shipped independently of the migration.

---

### Phase Ordering Rationale

- AI before Editor: prompt changes must be validated via promptfoo before editor and graph work begins; a broken prompt contract invalidates quality assessments of data flowing through the system
- Editor before Graph: the editor produces content that feeds AI calls and ultimately the graph; fixing the content sync race ensures graph data is authoritative during performance testing
- Graph before Supabase: graph performance depends on the volume and quality of node data; stable data from phases 1 and 2 makes performance testing meaningful
- Supabase last: database migrations have the highest rollback cost; all application-layer work should be stable before touching the schema
- Eval suite expanded in Phase 1 not Phase 4: the eval suite is the safety net for all prompt changes; it must be hardened before prompt engineering begins

### Research Flags

Phases requiring hands-on validation during execution (not additional pre-work research):
- **Phase 3 (Graph):** `onlyRenderVisibleElements` edge rendering bug requires live testing with a real 100+ node graph before the flag ships. Cannot be confirmed from documentation alone.
- **Phase 4 (Supabase):** `SET LOCAL statement_timeout` workaround requires staging database validation. The non-fatal post-insert fix is safe to ship immediately without staging.

Phases with well-documented, HIGH-confidence patterns (no additional research needed):
- **Phase 1 (AI Reliability):** All Vercel AI SDK v6 error handling APIs are verified from official reference docs. Khanmigo patterns are sourced from the publicly disclosed system prompt.
- **Phase 2 (Editor):** TipTap v3 content sync fix is confirmed by direct code audit and official TipTap v3 docs. The `neuron.id`-keyed unified effect is a standard React pattern.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new packages needed. All v2.0 changes use existing APIs verified against official docs. Package versions confirmed directly from `package.json`. |
| Features | HIGH | Features mapped against direct codebase audit. Khanmigo patterns from publicly disclosed source. Bloom research from peer-reviewed 2024–2025 papers. |
| Architecture | HIGH | Every recommendation grounded in direct file-by-file code audit with specific line numbers. Build order validated against actual dependency graph. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls confirmed from multiple corroborating sources. Two Supabase-specific findings (statement timeout override) are MEDIUM — community-confirmed but not in primary docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **`onlyRenderVisibleElements` edge rendering bug (Phase 3):** GitHub issue #4516 confirms the bug exists but does not fully document reproduction conditions. Must test with a real large graph before shipping Phase 3. Go/no-go decision at end of Phase 3.
- **Supabase `SET LOCAL statement_timeout` (Phase 4):** Community-confirmed workaround but not in primary Supabase docs. Requires staging validation before production migration.
- **Bloom real-time UI indicator design:** No established production pattern exists in any edtech platform. The 6-step indicator design is original — needs UX validation with real users before treating as final. Defer visual design decisions to implementation.
- **TipTap JSON migration (deferred to v2.1):** The research recommends migrating `neuron.content` from HTML to JSON. This requires a migration script and careful validation of all existing content rows. Flag as a v2.1 priority.
- **Eval judge model version pinning:** The promptfoo `llm-rubric` judge model is not currently pinned in the config. Before shipping Phase 1 eval changes, the judge model version must be pinned and current scores baselined to prevent score drift from silent judge model updates.

---

## Sources

### Primary (HIGH confidence)
- [AI SDK Core: generateObject reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) — `maxRetries`, `abortSignal`, `experimental_repairText`, `NoObjectGeneratedError`
- [AI SDK Core: streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) — `onError`, `abortSignal`, `maxRetries`
- [AI SDK Core: Error Handling](https://ai-sdk.dev/docs/ai-sdk-core/error-handling) — typed error exports, stream error swallowing pattern
- [AI SDK Errors: AI_NoObjectGeneratedError](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-object-generated-error) — type guard API shape confirmed
- [AI SDK 4.1 release: NoObjectGeneratedError](https://vercel.com/blog/ai-sdk-4-1) — stable export confirmation
- [GitHub issue #4726: stream functions fail silently](https://github.com/vercel/ai/issues/4726) — `onError` necessity confirmed
- [Khanmigo Lite system prompt](https://gist.github.com/25yeht/c940f47e8658912fc185595c8903d1ec) — calibrated difficulty, mistake handling, Goldilocks edge patterns; corroborated by multiple GitHub repositories
- [TipTap: Export to JSON and HTML](https://tiptap.dev/docs/guides/output-json-html) — `getJSON()` as source of truth
- [TipTap: setContent command](https://tiptap.dev/docs/editor/api/commands/content/set-content) — `emitUpdate` default change in v3
- [TipTap: Invalid Schema Handling](https://tiptap.dev/docs/guides/invalid-schema) — `enableContentCheck` API
- [TipTap 3.0 Stable Release Notes](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) — v3 breaking changes confirmed
- [React Flow: Performance](https://reactflow.dev/learn/advanced-use/performance) — `onlyRenderVisibleElements`, `React.memo` requirement, FPS improvement data
- [promptfoo: Conversation Relevance](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/conversation-relevance/) — assertion type confirmed
- [promptfoo: LLM Rubric](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/) — threshold parameter
- [promptfoo: Chat Conversations — storeOutputAs](https://www.promptfoo.dev/docs/configuration/chat/) — multi-turn var injection
- [Learning Analytics with Bloom's Taxonomy — MDPI Computers 2024](https://www.mdpi.com/2073-431X/14/12/555) — Bloom classification accuracy at boundary levels; micro-F1 0.814 for GPT-4o-mini
- [LLMs meet Bloom's Taxonomy — COLING 2025](https://aclanthology.org/2025.coling-main.350/) — misclassification clustering at adjacent levels confirmed
- [DAG-Math: Graph-Guided Mathematical Reasoning — ICLR 2025](https://arxiv.org/html/2510.19842v1) — topological self-check pattern for LLM DAG reasoning
- [LLM-Powered Construction of Course Knowledge-Competency Graphs — ACM ETAI 2025](https://dl.acm.org/doi/10.1145/3766557.3766569) — DAG prerequisite inference patterns

### Secondary (MEDIUM confidence)
- [GitHub issue #4516: onlyRenderVisibleElements edge rendering bug](https://github.com/xyflow/xyflow/issues/4516) — confirmed but reproduction conditions not fully documented
- [Supabase: API statement timeout discussion #27421](https://github.com/orgs/supabase/discussions/27421) — `SET LOCAL statement_timeout` workaround; community-confirmed
- [Synergy Codes: React Flow performance guide](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance) — FPS improvement numbers corroborate official docs
- [TipTap GitHub issue #4828: Update event triggered unexpectedly](https://github.com/ueberdosis/tiptap/issues/4828) — `setContent` false arg behavior
- [AI SDK Core: Settings (timeout, abortSignal)](https://ai-sdk.dev/docs/ai-sdk-core/settings) — `abortSignal` prop documented; Vercel 55s/60s convention is community practice
- [Mechanistic Interpretability via Linear Probing (2026)](https://arxiv.org/html/2602.17229) — Bloom classification approach corroboration
- [Measuring Agents in Production (arXiv 2512.04123)](https://arxiv.org/html/2512.04123v1) — agent nondeterminism in CI; eval suite brittleness
- [Building a Golden Dataset (Maxim AI)](https://www.getmaxim.ai/articles/building-a-golden-dataset-for-ai-evaluation-a-step-by-step-guide/) — eval suite golden dataset pitfalls
- [Prompt Versioning Best Practices (Maxim AI 2025)](https://www.getmaxim.ai/articles/prompt-versioning-best-practices-for-ai-engineering-teams/) — prompt drift monitoring

### Tertiary (LOW confidence)
- [The Socratic Prompt — Towards AI](https://pub.towardsai.net/the-socratic-prompt-how-to-make-a-language-model-stop-guessing-and-start-thinking-07279858abad) — meta-questioning technique; single practitioner article, corroborated by Khanmigo source

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
