# NeuroGraph Retrospective

Living document capturing lessons, trends, and execution metrics across milestones.

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tasks | Models Used | Days |
|-----------|--------|-------|-------|-------------|------|
| v1.0      | 4      | 5     | 0     | GPT-4o, Cl. | < 5  |
| v1.1      | 5      | 15    | 24    | Claude       | ~2   |

---

## Milestone: v1.1 — Staging Area

**Shipped:** 2026-03-23
**Phases:** 5 | **Plans:** 15

### What Was Built
- Secure data foundation with knowledge_queue and user_api_keys tables, RLS, SHA-256 hashing, and structural AI isolation
- iOS Shortcuts capture endpoint with bearer auth, rate limiting, SSRF-safe metadata extraction, and duplicate URL detection
- Editorial Queue Triage UI at /app/queue with optimistic mutations, state grouping, rust aging indicators, and sidebar badge
- Full Crystallize Flow: URL extraction → AI summary → seeded Socratic chat → auto-mastered queue item on Neurogenesis
- UI Polish pass: editorial prose chat, dynamic panel layout, motion language, monochrome review buttons, empty states

### What Worked
- **Test-first approach (Wave 0)**: Writing RED-state test scaffolds before production code caught contract mismatches early (e.g., Supabase count query mock shape, token length)
- **Structural AI isolation**: Enforcing module-boundary separation between queue and neuron code paths prevented accidental data leakage
- **Forward-only state machine**: Zod-level validation of allowed transitions eliminated impossible state bugs
- **Service-role client for capture**: Bypassing RLS for INSERT operations simplified the auth model without sacrificing security

### What Was Inefficient
- **Requirements tracking fell behind**: Traceability table wasn't updated as phases 7-9 shipped, creating false "Pending" status at milestone completion
- **Rebase conflicts**: Multiple parallel feature branches (graph pedagogy, retention, staging area) created complex merge conflicts requiring manual resolution

### Patterns Established
- **Queue routing as App Router page**: Queue renders at `/app/queue` as a dedicated page, not as a leftPanelMode value — prevents Zustand mode explosion
- **Capture auth in route handler**: Never in middleware (CVE-2025-29927 mitigation)
- **Separate Zustand stores per domain**: queueStore owns queue state, graphStore owns panel mode — single coupling point via openQueue()

### Key Lessons
- CHECK constraints over PostgreSQL ENUMs for state fields — simpler schema evolution
- Service-role Supabase clients can be module-level singletons when credentials are env vars
- Optimistic UI with server-side rollback is the right pattern for state transitions in Zustand

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-22
**Phases:** 4 | **Plans:** 5

### What Was Built
- AI Bouncer for active duplicate prevention.
- 14-day Ephemeral Discovery Engine (auto-wiping chat history).
- Strict Left-to-Right DAG layout to solve "spaghetti graphs".
- FSRS-6 spaced repetition engine with Upward FIRe healing and UI visual decay.
- Fluid TipTap-based Advanced AI Markdown Editor with liquid background metadata extraction.

### What Worked
- **Visual Decay (Soft-FIRe)**: Changing border styles instead of locking users out was vastly superior for user motivation.
- **TipTap v3 Root Control**: Directly wrapping TipTap instead of using high-level wrappers like Novel.sh avoided React dependency lag and gave total control over ProseMirror plugins.
- **Background Extraction**: Extracting 'Definition' and 'Core Insight' asynchronously removed UI friction while enforcing the active learning pedagogy.

### What Was Inefficient
- **Vercel AI SDK v5 -> v6 Changes**: Wasted some time debugging removed APIs (`toDataStreamResponse` vs `toTextStreamResponse`).

### Patterns Established
- **Active Extraction over Passive Ingestion**: Future features must force the user to synthesize knowledge, never auto-generating nodes for them.
- **"The Bouncer"**: AI as a strict mediator ensuring graph quality, not a submissive text-completion bot.

### Key Lessons
- Direct implementation of ProseMirror plugins is the only reliable way to handle complex WYSIWYG interactions (like Slash commands) without triggering React cyclic re-render crashes.
