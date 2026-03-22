---
phase: 05-data-layer-auth-foundation
plan: "02"
subsystem: auth
tags: [nanoid, zod, crypto, sha256, api-keys, validation, queue]

# Dependency graph
requires: []
provides:
  - "generateApiKey: ng_ prefix + 48 alphanumeric chars via nanoid customAlphabet"
  - "hashApiKey: SHA-256 via node:crypto, 64-char hex output"
  - "getKeyPrefix: 11-char display prefix for UI"
  - "verifyApiKey: timing-safe comparison via timingSafeEqual"
  - "QueueItemInsertSchema: Zod schema for queue item creation"
  - "QueueItemStateSchema: 4-state enum (inbox, passive_debt, resource, mastered)"
  - "QueueStateTransitionSchema: Zod schema for PATCH state transitions"
  - "VALID_TRANSITIONS: forward-only funnel allowlist map"
  - "RawApiKeySchema: bearer token format validator"
affects:
  - "06-capture-api-key-management"
  - "07-queue-triage-ui"
  - "08-crystallize-flow"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SHA-256 hashing for high-entropy API keys (not bcrypt -- per-request speed critical)"
    - "timingSafeEqual for constant-time key comparison (prevents timing attacks)"
    - "nanoid customAlphabet for cryptographically secure key body generation"
    - "Zod safeParse pattern with { success, data, error } shape"

key-files:
  created:
    - src/lib/auth/apiKeys.ts
    - src/lib/auth/__tests__/apiKeys.test.ts
    - src/lib/validation/queue.ts
    - src/lib/validation/apiKeys.ts
    - src/lib/validation/__tests__/schemas.test.ts
  modified: []

key-decisions:
  - "SHA-256 (not bcrypt/argon2) for API key hashing -- API keys are high-entropy tokens, bcrypt adds latency with no security benefit"
  - "timingSafeEqual for key verification -- prevents side-channel timing attacks"
  - "4-state machine locked: inbox, passive_debt, resource, mastered -- no crystallizing or discarded states"
  - "VALID_TRANSITIONS exported as allowlist -- server-side validation in Phase 6 PATCH handler"
  - "nanoid v3 customAlphabet used (already a transitive dependency, not installed anew)"

patterns-established:
  - "API key format: ng_<48 chars> -- ng_ prefix is brand-specific, 48 alphanumeric body = ~285 bits entropy"
  - "Zod schemas in src/lib/validation/ -- separate from route handlers for reuse across phases"
  - "Test files in __tests__/ subdirectory alongside source files"

requirements-completed: [DATA-02, DATA-04]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 5 Plan 02: API Key Utilities & Validation Schemas Summary

**SHA-256 API key generation/hashing with timing-safe verification and Zod schemas for the 4-state queue funnel and ng_ bearer token format**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T14:42:51Z
- **Completed:** 2026-03-22T14:44:50Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- API key module with generate/hash/prefix/verify functions using node:crypto and nanoid
- Zod schemas for queue item inserts, state transitions, and the 4-state enum
- VALID_TRANSITIONS allowlist encoding the forward-only cognitive funnel
- RawApiKeySchema for bearer token validation at capture endpoint boundary
- 26 unit tests passing across both modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Create API key cryptographic utilities** - `9601bd7` (test + feat, TDD)
2. **Task 2: Create Zod validation schemas for queue items and API keys** - `c865e82` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD tasks may have multiple commits (test + feat combined into one commit here)_

## Files Created/Modified

- `src/lib/auth/apiKeys.ts` - generateApiKey, hashApiKey, getKeyPrefix, verifyApiKey exports
- `src/lib/auth/__tests__/apiKeys.test.ts` - 7 tests covering all utility functions
- `src/lib/validation/queue.ts` - QueueItemInsertSchema, QueueItemStateSchema, QueueStateTransitionSchema, VALID_TRANSITIONS
- `src/lib/validation/apiKeys.ts` - RawApiKeySchema for bearer token format validation
- `src/lib/validation/__tests__/schemas.test.ts` - 19 tests covering all schema validations

## Decisions Made

- SHA-256 (not bcrypt/argon2) for API key hashing -- per-request speed critical, and high-entropy tokens don't need slow hashing
- timingSafeEqual for constant-time comparison to prevent side-channel attacks
- 4-state machine strictly enforced at schema level (inbox, passive_debt, resource, mastered only)
- VALID_TRANSITIONS exported for Phase 6 server-side route validation
- nanoid v3.3.11 used via existing transitive dependency -- no new npm packages installed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 (Capture API & Key Management) can import `generateApiKey`, `hashApiKey`, `getKeyPrefix`, `verifyApiKey` from `src/lib/auth/apiKeys.ts`
- Phase 6 PATCH handler can use `VALID_TRANSITIONS` from `src/lib/validation/queue.ts` for state machine enforcement
- Phase 6 `/api/capture` route can use `RawApiKeySchema` from `src/lib/validation/apiKeys.ts` for bearer token validation
- No blockers.

---
*Phase: 05-data-layer-auth-foundation*
*Completed: 2026-03-22*
