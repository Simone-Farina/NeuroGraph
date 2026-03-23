---
phase: 11
slug: dag-manager-agent
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-23
---

# Phase 11 — Validation Strategy

> Retroactive validation record for the shipped Architect contract and Golden DAG suite.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | promptfoo + targeted Vitest + TypeScript compile checks |
| **Primary suite** | `prompt-eval/architect/` |
| **Quick run command** | `npm run eval:architect` |
| **Full suite command** | `npm run eval:all && npx tsc --noEmit` |
| **Estimated runtime** | ~30-90 seconds depending on provider latency |

---

## Per-Task Verification Map

| Task ID | Plan | Requirement | Test Type | Automated Command | Status |
|---------|------|-------------|-----------|-------------------|--------|
| 11-01-01 | 01 | DAG-01, DAG-03 | prompt/schema | `npx vitest run src/lib/ai/__tests__/prompts.test.ts src/lib/ai/__tests__/architect.test.ts --reporter=verbose` | green |
| 11-01-02 | 01 | DAG-01, DAG-03 | deterministic invariants | `npx vitest run src/lib/ai/__tests__/architect.test.ts --reporter=verbose` | green |
| 11-02-01 | 02 | DAG-02 | promptfoo golden valid-path cases | `npm run eval:architect` | green |
| 11-02-02 | 02 | DAG-02, DAG-03 | promptfoo cycle traps and schema assertions | `npm run eval:architect` | green |
| 11-03-01 | 03 | DAG-01, DAG-02, DAG-03 | integration sweep | `npm run eval:all && npx tsc --noEmit` | green |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Status |
|----------|-------------|------------|--------|
| Schema shape matches the future runtime contract | DAG-03 | Product judgment on response ergonomics still matters | approved |
| Cycle refusal is explicit rather than magical repair | DAG-02 | Human review confirms the refusal philosophy, not just the pass/fail bit | approved |
| Runtime-light boundary is preserved | DAG-01 | Human confirmation that no route/UI wiring slipped into the phase | approved |

---

## Verification Runs

- `npx vitest run src/lib/ai/__tests__/prompts.test.ts src/lib/ai/__tests__/architect.test.ts --reporter=verbose`
- `npm run eval:architect`
- `npm run eval:all`
- `npx tsc --noEmit`

## Approval

- Human approval captured on 2026-03-23 during the Phase 11 execution review.
