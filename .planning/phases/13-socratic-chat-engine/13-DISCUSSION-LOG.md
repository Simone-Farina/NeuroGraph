# Phase 13: Socratic Chat Engine - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-03-23
**Phase:** 13-socratic-chat-engine
**Mode:** assumptions
**Areas analyzed:** Multi-Turn Eval Strategy, Prompt Contract Modification, Custom Provider Architecture, Assertion Strategy

## Assumptions Presented

### Multi-Turn Eval Strategy
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Use promptfoo multi-turn conversation format (message arrays) | Confident | SOCRATES-02 requires multi-turn testing |
| Pre-scripted conversation scripts (not live loops) | Likely | Golden casuistry philosophy from Phase 10 |

### Prompt Contract Modification
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Modify CHAT_SYSTEM_PROMPT with anti-answer-giving directives | Likely | Current prompt lacks explicit prohibition |
| Tighten Neurogenesis Policy to deep-insights-only | Unclear | Current "fire liberally" conflicts with SOCRATES-03 |

### Custom Provider Architecture
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Create conversationalist provider following bouncer/architect pattern | Confident | `prompt-eval/shared/` patterns |

### Assertion Strategy
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Scored threshold > 0.8 for tone, hard pass/fail for neurogenesis trigger | Confident | Phase 10 context specified Socratic Index scoring |
| Dual-mode: heuristic fallback + LLM rubric | Likely | Matches established dual-mode pattern |

## Corrections Made

### Prompt Contract Modification — Neurogenesis Policy
- **Original assumption:** Unclear — Option A (tighten) vs Option B (add depth tier)
- **User correction:** Go firmly with Option A. Tighten policy to fire only on genuine deep insights.
- **Reason:** The current liberal policy violates the core Master Specification. Node creation must "follow demonstrated conceptual depth" and be "selective to avoid noise." User mandated Bloom's Taxonomy as the Deep Insight measurement framework — Neurogenesis only at Analyze level or higher.
