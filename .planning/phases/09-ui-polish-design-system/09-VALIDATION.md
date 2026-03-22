---
phase: 09
slug: ui-polish-design-system
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/components/layout/__tests__/AppSidebar.queue.test.tsx src/components/chat/__tests__/ChatPanel.crystallize.test.tsx --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose && npx tsc --noEmit` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run the smallest relevant component suite plus `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run --reporter=verbose && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | POLISH-02 | component/store | `npx vitest run src/components/layout/__tests__/AppSidebar.queue.test.tsx --reporter=verbose` | ✅ (extend) | ⬜ pending |
| 09-01-02 | 01 | 1 | POLISH-02, POLISH-05 | component | `npx vitest run src/components/layout/__tests__/AppSidebar.queue.test.tsx --reporter=verbose` | ✅ (extend) | ⬜ pending |
| 09-02-01 | 02 | 2 | POLISH-01, POLISH-03 | component | `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx --reporter=verbose` | ✅ (extend) | ⬜ pending |
| 09-02-02 | 02 | 2 | POLISH-03 | component | `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx --reporter=verbose` | ✅ (extend) | ⬜ pending |
| 09-03-01 | 03 | 3 | POLISH-04 | component/page | `npx vitest run src/app/api/review src/app/'(app)'/app/review --reporter=verbose` | ⚠️ likely new/expand | ⬜ pending |
| 09-03-02 | 03 | 3 | POLISH-05 | integration/manual | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add/extend sidebar tests to cover grouped `Active/Recent` and `Fading` conversation states
- [ ] Add/extend chat presentation tests to cover editorial empty state and reduced bubble treatment
- [ ] Add/extend review UI tests to cover monochrome difficulty controls
- [ ] Add lightweight shell preset coverage for preset selection and route-driven behavior

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Left panel feels like a calm editorial workspace | POLISH-01, POLISH-03 | Emotional tone, density, and visual calm cannot be meaningfully scored by unit tests | Open `/app` with a new/empty account and confirm the panel feels like a quiet desk rather than a generic chatbot |
| Conversation history tells a fading story | POLISH-02 | Semantic rust and grouping need human judgment | Inspect `Active/Recent` and `Fading` sections and confirm aging is legible without feeling like an alarm |
| Layout presets feel intentional | POLISH-02, POLISH-05 | Motion and spatial change need human review | Move between queue/chat/review/graph-heavy states and confirm `standard`, `deep_read`, and `graph_zenith` feel purposeful |
| Review difficulty remains clear without color | POLISH-04 | Legibility and speed need human review | Use the review surface on desktop and mobile and confirm the monochrome buttons are still easy to distinguish |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or explicit Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers the missing UI-focused assertions
- [x] No watch-mode flags
- [x] Feedback latency target is documented
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
