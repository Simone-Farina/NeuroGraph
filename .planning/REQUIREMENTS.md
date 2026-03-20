# Requirements

**Project:** NeuroGraph 2.0
**Domain:** Active Generative Mastery / Cognitive MicroSaaS

## Validated
<!-- Shipped and confirmed valuable / Already Implemented -->
- ✓ 40/60 Spatial Split Interface (Left Panel: Chat/Notes, Right Panel: React Flow Graph) — existing
- ✓ Socratic Chat Interface (Vercel AI SDK v6) with tool rehydration fixed — existing
- ✓ Supabase DB Schema (`neurons`, `synapses`, `messages`, `conversations` with pgvector) — existing
- ✓ Markdown Node Editor and Dual-Action In-Place Extraction — existing
- ✓ AI Orchestrator (Environment-based routing via `src/lib/ai/providers.ts`) — existing
- ✓ Zustand Bidirectional Sync for UI state — existing

## Active
<!-- Current scope. Building toward these. -->

- [ ] AI Bouncer (Active Duplicate Prevention via `pgvector` and LLM evaluation during Neurogenesis)
- [ ] 14-day TTL Ephemeral Discovery Engine (Auto-wiping chat history to force extraction)
- [ ] Strict Prerequisite DAG Enforcer (Auto-layout, cycle rejection in React Flow)
- [ ] Rigorous Retention Engine (`ts-fsrs` spaced repetition applied to Neurons)
- [ ] Ghost Nodes / Fog of War (Target-driven learning paths curriculum generation)
- [ ] Soft-FIRe Visual Decay (Visual flagging of dependent concepts when foundational Neurons decay)

## Out of Scope
<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Passive Document Ingestion] — Creates an "Illusion of Competence" and graveyard of unread notes, violating core value.
- [Auto-generation of graph nodes by AI without user verification] — AI is a bouncer, not a mass generator.

---
*Last updated: 2026-03-21 after project initialization*
