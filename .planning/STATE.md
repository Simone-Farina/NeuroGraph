---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: staging-area
status: active
last_updated: "2026-03-22T00:00:00.000Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

Current execution state for get-shit-done.

## Current Phase

- **phase**: Phase 5 — Data Layer & Auth Foundation
- **plan**: —
- **status**: Roadmap defined, ready for planning
- **focus**: Milestone v1.1 Staging Area — cognitive funnel for chaotic inputs

## Progress

[                                        ] 0% (0/4 phases complete)

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Milestone v1.1 — Staging Area & Cognitive Funnel

## Milestone v1.1 Phase Map

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 5 | Data Layer & Auth Foundation | DATA-01, DATA-02, DATA-03, DATA-04 | Not started |
| 6 | Capture API & Key Management | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | Not started |
| 7 | Queue Triage UI | TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04, TRIAGE-05 | Not started |
| 8 | Crystallize Flow | CRYST-01, CRYST-02, CRYST-03 | Not started |
| 9 | UI Polish & Design System | POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05 | Not started |

## Accumulated Context

### v1.0 Decisions (carried forward)
- **04-advanced-ai-editor**: TipTap v3 directly (not Novel.sh); slash menu as React state overlay; custom Bouncer bubble menu; AI SDK v6 toTextStreamResponse + maxOutputTokens
- **01-knowledge-quality**: pg_cron daily TTL wipe; pgvector 0.85 similarity bouncer; 409 Conflict for collisions

### v1.1 Decisions (locked in research)
- **Queue routing**: Queue renders at `/app/queue` as an App Router page — NOT as a `leftPanelMode` value. Prevents Zustand mode explosion.
- **API key storage**: SHA-256 hash via Node.js `crypto`, `ng_` prefix for display, `timingSafeEqual` for comparison. No bcrypt/argon2 (too slow per-request).
- **Capture endpoint auth**: Bearer token validation lives inside the `/api/capture` route handler itself — never in middleware (CVE-2025-29927 CVSS 9.1 mitigation).
- **AI isolation**: `knowledge_queue` is structurally separate — never joined or queried in chat routes. Queue content enters AI context in exactly one place: Crystallize route seeding a new conversation.
- **URL extraction**: `@extractus/article-extractor` v8, Node.js runtime only (not Edge). 8-10s `AbortSignal.timeout`. Explicit failure signal triggers manual paste fallback.
- **Queue store**: Separate `queueStore` (Zustand) owns queue state. `graphStore` retains sole ownership of panel mode. Only coupling: `graphStore.openQueue()` after Crystallize.
- **State machine**: Transitions validated server-side with allowlist. Client does optimistic update with rollback on failure.

### v1.0 Performance
| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-knowledge-quality | 01 | 5min | 2 | 4 |
| 01-knowledge-quality | 02 | 10min | 1 | 6 |
| 04-advanced-ai-editor | 01 | 45min | 5 | 8 |

### Research Flags (address during planning)
- **Phase 6**: Validate iOS Shortcuts `.shortcut` template behavior on a physical device before declaring Phase 6 done.
- **Phase 8**: Run URL extraction test harness against 20+ diverse real URLs before committing to fallback UX threshold. Confirm Vercel plan tier for function timeout budget (Hobby = 10s, Pro = 60s).

## Session

- **Last session**: 2026-03-22
- **Stopped at**: Milestone v1.1 roadmap created — ready for `/gsd:plan-phase 5`
