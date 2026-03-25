---
phase: 23-pure-conversationalist
plan: "01"
subsystem: testing
tags: [promptfoo, eval, conversationalist, yaml, supabase, migration]

# Dependency graph
requires:
  - phase: 19-enterprise-prompt-engineering
    provides: conversationalist eval infrastructure (cases.yaml, promptfooconfig.yaml, provider.mjs)
provides:
  - 4 new golden eval cases with no-jargon, natural-flow, depth-challenge, and mistake-handling JavaScript assertions
  - Pure-text eval provider with tool-calling and neurogenesis code fully removed
  - DB migration truncating messages and conversations tables for clean slate
affects: [23-02-pure-conversationalist, 24-neurogenesis-background-evaluator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Eval-driven development: eval suite defines behavioral contract before prompt rewrite"
    - "JavaScript assertion blocks in YAML with hard regex constraints (jargon ban, bullet detection)"
    - "Destructive TRUNCATE migration with CASCADE for single-user beta clean resets"

key-files:
  created:
    - supabase/migrations/20260325000000_truncate_chat_tables.sql
  modified:
    - prompt-eval/conversationalist/cases.yaml
    - prompt-eval/conversationalist/promptfooconfig.yaml
    - prompt-eval/shared/neurograph-conversationalist-provider.mjs

key-decisions:
  - "23-01-cases-full-replace: All 17 old eval cases replaced with 4 new ones — old cases relied on neurogenesis_triggered which no longer exists in the new pure-text architecture"
  - "23-01-socratic-threshold: Socratic tone threshold lowered from 0.8 to 0.7 — natural, paragraph-form responses may score lower on the teach-then-ask heuristic than structured responses"
  - "23-01-tool-removal-eval: Provider generateText call stripped of all tool parameters — eval provider must mirror production chat architecture exactly"
  - "23-01-truncate-migration: TRUNCATE TABLE with CASCADE is sufficient — no complex JSON parsing needed, single-user beta data is disposable"

patterns-established:
  - "Per-case JavaScript assert blocks with explicit FAIL conditions before PASS check"
  - "Jargon ban via array of regex patterns with word boundary anchors"
  - "Bullet detection via line-by-line split and leading pattern match"

requirements-completed: [EVAL-01, AGENT-06]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 23 Plan 01: Pure Conversationalist Eval Suite Summary

**4 new golden eval cases with hard jargon-ban, bullet-point, and Socratic question assertions replace 17 legacy tool-call cases; TRUNCATE migration eliminates legacy chat data**

## Performance

- **Duration:** 3min
- **Started:** 2026-03-25T21:17:27Z
- **Completed:** 2026-03-25T21:20:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced all 17 old conversationalist eval cases with 4 new golden cases validating the pure-text Socratic tutor behavioral contract
- Stripped neurogenesisJsonSchema, BLOOM_ANALYZE_SIGNALS, BLOOM_QUESTION_EXEMPTION, detectsAnalyzeLevel, and suggest_neurogenesis tool from the eval provider — provider now calls generateText with no tools
- Lowered Socratic tone threshold from 0.8 to 0.7 in promptfooconfig defaultTest and removed neurogenesis assertion entirely
- Created destructive TRUNCATE migration to wipe all legacy tool-call messages and conversations

## Task Commits

Each task was committed atomically:

1. **Task 1: Rebuild conversationalist eval suite with pure-text assertions** - `3a3a0f1` (feat)
2. **Task 2: Create TRUNCATE migration for messages and conversations tables** - `18610b3` (chore)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `prompt-eval/conversationalist/cases.yaml` - Replaced with 4 new golden cases: no-jargon, natural-flow, depth-challenge, mistake-handling
- `prompt-eval/conversationalist/promptfooconfig.yaml` - Removed neurogenesis defaultTest assertion; lowered Socratic threshold to 0.7
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` - Removed all neurogenesis code; output is now `{ response, socratic_score }` only
- `supabase/migrations/20260325000000_truncate_chat_tables.sql` - TRUNCATE messages + conversations CASCADE

## Decisions Made

- **23-01-cases-full-replace:** All 17 old eval cases replaced with 4 new ones. Old cases tested `neurogenesis_triggered` which no longer exists. Starting fresh was cleaner than updating 17 cases individually.
- **23-01-socratic-threshold:** Threshold lowered from 0.8 to 0.7. The new pure conversationalist prompt aims for natural paragraph-form responses, which may score lower on the existing teach-then-ask heuristic than the old structured responses.
- **23-01-tool-removal-eval:** Eval provider must mirror production chat architecture exactly — removing tools from the generateText call in the provider is the prerequisite for eval results having predictive validity.
- **23-01-truncate-migration:** TRUNCATE with CASCADE is the correct approach. No JSON-column parsing or partial migration needed. Single-user beta; data is disposable. The new architecture creates a clean conversation model.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration runs via standard Supabase migration tooling on next push.

## Next Phase Readiness

- Eval suite contract is established. Plan 23-02 can now rewrite CHAT_SYSTEM_PROMPT and strip tools from the production `/api/chat/route.ts` with a clear definition of what "passing" looks like.
- The TRUNCATE migration is ready to run — should be applied after the prompt rewrite ships to avoid running the new eval against stale legacy data.
- No blockers.

---
*Phase: 23-pure-conversationalist*
*Completed: 2026-03-25*
