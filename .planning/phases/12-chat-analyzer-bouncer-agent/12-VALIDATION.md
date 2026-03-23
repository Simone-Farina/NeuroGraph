---
phase: 12
slug: chat-analyzer-bouncer-agent
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | promptfoo (local eval harness) |
| **Config file** | `prompt-eval/bouncer/promptfooconfig.yaml` |
| **Quick run command** | `npm run eval:bouncer` |
| **Full suite command** | `npm run eval:all` |
| **Estimated runtime** | ~15 seconds (heuristic fallback) / ~60 seconds (with API) |

---

## Sampling Rate

- **After every task commit:** Run `npm run eval:bouncer`
- **After every plan wave:** Run `npm run eval:all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | BOUNCER-01 | eval | `npm run eval:bouncer` | ✅ (cases.csv exists) | ⬜ pending |
| 12-01-02 | 01 | 1 | BOUNCER-02 | eval | `npm run eval:bouncer` | ✅ (cases.csv exists) | ⬜ pending |
| 12-02-01 | 02 | 2 | BOUNCER-03 | eval | `npm run eval:bouncer` | ✅ (cases.csv exists) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `prompt-eval/bouncer/cases.csv` — 5 baseline golden cases exist from Phase 10
- [x] `prompt-eval/bouncer/promptfooconfig.yaml` — eval config exists
- [x] `prompt-eval/shared/neurograph-bouncer-provider.mjs` — heuristic provider exists
- [ ] `npm install` — promptfoo declared but node_modules may need refresh

*Phase 10 established all infrastructure. Phase 12 extends existing files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Extraction quality reads naturally | BOUNCER-03 | Subjective quality | Review extracted definitions in eval output for coherence |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
