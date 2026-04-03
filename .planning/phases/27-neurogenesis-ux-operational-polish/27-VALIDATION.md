---
phase: 27
slug: neurogenesis-ux-operational-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run src/components/chat/ChatPanel.test.tsx src/components/queue/__tests__/QueueBootstrap.test.tsx src/components/queue/__tests__/QueueItemCard.test.tsx` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run src/components/chat/ChatPanel.test.tsx src/components/queue/__tests__/QueueBootstrap.test.tsx src/components/queue/__tests__/QueueItemCard.test.tsx`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | NGEN-01 | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | needs new test case | pending |
| 27-01-02 | 01 | 1 | NGEN-01 | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | needs new test case | pending |
| 27-01-03 | 01 | 1 | NGEN-01 | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | needs new test case | pending |
| 27-02-01 | 02 | 1 | UI-01 | smoke/manual | visual inspection | manual-only | pending |
| 27-03-01 | 03 | 1 | PERF-01 | unit | `npm test -- --run src/components/queue/__tests__/QueueBootstrap.test.tsx` | needs new test case | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] New test cases in `src/components/chat/ChatPanel.test.tsx` — contextual trigger presence/absence, API call, dismiss
- [ ] Updated test cases in `src/components/queue/__tests__/QueueBootstrap.test.tsx` — panel mode guard on focus/visibility
- [ ] Updated test cases in `src/components/queue/__tests__/QueueItemCard.test.tsx` — button label assertion update

*Existing infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No jargon in graph empty state | UI-01 | Visual rendering context | Load app with empty graph, verify "crystallize", "neuron", "Bloom" absent from all visible text |
| Contextual card visual appearance | NGEN-01 | Layout/animation verification | Send messages until Analyze+, verify card appears inline below AI message |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
