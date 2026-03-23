# Phase 12: Chat Analyzer / Bouncer Agent - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-03-23
**Phase:** 12-chat-analyzer-bouncer-agent
**Mode:** assumptions
**Areas analyzed:** Bouncer Prompt Scope, Eval Suite Structure, Heuristic Fallback Provider, Runtime Integration Boundary

## Assumptions Presented

### Bouncer Prompt Scope
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Extend BOUNCER_SYSTEM_PROMPT to handle both duplicate rejection AND extraction as single agent with expanded JSON contract | Likely | `src/lib/ai/prompts.ts` lines 41-58, ROADMAP phase 12 description |

### Eval Suite Structure
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Extend existing 5-case CSV with new extraction cases while preserving duplicate-detection baseline | Confident | `prompt-eval/bouncer/cases.csv`, Phase 11 architect pattern |

### Heuristic Fallback Provider
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Extend heuristicDecision in bouncer provider to cover extraction fields | Confident | `prompt-eval/shared/neurograph-bouncer-provider.mjs` lines 78-124 |

### Runtime Integration Boundary
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Phase 12 stays eval-only, no production route changes | Likely | Phase 11 CONTEXT.md pattern, ROADMAP "define and validate" phrasing |

## Corrections Made

No corrections — all assumptions confirmed.
