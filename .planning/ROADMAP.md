# Roadmap: NeuroGraph 2.0

## Milestones

- [x] **v1.0 MVP** — Phases 1-4 (shipped 2026-03-22) [archived](milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Staging Area** — Phases 5-9 (shipped 2026-03-23) [archived](milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Agent Intelligence** — Phases 10-13 (shipped 2026-03-24) [archived](milestones/v1.2-ROADMAP.md)
- [ ] **v1.3 QA Refinement** — Phases 14-15 (in progress)

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

### v1.3 QA Refinement (In Progress)

**Milestone Goal:** Fix 8 bugs and UX frictions discovered during hands-on QA testing. No new features.

- [x] **Phase 14: Backend AI Correctness** - Fix Architect schema error, enforce Bloom gate at runtime, repair DAG prerequisite wiring (completed 2026-03-24)
- [ ] **Phase 15: UI/UX Polish & Security** - Fix layout resets, design inconsistencies, stuck neuron indicators, handle dots, and API key masking

---

## Phase Details

### Phase 14: Backend AI Correctness
**Goal**: All three AI agent contracts execute correctly — Architect returns valid structured output, Bloom gate blocks shallow neurons at runtime, and DAG agent creates coherent prerequisite edges
**Depends on**: Phase 13
**Requirements**: BUG-01, BUG-02, BUG-03
**Success Criteria** (what must be TRUE):
  1. The Architect API `/api/architect` returns a valid curriculum response without schema errors — `refusalReason` is accepted by the OpenAI structured output provider
  2. A user cannot create a neuron from a Remember or Understand level conversation — the `suggest_neurogenesis` tool does not fire below Analyze cognitive level
  3. The DAG agent creates a prerequisite edge from "Vector Databases" to "Relational Databases" or "NoSQL Databases" when that relationship is semantically correct
  4. Legacy nonsensical edges (e.g., "Relational Databases" → "Automated Red-Teaming") are absent from the graph after the fix is applied
**Plans**: 2 plans
Plans:
- [x] 14-01-PLAN.md — Fix OpenAI structured output schema errors (.optional() to .nullable())
- [x] 14-02-PLAN.md — Enforce Bloom gate, widen DAG search, clean legacy edges
**UI hint**: no

### Phase 15: UI/UX Polish & Security
**Goal**: All layout, visual, interaction, and security regressions from QA are resolved — the app feels coherent and the API key is properly masked after generation
**Depends on**: Phase 14
**Requirements**: BUG-04, BUG-05, BUG-06, BUG-07, BUG-08
**Success Criteria** (what must be TRUE):
  1. Switching from Review mode back to Chat mode preserves the correct shell panel width — no reset to default layout
  2. The "Set Learning Target" UI uses the app's editorial design language — no white pill buttons or mismatched border styles
  3. Previously synthesized neurons appear as resolved neuron cards in chat history, not as stuck "Synthesizing new neuron..." spinners
  4. Neuron nodes on the graph canvas have no visible Handle dots — the topology reads as clean and read-only
  5. The API key in the sidebar is masked after its initial one-time reveal — only visible at the moment of generation
**Plans**: 2 plans
Plans:
- [x] 15-01-PLAN.md — Fix layout reset, Handle dots, and stuck neurogenesis spinners (BUG-04, BUG-06, BUG-07)
- [ ] 15-02-PLAN.md — Redesign Learning Target UI and add API key masking (BUG-05, BUG-08)
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
| 14. Backend AI Correctness | v1.3 | 2/2 | Complete    | 2026-03-24 |
| 15. UI/UX Polish & Security | v1.3 | 1/2 | In Progress|  |
