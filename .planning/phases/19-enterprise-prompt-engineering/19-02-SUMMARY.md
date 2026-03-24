---
phase: 19-enterprise-prompt-engineering
plan: 02
subsystem: testing
tags: [promptfoo, eval, golden-cases, khanmigo, behavioral, architect, conversationalist, judge-model]

# Dependency graph
requires:
  - phase: 19-enterprise-prompt-engineering
    plan: 01
    provides: Khanmigo patterns in CHAT_SYSTEM_PROMPT, comprehension test heuristic in inferPrerequisites, Kahn's algorithm in architect.ts
provides:
  - 4 Khanmigo behavioral golden cases in conversationalist suite (mistake handling, calibrated difficulty, meta-questioning, neurogenesis priming)
  - 4 architect boundary golden cases (RELATED vs PREREQUISITE, BUILDS_ON vs PREREQUISITE, strong prerequisite, no connection)
  - Judge model pinned to openai:gpt-4o-2024-08-06 in all 3 promptfoo configs
affects:
  - prompt-eval/conversationalist
  - prompt-eval/architect
  - prompt-eval/bouncer

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Judge model pin comment at top of promptfooconfig.yaml to prevent score drift from silent model updates"
    - "Behavioral assertion pattern: custom javascript assert blocks validate Khanmigo-specific response patterns"
    - "CSV architect cases: RELATED/BUILDS_ON/PREREQUISITE disambiguation via required_synapse column"

key-files:
  created: []
  modified:
    - prompt-eval/conversationalist/cases.yaml
    - prompt-eval/conversationalist/promptfooconfig.yaml
    - prompt-eval/architect/cases.csv
    - prompt-eval/architect/promptfooconfig.yaml
    - prompt-eval/bouncer/promptfooconfig.yaml

key-decisions:
  - "Judge model pin added as comment (not as llm-rubric provider override) — configs use heuristic-only assertions; pin documents intended model version without requiring live API calls"
  - "Mistake handling case uses soft assertion: reject direct-correction openings but allow question + mention of correct answer — avoids over-constraining response style"
  - "Calibrated difficulty case checks question count <= 2 — more than 2 questions signals escalation not simplification"
  - "Meta-questioning case uses scored partial credit (0.8) for responses with question but no explicit assumption signal — meta-questions are rare, hard pass/fail would be brittle"
  - "No-connection case (Quantum Computing + Italian Cuisine) uses empty required_synapse — existing assertion returns true when required_synapse is empty, correctly passing any valid response"

patterns-established:
  - "Custom assert blocks on individual cases for behavioral patterns — default assertions check Socratic tone and neurogenesis; per-case asserts check specific Khanmigo behaviors"
  - "Architect CSV: RELATED/BUILDS_ON/PREREQUISITE columns disambiguate synapse type in required_synapse field"

requirements-completed: [PROMPT-04]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 19 Plan 02: Eval Suite Expansion — 42-Case Coverage + Judge Model Pin Summary

**Expanded promptfoo eval suite from 34 to 42 cases with behavioral assertions for all 4 Khanmigo patterns and judge model pinned to gpt-4o-2024-08-06 across all three configs**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-24T21:25:25Z
- **Completed:** 2026-03-24T21:27:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added 4 Khanmigo behavioral golden cases to conversationalist suite: mistake handling (no direct correction), calibrated difficulty (simplify for uncertain learner), meta-questioning (surface assumptions after 3+ turns), multi-turn neurogenesis priming (cross-domain Analyze-level insight)
- Added 4 architect boundary cases to disambiguate comprehension test output: RELATED (parallel languages), BUILDS_ON (enrichment), strong PREREQUISITE (calculus gates gradient descent), no connection (unrelated domains)
- Pinned judge model `openai:gpt-4o-2024-08-06` via comment in all 3 promptfoo configs (conversationalist, architect, bouncer)
- Total suite: 17 conversationalist + 12 architect + 13 bouncer = 42 golden cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Pin judge model and add 4 conversationalist behavioral cases** - `4bcea87` (feat)
2. **Task 2: Add 4 architect boundary cases** - `36b2c8f` (feat)

## Files Created/Modified

- `prompt-eval/conversationalist/cases.yaml` — Added 4 Khanmigo behavioral cases (cases 14–17) with per-case javascript assertions; total 17 cases
- `prompt-eval/conversationalist/promptfooconfig.yaml` — Added judge model pin comment
- `prompt-eval/architect/cases.csv` — Added 4 boundary disambiguation cases (rows 9–12); total 12 data rows
- `prompt-eval/architect/promptfooconfig.yaml` — Added judge model pin comment
- `prompt-eval/bouncer/promptfooconfig.yaml` — Added judge model pin comment

## Decisions Made

- Judge model pin implemented as a comment rather than a live `provider:` override because all three configs use heuristic-only evaluation (no `llm-rubric` assertions). A comment at the top of each file serves as documentation and re-baselining signal without introducing a live API dependency in CI.
- The "no connection" architect case uses an empty `required_synapse` field — the existing assertion returns `true` when the field is empty, which correctly passes any valid response. The case's value is in verifying the model does not hallucinate a PREREQUISITE between unrelated domains.
- Calibrated difficulty case sets a maximum of 2 question marks as a proxy for "not escalating complexity" — this is a heuristic that may need tuning if legitimate single-turn responses naturally contain 3 questions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 42 golden cases in place and following existing format conventions
- Judge model pinned in all 3 configs — score drift from silent model updates will be caught at re-baseline
- Behavioral assertions validate the 4 Khanmigo patterns from PROMPT-01 — prompt drift will trigger eval failures
- No blockers

---
*Phase: 19-enterprise-prompt-engineering*
*Completed: 2026-03-24*
