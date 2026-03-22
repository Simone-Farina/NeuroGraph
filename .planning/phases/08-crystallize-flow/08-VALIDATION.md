---
phase: 08
slug: crystallize-flow
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/api/crystallize/__tests__/route.test.ts src/components/chat/__tests__/ChatPanel.crystallize.test.tsx src/app/api/neurons/__tests__/route.test.ts --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose && npx tsc --noEmit` |
| **Estimated runtime** | ~35 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/api/crystallize/__tests__/route.test.ts src/components/chat/__tests__/ChatPanel.crystallize.test.tsx src/app/api/neurons/__tests__/route.test.ts --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | CRYST-01 | unit | `npx vitest run src/lib/crystallize/__tests__/article.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | CRYST-01, CRYST-02 | route | `npx vitest run src/app/api/crystallize/__tests__/route.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | CRYST-01 | component | `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx --reporter=verbose` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | CRYST-02 | component | `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx --reporter=verbose` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 3 | CRYST-03 | route | `npx vitest run src/app/api/neurons/__tests__/route.test.ts --reporter=verbose` | ✅ | ⬜ pending |
| 08-03-02 | 03 | 3 | CRYST-03 | integration | `npx vitest run src/components/chat/__tests__/ChatPanel.mastery.test.tsx --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/crystallize/__tests__/article.test.ts` — extraction normalization and failure-classification stubs
- [ ] `src/app/api/crystallize/__tests__/route.test.ts` — starter/manual route contracts
- [ ] `src/components/chat/__tests__/ChatPanel.crystallize.test.tsx` — queue-intent bootstrap and manual-paste UI contracts
- [ ] `src/components/chat/__tests__/ChatPanel.mastery.test.tsx` — queue refresh after mastered handoff

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crystallize feels like a calm continuation instead of a modal/error recovery flow | CRYST-01, CRYST-02 | Emotional contract and typography rhythm are not meaningfully captured by unit tests | Trigger Crystallize from `/app/queue`, confirm `/app` opens with a calm loading state or seeded message and no dashboard/error theater |
| Manual paste fallback remains embedded and low-anxiety | CRYST-02 | Visual placement and tone need human review | Force extraction failure, confirm the paste surface appears inside the chat column with subdued actions and no route bounce |
| Mastered state is reflected in queue UX without ambiguity | CRYST-03 | Needs full app-shell observation | Create a neuron from a crystallize-linked chat and confirm the originating queue item leaves active sections after queue refresh |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing test references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
