---
phase: 13
slug: socratic-chat-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | promptfoo (local eval harness) |
| **Config file** | `prompt-eval/conversationalist/promptfooconfig.yaml` |
| **Quick run command** | `npm run eval:conversationalist` |
| **Full suite command** | `npm run eval:all` |
| **Estimated runtime** | ~15 seconds (heuristic fallback) / ~90 seconds (with API) |

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
| 13-01-01 | 01 | 1 | SOCRATES-01 | eval | `npm run eval:conversationalist` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | SOCRATES-01 | eval | `npm run eval:conversationalist` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | SOCRATES-02, SOCRATES-03 | eval | `npm run eval:conversationalist` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 2 | SOCRATES-02, SOCRATES-03 | eval | `npm run eval:conversationalist` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `prompt-eval/conversationalist/` — scaffold directory exists from Phase 10
- [x] `prompt-eval/conversationalist/promptfooconfig.yaml` — placeholder config exists
- [ ] `prompt-eval/conversationalist/cases.yaml` — multi-turn test cases (created in Phase 13)
- [ ] `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — custom provider (created in Phase 13)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Socratic tone feels natural | SOCRATES-01 | Subjective quality | Review assistant responses in eval output for coaching feel |
| Bloom classification boundary | SOCRATES-03 | Edge cases are subjective | Review neurogenesis trigger decisions at Analyze/Apply boundary |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
