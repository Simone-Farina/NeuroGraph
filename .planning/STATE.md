---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Core Flow Stability, Multi-Agent Architecture & Observability
status: Ready to plan
stopped_at: Completed 23-02-PLAN.md
last_updated: "2026-03-25T21:35:28.283Z"
progress:
  total_phases: 8
  completed_phases: 6
  total_plans: 11
  completed_plans: 11
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Phase 22 — Observability Foundation

## Current Position

Phase: 24
Plan: Not started

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
| Phase 22-observability-foundation P01 | 3min | 2 tasks | 4 files |
| Phase 22-observability-foundation P02 | 3min | 2 tasks | 9 files |
| Phase 23-pure-conversationalist P01 | 3min | 2 tasks | 4 files |
| Phase 23-pure-conversationalist P02 | 4min | 2 tasks | 4 files |

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
- [Phase 22-observability-foundation]: flushAt: 1 replaces non-existent immediateExport option in LangfuseSpanProcessor v5.0.1
- [Phase 22-observability-foundation]: shouldExportSpan replaces non-existent shouldExport — v5 signature is ({ otelSpan }) => boolean
- [Phase 22-observability-foundation]: wrapRagWithObserve uses startActiveObservation (v5 API) not observe(options, fn) — observe() is a decorator in v5
- [Phase 22-observability-foundation]: 22-02: inferPrerequisites userId? is optional — existing crystallize callers compile unchanged; neurons/route.ts updated to pass user.id
- [Phase 22-observability-foundation]: 22-02: GenerateCrystallizeSeedInput.userId? optional to avoid breaking crystallize/route.ts and manual/route.ts call sites
- [Phase 23-pure-conversationalist]: 23-01-cases-full-replace: All 17 old eval cases replaced with 4 new ones — neurogenesis_triggered no longer exists in pure-text architecture
- [Phase 23-pure-conversationalist]: 23-01-socratic-threshold: Socratic tone threshold lowered from 0.8 to 0.7 — natural paragraph-form responses score lower on teach-then-ask heuristic
- [Phase 23-pure-conversationalist]: 23-01-tool-removal-eval: Eval provider generateText call stripped of all tools — provider must mirror production chat architecture exactly
- [Phase 23-pure-conversationalist]: 23-01-truncate-migration: TRUNCATE TABLE messages/conversations CASCADE — no JSON parsing migration needed, single-user beta data is disposable
- [Phase 23-pure-conversationalist]: 23-02-depth-encouragement: Depth Encouragement directive pushes users to analyze mechanisms and tradeoffs without naming Bloom's Taxonomy or cognitive levels — strict separation of concerns
- [Phase 23-pure-conversationalist]: 23-02-reference-catalog: Renamed Existing Neuron Catalog to Reference Catalog in system prompt construction — strips internal architecture language from AI context
- [Phase 23-pure-conversationalist]: 23-02-loadMessages-text-only: loadMessages simplified to text-only parts — no tool part rehydration since TRUNCATE migration wiped all legacy tool_invocations metadata

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 22]: Langfuse Cloud vs self-host decision must be made before the first trace is sent — affects env var config, GDPR posture, and operational burden
- [Phase 24]: Evaluator calibration baseline unknown — run 31 golden promptfoo cases through gemini-2.5-flash for Bloom classification before wiring to UI; if false positive rate at Understand/Analyze boundary exceeds 20%, adjust confidence threshold or model choice
- [Phase 22]: Known issue #12643 — trace-level input/output appears empty in Langfuse Traces tab with ai@6.0.82 + @langfuse/otel@5.0.1; data is present in Observations tab; monitor for patch

## Session Continuity

Last session: 2026-03-25T21:29:32.612Z
Stopped at: Completed 23-02-PLAN.md
Resume file: None
