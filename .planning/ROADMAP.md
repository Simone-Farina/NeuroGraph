# Roadmap: NeuroGraph 2.0

## Overview

Upgrading the live conversational graph prototype into a strict, active-extraction cognitive engine. We are enforcing DAG structures, adding AI-driven duplicate prevention (The Bouncer), and implementing an FSRS-6 spaced repetition mechanics.

## Phases

- [ ] **Phase 1: Knowledge Quality & Ephemerality** - AI Bouncer and 14-day chat TTL.
- [ ] **Phase 2: Graph Pedagogy** - Strict DAG layouts and target-driven Ghost Nodes.
- [ ] **Phase 3: Rigorous Retention** - `ts-fsrs` engine and Soft-FIRe decay visuals.

## Phase Details

### Phase 1: Knowledge Quality & Ephemerality
**Goal**: Enforce Active Extraction by preventing duplicate Neurons and wiping ephemeral chats.
**Depends on**: Nothing (Base MVP is live)
**Requirements**: 
- AI Bouncer (Duplicate Prevention)
- 14-day TTL Ephemeral Discovery Engine
**Success Criteria** (what must be TRUE):
  1. The DB cron or API successfully deletes chat messages older than 14 days to force extraction.
  2. The Neurogenesis tool evaluates similarity > 85% via pgvector and uses LLM to refuse creation of duplicate nodes, returning an "append suggestion" instead.
**Plans**: TBD

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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Knowledge Quality & Ephemerality | 0/0 | Not started | - |
| 2. Graph Pedagogy | 0/0 | Not started | - |
| 3. Rigorous Retention | 0/0 | Not started | - |
