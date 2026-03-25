---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Core Flow Stability, Multi-Agent Architecture & Observability
status: Ready to plan Phase 22
stopped_at: Roadmap created — Phase 22 next
last_updated: "2026-03-25"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Phase 22 — Observability Foundation

## Current Position

Phase: 22 of 25 (Observability Foundation)
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-25 — v2.1 roadmap created (Phases 22-25)

Progress: [░░░░░░░░░░] 0% (v2.1 milestone)

## Performance Metrics

**Velocity (v2.0 reference):**

- Total plans completed: 7 (v2.0)
- Average duration: ~7 min/plan
- Total execution time: ~50 min

**By Phase (v2.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 18 AI Reliability | 2 | ~18m | ~9m |
| Phase 19 Enterprise Prompts | 2 | ~17m | ~8m |
| Phase 20 Editor Reliability | 1 | ~7m | 7m |
| Phase 21 Graph + Bloom UI | 2 | ~10m | ~5m |

**Recent Trend:**

- Last 5 plans: 8m, 10m, 15m, 2m, 7m
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v2.1 Roadmap]: Observability first — traces must be live before any agent refactoring so every code change in Phases 23-25 is debuggable from day one
- [v2.1 Roadmap]: DB migration (AGENT-06) ships in Phase 23 with the Pure Conversationalist — tool-call message cleanup is a hard prerequisite for Phase 24 session rehydration
- [v2.1 Roadmap]: Eval suites (EVAL-01, EVAL-02) ship before production code — evals gate each agent's implementation, not the other way around
- [v2.1 Roadmap]: Architect pipeline is last (Phase 25) — highest latency change, depends on bloomLevel output from Phase 24, lands after interactive path is proven stable
- [v2.1 Constraints]: Use `immediateExport: true` in LangfuseSpanProcessor — `after()` requires Next.js 15+; project is on Next.js 14.2.35
- [v2.1 Constraints]: Audit all routes for `runtime = 'edge'` before instrumentation — Edge runtime drops Langfuse Node.js SDK traces silently
- [v2.1 Constraints]: Bloom evaluator is a UI hint layer only (0.75 confidence threshold) — Bouncer remains authoritative gate for Bloom classification

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 22]: Langfuse Cloud vs self-host decision must be made before the first trace is sent — affects env var config, GDPR posture, and operational burden
- [Phase 24]: Evaluator calibration baseline unknown — run 31 golden promptfoo cases through gemini-2.5-flash for Bloom classification before wiring to UI; if false positive rate at Understand/Analyze boundary exceeds 20%, adjust confidence threshold or model choice
- [Phase 22]: Known issue #12643 — trace-level input/output appears empty in Langfuse Traces tab with ai@6.0.82 + @langfuse/otel@5.0.1; data is present in Observations tab; monitor for patch

## Session Continuity

Last session: 2026-03-25
Stopped at: v2.1 roadmap written — Phases 22-25 defined, REQUIREMENTS.md traceability pending
Resume file: None
