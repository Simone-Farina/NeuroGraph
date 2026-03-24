# Roadmap: NeuroGraph 2.0

## Milestones

- [x] **v1.0 MVP** — Phases 1-4 (shipped 2026-03-22) [archived](milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Staging Area** — Phases 5-9 (shipped 2026-03-23) [archived](milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Agent Intelligence** — Phases 10-13 (shipped 2026-03-24) [archived](milestones/v1.2-ROADMAP.md)
- [x] **v1.3 QA Refinement** — Phases 14-15 (shipped 2026-03-24) [archived](milestones/v1.3-ROADMAP.md)
- [ ] **v1.4 QA Refinement II** — Phases 16-17 (in progress)

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

---

### v1.4 QA Refinement II (Phases 16-17)

**Milestone Goal:** Fix 6 bugs from QA round 2 — critical Socratic agent redesign so it teaches instead of parroting, plus Horizon UI and Crystallize state polish.

- [ ] **Phase 16: Socratic Agent Redesign** - Teach-and-question contract, progressive knowledge building per turn
- [ ] **Phase 17: Horizon & Crystallize UI Fixes** - Paste state session-scoping, dynamic container sizing, ghost node layout, shell timing, TARGET label removal

---

## Phase Details

### Phase 16: Socratic Agent Redesign
**Goal**: The Socratic agent teaches and deepens understanding per turn — not a question-parrot
**Depends on**: Phase 15
**Requirements**: AGENT-01, AGENT-02
**Success Criteria** (what must be TRUE):
  1. After a user answers a question, the agent responds with new information, context, or a counterexample before asking the next question — never bare redirect questions
  2. Reading a full Socratic exchange, each agent turn visibly adds knowledge the user did not state — the agent is a teacher, not an echo
  3. The existing promptfoo golden suite (31 cases) continues to pass at 100% after the prompt contract change
  4. The agent still withholds direct answers to Bloom-shallow queries — teaching does not collapse into answer-giving
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — Rewrite CHAT_SYSTEM_PROMPT and update scoreSocraticTone heuristic
- [ ] 16-02-PLAN.md — Add teach-then-ask golden cases and verify full eval suite

### Phase 17: Horizon & Crystallize UI Fixes
**Goal**: Horizon UI is visually stable and Crystallize paste state is properly session-scoped
**Depends on**: Phase 16
**Requirements**: CRYST-04, HORIZON-04, HORIZON-05, HORIZON-06, HORIZON-07
**Success Criteria** (what must be TRUE):
  1. Switching to a different chat conversation clears the Crystallize paste banner and paste box — the fallback state does not bleed across conversations
  2. The "Set Learning Target" button container is compact when the input field is hidden and only expands when the user opens it
  3. After Horizon generation, ghost node labels are readable and nodes do not overlap or stack on top of each other
  4. The chat panel remains visible and does not collapse during or after ghost node rendering — the shell preset transition does not fire prematurely
  5. The "TARGET X" label below the Learning Target controls is absent from the UI
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
| 16. Socratic Agent Redesign | v1.4 | 0/2 | In progress | - |
| 17. Horizon & Crystallize UI Fixes | v1.4 | 0/TBD | Not started | - |
