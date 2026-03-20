# Project Research Summary

**Project:** NeuroGraph 2.0
**Domain:** Cognitive MicroSaaS / Active Generative Mastery
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

NeuroGraph 2.0 is a highly opinionated learning tool rejecting passive ingestion in favor of "Active Extraction." The research confirms that the chosen stack (Next.js 14, Supabase, React Flow, Zustand, and Vercel AI SDK) perfectly supports the required architecture. 

The greatest risks lie in UX (the AI Bouncer being too strict, frustrating users) and technical complexity (managing dual-state synchronization between the 40vw Left Panel and the 60vw React Flow DAG). By enforcing a strict DAG layout and leveraging a hybrid vector+LLM approach for duplicate prevention, we can build a robust cognitive engine.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Next.js 14 App Router:** Hosts server components and Vercel AI SDK streaming endpoints.
- **React Flow & Zustand:** The backbone of the 60vw Right Panel and cross-panel state management.
- **Supabase (pgvector):** Essential for the AI Bouncer vector similarity search.
- **ts-fsrs:** Handles the mathematical heavy lifting for Spaced Repetition (FSRS-6).

### Expected Features

**Must have (table stakes):**
- 40/60 Split UI (Chat/Editor vs Graph).
- In-Place Extraction (Neurogenesis) from Socratic Chat.
- Bidirectional Sync (Clicking map interacts with chat/editor).

**Should have (competitive differentiators):**
- AI Bouncer (Duplicate prevention).
- Strict Prerequisite DAG Enforcer.
- 14-day TTL Ephemeral Discovery Engine.

**Defer (v2+):**
- Ghost Nodes & Fog of War (Target-driven curricula).
- Soft-FIRe Visual Decay (Cascading rust visuals logic).

### Architecture Approach

**Major components:**
1. **The Graph Store:** Zustand global state managing `leftPanelMode` and syncing active nodes.
2. **The Socratic Engine:** Vercel AI SDK routes combining chat streaming with tool execution.
3. **The Bouncer Pipeline:** Next.js Server actions querying Supabase pgvector and utilizing LLM evaluation before DB insertion.

### Critical Pitfalls

1. **The Spaghetti Graph:** React Flow unconstrained layout. **Avoid:** Force `dagre` top-down layout and reject cycle creation logic.
2. **Tool Call Rehydration Failure:** Vercel AI SDK state reload crash. **Avoid:** Strict zod schemas for all generative UI tools.
3. **Heavy React Nodes:** FPS drops. **Avoid:** Keep React Flow nodes extremely lightweight (icon, title, status colors) and put editing purely in the 40vw Left Panel.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & UI Paradigms
**Rationale:** Must establish the 40/60 split and Supabase schema before any AI integration.
**Delivers:** Auth, Supabase DB, empty Left Panel structure, and basic React Flow layout on right.

### Phase 2: Socratic Chat Engine
**Rationale:** The core loop starts with conversation.
**Delivers:** Vercel AI SDK integration, streaming chat, 14-day TTL logic.
**Avoids:** UI blocking during AI streaming.

### Phase 3: Neurogenesis & The AI Bouncer
**Rationale:** This connects the Chat to the Graph.
**Delivers:** Text extraction tools, pgvector search, LLM duplicate evaluation, creating nodes in DB and updating React Flow.

### Phase 4: Strict DAG & Bidirectional Sync
**Rationale:** Cleans up the graph output and perfects user navigation.
**Delivers:** Connecting prereqs, dagre auto-layout, clicking map nodes opens markdown editor in Left Panel.

### Phase 5: Rigorous Retention (FSRS-6)
**Rationale:** The final core thesis. Applies memory decay.
**Delivers:** `ts-fsrs` integration, review UI modes, changing visual colors of Neurons based on "rust."

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tooling is mature and natively compatible. |
| Features | HIGH | Feature constraints are explicit and well-defined by the thesis. |
| Architecture | HIGH | Zustand+ReactFlow+Next.js is a proven triad for this UI setup. |
| Pitfalls | MEDIUM | Performance tuning on Vercel AI SDK UI Rehydration can be tricky. |

**Overall confidence:** HIGH

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
