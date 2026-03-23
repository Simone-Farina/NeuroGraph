---
phase: 13-socratic-chat-engine
plan: "01"
subsystem: prompt-engineering
tags:
  - socratic-chat
  - bloom-taxonomy
  - neurogenesis-policy
  - promptfoo
  - eval-infrastructure
dependency_graph:
  requires:
    - "10-promptfoo-evaluation-harness (eval infrastructure)"
    - "src/lib/ai/prompts.ts (CHAT_SYSTEM_PROMPT)"
    - "prompt-eval/shared/neurograph-bouncer-provider.mjs (provider pattern)"
  provides:
    - "Rewritten CHAT_SYSTEM_PROMPT with Socratic directives and Bloom-gated neurogenesis"
    - "neurograph-conversationalist-provider.mjs with dual-mode execution"
    - "prompt-eval/conversationalist/prompt.json multi-turn Nunjucks template"
  affects:
    - "src/app/api/chat/route.ts (consumes CHAT_SYSTEM_PROMPT at runtime)"
    - "Plan 13-02 (golden eval suite will use provider + prompt template)"
tech_stack:
  added: []
  patterns:
    - "Bloom's Taxonomy Analyze/Evaluate/Create level keyword heuristic"
    - "Dual-mode promptfoo provider (heuristic fallback + live generateText with tools)"
    - "Multi-turn message array with Nunjucks expansion for promptfoo"
    - "Backtick+semicolon regex terminator for CHAT_SYSTEM_PROMPT extraction (avoids escaped backtick early match)"
key_files:
  created:
    - prompt-eval/shared/neurograph-conversationalist-provider.mjs
    - prompt-eval/conversationalist/prompt.json
  modified:
    - src/lib/ai/prompts.ts
decisions:
  - "13-01-bloom-gate: Neurogenesis policy tightened to Bloom Analyze/Evaluate/Create only — removes liberal 'at least once per conversation' mandate"
  - "13-01-socratic-directive: CHAT_SYSTEM_PROMPT now explicitly forbids direct answers and mandates question-led guidance"
  - "13-01-heuristic-neurogenesis: Heuristic provider outputs neurogenesis_triggered via detectsAnalyzeLevel(finalMessage) so offline/live assertions are consistent"
  - "13-01-backtick-regex: Provider uses backtick+semicolon terminator for CHAT_SYSTEM_PROMPT regex to avoid early match on escaped backticks inside template literal"
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-24"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 13 Plan 01: Socratic Prompt Contract and Conversationalist Provider Summary

**One-liner:** Replaced liberal neurogenesis policy with Bloom Analyze/Evaluate/Create gating in CHAT_SYSTEM_PROMPT and built the dual-mode conversationalist eval provider with heuristic Socratic tone scoring.

## What Was Built

### Task 1: CHAT_SYSTEM_PROMPT Rewrite (SOCRATES-01)

Rewrote the `CHAT_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts` to enforce Socratic coaching discipline:

- **Anti-answer directive added:** "NEVER give direct answers to conceptual questions unprompted. Always lead with a question or challenge that guides the user to discover the answer themselves."
- **Liberal neurogenesis policy removed:** All five liberal trigger conditions, the "DO NOT wait for a perfect insight" directive, and the "at least once per conversation" mandate are gone.
- **Bloom-gated policy installed:** `suggest_neurogenesis` tool may only be called when the user demonstrates Analyze, Evaluate, or Create level engagement — with explicit positive signs and explicit "Do NOT call" guards.
- **Collateral damage avoided:** `BOUNCER_SYSTEM_PROMPT` and `ARCHITECT_SYSTEM_PROMPT` are untouched.

### Task 2: Conversationalist Provider and Prompt Template (SOCRATES-02, SOCRATES-03 infra)

Created `prompt-eval/shared/neurograph-conversationalist-provider.mjs`:

- **`extractChatPrompt()`** — extracts `CHAT_SYSTEM_PROMPT` from `prompts.ts` using backtick+semicolon regex (avoids early match on `\`` inside template literal).
- **`resolveModel()`** — checks `PROMPTFOO_CONVERSATIONALIST_MODEL` env var, falls back to `AI_MODEL_EVALUATOR`, then `openai:gpt-4o-mini`; returns null for mock/keyless environments.
- **`scoreSocraticTone(text)`** — question marks (max 0.5) + coaching phrases (max 0.3) minus direct answer patterns (-0.4 each), clamped to [0, 1].
- **`detectsAnalyzeLevel(text)`** — eight Bloom Analyze signal regexes with question-mark exemption (Pitfall 5 guard).
- **`buildMessages(vars)`** — converts `vars.messages` array + `vars.final_user_message` into AI SDK messages format.
- **`heuristicConversationalist(vars)`** — offline fallback that synthesizes a coaching reply, computes `socratic_score`, and sets `neurogenesis_triggered` from `detectsAnalyzeLevel(finalMessage)`.
- **Live mode** — calls `generateText` with `system: systemPrompt`, `messages: buildMessages(vars)`, and `suggest_neurogenesis` tool; detects tool invocations for `neurogenesis_triggered`.

Created `prompt-eval/conversationalist/prompt.json`:
- Nunjucks message array expansion: `{%- for msg in messages %}` loop + final user message append.
- No system role entry (provider injects via `system:` param per Pitfall 4).

## Verification Results

All checks passed:
1. Prompt regex extraction: PASS
2. `BOUNCER_SYSTEM_PROMPT` untouched: PASS
3. `ARCHITECT_SYSTEM_PROMPT` untouched: PASS
4. Provider exports all required functions: PASS
5. `prompt.json` has `final_user_message`: PASS
6. `prompt.json` has Nunjucks for loop: PASS
7. `prompt.json` has no system role: PASS
8. No new npm dependencies: PASS

Provider heuristic mode test: returns `{ socratic_score: 0.8, neurogenesis_triggered: true }` for an Analyze-level final message ("I think recursion is like calling yourself with a smaller problem — similar to induction in math because each call reduces the problem.").

## Deviations from Plan

None — plan executed exactly as written. All must_haves satisfied:
- `CHAT_SYSTEM_PROMPT` explicitly forbids giving direct answers and mandates questioning tone.
- `CHAT_SYSTEM_PROMPT` gates Neurogenesis on Bloom Analyze/Evaluate/Create level only.
- The conversationalist provider extracts `CHAT_SYSTEM_PROMPT` from `prompts.ts` and runs in both heuristic and live modes.

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | `7edc5f4` | feat(13-01): rewrite CHAT_SYSTEM_PROMPT with Socratic directives and Bloom-gated Neurogenesis |
| Task 2 | `3ea5617` | feat(13-01): create conversationalist provider and multi-turn prompt template |

## Known Stubs

None — all exported functions are fully implemented. Plan 13-02 will use the provider and prompt template to build the golden test suite.

## Self-Check: PASSED

- src/lib/ai/prompts.ts: FOUND
- prompt-eval/shared/neurograph-conversationalist-provider.mjs: FOUND
- prompt-eval/conversationalist/prompt.json: FOUND
- Commit 7edc5f4: FOUND
- Commit 3ea5617: FOUND
