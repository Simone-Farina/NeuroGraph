# Milestone v1.2: Agent Intelligence Requirements

## Core Goal
Establish enterprise-grade, test-driven system prompts for the core NeuroGraph agents using `promptfoo` to ensure rigorous evaluation and reliability.

## 1. Test-Driven Prompt Engineering Infrastructure
- [x] **TEST-01**: The system must have `promptfoo` installed and configured as a testing dependency.
- [x] **TEST-02**: A dedicated root directory structure at `prompt-eval/` must exist to isolate agent evaluation suites from runtime code.
- [x] **TEST-03**: There must be at least one baseline test script/command to run the full prompt evaluation suite locally.

## 2. DAG Manager Agent
- [x] **DAG-01**: The DAG Manager prompt must explicitly enforce structured evaluation of "prerequisites" vs "builds-on" relationships.
- [x] **DAG-02**: `promptfoo` evaluations must exist to prove the DAG Manager refuses cyclical dependencies.
- [x] **DAG-03**: `promptfoo` evaluations must exist to verify the DAG Manager outputs correctly structured JSON matching the system schema.

## 2.5 Horizon UI & DAG Wiring
- [x] **HORIZON-01**: The app must expose an authenticated `/api/architect` route that returns an ephemeral strict JSON curriculum draft to frontend state without writing nodes or synapses to Supabase.
- [x] **HORIZON-02**: The Graph panel must provide a `Set Learning Target` trigger and render Architect output as low-anxiety `ghostNeuron` nodes with Fog of War styling.
- [x] **HORIZON-03**: Clicking a ghost node must open a left-panel briefing mode with the generated definition and a `Start Learning (Crystallize)` handoff that seeds a fresh chat session.

## 3. Chat Analyzer / Bouncer Agent
- [ ] **BOUNCER-01**: The Bouncer prompt must enforce the "duplicate prevention" core value.
- [ ] **BOUNCER-02**: `promptfoo` evaluations must exist showing the Bouncer rejecting near-identical inputs and suggesting appends instead.
- [ ] **BOUNCER-03**: `promptfoo` evaluations must verify the Bouncer successfully extracts "Definition" and "Core Insight" from ambiguous human text.

## 4. Socratic Chat Engine
- [ ] **SOCRATES-01**: The Socratic Chat prompt must explicitly forbid the agent from just "giving the answer" and mandate a guiding, questioning tone.
- [ ] **SOCRATES-02**: `promptfoo` evaluations must exist testing the Socratic engine against multiple simulated user chat turns to ensure it maintains the coaching persona.
- [ ] **SOCRATES-03**: The Socratic Engine must recognize when the user has reached a "Deep Insight" and successfully propose Neurogenesis.

---

## Future Requirements (Deferred)
- Graph Pedagogy / Ghost Nodes (Phase 2 core logic)
- Rigorous Retention / `ts-fsrs` (Phase 3 core logic)

## Out of Scope
- Building our own custom evaluation library (we will use `promptfoo`).
- Evaluating standard open-source chat (only custom NeuroGraph system prompts).

## Traceability

| Requirement | Description | Phase | Status |
|-------------|-------------|-------|--------|
| TEST-01 | promptfoo installed | Phase 10 | Complete |
| TEST-02 | Evaluation structure | Phase 10 | Complete |
| TEST-03 | Baseline runner | Phase 10 | Complete |
| DAG-01 | DAG Manager prompt logic | Phase 11 | Complete |
| DAG-02 | DAG Manager cyclical testing | Phase 11 | Complete |
| DAG-03 | DAG Manager JSON testing | Phase 11 | Complete |
| HORIZON-01 | Ephemeral Architect route | Phase 11.5 | Complete |
| HORIZON-02 | Ghost path graph rendering | Phase 11.5 | Complete |
| HORIZON-03 | Ghost briefing to chat handoff | Phase 11.5 | Complete |
| BOUNCER-01 | Bouncer duplicate logic | Phase 12 | Pending |
| BOUNCER-02 | Bouncer duplicate testing | Phase 12 | Pending |
| BOUNCER-03 | Bouncer extraction testing | Phase 12 | Pending |
| SOCRATES-01 | Socratic tone logic | Phase 13 | Pending |
| SOCRATES-02 | Socratic multi-turn testing | Phase 13 | Pending |
| SOCRATES-03 | Socratic insight detection | Phase 13 | Pending |
