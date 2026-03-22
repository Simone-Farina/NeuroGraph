# Requirements: NeuroGraph

**Defined:** 2026-03-22
**Core Value:** The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## Validated

<!-- Shipped and confirmed valuable -->
- ✓ 40/60 Spatial Split Interface (Left Panel: Chat/Notes, Right Panel: React Flow Graph) — existing
- ✓ Socratic Chat Interface (Vercel AI SDK v6) with tool rehydration — existing
- ✓ Supabase DB Schema (neurons, synapses, messages, conversations with pgvector) — existing
- ✓ AI Orchestrator (environment-based routing via getModelForRole) — existing
- ✓ Zustand Bidirectional Sync for UI state — existing
- ✓ AI Bouncer (pgvector duplicate prevention during Neurogenesis) — Phase 1
- ✓ 14-day TTL Ephemeral Discovery Engine (pg_cron auto-wipe) — Phase 1
- ✓ Advanced AI Markdown Editor (TipTap WYSIWYG, slash commands, Bouncer bubble menu) — Phase 4

## v1.1 Requirements

Requirements for Milestone v1.1: Staging Area & Cognitive Funnel.

### Data Layer

- [x] **DATA-01**: System stores queue items with title, URL (optional), notes (optional), and a 4-state enum (inbox, resource, passive_debt, mastered)
- [x] **DATA-02**: System stores hashed API keys per user with key_prefix for display, created_at, and last_used_at timestamps
- [x] **DATA-03**: Queue items table has RLS policies scoped to the owning user and is structurally isolated from the neurons/embeddings pipeline
- [x] **DATA-04**: TypeScript types and Zod validation schemas exist for QueueItem and ApiKey entities

### Authentication & Capture

- [x] **AUTH-01**: User can generate a personal API key from the app UI
- [x] **AUTH-02**: User can revoke an existing API key
- [x] **AUTH-03**: User can POST to `/api/capture` with a bearer token to create a new inbox item (URL + optional title + optional notes)
- [x] **AUTH-04**: Capture endpoint validates bearer token in the route handler (not middleware) and returns body-level success/error JSON compatible with iOS Shortcuts

### Triage UI

- [ ] **TRIAGE-01**: User can view a Queue page in the Left Panel showing items grouped by state (Inbox, Passive Debt, Resource)
- [ ] **TRIAGE-02**: Queue page is accessible via sidebar navigation with an unread count badge
- [ ] **TRIAGE-03**: User can manually transition items between states: Archive as Resource, Mark as Read (→ Passive Debt), Crystallize (→ Chat), Delete
- [ ] **TRIAGE-04**: Items auto-advance state: new capture → Inbox; item opened/viewed → Passive Debt. Manual override always available
- [ ] **TRIAGE-05**: Passive Debt items display aging indicators showing days since capture

### Crystallize Flow

- [ ] **CRYST-01**: User can click "Crystallize" on a queue item to auto-fetch URL content, generate an AI summary, and open a new Chat session seeded with the summary + notes
- [ ] **CRYST-02**: If URL extraction fails (paywall, SPA, timeout), system shows a manual paste area for the user to provide content
- [ ] **CRYST-03**: When a Neuron is created from a Crystallize-initiated chat session, the originating queue item auto-transitions to "mastered" state

### UI Polish & Design System

- [ ] **POLISH-01**: Chat AI messages render as editorial prose without bubble containers — full-width, borderless, serif typography
- [x] **POLISH-02**: The 40/60 panel split is dynamic, flexing based on active content (wider chat when reading, wider graph when exploring)
- [ ] **POLISH-03**: Empty states for graph and chat teach the interface using brand voice and visual hints of future structure
- [x] **POLISH-04**: Review page rating buttons are monochrome — difficulty communicated through weight/size, not colored backgrounds
- [x] **POLISH-05**: Panel transitions use intentional motion (micro-scale + fade for detail panel, staggered list entries, spatial momentum)

## Active (Remaining from v1.0)

<!-- Deferred from v1.0, not in current milestone -->
- [ ] Strict Prerequisite DAG Enforcer (Auto-layout, cycle rejection in React Flow)
- [ ] Rigorous Retention Engine (ts-fsrs spaced repetition applied to Neurons)
- [ ] Ghost Nodes / Fog of War (Target-driven learning paths curriculum generation)
- [ ] Soft-FIRe Visual Decay (Visual flagging of dependent concepts when foundational Neurons decay)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Capture
- **CAP-01**: User can capture items via browser extension (share sheet)
- **CAP-02**: User can capture items via email forwarding

### Intelligence
- **INTEL-01**: AI can reference queue items during normal chat when explicitly permitted by user
- **INTEL-02**: System suggests related queue items when a chat topic overlaps with queued URLs

### Bulk Operations
- **BULK-01**: User can select multiple queue items and batch-triage them
- **BULK-02**: User can sort/filter queue by date, domain, or tag

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-summarize on capture | Violates Active Extraction. Summary only generated on explicit Crystallize action. |
| Auto-create Neurons from queue | The Recall.ai trap. Queue items MUST go through Socratic chat to earn Neuron status. |
| OAuth/SSO for API auth | Over-engineered for personal use. Bearer token is sufficient. |
| Browser extension | Deferred to v2. iOS Shortcut covers the mobile capture use case. |
| Queue visible to chat AI | AI isolation is a core design decision. Queue is invisible unless Crystallized. |
| Passive Document Ingestion | Creates an "Illusion of Competence" and graveyard of unread notes. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 5 | Complete |
| DATA-02 | Phase 5 | Complete |
| DATA-03 | Phase 5 | Complete |
| DATA-04 | Phase 5 | Complete |
| AUTH-01 | Phase 6 | Complete |
| AUTH-02 | Phase 6 | Complete |
| AUTH-03 | Phase 6 | Complete |
| AUTH-04 | Phase 6 | Complete |
| TRIAGE-01 | Phase 7 | Pending |
| TRIAGE-02 | Phase 7 | Pending |
| TRIAGE-03 | Phase 7 | Pending |
| TRIAGE-04 | Phase 7 | Pending |
| TRIAGE-05 | Phase 7 | Pending |
| CRYST-01 | Phase 8 | Pending |
| CRYST-02 | Phase 8 | Pending |
| CRYST-03 | Phase 8 | Pending |
| POLISH-01 | Phase 9 | Pending |
| POLISH-02 | Phase 9 | Complete |
| POLISH-03 | Phase 9 | Pending |
| POLISH-04 | Phase 9 | Complete |
| POLISH-05 | Phase 9 | Complete |

**Coverage:**
- v1.1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 — traceability filled after roadmap creation*
