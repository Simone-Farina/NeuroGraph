# NeuroGraph 2.0

## What This Is

NeuroGraph 2.0 is a MicroSaaS platform for Active Generative Mastery. It is a conversation-first thinking companion that opposes "passive ingestion" and forces users to actively extract insights (Neurogenesis) into a living, interactive, spaced-repetition-enforced Knowledge Graph. It includes a Staging Area cognitive funnel, test-driven AI agent contracts, and Bloom-gated Socratic coaching.

## Core Value

The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## Current Milestone: v1.3 QA Refinement

**Goal:** Fix bugs, UX frictions, and broken core features discovered during hands-on testing. Pure bug-fix milestone — no new features.

**Target fixes:**
- Architect API schema error (refusalReason required field)
- Bloom-gated Neurogenesis not enforced at runtime
- DAG agent not creating prerequisite connections
- Layout, UI, and security issues from QA testing

## Current State

**Shipped:** v1.2 Agent Intelligence (2026-03-24)
**Codebase:** ~19,100 LOC TypeScript/TSX
**Tech Stack:** Next.js 14, React Flow, Zustand, Vercel AI SDK v6, Supabase (pgvector), TipTap v3, ts-fsrs, promptfoo
**Eval Suite:** 31 golden cases (bouncer 13 + architect 8 + conversationalist 10) — 100% pass

## Requirements

### Validated

<!-- Shipped in v1.0 MVP -->
- ✓ 40/60 Spatial Split Interface — existing
- ✓ Socratic Chat Engine (Bloom-gated, anti-answer-giving directives) — v1.0 + v1.2
- ✓ Ephemeral Discovery Engine (14-day TTL) — v1.0
- ✓ AI Bouncer Mechanism (vector + LLM eval contract) — v1.0 + v1.2
- ✓ Neurogenesis Flow (high-friction, Bloom Analyze+ threshold) — v1.0 + v1.2
- ✓ Strict Prerequisite DAG Enforcer (LLM Epistemological Inquisitor) — v1.0 + v1.2
- ✓ Horizon Layer & Ghost Nodes (ephemeral Architect curriculum) — v1.0 + v1.2
- ✓ Rigorous Retention Engine (FSRS-6 + Upward FIRe healing) — v1.0
- ✓ Soft-FIRe Visual Feedback (terracotta decay + foundation warnings) — v1.0
- ✓ Advanced AI Markdown Editor (TipTap WYSIWYG, slash commands) — v1.0

<!-- Shipped in v1.1 Staging Area -->
- ✓ Knowledge Queue data model (4-state, RLS, AI isolation) — v1.1
- ✓ Personal API key auth + iOS Shortcuts capture — v1.1
- ✓ Queue Triage UI (editorial page, optimistic mutations, sidebar badge) — v1.1
- ✓ Crystallize Flow (URL extraction → AI summary → Socratic chat → auto-mastered) — v1.1
- ✓ UI Polish & Design System (editorial prose, dynamic layout, motion language) — v1.1

<!-- Shipped in v1.2 Agent Intelligence -->
- ✓ promptfoo eval harness with per-agent golden suites — v1.2
- ✓ DAG Manager (Architect) prompt contract with cycle refusal — v1.2
- ✓ Horizon UI & DAG Wiring (ephemeral ghost curriculum, briefing panel) — v1.2
- ✓ Bouncer dual-purpose contract (duplicate rejection + definition/insight extraction) — v1.2
- ✓ Socratic Chat Engine with Bloom-gated Neurogenesis (Analyze+ only) — v1.2

### Active

- [ ] Implement Canvas Mode for freeform dragging and media organization
- [ ] Implement Downward FIRe cascading logic
- [ ] Connect robust AI auto-healing recommendations for FSRS decay
- [ ] Wire LLM Bouncer into production neuron creation (currently eval-only)

### Out of Scope

- [Passive Document Ingestion] — Creates "Illusion of Competence," violating core value.
- [Auto-generation of graph nodes by AI] — AI is a bouncer, not a mass generator.
- [Auto-summarize on capture] — Summary only on explicit Crystallize action.
- [Queue visible to chat AI] — AI isolation is a core design decision.

## Context

- **Academic Foundations:** "The Math Academy Way" (Justin Skycak) — DAGs for learning dependencies.
- **Cognitive Science:** FSRS-6 spaced repetition, active recall, Bloom's Taxonomy for depth gating.
- **Ecosystem:** Recall.ai, Oboe, Thesecondbrain focus on passive ingestion — NeuroGraph demands mastery.

## Constraints

- **Tech Stack** — Next.js 14 App Router + Supabase
- **UI** — 40vw Left / 60vw Right spatial split
- **Ephemerality** — 14-day chat TTL to force extraction

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI as a Bouncer | Prevents graph bloat and passive junk generation | ✓ Good |
| Ghost Nodes & Fog of War | Prevents cognitive overload on learning roadmaps | ✓ Good |
| Soft-FIRe (Fractional Implicit Repetition) | Foundation rust propagates to dependent nodes | ✓ Good |
| Cognitive Funnel (4-state) | Raw inputs must earn Neuron status through Crystallize | ✓ Good |
| Personal API Key auth | Stateless bearer token for iOS Shortcuts mobile capture | ✓ Good |
| AI Isolation from Queue | Queue invisible to chat AI unless explicitly Crystallized | ✓ Good |
| Eval-Driven Development | promptfoo golden suites validate all agent contracts before production | ✓ Good |
| Bloom-Gated Neurogenesis | Only Analyze/Evaluate/Create level insights trigger node proposals | ✓ Good |
| LLM Prerequisite Inference | Epistemological Inquisitor replaces vector-similarity wiring | ✓ Good |
| Hybrid eval model | Hard pass/fail for structural, scored thresholds for behavioral | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 — Milestone v1.3 QA Refinement started*
