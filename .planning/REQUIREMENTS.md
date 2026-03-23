# Milestone v1.2: Agent Intelligence Requirements

## Core Goal
Establish enterprise-grade, test-driven system prompts for the core NeuroGraph agents using `promptfoo` to ensure rigorous evaluation and reliability.

## 1. Test-Driven Prompt Engineering Infrastructure
- [ ] **TEST-01**: The system must have `promptfoo` installed and configured as a testing dependency.
- [ ] **TEST-02**: A dedicated directory structure (`tests/prompts/` or similar) must exist to isolate agent evaluation suites.
- [ ] **TEST-03**: There must be at least one baseline test script/command to run the full prompt evaluation suite locally.

## 2. DAG Manager Agent
- [ ] **DAG-01**: The DAG Manager prompt must explicitly enforce structured evaluation of "prerequisites" vs "builds-on" relationships.
- [ ] **DAG-02**: `promptfoo` evaluations must exist to prove the DAG Manager refuses cyclical dependencies.
- [ ] **DAG-03**: `promptfoo` evaluations must exist to verify the DAG Manager outputs correctly structured JSON matching the system schema.

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
| TEST-01 | promptfoo installed | TBD | Pending |
| TEST-02 | Evaluation structure | TBD | Pending |
| TEST-03 | Baseline runner | TBD | Pending |
| DAG-01 | DAG Manager prompt logic | TBD | Pending |
| DAG-02 | DAG Manager cyclical testing | TBD | Pending |
| DAG-03 | DAG Manager JSON testing | TBD | Pending |
| BOUNCER-01 | Bouncer duplicate logic | TBD | Pending |
| BOUNCER-02 | Bouncer duplicate testing | TBD | Pending |
| BOUNCER-03 | Bouncer extraction testing | TBD | Pending |
| SOCRATES-01 | Socratic tone logic | TBD | Pending |
| SOCRATES-02 | Socratic multi-turn testing | TBD | Pending |
| SOCRATES-03 | Socratic insight detection | TBD | Pending |
