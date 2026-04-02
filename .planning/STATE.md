---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Core Flow Stability, Multi-Agent Architecture & Observability
status: QA testing in progress
stopped_at: Manual QA testing — user running v2.1 test checklist
last_updated: "2026-04-03"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Post-v2.1 QA testing and stabilization

## Current Position

Phase: v2.1 complete — QA testing
Plan: Manual test checklist (v2.1-test-checklist.xlsx)
Status: Testing with real models via OpenRouter
Last activity: 2026-04-03 — Fixed OpenRouter provider integration, resumed QA

Progress: [██████████] 100% (v2.1 build) | QA in progress

## Post-Milestone Fixes (applied after v2.1 tag)

| Commit | Fix | Reason |
|--------|-----|--------|
| b84f762 | Enable `experimental.instrumentationHook` in next.config.js | Langfuse tracing was silently a no-op without it |
| c86146a | Bloom debug cheat codes (`/bloom:Analyze`) + status indicator | Deterministic testing support |
| fa3fbfd | OpenRouter provider support + aligned env var names | User's Vercel config uses OpenRouter for all models |
| edf5527 | Remove silent fallbacks — missing env vars now throw | Prevent accidental OpenAI billing |
| 0da87c5 | `compatibility: 'compatible'` for OpenRouter | SDK was using Responses API, not Chat Completions |
| 4b8fe90 | Force `.chat()` for OpenRouter | `compatibility` flag alone wasn't enough |
| d629cbf | Remove unused Aider spec files | Cleanup |

## Performance Metrics

**v2.1 Execution:**

| Phase | Plans | Duration | Tasks | Files |
|-------|-------|----------|-------|-------|
| 22 Observability Foundation | 2 | ~6min | 4 | 13 |
| 23 Pure Conversationalist | 2 | ~7min | 4 | 8 |
| 24 Silent Observer | 2 | ~18min | 4 | 8 |
| 25 Decoupled Architect Pipeline | 2 | ~15min | 4 | 4 |
| **Total** | **8** | **~46min** | **16** | **33** |

## Accumulated Context

### Decisions

- [v2.1]: Langfuse Cloud (not self-hosted) — decided during milestone setup
- [v2.1]: OpenRouter as single provider gateway — all models routed through one API key
- [v2.1]: Env var names aligned with Vercel: AI_MODEL_CHAT, AI_MODEL_SYNTHESIZER, AI_MODEL_INQUISITOR, AI_MODEL_EVALUATOR
- [v2.1]: No silent fallbacks — missing env vars throw with actionable error messages
- [v2.1]: Debug cheat codes (`/bloom:*`) active in dev only (NODE_ENV !== 'production')
- [v2.1]: Bloom status indicator shows level + confidence next to Generate Neuron button

### Pending Todos

- Complete manual QA test checklist (v2.1-test-checklist.xlsx)
- Verify all tests pass with real OpenRouter models
- Push all post-milestone fixes to main

### Blockers/Concerns

- [Resolved] Langfuse Cloud chosen — OPENROUTER_API_KEY covers all providers
- [Resolved] instrumentationHook missing — fixed in b84f762
- [Resolved] OpenRouter Responses API incompatibility — fixed in 4b8fe90
- [Open] Evaluator calibration baseline still unknown — testing in progress
- [Open] Langfuse issue #12643 — trace-level I/O may appear empty in Traces tab

## Session Continuity

Last session: 2026-04-03
Stopped at: QA testing with real OpenRouter models
Resume file: None
