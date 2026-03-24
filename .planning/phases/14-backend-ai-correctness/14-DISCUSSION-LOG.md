# Phase 14: Backend AI Correctness - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-03-24
**Phase:** 14-backend-ai-correctness
**Mode:** assumptions
**Areas analyzed:** Architect Schema, Bloom Gate Runtime, DAG Prerequisite Wiring, Legacy Edge Cleanup

## Assumptions Presented

### BUG-01: Architect Schema
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| `refusalReason` `.optional()` incompatible with OpenAI structured outputs — change to `.nullable()` | Confident | `architect.ts` line 88, OpenAI requires all properties in `required` |

### BUG-02: Bloom Gate
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Bloom gate is prompt-only, no server-side enforcement — add 422 rejection for Remember/Understand/Apply | Confident | `tools.ts` line 21 accepts all 6 levels, no validation in neurons POST |

### BUG-03: DAG Wiring
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Candidate pool too narrow (threshold 0.3, count 5) — widen to 0.15/10 | Likely | `neurons/route.ts` lines 156-161 |
| Legacy RELATED + ai_suggested edges persist — SQL cleanup needed | Likely | No migration removed old auto-wired edges |

## Corrections Made

No corrections — all assumptions confirmed.
