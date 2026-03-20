# NeuroGraph 2.0

## What This Is

NeuroGraph 2.0 is a MicroSaaS platform for Active Generative Mastery. It is a conversation-first thinking companion that opposes "passive ingestion" and forces users to actively extract insights (Neurogenesis) into a living, interactive, spaced-repetition-enforced Knowledge Graph (Neural Network).

## Core Value

The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## Requirements

### Validated

<!-- Inferred from codebase mapping -->
- ✓ 40/60 Spatial Split Interface (Left Panel: Chat/Notes, Right Panel: React Flow Graph) — existing
- ✓ Basic Next.js App Router structure and Database connection (Supabase + pgvector) — existing
- ✓ AI Orchestration System (`getModelForRole` routing structure) — existing
- ✓ Dual-action text extraction tooling (`useTextSelection.ts`) — existing
- ✓ Global state foundation (`graphStore.ts` with `chat|neuron|review` modes) — existing

### Active

- [ ] Socratic Chat Engine (Tabula Rasa start, AI guides user to insights)
- [ ] Ephemeral Discovery Engine (Chats have a strict 14-day Time-To-Live to force knowledge extraction)
- [ ] AI Bouncer Mechanism (Background vector search prevents duplicate Neurons, suggests appending)
- [ ] Neurogenesis Flow (High-friction conversion of deep insights into new Neurons)
- [ ] Strict Prerequisite DAG Enforcer (Knowledge is built on dependency trees)
- [ ] Horizon Layer & Ghost Nodes (Target-driven learning paths with a "Fog of War" UI)
- [ ] Rigorous Retention Engine (FSRS-6 spaced repetition applied to Neurons)
- [ ] Soft-FIRe Visual Feedback (Visual flagging/rusting of dependent concepts when foundational Neurons decay)
- [ ] Bidirectional UI Sync (Clicking map opens markdown and pans camera; selecting text injects into existing Neurons)

### Out of Scope

- [Passive Document Ingestion (e.g., auto-summarize PDF)] — Creates an "Illusion of Competence" and graveyard of unread notes, violating core value.
- [Auto-generation of graph nodes by AI without user verification] — AI is a bouncer, not a mass generator.

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
| AI as a Bouncer | Prevents graph bloat and passive junk generation; ensures knowledge mapping is highly deliberate. | — Pending |
| Ghost Nodes & Fog of War | Prevents cognitive overload when outlining complex learning roadmaps (e.g., AI Engineer). | — Pending |
| Fractional Implicit Repetition (Soft-FIRe) | If a foundational concept rusts, advanced concepts built on it must flag decay to reinforce the DAG dependency tree. | — Pending |

---
*Last updated: 2026-03-20 after initialization*
