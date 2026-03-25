# Roadmap: NeuroGraph 2.0

## Milestones

- [x] **v1.0 MVP** — Phases 1-4 (shipped 2026-03-22) [archived](milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Staging Area** — Phases 5-9 (shipped 2026-03-23) [archived](milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Agent Intelligence** — Phases 10-13 (shipped 2026-03-24) [archived](milestones/v1.2-ROADMAP.md)
- [x] **v1.3 QA Refinement** — Phases 14-15 (shipped 2026-03-24) [archived](milestones/v1.3-ROADMAP.md)
- [x] **v1.4 QA Refinement II** — Phases 16-17 (shipped 2026-03-24) [archived](milestones/v1.4-ROADMAP.md)
- [x] **v2.0 MVP Core Stability** — Phases 18-21 (shipped 2026-03-24) [archived](milestones/v2.0-ROADMAP.md)
- [ ] **v2.1 Core Flow Stability, Multi-Agent Architecture & Observability** — Phases 22-25 (in progress)

---

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-22</summary>

- [x] **Phase 1: Knowledge Quality & Ephemerality** - AI bouncer, duplicate prevention, 14-day TTL
- [x] **Phase 2: Graph Pedagogy** - Strict DAG layout, prerequisite enforcement
- [x] **Phase 3: Rigorous Retention** - FSRS-6 engine, Upward FIRe healing, Soft-FIRe decay UI
- [x] **Phase 4: Advanced AI Markdown Editor** - TipTap WYSIWYG, slash commands, Bouncer bubble menu

</details>

<details>
<summary>v1.1 Staging Area (Phases 5-9) — SHIPPED 2026-03-23</summary>

- [x] **Phase 5: Data Layer & Auth Foundation** - knowledge_queue schema, user_api_keys, RLS
- [x] **Phase 6: Capture API & Key Management** - iOS Shortcuts endpoint, bearer auth, key CRUD UI
- [x] **Phase 7: Queue Triage UI** - Editorial queue page, optimistic mutations, sidebar badge
- [x] **Phase 8: Crystallize Flow** - URL extraction → AI summary → Socratic chat → auto-mastered
- [x] **Phase 9: UI Polish & Design System** - Editorial prose, dynamic layout, motion language

</details>

<details>
<summary>v1.2 Agent Intelligence (Phases 10-13) — SHIPPED 2026-03-24</summary>

- [x] **Phase 10: Promptfoo Evaluation Harness** - 31-case golden suite, per-agent CI eval contracts
- [x] **Phase 11: DAG Manager Agent** - Architect prompt contract, cycle refusal, horizon ghost nodes
- [x] **Phase 11.5: Horizon UI & DAG Wiring** - Ephemeral ghost curriculum, briefing panel
- [x] **Phase 12: Chat Analyzer / Bouncer Agent** - Dual-purpose bouncer, duplicate rejection, insight extraction
- [x] **Phase 13: Socratic Chat Engine** - Bloom-gated Neurogenesis (Analyze+ only), suggest_neurogenesis tool

</details>

<details>
<summary>v1.3 QA Refinement (Phases 14-15) — SHIPPED 2026-03-24</summary>

- [x] **Phase 14: Backend AI Correctness** - Architect schema fix, Bloom gate enforcement, DAG wiring widening, legacy edge cleanup (completed 2026-03-24)
- [x] **Phase 15: UI/UX Polish & Security** - Layout reset, Learning Target redesign, stuck spinners, Handle dots, API key masking (completed 2026-03-24)

</details>

<details>
<summary>v1.4 QA Refinement II (Phases 16-17) — SHIPPED 2026-03-24</summary>

- [x] **Phase 16: Socratic Agent Redesign** - Teach-then-ask prompt, scoreSocraticTone teaching dimension, 34-case eval suite (completed 2026-03-24)
- [x] **Phase 17: Horizon & Crystallize UI Fixes** - Paste state cleanup, compact HorizonControls, TB ghost layout, delayed shell preset (completed 2026-03-24)

</details>

<details>
<summary>v2.0 MVP Core Stability (Phases 18-21) — SHIPPED 2026-03-24</summary>

- [x] **Phase 18: AI Reliability** - Typed error handling, timeouts, and retry logic across all AI call sites (completed 2026-03-24)
- [x] **Phase 19: Enterprise Prompt Engineering** - Khanmigo patterns, comprehension-test DAG heuristic, expanded eval suite (completed 2026-03-24)
- [x] **Phase 20: Editor Reliability** - TipTap content sync race fix, serialization standardized to getJSON (completed 2026-03-24)
- [x] **Phase 21: Graph Performance & Bloom UI** - React.memo on nodes, onlyRenderVisibleElements, real-time Bloom depth indicator (completed 2026-03-24)

</details>

---

### v2.1 Core Flow Stability, Multi-Agent Architecture & Observability (Phases 22-25) — In Progress

**Milestone Goal:** Deconstruct the monolithic chat endpoint into an Asynchronous Multi-Agent Architecture with deep LLM observability — fix the core loop, no new product features.

- [x] **Phase 22: Observability Foundation** - Langfuse Cloud integration, OpenTelemetry spans across all AI call sites, session/user trace correlation (completed 2026-03-25)
- [ ] **Phase 23: Pure Conversationalist** - Strip tool-calling from /api/chat, rewrite as natural Socratic tutor, DB migration for persisted tool-call messages, conversationalist eval suite
- [ ] **Phase 24: Silent Observer** - Async Bloom Evaluator (Gemini Flash), Zustand bloomLevel state, Generate Neuron button illumination, Bloom eval suite
- [ ] **Phase 25: Decoupled Architect Pipeline** - POST /api/architect 3-step pipeline (Synthesizer → RAG → Inquisitor), independent Langfuse spans per step, non-blocking React Flow update

---

## Phase Details

### Phase 18: AI Reliability
**Goal**: Every AI call site is resilient — timeouts bound LLM calls, retries handle transient failures, typed errors surface actionable messages instead of opaque 500s, and the neurons route never returns 500 after a successful insert
**Depends on**: Phase 17
**Requirements**: AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):
  1. A failing AI stream (simulated network drop) logs a structured error and the user sees a recoverable error message — not a blank screen or silent hang
  2. Any `generateObject` call that times out after 25 seconds returns a typed `APICallError` or `NoObjectGeneratedError` — never an unhandled promise rejection
  3. Creating a neuron succeeds even when the post-insert vector search (`find_similar_neurons`) fails — the neuron appears in the graph and no 500 is returned to the client
  4. All four AI call sites (`/api/chat`, `/api/architect`, `/api/neurons/extract`, `/api/neurons/ai-action`) have `maxRetries: 2` and `AbortSignal.timeout(25000)` applied
**Plans:** 2/2 plans complete

Plans:
- [x] 18-01-PLAN.md — Harden generateObject call sites (AI-02) + neurons route resilience (AI-03)
- [x] 18-02-PLAN.md — Harden streamText call sites with onError (AI-01)

### Phase 19: Enterprise Prompt Engineering
**Goal**: All AI agent prompts meet enterprise pedagogical standards — the Socratic agent uses Khanmigo-proven calibration patterns, the DAG agent uses a comprehension-test heuristic with boundary examples, and the eval suite validates behavioral correctness (not just structural output)
**Depends on**: Phase 18
**Requirements**: PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04
**Success Criteria** (what must be TRUE):
  1. The Socratic chat agent handles a user mistake by asking "how did you get there" — not by correcting the answer directly
  2. The DAG agent's `inferPrerequisites` refuses to link two nodes when removing one does not make the other incomprehensible (comprehension test boundary)
  3. Server-side Kahn's algorithm rejects a cyclic prerequisite chain even when the LLM prompt compliance fails
  4. The promptfoo eval suite passes 42+ cases (up from 34), including multi-turn neurogenesis priming and Bloom distribution behavioral assertions
**Plans:** 2/2 plans complete

Plans:
- [x] 19-01-PLAN.md — Khanmigo prompt patterns + comprehension test heuristic + Kahn's algorithm (PROMPT-01, PROMPT-02, PROMPT-03)
- [ ] 19-02-PLAN.md — Eval suite expansion to 42+ cases with behavioral assertions (PROMPT-04)

### Phase 20: Editor Reliability
**Goal**: The TipTap editor displays correct neuron content on every navigation event, regardless of focus state, and all editor components share a single serialization format
**Depends on**: Phase 18
**Requirements**: EDITOR-01, EDITOR-02
**Success Criteria** (what must be TRUE):
  1. Switching between neurons while the editor is focused always displays the newly selected neuron's content — stale content from the previous neuron never persists
  2. All content saved through any editor component is stored as TipTap JSON (`getJSON()`) — no mixed HTML/plain-text formats in new saves
  3. A schema mismatch between editor extensions (e.g., after an upgrade) surfaces an `onContentError` log entry rather than silently corrupting the document
**Plans:** 1/1 plans complete

Plans:
- [x] 20-01-PLAN.md — Fix content sync race + standardize serialization to getJSON (EDITOR-01, EDITOR-02)

### Phase 21: Graph Performance & Bloom UI
**Goal**: The knowledge graph renders at 60fps at scale and the chat interface gives users real-time cognitive depth feedback via a Bloom-level indicator
**Depends on**: Phase 20
**Requirements**: GRAPH-01, GRAPH-02, BLOOM-01
**Success Criteria** (what must be TRUE):
  1. Updating retrievability on one node does not trigger a re-render of all other nodes in the graph — observable via React DevTools profiler
  2. Off-screen nodes are absent from the DOM when the graph contains 100+ nodes and `onlyRenderVisibleElements` is active
  3. The chat interface displays a 6-segment Bloom depth meter that advances visibly as the user's messages shift from factual recall (Remember) toward synthesis and evaluation (Analyze/Create)
**Plans:** 2/2 plans complete

Plans:
- [x] 21-01-PLAN.md — React.memo on graph components + onlyRenderVisibleElements (GRAPH-01, GRAPH-02)
- [x] 21-02-PLAN.md — Bloom depth meter in chat interface (BLOOM-01)

---

### Phase 22: Observability Foundation
**Goal**: Every LLM call site emits a named, correlated OpenTelemetry trace to Langfuse Cloud — giving full visibility into what the AI saw and generated before any agent logic is changed
**Depends on**: Phase 21
**Requirements**: OBS-01, OBS-02, OBS-03, OBS-04, OBS-05
**Success Criteria** (what must be TRUE):
  1. Opening the Langfuse Cloud dashboard shows a live trace for every chat, architect, bouncer, and neuron AI call — no call site is dark
  2. Each trace carries a named span identifying the agent (Conversationalist, Architect, Bouncer, Neurons Extract) so the source is unambiguous
  3. Clicking any trace shows the conversation session ID and authenticated user ID in the span metadata — enabling per-user cost analysis and filtering
  4. The RAG context injected into a prompt (retrieved neurons, vector results) is visible as span metadata in the trace — confirming exactly what the model received
  5. The `instrumentation.ts` file initializes `LangfuseSpanProcessor` with `immediateExport: true` so traces are not silently dropped on Vercel serverless termination
**Plans:** 2/2 plans complete

Plans:
- [x] 22-01-PLAN.md — OTel infrastructure: install packages, create instrumentation.ts + tracing.ts helper (OBS-05, OBS-02)
- [ ] 22-02-PLAN.md — Instrument all 8 AI call sites with experimental_telemetry + RAG observe (OBS-01, OBS-02, OBS-03, OBS-04)

### Phase 23: Pure Conversationalist
**Goal**: The `/api/chat` endpoint is a pure Socratic text streamer with zero tool-calling capability — and all existing sessions rehydrate correctly after the tool-call messages are migrated away
**Depends on**: Phase 22
**Requirements**: AGENT-01, AGENT-02, AGENT-06, EVAL-01
**Success Criteria** (what must be TRUE):
  1. Sending any message to `/api/chat` never triggers a `suggest_neurogenesis` tool call — the response is always a plain text stream
  2. The chat system prompt contains no references to "Neurons," "Crystallization," or "Bloom's Taxonomy" — it reads as a natural conversation partner
  3. Loading an existing conversation session that previously contained tool-call messages renders without errors — no blank chat, no corrupted message arrays
  4. The conversationalist promptfoo eval suite passes all golden cases proving no direct answers, no bullet points, and no NeuroGraph jargon in responses
**Plans:** 1/2 plans executed

Plans:
- [x] 23-01-PLAN.md — Rebuild conversationalist eval suite + DB truncate migration (EVAL-01, AGENT-06)
- [ ] 23-02-PLAN.md — Strip tools from chat route, rewrite prompt, clean up ChatPanel (AGENT-01, AGENT-02)

### Phase 24: Silent Observer
**Goal**: A non-blocking Bloom Evaluator runs in the background after each user message and illuminates the "Generate Neuron" button when the conversation reaches Analyze-level cognitive depth
**Depends on**: Phase 23
**Requirements**: AGENT-03, AGENT-04, AGENT-05, EVAL-02, EVAL-03
**Success Criteria** (what must be TRUE):
  1. After a user sends a message, the chat stream completes without delay — the Bloom evaluation runs in the background and does not hold up the response
  2. After a conversation reaches Analyze-level depth, the "Generate Neuron" button transitions from muted to solid (Danish Computation aesthetic) without any gamification animation
  3. The button remains muted after messages that are factual recall or comprehension-level — it does not illuminate prematurely
  4. The Bloom eval suite passes all golden cases distinguishing Understand vs Analyze/Evaluate/Create, with a confidence threshold of 0.75 before the button illuminates
  5. No eval suite ships after the production code it validates — evals are written first and gate the implementation
**Plans**: TBD
**UI hint**: yes

### Phase 25: Decoupled Architect Pipeline
**Goal**: Neurogenesis is user-triggered via a dedicated `POST /api/architect` endpoint that runs a traceable 3-step pipeline without freezing the chat UI
**Depends on**: Phase 24
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. Clicking "Generate Neuron" sends a POST to `/api/architect` and the chat interface remains fully interactive while the pipeline runs
  2. The Langfuse dashboard shows three independent spans for each architect call: one for the Synthesizer, one for RAG retrieval, and one for the Epistemological Inquisitor
  3. The Synthesizer output contains a canonical `title`, `definition`, and `core_insight` derived from the conversation history — not hallucinated from thin air
  4. The resulting neuron and DAG edges appear in the React Flow graph without a page reload or UI freeze
**Plans**: TBD

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Knowledge Quality & Ephemerality | v1.0 | 2/2 | Complete | 2026-03-21 |
| 2. Graph Pedagogy | v1.0 | 1/1 | Complete | 2026-03-22 |
| 3. Rigorous Retention | v1.0 | 1/1 | Complete | 2026-03-22 |
| 4. Advanced AI Markdown Editor | v1.0 | 1/1 | Complete | 2026-03-21 |
| 5. Data Layer & Auth Foundation | v1.1 | 3/3 | Complete | 2026-03-22 |
| 6. Capture API & Key Management | v1.1 | 3/3 | Complete | 2026-03-22 |
| 7. Queue Triage UI | v1.1 | 3/3 | Complete | 2026-03-22 |
| 8. Crystallize Flow | v1.1 | 3/3 | Complete | 2026-03-22 |
| 9. UI Polish & Design System | v1.1 | 3/3 | Complete | 2026-03-23 |
| 10. Promptfoo Evaluation Harness | v1.2 | 3/3 | Complete | 2026-03-23 |
| 11. DAG Manager Agent | v1.2 | 3/3 | Complete | 2026-03-23 |
| 11.5. Horizon UI & DAG Wiring | v1.2 | 3/3 | Complete | 2026-03-23 |
| 12. Chat Analyzer / Bouncer Agent | v1.2 | 2/2 | Complete | 2026-03-23 |
| 13. Socratic Chat Engine | v1.2 | 2/2 | Complete | 2026-03-24 |
| 14. Backend AI Correctness | v1.3 | 2/2 | Complete | 2026-03-24 |
| 15. UI/UX Polish & Security | v1.3 | 2/2 | Complete | 2026-03-24 |
| 16. Socratic Agent Redesign | v1.4 | 2/2 | Complete | 2026-03-24 |
| 17. Horizon & Crystallize UI Fixes | v1.4 | 2/2 | Complete | 2026-03-24 |
| 18. AI Reliability | v2.0 | 2/2 | Complete | 2026-03-24 |
| 19. Enterprise Prompt Engineering | v2.0 | 1/2 | Complete | 2026-03-24 |
| 20. Editor Reliability | v2.0 | 1/1 | Complete | 2026-03-24 |
| 21. Graph Performance & Bloom UI | v2.0 | 2/2 | Complete | 2026-03-24 |
| 22. Observability Foundation | v2.1 | 1/2 | Complete    | 2026-03-25 |
| 23. Pure Conversationalist | v2.1 | 1/2 | In Progress|  |
| 24. Silent Observer | v2.1 | 0/? | Not started | - |
| 25. Decoupled Architect Pipeline | v2.1 | 0/? | Not started | - |
