---
phase: 15
slug: ui-ux-polish-security
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | BUG-04, BUG-07 | unit | `npx vitest run --reporter=dot` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | BUG-06 | unit | `npx vitest run --reporter=dot` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 1 | BUG-05 | visual | manual browser check | N/A | ⬜ pending |
| 15-02-02 | 02 | 1 | BUG-08 | unit | `npx vitest run --reporter=dot` | ✅ | ⬜ pending |

---

## Wave 0 Requirements

- [x] vitest installed and configured
- [x] Existing test files cover related components

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Learning Target editorial design | BUG-05 | Visual design quality | Check rounded-xl buttons, serif labels, muted borders match app aesthetic |
| Handle dots invisible | BUG-07 | Visual | Check no dots visible on neuron nodes in browser |
| API key auto-masks after 10s | BUG-08 | Timer behavior | Generate key, verify it masks after ~10 seconds |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity satisfied
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
