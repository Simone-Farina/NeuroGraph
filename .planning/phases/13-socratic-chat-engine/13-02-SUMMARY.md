---
phase: 13-socratic-chat-engine
plan: "02"
subsystem: prompt-engineering
tags:
  - socratic-chat
  - bloom-taxonomy
  - neurogenesis-policy
  - promptfoo
  - eval-golden-suite
dependency_graph:
  requires:
    - "13-01 (conversationalist provider + prompt template)"
    - "prompt-eval/shared/neurograph-conversationalist-provider.mjs"
    - "prompt-eval/conversationalist/prompt.json"
  provides:
    - "10 hand-curated golden multi-turn conversationalist eval cases"
    - "Real promptfoo config replacing Phase 10 echo placeholder"
    - "Full eval:conversationalist suite passing 100% in offline/CI mode"
  affects:
    - "eval:all command (now includes live conversationalist suite)"
tech_stack:
  added: []
  patterns:
    - "Multi-turn YAML cases with messages array and final_user_message"
    - "Scored Socratic tone assertion with threshold >= 0.8 (D-07)"
    - "Hard pass/fail Neurogenesis trigger assertion (D-09)"
    - "Golden casuistry: hand-curated, deterministic, not synthetic"
key_files:
  created:
    - prompt-eval/conversationalist/cases.yaml
  modified:
    - prompt-eval/conversationalist/promptfooconfig.yaml
decisions:
  - "13-02-case-distribution: 4 Socratic tone + 3 Neurogenesis trigger + 2 no-trigger + 1 edge case = 10 golden cases"
  - "13-02-trigger-signals: Neurogenesis trigger cases use causal reasoning phrases matching BLOOM_ANALYZE_SIGNALS in provider heuristic"
  - "13-02-no-trigger-signals: No-trigger cases use direct questions ending with '?' (BLOOM_QUESTION_EXEMPTION rule)"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-24"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 13 Plan 02: Golden Conversationalist Eval Suite Summary

**One-liner:** 10 hand-curated multi-turn golden cases with dual-mode Socratic tone scoring and Bloom-gated Neurogenesis assertions, replacing the Phase 10 echo placeholder and passing 100% in offline/CI mode.

## What Was Built

### Task 1: Golden Multi-Turn Cases and Promptfoo Config

Created `prompt-eval/conversationalist/cases.yaml` with 10 hand-curated cases:

**Socratic Tone Cases (4 cases, `expected_neurogenesis: false`):**
1. "Coaching tone on first exchange" — zero prior context, user asks a factual question
2. "Answer-giving refusal under pressure" — 2-turn context, user demands a direct answer
3. "Persona maintained after 3 turns" — 5-turn recursion conversation, AI stays coaching
4. "Tone under pressure — frustrated user" — 2-turn context, user expresses frustration

**Neurogenesis Trigger Cases (3 cases, `expected_neurogenesis: true`):**
5. "Bloom Analyze level triggers Neurogenesis" — "I realized that recursion is basically computational induction..." (causal reasoning + personal insight)
6. "Bloom Evaluate level triggers Neurogenesis" — "I think SQL is better than NoSQL... because ACID guarantees prevent..." (evaluative comparison)
7. "Bloom Create level triggers Neurogenesis" — "I designed a two-tier caching approach..." (synthesis from design rationale)

**Neurogenesis No-Trigger Cases (2 cases, `expected_neurogenesis: false`):**
8. "Remember level does NOT trigger Neurogenesis" — "What is a hash table?" (bare question)
9. "Understand level does NOT trigger Neurogenesis" — "Can you explain how quicksort works?" (understand-level question ending with `?`)

**Edge Cases (1 case, `expected_neurogenesis: false`):**
10. "Topic pivot mid-conversation" — 4-turn physics conversation, final message pivots to biology

Replaced `prompt-eval/conversationalist/promptfooconfig.yaml` (Phase 10 echo placeholder) with:
- `prompts: - file://prompt.json` (Nunjucks multi-turn template from Plan 01)
- `providers: - exec:node ../shared/neurograph-conversationalist-provider.mjs`
- Two default assertions: scored Socratic tone (threshold >= 0.8) + hard pass/fail Neurogenesis (checks `neurogenesis_triggered === expected_neurogenesis`)

### Task 2: Full Suite Validation

Validated all three eval suites pass with zero regressions:

| Suite | Cases | Result |
|-------|-------|--------|
| eval:bouncer | 13 | 100% pass |
| eval:architect | 8 | 100% pass |
| eval:conversationalist | 10 | 100% pass |
| **eval:all** | **31** | **100% pass** |

## Verification Results

All acceptance criteria met:
1. `cases.yaml` contains 10 "description:" entries: PASS
2. `expected_neurogenesis: true` — 3 data entries (Bloom Analyze/Evaluate/Create): PASS
3. `expected_neurogenesis: false` — 7 data entries (tone + no-trigger + edge): PASS
4. `final_user_message` — 10 entries: PASS
5. `promptfooconfig.yaml` contains "neurograph-conversationalist-provider" (not "echo"): PASS
6. `promptfooconfig.yaml` contains "socratic_score" assertion: PASS
7. `promptfooconfig.yaml` contains "neurogenesis_triggered" assertion: PASS
8. `npm run eval:conversationalist` exits with code 0, 10 cases passing: PASS
9. `npm run eval:all` exits with code 0, no regressions: PASS

## Deviations from Plan

None — plan executed exactly as written. All must_haves satisfied:
- Multi-turn eval cases test coaching tone across several conversation turns (D-04)
- Socratic tone assertions use scored threshold >= 0.8 (D-07)
- Neurogenesis trigger assertions are hard pass/fail (D-09)
- Heuristic fallback passes all cases in offline/CI mode
- `eval:conversationalist` runs end-to-end without errors

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | `4639c63` | feat(13-02): create golden conversationalist eval suite and replace echo placeholder |
| Task 2 | (validation only, no file changes) | — |

## Known Stubs

None — the eval suite is fully wired to the real provider and all assertions evaluate deterministically against the heuristic fallback in offline mode.

## Self-Check: PASSED
