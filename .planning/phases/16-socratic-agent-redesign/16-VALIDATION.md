---
phase: 16
slug: socratic-agent-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | promptfoo (eval harness) + vitest (unit tests) |
| **Config file** | `prompt-eval/conversationalist/promptfooconfig.yaml` |
| **Quick run command** | `npm run eval:conversationalist` |
| **Full suite command** | `npm run eval:all` |
| **Estimated runtime** | ~15 seconds (heuristic) / ~90 seconds (with API) |

---

## Sampling Rate

- **After every task commit:** Run `npm run eval:conversationalist`
- **After every plan wave:** Run `npm run eval:all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | AGENT-01, AGENT-02 | unit + eval | `npx vitest run src/lib/ai/__tests__/prompts.test.ts && npm run eval:conversationalist` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | AGENT-01 | eval | `npm run eval:conversationalist` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 2 | AGENT-01, AGENT-02 | eval | `npm run eval:all` | ✅ | ⬜ pending |

---

## Wave 0 Requirements

- [x] promptfoo installed and configured
- [x] `prompt-eval/conversationalist/` scaffold exists with 10 baseline cases
- [x] `neurograph-conversationalist-provider.mjs` exists with `scoreSocraticTone`
- [x] `src/lib/ai/__tests__/prompts.test.ts` exists

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Teaching content quality | AGENT-01 | Subjective | Review agent responses for genuine knowledge enrichment vs filler |
| Build-on-answer pattern | AGENT-02 | Subjective | Check that each response acknowledges and extends user's previous answer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify
- [ ] Sampling continuity satisfied
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
