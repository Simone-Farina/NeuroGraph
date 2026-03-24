# Roadmap: NeuroGraph 2.0

## Milestones

- [x] **v1.0 MVP** — Phases 1-4 (shipped 2026-03-22) [archived](milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Staging Area** — Phases 5-9 (shipped 2026-03-23) [archived](milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Agent Intelligence** — Phases 10-13 (shipped 2026-03-24) [archived](milestones/v1.2-ROADMAP.md)
- [x] **v1.3 QA Refinement** — Phases 14-15 (shipped 2026-03-24) [archived](milestones/v1.3-ROADMAP.md)
- [x] **v1.4 QA Refinement II** — Phases 16-17 (shipped 2026-03-24) [archived](milestones/v1.4-ROADMAP.md)

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

---

### v2.0 MVP Core Stability (Phases 18-21) — In Progress

**Milestone Goal:** Every core feature works flawlessly end-to-end. No new features — make what exists production-grade. Enterprise-level prompt engineering for all AI agents.

- [x] **Phase 18: AI Reliability** - Typed error handling, timeouts, and retry logic across all AI call sites (completed 2026-03-24)
- [ ] **Phase 19: Enterprise Prompt Engineering** - Khanmigo patterns, comprehension-test DAG heuristic, expanded eval suite
- [ ] **Phase 20: Editor Reliability** - TipTap content sync race fix, serialization standardized to getJSON
- [ ] **Phase 21: Graph Performance & Bloom UI** - React.memo on nodes, onlyRenderVisibleElements, real-time Bloom depth indicator

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
**Plans**: TBD

### Phase 20: Editor Reliability
**Goal**: The TipTap editor displays correct neuron content on every navigation event, regardless of focus state, and all editor components share a single serialization format
**Depends on**: Phase 18
**Requirements**: EDITOR-01, EDITOR-02
**Success Criteria** (what must be TRUE):
  1. Switching between neurons while the editor is focused always displays the newly selected neuron's content — stale content from the previous neuron never persists
  2. All content saved through any editor component is stored as TipTap JSON (`getJSON()`) — no mixed HTML/plain-text formats in new saves
  3. A schema mismatch between editor extensions (e.g., after an upgrade) surfaces an `onContentError` log entry rather than silently corrupting the document
**Plans**: TBD
**UI hint**: yes

### Phase 21: Graph Performance & Bloom UI
**Goal**: The knowledge graph renders at 60fps at scale and the chat interface gives users real-time cognitive depth feedback via a Bloom-level indicator
**Depends on**: Phase 20
**Requirements**: GRAPH-01, GRAPH-02, BLOOM-01
**Success Criteria** (what must be TRUE):
  1. Updating retrievability on one node does not trigger a re-render of all other nodes in the graph — observable via React DevTools profiler
  2. Off-screen nodes are absent from the DOM when the graph contains 100+ nodes and `onlyRenderVisibleElements` is active
  3. The chat interface displays a 6-segment Bloom depth meter that advances visibly as the user's messages shift from factual recall (Remember) toward synthesis and evaluation (Analyze/Create)
**Plans**: TBD
**UI hint**: yes

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
| 18. AI Reliability | v2.0 | 2/2 | Complete   | 2026-03-24 |
| 19. Enterprise Prompt Engineering | v2.0 | 0/? | Not started | - |
| 20. Editor Reliability | v2.0 | 0/? | Not started | - |
| 21. Graph Performance & Bloom UI | v2.0 | 0/? | Not started | - |
