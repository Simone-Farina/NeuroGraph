---
phase: 10-promptfoo-evaluation-harness
plan: 02
subsystem: bouncer-eval
tags: [promptfoo, bouncer, golden-cases, assertions]
requires:
  - phase: 10-promptfoo-evaluation-harness
    plan: 01
    provides: local promptfoo harness and prompt-eval workspace
provides:
  - Golden Bouncer suite with five curated cases
  - Deterministic duplicate-rejection assertions
  - Reusable Bouncer prompt contract export
affects: []
tech-stack:
  added: []
  patterns: [golden casuistry, strict json contract, deterministic fallback provider]
key-files:
  created:
    - prompt-eval/bouncer/prompt.txt
    - prompt-eval/bouncer/cases.csv
    - prompt-eval/shared/bouncer-response.schema.json
    - prompt-eval/shared/neurograph-bouncer-provider.mjs
  modified:
    - prompt-eval/bouncer/promptfooconfig.yaml
    - src/lib/ai/prompts.ts
    - src/lib/ai/__tests__/prompts.test.ts
key-decisions:
  - "The Bouncer prompt contract is a strict JSON surface with decision, confidence, match_title, and rationale."
  - "Promptfoo runs the suite through a local exec provider that reuses the runtime Bouncer prompt text."
  - "When no real model key is configured, the suite falls back to a deterministic heuristic so local execution still works."
requirements-completed: [TEST-02, TEST-03]
duration: 45min
completed: 2026-03-23
---

# Phase 10 Plan 02 Summary

Built the first real Golden evaluation suite for the NeuroGraph Bouncer.

## Accomplishments

- Exported `BOUNCER_SYSTEM_PROMPT` from the runtime prompt layer with a strict JSON-only contract.
- Created five curated Bouncer edge cases covering:
  - exact duplicate
  - near-synonym
  - multilingual duplicate
  - same concept with different phrasing
  - unrelated concept
- Added a shared JSON schema and deterministic assertions so duplicate leakage fails clearly.

## Verification

- `npx vitest run src/lib/ai/__tests__/prompts.test.ts --reporter=verbose`
- `npm run eval:bouncer`

## Issues Encountered

- Promptfoo path resolution required normalizing the suite to CSV-backed fixtures plus config-level default assertions.
- The deterministic fallback heuristic needed explicit alias coverage for the brutal synonym and multilingual cases.

## Self-Check: PASSED

- `npm run eval:bouncer` passes all five cases.
- The suite exercises the real Bouncer contract rather than a toy echo prompt.
