---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: MVP Core Stability
status: Ready to plan
stopped_at: Completed 20-01-PLAN.md
last_updated: "2026-03-24T21:48:47.242Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 5
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-24)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Phase 18 — AI Reliability

## Current Position

Phase: 21
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v2.0)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 18-ai-reliability P02 | 8min | 2 tasks | 2 files |
| Phase 18 P01 | 10m | 2 tasks | 6 files |
| Phase 19-enterprise-prompt-engineering P01 | 15min | 3 tasks | 3 files |
| Phase 19 P02 | 2min | 2 tasks | 5 files |
| Phase 20-editor-reliability P01 | 7min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v2.0 Roadmap]: Phase 18 (AI Reliability) precedes Phase 19 (Prompts) — AI call sites must be hardened before prompt engineering begins so behavioral regressions surface as real errors
- [v2.0 Roadmap]: PROMPT-04 (eval suite expansion) is in Phase 19 alongside prompt changes — evals must be written before prompts are changed, not after
- [v2.0 Roadmap]: Phase 20 (Editor) ordered after Phase 18 because editor content feeds AI calls; stable AI layer makes editor validation meaningful
- [v2.0 Roadmap]: Phase 21 (Graph + Bloom UI) is last — React-side changes depend on stable editor data and are the only phases touching UI components
- [Phase 18-ai-reliability]: onError is the ONLY reliable surface for mid-stream AI SDK errors — outer try/catch does not catch them (per GitHub issue #4726)
- [Phase 18-ai-reliability]: maxRetries: 1 on chat (not 0 or 2) — interactive streaming needs 1 retry for transient errors, but more adds dead silence
- [Phase 18-ai-reliability]: 60s timeout for chat, 30s for ai-action — proportional to expected generation length
- [Phase 18]: Use NoObjectGeneratedError.isInstance() not instanceof for SDK error discrimination
- [Phase 18]: Wrap entire post-insert enrichment in a single non-fatal try/catch (crystallize + vector search + inferPrerequisites + ghostProjection)
- [Phase 19-enterprise-prompt-engineering]: 19-01-khanmigo-sections: Khanmigo patterns placed in dedicated Pedagogical Calibration section preserving A/E/Q structure and Neurogenesis Policy unchanged
- [Phase 19-enterprise-prompt-engineering]: 19-01-kahn-belt-suspenders: kahnCycleDetection fires only when DFS missed cycle — no redundant errors, covers disconnected-component edge cases
- [Phase 19-enterprise-prompt-engineering]: 19-01-comprehension-test: Binary 'NEVER encountered A — can B still be understood?' replaces subjective prerequisite judgment in inferPrerequisites
- [Phase 19]: 19-02-judge-model-pin: Judge model pinned as comment (not llm-rubric provider) — configs use heuristic-only assertions; pin documents intended model without requiring live API calls
- [Phase 19]: 19-02-behavioral-assertions: Per-case javascript assert blocks validate Khanmigo patterns; default assertions handle Socratic tone and neurogenesis; custom asserts check specific behaviors
- [Phase 20-editor-reliability]: 20-01-single-effect-neuron-id: Single effect keyed on [neuron.id, editor] replaces dual effects; focus guard is wrong when ID changes
- [Phase 20-editor-reliability]: 20-01-getjson-canonical: JSON.stringify(getJSON()) is canonical save format replacing getHTML()
- [Phase 20-editor-reliability]: 20-01-emit-update-false: TipTap v3 setContent uses {emitUpdate:false} options object (not boolean) to suppress dirty/extraction triggers on programmatic sync

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 21]: `onlyRenderVisibleElements` has a known edge rendering bug (GitHub #4516). Requires hands-on validation with a 100+ node graph before shipping. Go/no-go decision at phase close.
- [Phase 19]: promptfoo judge model version must be pinned and current scores baselined before eval suite expansion begins — prevents score drift from silent judge model updates.

## Session Continuity

Last session: 2026-03-24T21:47:37.586Z
Stopped at: Completed 20-01-PLAN.md
Resume file: None
