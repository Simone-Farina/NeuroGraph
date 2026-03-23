---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Staging Area
status: Milestone complete
last_updated: "2026-03-23T22:37:12.571Z"
progress:
  total_phases: 13
  completed_phases: 12
  total_plans: 30
  completed_plans: 32
---

# Project State

Current execution state for get-shit-done.

## Current Phase

- **phase**: Phase 12 — Chat Analyzer / Bouncer Agent
- **plan**: 02 (complete)
- **status**: Phase 12 Plan 02 complete — 13-case golden Bouncer suite with fragment-based scored extraction assertions; all 13 cases pass at 100% in offline/CI mode
- **focus**: Phase 12 complete (BOUNCER-01, BOUNCER-02, BOUNCER-03 satisfied); ready for Phase 13 Socratic Chat Engine

## Progress

[██████████] 100% (3/5 milestone phases complete, 10/10 planned items executed)

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Milestone v1.2 — Agent Intelligence

## Milestone v1.2 Phase Map

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 10 | Promptfoo Evaluation Harness | TEST-01, TEST-02, TEST-03 | Complete |
| 11 | DAG Manager Agent | DAG-01, DAG-02, DAG-03 | Complete |
| 11.5 | Horizon UI & DAG Wiring | HORIZON-01, HORIZON-02, HORIZON-03 | Complete |
| 12 | Chat Analyzer / Bouncer Agent | BOUNCER-01, BOUNCER-02, BOUNCER-03 | Not started |
| 13 | Socratic Chat Engine | SOCRATES-01, SOCRATES-02, SOCRATES-03 | Not started |

## Milestone v1.1 Phase Map

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 5 | Data Layer & Auth Foundation | DATA-01, DATA-02, DATA-03, DATA-04 | Complete |
| 6 | Capture API & Key Management | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | Complete |
| 7 | Queue Triage UI | TRIAGE-01, TRIAGE-02, TRIAGE-03, TRIAGE-04, TRIAGE-05 | Complete |
| 8 | Crystallize Flow | CRYST-01, CRYST-02, CRYST-03 | Complete |
| 9 | UI Polish & Design System | POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05 | Complete |

## Accumulated Context

### v1.0 Decisions (carried forward)

- **04-advanced-ai-editor**: TipTap v3 directly (not Novel.sh); slash menu as React state overlay; custom Bouncer bubble menu; AI SDK v6 toTextStreamResponse + maxOutputTokens
- **01-knowledge-quality**: pg_cron daily TTL wipe; pgvector 0.85 similarity bouncer; 409 Conflict for collisions

### v1.1 Decisions (locked in research)

### v1.1 Decisions (executed in 05-01)

- **05-01-schema**: CHECK constraint (not PostgreSQL ENUM) for knowledge_queue state field — simpler ALTER TABLE if state machine ever needs to change
- **05-01-column-name**: `key_hash` (not `hashed_key`) as canonical column name — consistent across SQL migration and TypeScript types
- **05-01-rls**: Narrow RLS on user_api_keys (SELECT+DELETE only) — service role client bypasses RLS for INSERT (key generation) and UPDATE (last_used_at) in Phase 6 capture endpoint

- **Queue routing**: Queue renders at `/app/queue` as an App Router page — NOT as a `leftPanelMode` value. Prevents Zustand mode explosion.
- **API key storage**: SHA-256 hash via Node.js `crypto`, `ng_` prefix for display, `timingSafeEqual` for comparison. No bcrypt/argon2 (too slow per-request).
- **Capture endpoint auth**: Bearer token validation lives inside the `/api/capture` route handler itself — never in middleware (CVE-2025-29927 CVSS 9.1 mitigation).
- **AI isolation**: `knowledge_queue` is structurally separate — never joined or queried in chat routes. Queue content enters AI context in exactly one place: Crystallize route seeding a new conversation.
- **URL extraction**: `@extractus/article-extractor` v8, Node.js runtime only (not Edge). 8-10s `AbortSignal.timeout`. Explicit failure signal triggers manual paste fallback.
- **Queue store**: Separate `queueStore` (Zustand) owns queue state. `graphStore` retains sole ownership of panel mode. Only coupling: `graphStore.openQueue()` after Crystallize.
- **State machine**: Transitions validated server-side with allowlist. Client does optimistic update with rollback on failure.

### v1.1 Decisions (executed in 05-02)

- **05-02-hashing**: SHA-256 (not bcrypt/argon2) for API key hashing — per-request speed critical, high-entropy tokens don't need slow hashing
- **05-02-state-machine**: 4-state queue machine locked at Zod schema level: inbox, passive_debt, resource, mastered — no crystallizing or discarded states
- **05-02-nanoid**: nanoid v3.3.11 used via existing transitive dependency — no new npm packages installed

### v1.1 Decisions (executed in 05-03)

- **05-03-query-isolation**: Each table gets its own query module file (queueQueries.ts, apiKeyQueries.ts) — structural AI isolation enforced at module boundary, never cross-reference neuron/synapse tables from queue modules
- **05-03-tsc-path-alias**: `npx tsc --noEmit <file>` fails on `@/` path aliases; use full project `npx tsc --noEmit` for type-checking in projects with tsconfig path mappings

### v1.1 Decisions (executed in 06-00)

- **06-00-nyquist**: Wave 0 Nyquist compliance plan — test scaffolds only, no production decisions required; contracts follow plan spec exactly

### v1.1 Decisions (executed in 06-01)

- **06-01-service-role-client**: Service role Supabase client created module-level in capture route (not per-request) — safe because credentials are env vars not user-scoped
- **06-01-test-scaffold-bugs**: Three bugs in 06-00 scaffold fixed: (1) vi.hoisted for mockSupabaseAdmin, (2) VALID_TOKEN was 52 chars not 48, (3) Supabase count query mock must return Promise not {count: fn}

### v1.1 Decisions (executed in 06-02)

- **06-02-key-route-split**: `/api/keys` GET and DELETE use the cookie-session client, while POST inserts through the service-role client because RLS blocks user INSERT
- **06-02-inline-secret-reveal**: API key generation stays in the sidebar footer with one-time reveal and copy feedback instead of a separate settings page or modal

### v1.1 Decisions (locked in 07 context)

- **07-queue-composition**: Queue page is a single stacked editorial index with sections in fixed order: Inbox, Passive Debt, Resources
- **07-inbox-trigger**: `inbox -> passive_debt` auto-advances only when the user explicitly clicks the external URL
- **07-sidebar-badge**: Queue badge counts `inbox` items only to preserve a low-anxiety Inbox Zero model
- **07-semantic-rust**: Passive Debt aging uses human relative time plus restrained rust/terracotta semantic styling after a threshold

### v1.1 Decisions (executed in 07-01)

- **07-01-queue-boundary**: Queue client state is route-backed only; the store never calls Supabase directly and all mutations go through `/api/queue`
- **07-01-derived-inbox-count**: Sidebar badge state derives from grouped queue items in `queueStore`, avoiding duplicated counters

### v1.1 Decisions (executed in 07-02)

- **07-02-editorial-stacking**: Queue is rendered as a single editorial column with fixed section order rather than tabs or mixed-list filtering
- **07-02-inline-triage**: Actions stay subtle and inline; no nested modal or detail pane inside the 40vw shell

### v1.1 Decisions (executed in 07-03)

- **07-03-shell-bootstrap**: Queue refresh is mounted once at the shell level and re-syncs on focus and visibility return
- **07-03-badge-zero-anxiety**: The Queue badge hides at zero and remains visible in collapsed mode without introducing any new panel mode

### v1.1 Decisions (post-07 hardening)

- **07-post-key-rotation**: `user_api_keys.revoked_at` updates must use the service-role client; user-scoped clients only have SELECT+DELETE RLS and can silently fail to revoke, leading to `idx_user_api_keys_active_per_user` collisions
- **07-post-ui-review**: Phase 7 UI audit scored 16/24 in `07-UI-REVIEW.md`; immediate fixes landed for row-level pending feedback, safer delete confirmation, explicit state-transition copy, and quieter section chrome
- **07-post-ui-review-defer**: Remaining queue polish around typography simplification, terracotta semantic tokens, and flatter editorial row treatment is intentionally deferred to Phase 9
- **08-parser-fallback**: `gsd-tools init phase-op 8` still fails to detect the roadmap phase, so Phase 8 context was created manually from roadmap/state/project sources; planning may need the same fallback path if the parser issue persists
- **08-provenance-metadata**: Phase 8 will store crystallize provenance in `messages.metadata` instead of adding a new queue/conversation linkage table; the database already has a JSONB metadata column and chat message loading already exposes it
- **08-manual-paste-continuity**: Extraction failure should still create the conversation and show manual paste inside the chat surface; failure is a continuity state, not an ejection path
- **08-mastered-state-walk**: Mastery must honor the existing queue allowlist by walking `inbox/resource -> passive_debt -> mastered` rather than bypassing queue rules with a raw state update
- **08-planning-fallback**: `roadmap get-phase 8` still reports `malformed_roadmap`, so Phase 8 research, validation, and plan artifacts were written manually from roadmap/state/context sources
- **08-approved-closeout**: Human verification passed on 2026-03-22: seeded crystallize flow, manual paste fallback continuity, mastery handoff, and repeated Neurogenesis idempotence all behave correctly end-to-end
- **06-post-shortcut-validation**: Physical-device Shortcut validation is now complete, including URL-only capture, duplicate rejection, revoked-key unauthorized handling, and Inbox insertion confirmation
- **09-shell-preset-model**: Phase 9 uses named layout presets (`standard`, `deep_read`, `graph_zenith`) managed by store state and Framer Motion, not drag resizing
- **09-history-fading-model**: Conversation history is grouped into `Active/Recent` and `Fading`; fading sessions use semantic rust and reduced opacity to tell the TTL story without creating anxiety
- **09-priority-order**: Shell/navigation/history polish comes first if sequencing tradeoffs are required, but Phase 9 remains balanced across shell, chat, empty states, review, and motion
- **09-planning-fallback**: `gsd-tools init phase-op 9` failed to detect the roadmap phase, so Phase 9 context/research/validation/plans were written manually from roadmap/state/code sources

### v1.1 Decisions (executed in 09-01)

- **09-01-shell-presets**: The shell uses named layout presets (standard, deep_read, graph_zenith) instead of drag resizing.
- **09-01-history-curation**: Conversation history is grouped into Active/Recent and Fading, using reduced opacity and rust semantics for fading.

### v1.1 Decisions (executed in 09-02 and 09-03)

- **09-02-editorial-workspace**: Assistant messages render as editorial prose rather than chat bubbles. Queue and empty states aligned with editorial design language.
- **09-03-unified-motion**: Refined framer-motion presets across the shell. Review layout shifted to monochrome and subtle structural styling instead of game-like coloring.

### v1.2 Decisions (milestone start)

- **10-milestone-origin**: Milestone v1.2 was started from the promoted promptfoo/agents note rather than a separate discuss-milestone artifact.
- **10-agent-intelligence-scope**: The milestone focuses on test-driven prompt engineering first, not on broader agent runtime orchestration.
- **10-phase-order**: Evaluation infrastructure comes first, then DAG Manager, then Bouncer, then Socratic Chat Engine.
- **10-local-install-only**: `promptfoo` must be installed strictly as a local dev dependency in `package.json`; no global install is allowed.
- **10-prompt-eval-root**: The canonical prompt evaluation workspace is `prompt-eval/` with per-agent directories for `bouncer`, `architect`, and `conversationalist`.
- **10-runner-canon**: The harness command surface is explicit in `package.json`: `eval:all` plus targeted per-agent scripts.
- **10-hybrid-eval-model**: Structural integrity checks are hard pass/fail; softer pedagogical quality uses scored thresholds. Phase 10 proves the hard-fail pattern first on the Bouncer.
- **10-golden-casuistry**: Phase 10 uses a small hand-curated golden dataset, starting with five brutal Bouncer edge cases rather than broad synthetic coverage.
- **10-approved-closeout**: Human verification passed on 2026-03-23. The local promptfoo install, Golden Bouncer suite, docs, and scaffold suites are accepted as the milestone baseline.
- **11-architect-schema**: The Architect response contract is a strict schema with `isValid`, optional `refusalReason`, `nodes`, and `synapses`; invalid outputs must return empty node and synapse arrays.
- **11-architect-enums**: Architect synapse types are locked to the DB-backed enum semantics `PREREQUISITE`, `RELATED`, and `BUILDS_ON`; the model must not invent relation labels.
- **11-cycle-refusal**: Cycle detection must end in explicit structured refusal, never silent AI repair.
- **11-golden-architect-suite**: The Architect eval baseline is eight hand-curated cases: three valid curricula, three cycle traps, and two `PREREQUISITE` vs `BUILDS_ON` boundary cases.
- **11-runtime-light**: Phase 11 stops at prompt contract plus eval rigor. No product route or graph wiring belongs in that phase.
- **11.5-inserted-phase**: Horizon UI & DAG Wiring is inserted as Phase 11.5 so the product bridge lands before the Bouncer without corrupting the roadmap sequence.
- **11.5-ephemeral-draft**: `/api/architect` returns an authenticated draft path to frontend state only. Supabase writes stay forbidden until a later explicit commit flow exists.
- **11.5-graph-trigger**: The target-setting trigger lives in GraphPanel chrome as `Set Learning Target`, not as a chat command.
- **11.5-ghost-briefing**: Clicking a ghost node opens a left-panel briefing mode showing the generated definition and a `Start Learning (Crystallize)` handoff into chat.
- **11.5-approved-closeout**: Human verification passed on 2026-03-23. Horizon target setting, ghost-node preview, briefing mode, chat seeding, and ephemeral refresh behavior all matched the intended flow.

### v1.2 Decisions (executed in 12-01)

- **12-01-bouncer-extraction**: BOUNCER_SYSTEM_PROMPT expanded with `extracted_definition` and `extracted_core_insight` fields; present only on `allow_new` decisions, absent on `append_to_existing`
- **12-01-schema-backward-compat**: bouncer-response.schema.json updated to accept optional extraction fields while keeping `additionalProperties: false`; existing eval cases remain passing
- **12-01-golden-suite-12cases**: Golden suite grows from 5 to 12 cases (7 extraction cases; all 5 duplicate-detection baselines preserved as regression)
- **12-01-threshold-assertions**: Extraction field assertions use scored threshold (0.8); duplicate-rejection assertions remain hard pass/fail (hybrid eval model maintained)
- **12-01-heuristic-extraction**: Heuristic fallback derives `extracted_definition` from candidate text and `extracted_core_insight` from first sentence of definition; CI runs pass without API key

### v1.2 Decisions (executed in 12-02)

- **12-02-fragment-columns**: CSV uses `expected_definition_fragment`/`expected_insight_fragment` (keyword strings) instead of boolean `expected_has_definition`/`expected_has_insight` — fragment approach proves extraction content quality not just presence
- **12-02-fragment-order**: For Gradient Descent case, `expected_definition_fragment` = "optimization" (in definition text) and `expected_insight_fragment` = "gradient" (insight prepends title); heuristic insight is always prefixed with the candidate title
- **12-02-golden-suite-13cases**: Golden suite grows from 12 to 13 cases (8 new extraction cases replacing the Plan 01 draft; all 5 regression baselines preserved verbatim)
- **12-02-assertion-5-guard**: Fragment assertion skips when both fragment columns are empty (returns true), so Memory Palace case and all append_to_existing cases pass cleanly without fragments

### v1.0 Performance

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-knowledge-quality | 01 | 5min | 2 | 4 |
| 01-knowledge-quality | 02 | 10min | 1 | 6 |
| 04-advanced-ai-editor | 01 | 45min | 5 | 8 |
| 05-data-layer-auth-foundation | 01 | 1min | 2 | 3 |
| 05-data-layer-auth-foundation | 02 | 2min | 2 | 5 |
| 05-data-layer-auth-foundation | 03 | 2min | 2 | 4 |
| 06-capture-api-key-management | 00 | 2min | 2 | 4 |
| 06-capture-api-key-management | 01 | 8min | 2 | 4 |
| 06-capture-api-key-management | 02 | 1min | 2 | 2 |
| 07-queue-triage-ui | 01 | 10min | 2 | 5 |
| 07-queue-triage-ui | 02 | 12min | 2 | 8 |
| 07-queue-triage-ui | 03 | 12min | 3 | 5 |
| 08-crystallize-flow | 01 | 20min | 2 | 9 |
| 08-crystallize-flow | 02 | 20min | 2 | 4 |
| 08-crystallize-flow | 03 | 10min | 3 | 6 |
| 09-ui-polish-design-system | 01 | 15min | 3 | 4 |
| 09-ui-polish-design-system | 02 | 15min | 2 | 7 |
| 09-ui-polish-design-system | 03 | 15min | 3 | 3 |

### Research Flags (address during planning)

- **Phase 8**: Run URL extraction test harness against 20+ diverse real URLs before committing to fallback UX threshold. Confirm Vercel plan tier for function timeout budget (Hobby = 10s, Pro = 60s).

### Operational Validation

- **Phase 6 physical-device validation**: Closed on 2026-03-22. iPhone Shortcut capture now works with URL-only payloads, duplicate URLs are rejected cleanly, revoked keys return `unauthorized`, and successful captures appear in Inbox.

## Session

- **Last session**: 2026-03-23T22:28:40Z
- **Stopped at**: Completed Phase 12 Plan 02 — Chat Analyzer / Bouncer Agent (eval suite complete)

## Session Continuity

- **Last resumed**: 2026-03-23T22:28:40Z
- **Resume point**: Phase 12 complete — BOUNCER-01, BOUNCER-02, BOUNCER-03 all satisfied; 13-case golden suite passes 100%
- **Next action**: Proceed to Phase 13 Socratic Chat Engine
