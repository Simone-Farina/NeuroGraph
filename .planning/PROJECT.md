# NeuroGraph 2.0

## What This Is

NeuroGraph 2.0 is a MicroSaaS platform for Active Generative Mastery. It is a conversation-first thinking companion that opposes "passive ingestion" and forces users to actively extract insights (Neurogenesis) into a living, interactive, spaced-repetition-enforced Knowledge Graph (Neural Network). It now includes a Staging Area cognitive funnel that catches chaotic real-world inputs (URLs, ideas, articles) and guides them through a Crystallize flow into the sacred Knowledge Graph.

## Core Value

The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## Current State

**Shipped:** v1.1 Staging Area (2026-03-23)
**Codebase:** ~19,300 LOC TypeScript/TSX
**Tech Stack:** Next.js 14, React Flow, Zustand, Vercel AI SDK v6, Supabase (pgvector), TipTap v3, ts-fsrs

## Requirements

### Validated

<!-- Shipped in v1.0 MVP -->
- ✓ 40/60 Spatial Split Interface (Left Panel: Chat/Notes, Right Panel: React Flow Graph) — existing
- ✓ Socratic Chat Engine (Tabula Rasa start, AI guides user to insights) — v1.0
- ✓ Ephemeral Discovery Engine (14-day TTL to force knowledge extraction) — v1.0
- ✓ AI Bouncer Mechanism (Background vector search prevents duplicate Neurons) — v1.0
- ✓ Neurogenesis Flow (High-friction conversion of deep insights into Neurons) — v1.0
- ✓ Strict Prerequisite DAG Enforcer (Knowledge built on dependency trees) — v1.0
- ✓ Horizon Layer & Ghost Nodes (Target-driven learning paths with Fog of War UI) — v1.0
- ✓ Rigorous Retention Engine (FSRS-6 spaced repetition applied to Neurons) — v1.0
- ✓ Soft-FIRe Visual Feedback (Visual flagging of dependent concepts on decay) — v1.0
- ✓ Bidirectional UI Sync (Map click opens markdown, pans camera; text selection injects into Neurons) — v1.0
- ✓ Advanced AI Markdown Editor (TipTap WYSIWYG, slash commands, Bouncer bubble menu) — v1.0

<!-- Shipped in v1.1 Staging Area -->
- ✓ Knowledge Queue data model (4-state: inbox, resource, passive_debt, mastered) with RLS and AI isolation — v1.1
- ✓ Personal API key auth with SHA-256 hashing and iOS Shortcuts capture endpoint — v1.1
- ✓ Queue Triage UI (editorial /app/queue page, state groups, optimistic mutations, aging indicators, sidebar badge) — v1.1
- ✓ Crystallize Flow (URL extraction → AI summary → seeded Socratic chat → auto-mastered queue loop) — v1.1
- ✓ UI Polish & Design System (editorial prose chat, dynamic layout, motion language, monochrome review) — v1.1

### Active

<!-- Scope for next milestone -->
- [ ] Implement Canvas Mode for freeform dragging and media organization
- [ ] Implement Downward FIRe cascading logic
- [ ] Connect robust AI auto-healing recommendations for FSRS decay

### Out of Scope

- [Passive Document Ingestion (e.g., auto-summarize PDF)] — Creates an "Illusion of Competence" and graveyard of unread notes, violating core value.
- [Auto-generation of graph nodes by AI without user verification] — AI is a bouncer, not a mass generator.
- [Auto-summarize on capture] — Violates Active Extraction. Summary only generated on explicit Crystallize action.
- [Queue visible to chat AI] — AI isolation is a core design decision. Queue is invisible unless Crystallized.

## Context

- **Academic Foundations:** Inspired by "The Math Academy Way" (Justin Skycak) emphasizing Directed Acyclic Graphs (DAGs) for learning dependencies.
- **Cognitive Science:** Grounded in spaced repetition (FSRS-6) and active recall.
- **Ecosystem:** Current market alternatives (Recall.ai, Oboe, Thesecondbrain) focus on passive ingestion, leaving a gap for a rigorous, high-friction tool that demands mastery.
- **Existing Tech:** Leverages Next.js 14, React Flow, Zustand, Vercel AI SDK v6, and Supabase.

## Constraints

- **Type**: Tech Stack — Must build on the Next.js 14 App Router and Supabase infrastructure to leverage existing setup.
- **Type**: UI Constraint — Must strictly adhere to the 40vw Left / 60vw Right spatial split paradigm.
- **Type**: Ephemerality — Chats MUST have a 14-day TTL to enforce extraction.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI as a Bouncer | Prevents graph bloat and passive junk generation; ensures knowledge mapping is highly deliberate. | ✓ Good |
| Ghost Nodes & Fog of War | Prevents cognitive overload when outlining complex learning roadmaps (e.g., AI Engineer). | ✓ Good |
| Fractional Implicit Repetition (Soft-FIRe) | If a foundational concept rusts, advanced concepts built on it must flag decay to reinforce the DAG dependency tree. | ✓ Good |
| Cognitive Funnel (4-state) | Raw inputs must pass through Inbox → Passive Debt → Crystallize before earning Neuron status. Prevents graph from becoming a bookmark graveyard. | ✓ Good |
| Personal API Key auth | Stateless bearer token for mobile capture. Scoped to user. Simple for iOS Shortcuts. | ✓ Good |
| AI Isolation from Queue | Queue items invisible to chat AI. Only surfaced on explicit Crystallize. Keeps Socratic process intentional. | ✓ Good |
| TipTap Editor Integration | Replace disjointed input fields with fluid writing space that extracts metadata organically behind the scenes. | ✓ Good |
| SHA-256 for API keys (not bcrypt) | Per-request speed critical for capture endpoint. High-entropy tokens don't need slow hashing. | ✓ Good |
| CHECK constraint (not ENUM) for queue state | Simpler ALTER TABLE if state machine ever needs to change. | ✓ Good |
| Capture auth in route handler (not middleware) | CVE-2025-29927 (CVSS 9.1) mitigation — middleware can be bypassed. | ✓ Good |

---
*Last updated: 2026-03-23 after v1.1 milestone*
