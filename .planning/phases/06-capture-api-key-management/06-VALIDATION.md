---
phase: 06
slug: capture-api-key-management
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (configured in `vitest.config.ts`) |
| **Config file** | `vitest.config.ts` — `src/**/*.{test,spec}.{ts,tsx}` |
| **Quick run command** | `npx vitest run src/app/api/capture src/app/api/keys --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/api/capture src/app/api/keys --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-00-01 | 00 | 0 | AUTH-01..04 | scaffolds | `npx vitest run src/app/api/capture src/app/api/keys src/lib/capture --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-00-02 | 00 | 0 | AUTH-03 | unit | `npx vitest run src/lib/db/__tests__/queueQueries.test.ts --reporter=verbose` | ✅ (extend) | ⬜ pending |
| 06-01-01 | 01 | 1 | AUTH-03+04 | unit | `npx vitest run src/lib/capture --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | AUTH-03+04 | unit | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | AUTH-01+02 | unit | `npx vitest run src/app/api/keys --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | AUTH-01+02 | manual | Task 3 checkpoint | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/capture/__tests__/route.test.ts` — covers AUTH-03, AUTH-04 (bearer auth, duplicate, rate limit, SSRF)
- [ ] `src/app/api/keys/__tests__/route.test.ts` — covers AUTH-01, AUTH-02 (generate, revoke, get active)
- [ ] `src/lib/capture/__tests__/extractHeadMetadata.test.ts` — covers SSRF guard, timeout fallback, og:title extraction
- [ ] Update `src/lib/db/__tests__/queueQueries.test.ts` — add `findByUrl` test cases

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar key management UI states | AUTH-01, AUTH-02 | React component with 6 visual states needs browser rendering | Generate key from sidebar, copy, revoke, verify curl fails |
| iOS Shortcuts end-to-end | AUTH-03, AUTH-04 | Requires physical device + Shortcuts app | Closed on 2026-03-22: validated on device with URL-only capture, duplicate rejection, and revoked-key unauthorized response |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** manual device validation completed on 2026-03-22
