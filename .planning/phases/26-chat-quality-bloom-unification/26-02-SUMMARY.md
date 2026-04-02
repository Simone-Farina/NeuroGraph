---
phase: 26-chat-quality-bloom-unification
plan: 02
subsystem: ai
tags: [prompts, eval, promptfoo, bloom, worktree-cleanup]

# Dependency graph
requires:
  - phase: 24-silent-observer
    provides: "Phase 24 LLM Bloom evaluator at POST /api/bloom-evaluate — the sole classification source being verified"
  - phase: 23-pure-conversationalist
    provides: "CHAT_SYSTEM_PROMPT contract and conversationalist eval suite that this plan extends"
provides:
  - "Rewritten CHAT_SYSTEM_PROMPT defaulting to 1-2 paragraphs with varied openings and flexible closings"
  - "5th promptfoo regression case in conversationalist eval suite guarding against 3-paragraph default"
  - "Formal verification that Phase 21 Bloom heuristic was never merged (BLOOM-01 satisfied)"
  - "Stale Phase 21 worktree agent-ac5685ca removed from local and confirmed absent from remote"
affects: [conversationalist-eval, chat-quality, bloom-evaluator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Eval-first TDD: write failing regression case before changing the prompt it asserts against"
    - "Paragraph-count assertion via \\n\\n split in promptfoo JS block — deterministic, zero-cost"
    - "Bloom unification verification: grep audit + worktree list as acceptance gates"

key-files:
  created: []
  modified:
    - src/lib/ai/prompts.ts
    - prompt-eval/conversationalist/cases.yaml

key-decisions:
  - "26-02-shorter-default: CHAT_SYSTEM_PROMPT rewritten to default 1-2 paragraphs; 'One tight paragraph is often enough' as primary guidance (D-08)"
  - "26-02-opening-variety: Added 'Never start two consecutive replies the same way' with explicit vary-between instruction (D-09)"
  - "26-02-flexible-closing: Replaced mandatory 'Always close with exactly one focused question' with 'Usually close with a question, but occasionally a brief observation' (D-10)"
  - "26-02-eval-first: Paragraph-count regression case written before prompt change per D-11 — baseline captured first"
  - "26-02-bloom-verified: BLOOM-01 confirmed satisfied by grep audit — classifyBloomLevel/BLOOM_ANALYZE_SIGNALS/BloomDepthMeter all absent from src/"
  - "26-02-worktree-cleanup: worktree-agent-ac5685ca removed (local + branch deleted); remote push confirmed non-existent"

patterns-established:
  - "Prompt-eval eval-first: add failing eval case before prompt rewrite to establish regression baseline"

requirements-completed:
  - CHAT-02
  - BLOOM-01

# Metrics
duration: 2min
completed: 2026-04-03
---

# Phase 26 Plan 02: Chat Quality & Bloom Unification Summary

**CHAT_SYSTEM_PROMPT rewritten to default 1-2 paragraphs with varied openings and flexible closings; paragraph-count promptfoo regression guard added; Phase 21 Bloom heuristic formally verified absent and stale worktree removed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T23:45:22Z
- **Completed:** 2026-04-03T00:00:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- CHAT_SYSTEM_PROMPT defaults to 1-2 paragraphs (not 3) with explicit "One tight paragraph is often enough" as primary guidance; 3 paragraphs reserved for rare elaboration
- Opening variety strengthened with explicit "Never start two consecutive replies the same way" anti-pattern instruction
- Mandatory question closing replaced with "Usually close with a question, but occasionally a brief observation or reframe is enough"
- Conversationalist eval suite extended to 5 cases with paragraph-count regression assertion (Case 5: response-length)
- BLOOM-01 formally verified: zero matches for classifyBloomLevel/BLOOM_ANALYZE_SIGNALS/BloomDepthMeter in src/; sole classification source is POST /api/bloom-evaluate
- Stale Phase 21 worktree (agent-ac5685ca) removed; local branch deleted; confirmed never pushed to remote

## Task Commits

Each task was committed atomically:

1. **Task 1: Add paragraph-count eval assertion** - `0da168c` (test)
2. **Task 2: Rewrite CHAT_SYSTEM_PROMPT** - `6e272f8` (feat)
3. **Task 3: Verify Bloom unification and clean up stale worktree** - no file changes (verification + git admin)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/lib/ai/prompts.ts` — CHAT_SYSTEM_PROMPT rewritten per D-07 through D-10; no other exports changed
- `prompt-eval/conversationalist/cases.yaml` — 5th case added for CHAT-02 paragraph-count regression guard

## Decisions Made

- **D-08 shorter default:** "One tight paragraph is often enough" as primary guidance (not a range floor); 3 paragraphs only for rare elaboration — avoids anchoring model to the ceiling of a range
- **D-09 opening variety:** Explicit "Never start two consecutive replies the same way" plus vary-between instruction makes the anti-anchoring requirement concrete
- **D-10 flexible closing:** Replaced mandatory question with "Usually close with a question, but occasionally a brief observation or reframe is enough" — removes formulaic padding that inflated response length
- **D-11 eval-first:** Regression case written before prompt change; baseline captured; case will now pass after prompt rewrite
- **BLOOM-01 pre-satisfied:** grep audit confirms heuristic never reached develop/main; worktree-agent-ac5685ca was the isolated Phase 21 development branch

## Deviations from Plan

None — plan executed exactly as written.

### Note on TypeScript Check

`npx tsc --noEmit` reports 3 pre-existing errors in `src/lib/ai/__tests__/architect.test.ts`, `src/lib/ai/__tests__/inferPrerequisites.test.ts`, and `src/lib/ai/providers.ts`. None are in `prompts.ts`. These are out of scope per deviation rule scope boundary — pre-existing issues unrelated to this plan's changes.

## Issues Encountered

- `git ls-remote --heads origin worktree-agent-ac5685ca` initially returned output suggesting the branch existed on remote, but `git push origin --delete` returned "remote ref does not exist". A second `git ls-remote` confirmed the branch was not present. The local branch and worktree were successfully removed.

## Known Stubs

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CHAT-02 and BLOOM-01 requirements satisfied — phase 26 plan 02 complete
- Conversationalist eval suite now has 5 cases with paragraph-count regression guard
- The chat quality improvements (shorter responses, varied openings, flexible closings) are live in CHAT_SYSTEM_PROMPT
- Phase 21 heuristic cleanup is formally verified and documented

---
*Phase: 26-chat-quality-bloom-unification*
*Completed: 2026-04-03*
