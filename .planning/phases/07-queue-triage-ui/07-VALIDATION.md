---
phase: 07
slug: queue-triage-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx vitest run src/lib/db/__tests__/queueQueries.test.ts src/lib/validation/__tests__/schemas.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/stores/__tests__/queueStore.test.ts src/components/queue/__tests__/QueueItemCard.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | TRIAGE-01, TRIAGE-03 | route + store contract | `npx vitest run src/app/api/queue/__tests__/route.test.ts src/stores/__tests__/queueStore.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | TRIAGE-01, TRIAGE-03 | route integration | `npx vitest run src/app/api/queue/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | TRIAGE-01, TRIAGE-03 | store integration | `npx vitest run src/stores/__tests__/queueStore.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | TRIAGE-05 | unit + component | `npx vitest run src/lib/queue/__tests__/age.test.ts src/components/queue/__tests__/QueueItemCard.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | TRIAGE-01, TRIAGE-03, TRIAGE-04, TRIAGE-05 | component integration | `npx vitest run src/components/queue/__tests__/QueuePageClient.test.tsx src/components/queue/__tests__/QueueItemCard.test.tsx` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 3 | TRIAGE-02 | shell integration | `npx vitest run src/components/queue/__tests__/QueueBootstrap.test.tsx src/components/layout/__tests__/AppSidebar.queue.test.tsx` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 3 | TRIAGE-02, TRIAGE-04 | shell integration | `npx vitest run src/components/queue/__tests__/QueueBootstrap.test.tsx src/components/layout/__tests__/AppSidebar.queue.test.tsx` | ❌ W0 | ⬜ pending |
| 07-03-03 | 03 | 3 | TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04, TRIAGE-05 | manual checkpoint + full suite | `npx vitest run && npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/queue/__tests__/route.test.ts` — covers authenticated GET list + mutation contract
- [ ] `src/stores/__tests__/queueStore.test.ts` — covers optimistic update, rollback, pending-row locking, grouped derivation, and inbox-only badge count
- [ ] `src/lib/queue/__tests__/age.test.ts` — covers relative-age formatting and rust threshold helpers
- [ ] `src/components/queue/__tests__/QueuePageClient.test.tsx` — covers grouped render order, empty/error states, and refresh-on-mount
- [ ] `src/components/queue/__tests__/QueueItemCard.test.tsx` — covers state-aware action visibility, native-link click behavior, and age label rendering
- [ ] `src/components/layout/__tests__/AppSidebar.queue.test.tsx` — covers Queue nav item and inbox-only badge semantics
- [ ] `src/components/queue/__tests__/QueueBootstrap.test.tsx` — covers shell hydration and refresh-on-focus behavior
- [ ] `e2e/queue-triage.spec.ts` — end-to-end route + sidebar integration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Emotional contract of the Queue page in the 40vw shell | TRIAGE-01, TRIAGE-05 | Typography, calmness, and semantic-rust restraint are visual judgment calls | Sign in, open `/app/queue`, verify the page reads as a calm editorial index with restrained terracotta decay styling |
| Native external-link behavior plus inbox-to-passive-debt transition | TRIAGE-04 | Browser navigation and popup behavior are difficult to trust fully in jsdom | Click an Inbox item URL, confirm the browser follows the link normally and the queue item leaves Inbox |
| Sidebar badge emotional model | TRIAGE-02 | The low-anxiety brief depends on visual weight, not just badge arithmetic | Verify the Queue badge disappears at zero and never counts Passive Debt or Resources |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
