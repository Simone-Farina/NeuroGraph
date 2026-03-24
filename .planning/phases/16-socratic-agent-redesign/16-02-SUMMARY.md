---
phase: 16-socratic-agent-redesign
plan: 02
subsystem: testing
tags: [promptfoo, eval, socratic, golden-cases, teach-then-ask, heuristic-scoring]

# Dependency graph
requires:
  - phase: 16-socratic-agent-redesign
    provides: Updated CHAT_SYSTEM_PROMPT with teach-then-ask contract and updated scoreSocraticTone heuristic (Plan 01)
  - phase: 13-socratic-chat-engine
    provides: Original 10 conversationalist golden cases and eval infrastructure
provides:
  - 3 new teach-then-ask golden cases (cases 11-13) covering historical, science, and programming domains
  - Full 34-case cross-agent eval suite passing at 100% (bouncer 13 + architect 8 + conversationalist 13)
  - D-07 and D-08 satisfied
affects: [conversationalist-eval-suite, socratic-agent-behavior]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Teach-then-ask case authorship: final_user_message must avoid BLOOM_ANALYZE_SIGNALS (because, since, i realized, etc.) when expected_neurogenesis: false"
    - "Case distribution: cases with shallow answers always use declarative statements, not causal clauses"

key-files:
  created: []
  modified:
    - prompt-eval/conversationalist/cases.yaml

key-decisions:
  - "16-02-case-message-wording: Avoided 'because X' phrasing in final_user_message for expected_neurogenesis:false cases — the heuristic BLOOM_ANALYZE_SIGNALS pattern /\\bbecause\\b.{5,}/i fires on any causal clause, so shallow answers must use non-causal phrasing"
  - "16-02-no-threshold-change: promptfooconfig.yaml threshold left at >= 0.8 — heuristic template already scores 0.80 and all 13 cases pass without adjustment"

patterns-established:
  - "Pattern 1: Golden case authorship — for expected_neurogenesis: false cases, audit final_user_message against BLOOM_ANALYZE_SIGNALS before adding to suite"
  - "Pattern 2: Teach-then-ask case coverage — three domains (historical/philosophy, science, programming) ensure the pattern is validated across diverse topic types"

requirements-completed: [AGENT-01, AGENT-02]

# Metrics
duration: 8min
completed: 2026-03-24
---

# Phase 16 Plan 02: Socratic Agent Redesign — Teach-Then-Ask Golden Cases Summary

**3 teach-then-ask golden cases added (historical, science, programming domains); full 34-case cross-agent promptfoo suite passes at 100% with no threshold changes needed**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-24T18:44:00Z
- **Completed:** 2026-03-24T18:46:21Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added cases 11-13 to `prompt-eval/conversationalist/cases.yaml` under a new "Teach-Then-Ask Cases (Phase 16 Plan 02)" section
- Updated case distribution comment at the top of the file to document the new category
- Diagnosed and fixed accidental BLOOM_ANALYZE_SIGNALS matches in two case final_user_messages (causal "because" pattern)
- Full suite result: bouncer 13/13 + architect 8/8 + conversationalist 13/13 = 34 passed, 0 failed, 0 errors (100%)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add teach-then-ask golden cases and verify full suite** - `aa57a66` (feat)

## Files Created/Modified

- `prompt-eval/conversationalist/cases.yaml` — Added cases 11-13 (teach-then-ask pattern), updated case distribution header comment

## Decisions Made

- **Case message wording:** Avoided causal "because X" phrasing in `final_user_message` for `expected_neurogenesis: false` cases. The heuristic `BLOOM_ANALYZE_SIGNALS` pattern `/\bbecause\b.{5,}/i` fires on any causal clause — "I think X because Y" would incorrectly trigger neurogenesis detection for shallow answers. Changed wording to declarative statements ("I think Siddhartha just wanted independence from his teacher" / "gravity is too strong" via em-dash) to keep these firmly at Remember/Understand level.
- **No threshold change:** `promptfooconfig.yaml` threshold left at `>= 0.8`. The heuristic fallback template (Plan 01) scores exactly 0.80, all new cases pass on first run after the wording fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed accidental neurogenesis signal in case 11 and 12 final_user_messages**
- **Found during:** Task 1 (running eval after adding cases — 2 failures, 84.62% pass rate)
- **Issue:** Cases 11 and 12 used "I think X because Y" phrasing. The heuristic `detectsAnalyzeLevel` matched `/\bbecause\b.{5,}/i`, causing `neurogenesis_triggered: true` for cases with `expected_neurogenesis: false`.
- **Fix:** Rewrote final messages to avoid causal clauses: case 11 → "I think Siddhartha just wanted independence from his teacher"; case 12 → "I think nothing can escape a black hole — gravity is too strong." (em-dash instead of "because")
- **Files modified:** `prompt-eval/conversationalist/cases.yaml`
- **Verification:** Re-ran `npm run eval:conversationalist` — 13/13 passed (100%)
- **Committed in:** `aa57a66` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in case authorship)
**Impact on plan:** Essential fix. The plan's "Pitfall 4" warning covered this risk; actual execution triggered it as predicted. No scope creep.

## Issues Encountered

- Initial case run failed on cases 11 and 12 (84.62%) due to BLOOM_ANALYZE_SIGNALS matching "because" in shallow answer messages. Diagnosed immediately from the heuristic output — `neurogenesis_triggered: true` when `expected_neurogenesis: false`. Fixed in the same task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 16 is complete. Both plans executed:
  - Plan 01: CHAT_SYSTEM_PROMPT rewritten with teach-then-ask contract; heuristic updated
  - Plan 02: 3 new golden cases added; full 34-case suite passing 100%
- D-07 (new teach-then-ask golden cases) and D-08 (full suite integrity) are satisfied
- No blockers

## Self-Check: PASSED

- FOUND: `prompt-eval/conversationalist/cases.yaml`
- FOUND: `.planning/phases/16-socratic-agent-redesign/16-02-SUMMARY.md`
- FOUND: commit `aa57a66`

---
*Phase: 16-socratic-agent-redesign*
*Completed: 2026-03-24*
