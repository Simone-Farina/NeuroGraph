---
phase: 16-socratic-agent-redesign
plan: 01
subsystem: ai
tags: [prompt-engineering, eval, socratic, teaching, heuristic-scoring]

# Dependency graph
requires:
  - phase: 13-socratic-chat-engine
    provides: Original CHAT_SYSTEM_PROMPT with Bloom-gated Neurogenesis Policy
  - phase: 10-promptfoo-evaluation-harness
    provides: promptfoo eval infrastructure and scoreSocraticTone heuristic
provides:
  - CHAT_SYSTEM_PROMPT rewritten with mandatory acknowledge/enrich/question three-step structure
  - scoreSocraticTone updated with teaching content dimension and conditional direct-answer penalty
  - heuristicConversationalist fallback template now includes teaching signals (scores 0.80)
  - Unit test assertions confirming teach-then-ask contract keywords present
affects: [prompt-eval, conversationalist-eval-suite, socratic-agent-behavior]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Teach-then-ask: every agent response = acknowledge + enrich + question (three-step structure)"
    - "Teaching signal scoring: 15 regex patterns for enrichment content, capped at 0.4 contribution"
    - "Conditional direct-answer penalty: -0.1 per hit when question present, -0.4 when question absent"

key-files:
  created: []
  modified:
    - src/lib/ai/prompts.ts
    - src/lib/ai/__tests__/prompts.test.ts
    - prompt-eval/shared/neurograph-conversationalist-provider.mjs

key-decisions:
  - "16-01-teach-then-ask: Replace 'NEVER give direct answers' with mandatory three-step structure: Acknowledge (1 sentence), Enrich (MANDATORY new knowledge), Question (1 focused closing question)"
  - "16-01-teaching-signals: 15-regex teaching dimension capped at 0.4; GOOD Siddhartha example scores 1.0, question-parrot scores 0.40"
  - "16-01-conditional-penalty: 'here is how'/'here's how' removed from penalty list; remaining patterns penalized -0.1 when question follows, -0.4 when no question"
  - "16-01-rag-directive: Prompt now instructs agent to reference '## Relevant Knowledge Context' and '## Existing Neuron Catalog' sections for knowledge graph continuity"

patterns-established:
  - "Pattern 1: Teach-then-ask — every Socratic response must enrich before questioning; enrichment is mandatory not optional"
  - "Pattern 2: Calibrated heuristic scoring — document expected scores for canonical good/bad examples inline in code as regression anchors"
  - "Pattern 3: Conditional penalty — answer-giveaway penalty softened when a question follows; the anti-pattern is answer-only, not information-sharing"

requirements-completed: [AGENT-01, AGENT-02]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 16 Plan 01: Socratic Agent Redesign — Prompt & Heuristic Summary

**CHAT_SYSTEM_PROMPT rewritten with mandatory acknowledge/enrich/question contract; scoreSocraticTone gains teaching-content dimension calibrated so canonical teach-then-ask scores 1.0 and question-parrot scores 0.40**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-24T18:35:00Z
- **Completed:** 2026-03-24T18:40:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Rewrote `CHAT_SYSTEM_PROMPT` `## Goals` and `## Behavior` sections with the explicit three-step teach-then-ask structure; the old "NEVER give direct answers" directive is completely removed
- Updated `scoreSocraticTone` in the conversationalist provider with a 15-signal teaching content dimension (capped at 0.4), conditional direct-answer penalty, and calibration comments documenting both canonical examples
- Updated `heuristicConversationalist` fallback template to include teaching signals so offline/CI scoring is consistent with the new model (scores exactly 0.80)
- Added unit test assertions confirming "Acknowledge", "Enrich", "Question" keywords present and old directive absent

## Task Commits

1. **Task 1: Rewrite CHAT_SYSTEM_PROMPT with teach-then-ask contract** - `a9312d0` (feat)
2. **Task 2: Update scoreSocraticTone heuristic and fallback template** - `336a041` (feat)

## Files Created/Modified

- `src/lib/ai/prompts.ts` — CHAT_SYSTEM_PROMPT rewritten: three-step Behavior section, RAG context directive, anti-collapse guard
- `src/lib/ai/__tests__/prompts.test.ts` — New test "should encode the teach-then-ask three-step structure" with four assertions
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — `scoreSocraticTone` teaching dimension + conditional penalty; `heuristicConversationalist` template updated

## Decisions Made

- Used explicit numbered steps (1. Acknowledge, 2. Enrich, 3. Question) in the prompt Behavior section to make the structure unambiguous to the model
- Teaching signal regex list includes 15 patterns covering common enrichment phrasings (echoes, influenced by, interestingly, consider that, for example, historically, etc.) — validated against both canonical examples
- Removed "here is how" and "here's how" entirely from penalty list per D-06 (these are legitimate in enrichment sentences)
- Kept the Bloom-gated Neurogenesis Policy section completely unchanged — teaching enrichment does not collapse into answer-giving
- RAG context directive references the exact section headings injected at runtime by `route.ts` (`## Relevant Knowledge Context` and `## Existing Neuron Catalog`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Calibration verification confirmed all three score targets on first implementation pass:
- GOOD (Siddhartha ideal): 1.000 (target >= 0.85)
- BAD (question-parrot): 0.400 (target < 0.7)
- HEURISTIC template: 0.800 (target >= 0.8)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Prompt contract is ready; eval suite (golden cases, D-07) will be handled in subsequent plans if scheduled
- The `scoreSocraticTone` model is ready for the full promptfoo suite run (`npm run eval:conversationalist`) — existing 10 cases may see adjusted scores under new formula; threshold adjustments are in scope for next plan if needed
- No blockers

---
*Phase: 16-socratic-agent-redesign*
*Completed: 2026-03-24*
