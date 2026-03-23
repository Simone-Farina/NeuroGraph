---
phase: 10
slug: promptfoo-evaluation-harness
status: checkpoint-pending
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-23
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for prompt-eval infrastructure and the first Golden Bouncer suite.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | promptfoo + targeted TypeScript compile checks |
| **Primary config root** | `prompt-eval/` |
| **Quick run command** | `npm run eval:bouncer` |
| **Full suite command** | `npm run eval:all && npx tsc --noEmit` |
| **Estimated runtime** | ~30-90 seconds depending on provider latency |

---

## Sampling Rate

- **After every task commit:** Run the smallest relevant eval command plus `npx tsc --noEmit`
- **After every plan wave:** Run `npm run eval:all && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** the full eval harness and typecheck must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | TEST-01, TEST-03 | infra/script | `npm run eval:all` | ✅ created | ✅ green |
| 10-01-02 | 01 | 1 | TEST-02 | filesystem/config | `npm run eval:all` | ✅ created | ✅ green |
| 10-02-01 | 02 | 2 | TEST-02 | dataset/config | `npm run eval:bouncer` | ✅ created | ✅ green |
| 10-02-02 | 02 | 2 | TEST-03 | prompt/assertion | `npm run eval:bouncer` | ✅ created | ✅ green |
| 10-03-01 | 03 | 3 | TEST-01, TEST-02, TEST-03 | docs/integration | `npm run eval:all && npx tsc --noEmit` | ✅ created | ✅ green |
| 10-03-02 | 03 | 3 | TEST-03 | manual smoke | `npm run eval:architect && npm run eval:conversationalist` | ✅ created | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ new/expand*

---

## Wave 0 Requirements

- [x] Add initial prompt-eval directory scaffolding under `prompt-eval/`
- [x] Add project-local `promptfoo` dependency and package scripts
- [x] Create the first Bouncer golden fixture set with five cases
- [x] Add deterministic assertion support for duplicate rejection
- [x] Add lightweight documentation for required env vars and local run commands

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Project-local install only | TEST-01 | Need human confirmation that no global tool path is being relied on | Remove any accidental global assumptions and run `npm run eval:all` from a clean shell |
| Bouncer cases are meaningful, not synthetic sludge | TEST-02 | Dataset quality is a product judgment | Review the five golden cases and confirm each maps to a real NeuroGraph duplicate-risk scenario |
| Failure output is actionable | TEST-03 | Human readability of eval failures matters | Intentionally break one expected assertion and confirm the failure points clearly to the offending case |

---

## Validation Sign-Off

- [x] All tasks have automated verify or explicit manual justification
- [x] Sampling continuity is documented
- [x] Wave 0 captures missing harness prerequisites
- [x] No watch-mode commands
- [x] Feedback latency target is documented
- [x] `nyquist_compliant: true` set in frontmatter

## Verification Runs

- `npx vitest run src/lib/ai/__tests__/prompts.test.ts --reporter=verbose`
- `npm run eval:bouncer`
- `npm run eval:all`
- `npm run eval:architect`
- `npm run eval:conversationalist`
- `npx tsc --noEmit`

**Approval:** pending hard human checkpoint
