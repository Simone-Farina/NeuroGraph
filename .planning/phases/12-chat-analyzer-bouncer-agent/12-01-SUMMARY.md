---
phase: 12
plan: "01"
subsystem: prompt-eval/bouncer
tags: [bouncer, prompt-engineering, evaluation, promptfoo, extraction]
dependency_graph:
  requires: [10-promptfoo-evaluation-harness, 11-dag-manager-agent]
  provides: [BOUNCER-01, BOUNCER-02, BOUNCER-03]
  affects: [src/lib/ai/prompts.ts, prompt-eval/bouncer, prompt-eval/shared]
tech_stack:
  added: []
  patterns:
    - Hybrid eval model (hard pass/fail for structural, scored threshold for quality)
    - Heuristic fallback provider for offline/CI eval runs
    - Expanded JSON contract with optional extraction fields
key_files:
  created: []
  modified:
    - src/lib/ai/prompts.ts
    - prompt-eval/shared/bouncer-response.schema.json
    - prompt-eval/bouncer/cases.csv
    - prompt-eval/bouncer/promptfooconfig.yaml
    - prompt-eval/shared/neurograph-bouncer-provider.mjs
decisions:
  - BOUNCER_SYSTEM_PROMPT expanded with extracted_definition and extracted_core_insight; present only on allow_new decisions
  - bouncer-response.schema.json updated to accept optional extraction fields (additionalProperties remains false)
  - Golden suite grows from 5 to 12 cases (7 extraction cases added, all 5 duplicate-detection baselines preserved)
  - Extraction assertions use scored threshold (0.8), duplicate assertions remain hard pass/fail
  - Heuristic fallback produces extraction fields deterministically from candidate text so CI runs pass without API key
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-23"
  tasks_completed: 5
  files_modified: 5
---

# Phase 12 Plan 01: Chat Analyzer / Bouncer Agent — Expansion Summary

**One-liner:** Expanded BOUNCER_SYSTEM_PROMPT with extraction contract, 12-case golden suite (5 duplicate + 7 extraction), and heuristic fallback — all eval-only, no production route changes.

## What Was Built

### Expanded Bouncer Prompt Contract (BOUNCER-01)

`BOUNCER_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts` now instructs the LLM to include two optional extraction fields on `allow_new` decisions:

- `extracted_definition`: self-contained concept definition, max 280 chars
- `extracted_core_insight`: single most important takeaway, max 280 chars

On `append_to_existing` decisions, these fields must be omitted. The existing four fields (`decision`, `confidence`, `match_title`, `rationale`) and all duplicate-rejection rules are preserved unchanged.

### Updated JSON Schema

`prompt-eval/shared/bouncer-response.schema.json` adds `extracted_definition` and `extracted_core_insight` as optional string properties (minLength 10, maxLength 280). `additionalProperties: false` is retained — no unspecified keys allowed.

### Expanded Golden Suite (BOUNCER-02 + BOUNCER-03)

`prompt-eval/bouncer/cases.csv` grows from 5 to 12 cases:

- **5 preserved regression cases**: exact duplicate, near-synonym, multilingual duplicate, same-concept rephrasing, unrelated concept (all `append_to_existing` boundary checks)
- **7 new extraction cases** (all `allow_new`): ambiguous conversational text, overly technical jargon, partial/incomplete phrasing, conversational tone hiding real insight, genuinely distinct concept, thematic overlap boundary, abstract term

New CSV columns `expected_has_definition` and `expected_has_insight` drive the extraction assertions.

### Updated Eval Config (BOUNCER-02 + BOUNCER-03)

`prompt-eval/bouncer/promptfooconfig.yaml` adds two new assertions:

1. **Scored threshold (0.8)**: extraction fields present and non-empty on `allow_new`; absent on `append_to_existing`
2. **Scored threshold (0.8)**: extraction fields stay within 280 char limit when present

Existing hard pass/fail assertions (`is-json` schema, `decision` match, `match_title` match) are untouched.

### Extended Heuristic Fallback (offline/CI)

`prompt-eval/shared/neurograph-bouncer-provider.mjs` adds:

- `extractDefinition()`: returns candidate definition truncated to 280 chars at word boundary
- `extractCoreInsight()`: derives core insight from first sentence of definition prefixed with concept title
- `heuristicDecision()`: attaches extraction fields only when `decision === 'allow_new'`
- LLM path: normalizes `extracted_definition` and `extracted_core_insight` from parsed LLM response, enforcing 280 char cap and `allow_new` guard

## Deviations from Plan

None — plan executed exactly as written. All decisions from CONTEXT.md (D-01 through D-07) were honored.

## Known Stubs

None — no stubs were introduced. The prompt contract and eval harness are fully wired. The heuristic fallback is deterministic and produces extraction fields for all `allow_new` cases.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 26b68d1 | feat(12-01): expand BOUNCER_SYSTEM_PROMPT with extraction fields |
| 2 | f450de8 | feat(12-01): extend bouncer JSON schema with optional extraction fields |
| 3 | 5e3c474 | feat(12-01): extend bouncer golden suite with extraction cases |
| 4 | 81adbef | feat(12-01): add extraction assertions to bouncer promptfooconfig |
| 5 | eb2dd29 | feat(12-01): extend heuristic bouncer provider with extraction fields |

## Self-Check: PASSED
