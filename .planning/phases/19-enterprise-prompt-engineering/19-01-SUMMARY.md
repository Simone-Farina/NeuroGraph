---
phase: 19-enterprise-prompt-engineering
plan: 01
subsystem: ai
tags: [prompts, khanmigo, socratic, dag, prerequisite, cycle-detection, kahn, pedagogy]

# Dependency graph
requires:
  - phase: 18-ai-reliability
    provides: maxRetries and abortSignal patterns for generateObject call sites
provides:
  - Khanmigo-upgraded CHAT_SYSTEM_PROMPT with 4 pedagogical calibration patterns
  - Comprehension test heuristic in inferPrerequisites prompt with 4 boundary examples
  - Kahn's algorithm cycle detection in architect.ts as structural safety net
affects:
  - 19-02-enterprise-prompt-engineering
  - prompt-eval/conversationalist
  - prompt-eval/architect

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Kahn's algorithm topological sort for cycle detection — complementary to DFS"
    - "Comprehension test heuristic for DAG prerequisite disambiguation"
    - "Khanmigo calibrated difficulty / mistake handling / Goldilocks edge / meta-questioning pattern"

key-files:
  created: []
  modified:
    - src/lib/ai/prompts.ts
    - src/lib/ai/inferPrerequisites.ts
    - src/lib/ai/architect.ts

key-decisions:
  - "Khanmigo patterns placed in a dedicated Pedagogical Calibration section between Behavior and Neurogenesis Policy — preserves existing A/E/Q structure"
  - "Kahn's algorithm fires only when DFS missed the cycle — belt-and-suspenders, no redundant errors"
  - "kahnCycleDetection exported for testability per plan spec"
  - "maxRetries: 2 and abortSignal added to inferPrerequisites (Rule 2 — missing critical functionality present in main repo)"

patterns-established:
  - "Dual cycle detection: DFS (findPedagogicalCycle) as primary, Kahn's (kahnCycleDetection) as safety net"
  - "Comprehension test: binary 'NEVER encountered A — can B still be understood?' replaces subjective prerequisite judgment"

requirements-completed: [PROMPT-01, PROMPT-02, PROMPT-03]

# Metrics
duration: 15min
completed: 2026-03-24
---

# Phase 19 Plan 01: Enterprise Prompt Engineering — Khanmigo + DAG Hardening + Kahn's Summary

**Khanmigo-proven calibration patterns added to CHAT_SYSTEM_PROMPT, comprehension-test heuristic with 4 boundary examples in inferPrerequisites, and Kahn's topological sort cycle detection added to architect.ts superRefine**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-24T00:00:00Z
- **Completed:** 2026-03-24
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- CHAT_SYSTEM_PROMPT gains a Pedagogical Calibration section with all 4 Khanmigo patterns: calibrated difficulty (UNKNOWN baseline), mistake handling ("How did you get there?"), Goldilocks edge tracking (simplify/escalate on engagement signals), meta-questioning ("What assumption are you making?")
- inferPrerequisites system prompt replaced with comprehension-test heuristic + 4 boundary examples covering PREREQUISITE, BUILDS_ON, RELATED, and NO CONNECTION with topological self-check instruction
- architect.ts superRefine now runs both DFS (`findPedagogicalCycle`) and Kahn's algorithm (`kahnCycleDetection`) — `kahnCycleDetection` exported for testability

## Task Commits

Each task was committed atomically:

1. **Task 1: Khanmigo patterns in CHAT_SYSTEM_PROMPT** - `a93009a` (feat)
2. **Task 2: Comprehension test heuristic in inferPrerequisites** - `8ddbfd7` (feat)
3. **Task 3: Kahn's algorithm in architect.ts** - `e5637c0` (feat)

## Files Created/Modified

- `src/lib/ai/prompts.ts` — Added Pedagogical Calibration section and question-type variation bullet to CHAT_SYSTEM_PROMPT
- `src/lib/ai/inferPrerequisites.ts` — Replaced system prompt with comprehension test heuristic, 4 boundary examples, topological self-check; added missing maxRetries/abortSignal
- `src/lib/ai/architect.ts` — Added kahnCycleDetection() function, integrated into superRefine alongside existing DFS, exported for testability

## Decisions Made

- Khanmigo patterns placed in a new `## Pedagogical Calibration` section — keeps Acknowledge/Enrich/Question structure in `## Behavior` unchanged and Neurogenesis Policy untouched
- Kahn's algorithm only fires an error when DFS did NOT already catch the cycle — avoids duplicate error messages while providing genuine coverage of disconnected-component edge cases
- Set iteration in kahnCycleDetection uses `Array.from(nodes)` to match the existing TypeScript target configuration (same pattern as `findPedagogicalCycle`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added maxRetries and abortSignal to inferPrerequisites**
- **Found during:** Task 2 (inferPrerequisites prompt upgrade)
- **Issue:** Worktree's inferPrerequisites.ts was missing `maxRetries: 2` and `abortSignal: AbortSignal.timeout(25_000)` — present in main repo (Phase 18 work) but not in this branch
- **Fix:** Added both resilience settings alongside the system prompt upgrade
- **Files modified:** src/lib/ai/inferPrerequisites.ts
- **Verification:** TypeScript compiles without errors; settings visible in file
- **Committed in:** 8ddbfd7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality)
**Impact on plan:** Auto-fix brings inferPrerequisites resilience in line with Phase 18 goals. No scope creep.

## Issues Encountered

- Set iteration `for (const node of nodes)` triggered TS2802 error even with `lib: esnext` — replaced with `Array.from(nodes)` matching the existing DFS pattern in the same file

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 3 prompt files ready for eval suite expansion (Plan 19-02)
- CHAT_SYSTEM_PROMPT contains all acceptance-criteria phrases for conversationalist eval cases
- kahnCycleDetection exported — ready for unit test cases in architect eval suite
- No blockers

---
*Phase: 19-enterprise-prompt-engineering*
*Completed: 2026-03-24*
