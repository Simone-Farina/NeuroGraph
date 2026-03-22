# Roadmap: NeuroGraph 2.0

## Overview

Upgrading the live conversational graph prototype into a strict, active-extraction cognitive engine. We are enforcing DAG structures, adding AI-driven duplicate prevention (The Bouncer), and implementing an FSRS-6 spaced repetition mechanics.

---

## Milestone v1.0 (Complete)

- [x] **Phase 1: Knowledge Quality & Ephemerality** - AI Bouncer and 14-day chat TTL. (completed 2026-03-21)
- [ ] **Phase 2: Graph Pedagogy** - Strict DAG layouts and target-driven Ghost Nodes.
- [ ] **Phase 3: Rigorous Retention** - `ts-fsrs` engine and Soft-FIRe decay visuals.
- [x] **Phase 4: Advanced AI Markdown Editor** - Live WYSIWYG block editor with AI Bouncer integration. (completed 2026-03-21)

---

## Milestone v1.1: Staging Area

Introduce a cognitive funnel that catches chaotic real-world inputs (URLs, ideas, articles) in a Staging Area before they earn entry into the sacred Knowledge Graph.

### Phases

- [x] **Phase 5: Data Layer & Auth Foundation** - Schema, RLS, TypeScript types, and API key utilities. (completed 2026-03-22)
- [x] **Phase 6: Capture API & Key Management** - Bearer-token capture endpoint, key generation/revocation API routes. (completed 2026-03-22)
- [x] **Phase 7: Queue Triage UI** - Staging Area page, state transitions, aging indicators, sidebar badge. (completed 2026-03-22)
- [ ] **Phase 8: Crystallize Flow** - URL extraction, AI summarization, Socratic chat handoff, mastered state auto-advance.
- [ ] **Phase 9: UI Polish & Design System** - Editorial chat, dynamic layout, motion language, review page redesign, empty states.

---

## Phase Details (v1.0)

### Phase 1: Knowledge Quality & Ephemerality
**Goal**: Enforce Active Extraction by preventing duplicate Neurons and wiping ephemeral chats.
**Depends on**: Nothing (Base MVP is live)
**Requirements**:
- AI Bouncer (Duplicate Prevention)
- 14-day TTL Ephemeral Discovery Engine
**Success Criteria** (what must be TRUE):
  1. The DB cron or API successfully deletes chat messages older than 14 days to force extraction.
  2. The Neurogenesis tool evaluates similarity > 85% via pgvector and uses LLM to refuse creation of duplicate nodes, returning an "append suggestion" instead.
**Plans**: 2 (01-01 TTL Engine, 01-02 AI Bouncer)

### Phase 2: Graph Pedagogy
**Goal**: Restructure the visual memory network to enforce strict prerequisite mastery.
**Depends on**: Phase 1
**Requirements**:
- Strict Prerequisite DAG Enforcer
- Ghost Nodes / Fog of War
**Success Criteria** (what must be TRUE):
  1. React Flow auto-layouts nodes strictly top-to-bottom and entirely rejects cyclical edge connections.
  2. Users can generate target curricula that appear as locked/blurred "Ghost" Nodes until their prerequisites are fulfilled.
**Plans**: TBD

### Phase 3: Rigorous Retention
**Goal**: Add memory decay mechanics directly into the UI state of the graph.
**Depends on**: Phase 2
**Requirements**:
- Rigorous Retention Engine
- Soft-FIRe Visual Decay
**Success Criteria** (what must be TRUE):
  1. Neurons carry FSRS-6 memory state data updated via an active recall review session.
  2. Visually, if a foundational node "rusts" (falls below retention threshold), its distinct descendant nodes change border/glow color to indicate unstable foundations.
**Plans**: TBD

### Phase 4: Advanced AI Markdown Editor
**Goal**: Replace the rigid field-based editor with a tactile, AI-assisted WYSIWYG writing surface that conforms to the Danish Computation aesthetic.
**Depends on**: N/A (UI layer)
**Requirements**:
- TipTap/Novel.sh Block Editor Integration
- Slash Commands & Floating Bouncer Chat
- Liquid Document AI Extraction (Metadata inference)
**Success Criteria** (what must be TRUE):
  1. The editor correctly live-renders markdown syntax using the Newsreader serif font.
  2. Slash commands and text-highlight interactions spawn the AI Bouncer.
  3. The core fields (Definition, Insight) are extracted in the background without rigid UI fields.
**Plans**: 1 (PLAN.md — Editor Core, Liquid Document, Slash Commands, Bouncer, Visual Polish)

---

## Phase Details (v1.1)

### Phase 5: Data Layer & Auth Foundation
**Goal**: Users' queue items and API keys exist in the database in a structurally isolated, secure, and type-safe form — everything that follows can be built on this foundation without revisiting it.
**Depends on**: Phase 4 (existing Supabase + pgvector infrastructure)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. A queue item can be inserted into the database with a title, optional URL, optional notes, and one of four states (inbox, resource, passive_debt, mastered) — and retrieved scoped strictly to its owning user.
  2. An API key can be stored as a hashed value with a display prefix, created_at, and last_used_at — no plaintext key ever persists in the database.
  3. Neither the `knowledge_queue` table nor the `user_api_keys` table appears in any query used by the chat or Neurogenesis routes (structural AI isolation is verifiable at the migration level).
  4. TypeScript types for QueueItem and ApiKey compile without errors and Zod schemas reject malformed payloads at the boundary.
**Plans:** 3/3 plans complete
Plans:
- [ ] 05-01-PLAN.md — SQL migrations (knowledge_queue + user_api_keys) and Database type extension
- [ ] 05-02-PLAN.md — API key crypto utilities and Zod validation schemas
- [ ] 05-03-PLAN.md — Typed query layer (queueQueries + apiKeyQueries) with unit tests

### Phase 6: Capture API & Key Management
**Goal**: A user can generate a personal API key from the browser and immediately use it to POST a new inbox item from iOS Shortcuts — with correct structured responses for every success and failure path.
**Depends on**: Phase 5
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can generate a new personal API key from the app UI and see its display prefix — the full key is shown exactly once at creation time.
  2. User can revoke an existing API key and confirm it no longer accepts captures.
  3. A POST to `/api/capture` with a valid bearer token and a URL creates a new inbox item and returns `{ success: true, id }` in the response body (not just a 200 status code).
  4. A POST to `/api/capture` with an invalid or revoked token returns `{ success: false, error: "unauthorized" }` — and the iOS Shortcuts error branch fires correctly from this response body.
**Plans:** 3/3 plans executed
Plans:
- [x] 06-00-PLAN.md — Test scaffolds for capture route, keys route, metadata extraction, and findByUrl (Wave 0)
- [x] 06-01-PLAN.md — Capture endpoint with bearer auth, rate limiting, duplicate detection, and URL metadata extraction
- [x] 06-02-PLAN.md — Key management API route (GET/POST/DELETE) and sidebar UI section

### Phase 7: Queue Triage UI
**Goal**: Users can see all their queued items in the Left Panel, understand their states at a glance, act on them, and maintain a calm Inbox Zero model while Passive Debt remains quietly visible.
**Depends on**: Phase 6
**Requirements**: TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04, TRIAGE-05
**Success Criteria** (what must be TRUE):
  1. User can navigate to a Queue page at `/app/queue` via the sidebar — the page groups items visually by state (Inbox, Passive Debt, Resource) without any panel mode change.
  2. The sidebar Queue nav link displays a live unread count badge reflecting Inbox items only.
  3. User can transition any item: Archive as Resource, Mark as Passive Debt, or Delete — with optimistic UI and server-side rollback on failure.
  4. A newly captured item appears in Inbox; once a user explicitly opens its external URL, it auto-advances to Passive Debt — manual override always remains available.
  5. Each Passive Debt item displays a human-readable "X days ago" aging indicator without any user action.
**Plans:** 3/3 plans executed
Plans:
- [x] 07-01-PLAN.md — Queue API routes, queue store, and optimistic mutation boundary
- [x] 07-02-PLAN.md — `/app/queue` editorial page, stacked sections, and semantic-aging item UI
- [x] 07-03-PLAN.md — Sidebar Queue nav/badge, inbox-only auto-advance trigger, and crystallize handoff surface

### Phase 8: Crystallize Flow
**Goal**: Users can take any queued item and convert it into an active Socratic chat session seeded with the item's content — and the queue item automatically reaches "mastered" state when a Neuron is born from that session.
**Depends on**: Phase 7
**Requirements**: CRYST-01, CRYST-02, CRYST-03
**Success Criteria** (what must be TRUE):
  1. User can click "Crystallize" on a queue item with a URL and be taken to a new chat session pre-seeded with an AI summary of the article content — without manually pasting anything.
  2. When URL extraction fails (paywall, SPA, timeout), the system presents a manual paste area so the user can still Crystallize without abandoning the flow.
  3. When a Neuron is created from a Crystallize-initiated chat session, the originating queue item automatically transitions to "mastered" state — the user sees this reflected in the queue without any manual action.
**Plans:** 3 planned
Plans:
- [ ] 08-01-PLAN.md — Crystallize backend orchestration, extraction/summary helpers, and message-metadata provenance
- [ ] 08-02-PLAN.md — Chat-side crystallize bootstrap, seeded-session loading, and embedded manual paste flow
- [ ] 08-03-PLAN.md — Neurogenesis mastery handoff, queue refresh integration, and final human checkpoint

### Phase 9: UI Polish & Design System
**Goal**: Elevate the entire app from functional to editorially refined — applying the critique findings across all existing surfaces so the Staging Area UI doesn't feel like it landed in a lesser product. This phase also absorbs the remaining Phase 7 UI review follow-through: calmer typography scale, stronger semantic decay tokens, and a flatter editorial queue surface.
**Depends on**: Phase 8 (all features functional before polish pass)
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05
**Success Criteria** (what must be TRUE):
  1. Chat AI messages render as editorial prose (no bubble containers) — the chat feels like reading a thoughtful correspondence, not a messaging app.
  2. The 40/60 panel split is dynamic — the layout flexes based on active content (wider chat when reading, wider graph when exploring).
  3. Empty states for graph and chat teach the interface and match the brand voice — no emoji-in-circle templates.
  4. Review page rating buttons are monochrome — difficulty communicated through weight/size, not traffic-light colors.
  5. Panel transitions use intentional motion (micro-scale + fade, staggered list entries) — no binary cuts between states.
**Plans**: TBD

---

## Progress

**Execution Order:**
v1.0: 1 → 4 (out of order; 2 and 3 remain pending)
v1.1: 5 → 6 → 7 → 8 (strictly sequential; each phase depends on the previous)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Knowledge Quality & Ephemerality | 2/2 | Complete | 2026-03-21 |
| 2. Graph Pedagogy | 0/0 | Not started | - |
| 3. Rigorous Retention | 0/0 | Not started | - |
| 4. Advanced AI Markdown Editor | 1/1 | Complete | 2026-03-21 |
| 5. Data Layer & Auth Foundation | 3/3 | Complete   | 2026-03-22 |
| 6. Capture API & Key Management | 3/3 | Complete | 2026-03-22 |
| 7. Queue Triage UI | 3/3 | Complete | 2026-03-22 |
| 8. Crystallize Flow | 0/3 | Planned | - |
| 9. UI Polish & Design System | 0/0 | Not started | - |
