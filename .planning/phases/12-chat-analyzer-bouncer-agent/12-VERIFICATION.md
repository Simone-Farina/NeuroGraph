---
phase: 12-chat-analyzer-bouncer-agent
verified: 2026-03-23T22:35:00Z
status: gaps_found
score: 8/10 must-haves verified
re_verification: false
gaps:
  - truth: "The heuristic provider produces extraction fields on allow_new decisions so offline/CI runs pass schema validation"
    status: partial
    reason: "maxOutputTokens was not increased from 220 to 400 as specified in the plan. The heuristic path is unaffected (passes 13/13), but real LLM calls in production may truncate long extraction responses."
    artifacts:
      - path: "prompt-eval/shared/neurograph-bouncer-provider.mjs"
        issue: "maxOutputTokens: 220 on line 236 — plan required increase to 400 to accommodate extraction fields (~195 additional tokens)"
    missing:
      - "Change maxOutputTokens from 220 to 400 in neurograph-bouncer-provider.mjs"
  - truth: "The JSON schema allows optional extracted_definition and extracted_core_insight without breaking existing append_to_existing cases"
    status: partial
    reason: "extracted_core_insight maxLength is 280 in both the schema and the LLM normalization path. The plan specified 500. The summary also adopted 280, making this an intentional deviation — but it diverges from the contracted spec (plan acceptance criteria). If an LLM produces a valid insight longer than 280 chars, it will be truncated or rejected."
    artifacts:
      - path: "prompt-eval/shared/bouncer-response.schema.json"
        issue: "extracted_core_insight maxLength is 280 (line 34), not 500 as specified in the plan's acceptance criteria and task description"
      - path: "prompt-eval/shared/neurograph-bouncer-provider.mjs"
        issue: "LLM normalization truncates extracted_core_insight to 280 (line 253), not 500"
    missing:
      - "Decide canonical maxLength for extracted_core_insight: update schema and LLM normalization to 500 (per plan spec) OR explicitly document 280 as the chosen value and close the spec gap"
human_verification: []
---

# Phase 12: Chat Analyzer / Bouncer Agent Verification Report

**Phase Goal:** Define and validate a Chat Analyzer / Bouncer prompt that protects graph quality by rejecting duplicates and extracting structured insight from ambiguous user text.
**Verified:** 2026-03-23T22:35:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The Bouncer prompt describes both duplicate rejection AND definition/insight extraction as a single agent | VERIFIED | `src/lib/ai/prompts.ts` lines 42-65: BOUNCER_SYSTEM_PROMPT contains all 5 original duplicate rules plus `extracted_definition` and `extracted_core_insight` field contract in a single cohesive prompt |
| 2 | The JSON schema allows optional extracted_definition and extracted_core_insight without breaking existing append_to_existing cases | PARTIAL | `bouncer-response.schema.json` correctly marks both fields optional (not in `required`). `extracted_core_insight` maxLength is 280 in the schema but 500 was specified in the plan |
| 3 | The heuristic provider produces extraction fields on allow_new decisions so offline/CI runs pass schema validation | PARTIAL | `heuristicDecision()` correctly attaches `extracted_definition` and `extracted_core_insight` on `allow_new` — but `maxOutputTokens` was not raised to 400 (still 220), leaving the LLM path undersized for extraction responses |
| 4 | The LLM normalization pass-through includes extraction fields when present | VERIFIED | Lines 248-255 of provider: conditional block attaches extraction fields on `allow_new`, truncates to 280, guarded against `append_to_existing` |
| 5 | Evaluations prove the Bouncer rejects near-identical inputs and suggests appends | VERIFIED | Cases 1-4 in `cases.csv` cover exact duplicate, near-synonym, multilingual duplicate, same-concept rephrasing — all pass as `append_to_existing` with correct `match_title` |
| 6 | Evaluations prove the Bouncer extracts Definition and Core Insight from ambiguous text | VERIFIED | Cases 6-13 (8 extraction cases) cover ambiguous conversational text, partial phrasing, technical jargon, conversational tone, terse fragment, cross-domain, well-formed, metaphorical — all pass with fragment assertions |
| 7 | The original 5 duplicate-detection golden cases remain as regression baseline | VERIFIED | CSV rows 2-6 (cases 1-5) are preserved verbatim. `npm run eval:bouncer` reports 13 passed, 0 failed |
| 8 | Extraction assertions use scored presence checks, not hard exact-match | VERIFIED | `promptfooconfig.yaml` assertions 4 and 5: assertion 4 is hard pass/fail on length >= 10; assertion 5 uses case-insensitive substring fragment match (scored/lenient) |
| 9 | The full expanded suite passes in offline/CI mode without an API key | VERIFIED | `npm run eval:bouncer` — 13 passed, 0 failed, 0 errors (100%); no API key required (heuristic path active) |
| 10 | The full eval suite (all agents) continues to pass with no regressions | VERIFIED | `npm run eval:all` — 22 passed total (13 bouncer + 8 architect + 1 conversationalist), 0 failed, 0 errors |

**Score:** 8/10 truths verified (2 partial gaps)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/ai/prompts.ts` | Expanded BOUNCER_SYSTEM_PROMPT with extraction field rules | VERIFIED | Contains `extracted_definition` (line 53), `extracted_core_insight` (line 54), and conditional omission rule (lines 60-61). `CHAT_SYSTEM_PROMPT` and `ARCHITECT_SYSTEM_PROMPT` unchanged |
| `prompt-eval/shared/bouncer-response.schema.json` | Extended JSON schema with optional extraction properties | PARTIAL | Contains both properties; `extracted_definition` minLength 10 / maxLength 280 correct; `extracted_core_insight` maxLength 280 (plan spec: 500) |
| `prompt-eval/shared/neurograph-bouncer-provider.mjs` | Heuristic extraction output and LLM normalization for new fields | PARTIAL | `heuristicDecision()` and LLM normalization correctly handle extraction fields; `maxOutputTokens` not raised from 220 to 400 |
| `prompt-eval/bouncer/cases.csv` | 13 total golden cases (5 existing + 8 new extraction cases) | VERIFIED | 14 lines (header + 13 data rows); 10 columns including `expected_definition_fragment` and `expected_insight_fragment`; 8 `allow_new` extraction cases with non-empty fragments |
| `prompt-eval/bouncer/promptfooconfig.yaml` | Scored extraction assertions alongside existing hard pass/fail assertions | VERIFIED | 5 assertions: is-json schema, decision check, match_title check, extraction presence (hard), fragment substring check (scored) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/ai/prompts.ts` | `prompt-eval/shared/neurograph-bouncer-provider.mjs` | `extractBouncerPrompt()` reads `BOUNCER_SYSTEM_PROMPT` at runtime | WIRED | Lines 11-21 of provider: `extractBouncerPrompt()` reads `src/lib/ai/prompts.ts` and regex-extracts `BOUNCER_SYSTEM_PROMPT` |
| `prompt-eval/shared/bouncer-response.schema.json` | `prompt-eval/bouncer/promptfooconfig.yaml` | `is-json` assertion validates output against schema file | WIRED | `promptfooconfig.yaml` line 9: `value: file://../shared/bouncer-response.schema.json` |
| `prompt-eval/bouncer/cases.csv` | `prompt-eval/bouncer/promptfooconfig.yaml` | `tests: cases.csv` directive loads CSV rows as test vars | WIRED | `promptfooconfig.yaml` line 38: `tests: cases.csv` |
| `prompt-eval/bouncer/promptfooconfig.yaml` | `prompt-eval/shared/neurograph-bouncer-provider.mjs` | `exec:node` provider directive runs provider for each case | WIRED | `promptfooconfig.yaml` line 4: `exec:node ../shared/neurograph-bouncer-provider.mjs` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `neurograph-bouncer-provider.mjs` | `base.extracted_definition` | `extractDefinition(candidateTitle, candidateDefinition)` from CSV vars | Yes — heuristic derives from `candidate_definition` text; LLM path reads from parsed JSON | FLOWING |
| `neurograph-bouncer-provider.mjs` | `base.extracted_core_insight` | `extractCoreInsight(candidateTitle, candidateDefinition)` from CSV vars | Yes — heuristic prepends `candidateTitle` to first sentence of definition; LLM path reads from parsed JSON | FLOWING |
| `promptfooconfig.yaml` assertion 5 | `context.vars.expected_definition_fragment` | `cases.csv` column `expected_definition_fragment` | Yes — 8 extraction cases have non-empty fragment values; 5 regression cases have empty (skip guard fires) | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full bouncer eval suite passes (13 cases) | `npm run eval:bouncer` | 13 passed, 0 failed, 0 errors (100%) | PASS |
| Full cross-suite eval passes (all agents) | `npm run eval:all` | 22 passed, 0 failed, 0 errors (100%) | PASS |
| Schema correctly marks extraction fields optional | `node -e "..."` programmatic check | required=["decision","confidence","match_title","rationale"]; both extraction fields in properties but not required | PASS |
| All 7 phase commits exist in git history | `git log --oneline` | 26b68d1, f450de8, 5e3c474, 81adbef, eb2dd29, 13a4aa2, c78ffeb all verified | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BOUNCER-01 | 12-01-PLAN.md | The Bouncer prompt must enforce the "duplicate prevention" core value | SATISFIED | `BOUNCER_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts` retains all 5 original duplicate-prevention rules verbatim (lines 56-64). Cases 1-5 in the eval suite validate this behavior programmatically. Note: REQUIREMENTS.md still shows `[ ]` (unchecked) — the file was not updated by this phase. |
| BOUNCER-02 | 12-02-PLAN.md | promptfoo evaluations must exist showing the Bouncer rejecting near-identical inputs and suggesting appends instead | SATISFIED | Cases 1-4 in `cases.csv` cover exact duplicate, near-synonym, multilingual duplicate, same-concept rephrasing — all assert `append_to_existing` with correct `match_title`. All pass. |
| BOUNCER-03 | 12-02-PLAN.md | promptfoo evaluations must verify the Bouncer successfully extracts "Definition" and "Core Insight" from ambiguous human text | SATISFIED | Cases 6-13 in `cases.csv` cover all 8 D-04 archetypes of ambiguous text. Assertions 4 and 5 in `promptfooconfig.yaml` verify extraction presence and content fragments. All pass. |

**Orphaned requirements:** None — all three BOUNCER requirements are claimed by plans and verified.

**Documentation gap:** REQUIREMENTS.md traceability table still shows all three BOUNCER requirements as "Pending" (not updated to "Complete"). This is a documentation issue only; the implementation is fully in place.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `prompt-eval/shared/neurograph-bouncer-provider.mjs` | 236 | `maxOutputTokens: 220` — not raised to 400 as plan required | Warning | In heuristic/offline mode (CI), no impact — the heuristic path bypasses `generateText`. In LLM mode with a real API key, extraction responses may be truncated mid-field or cut off before `extracted_core_insight` is populated, causing schema validation failures or silent truncation |
| `prompt-eval/shared/bouncer-response.schema.json` | 34 | `extracted_core_insight` maxLength: 280 — plan spec required 500 | Warning | Undocumented spec deviation. The SUMMARY also adopted 280 (no note of intentional change from 500). An LLM producing a valid core insight > 280 chars will either fail schema validation or be truncated by the normalization pass. |

---

### Human Verification Required

None — all behavioral checks are verifiable programmatically via the eval suite.

---

### Gaps Summary

Two gaps found, both in `12-01-PLAN.md` tasks that were partially executed:

**Gap 1 — maxOutputTokens not raised (Warning):** The plan explicitly required increasing `maxOutputTokens` from 220 to 400 in `neurograph-bouncer-provider.mjs` to accommodate extraction fields. The commit `eb2dd29` did not make this change. The offline/CI heuristic path (which all 13 eval cases use) is unaffected since it never calls `generateText`. However, in production with a real API key, a 220-token budget may be insufficient to produce all four required fields plus two extraction fields for complex concepts, causing truncated or missing `extracted_definition`/`extracted_core_insight`.

**Gap 2 — extracted_core_insight maxLength spec deviation (Warning):** The plan and its acceptance criteria specified `extracted_core_insight` with `minLength: 10` and `maxLength: 500`. The implementation uses 280 for both `extracted_definition` and `extracted_core_insight`. The summary text also says "max 280 chars" for both, suggesting this was a deliberate convergence — but it was not documented as an intentional plan deviation. Both the schema and the LLM normalization truncate at 280. This may be acceptable (280 chars is still substantial for a core insight), but the spec gap should be explicitly closed.

These two gaps are warnings rather than blockers. All 13 golden cases pass, the three BOUNCER requirements are satisfied by implementation evidence, and the phase goal (define and validate the Bouncer prompt for duplicate rejection + extraction) is achieved.

---

_Verified: 2026-03-23T22:35:00Z_
_Verifier: Claude (gsd-verifier)_
