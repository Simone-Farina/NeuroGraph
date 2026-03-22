---
phase: 06-capture-api-key-management
plan: 00
subsystem: testing
tags: [vitest, tdd, red-state, capture, api-keys, ssrf, metadata]

# Dependency graph
requires:
  - phase: 05-data-layer-auth-foundation
    provides: queueQueries, apiKeyQueries, apiKeys lib, validation schemas, database types
provides:
  - RED state test scaffolds for capture route (8 test cases covering auth, rate limit, duplicate, success paths)
  - RED state test scaffolds for keys route (10 test cases covering GET/POST/DELETE, auth guards, key_hash leak prevention)
  - RED state test scaffolds for metadata extraction (16 test cases covering isSafeUrl SSRF protection and extractHeadMetadata fallbacks)
  - Extended queueQueries.test.ts with findByUrl test block (3 cases)
affects:
  - 06-01: capture route implementation must pass capture route tests
  - 06-02: keys route implementation must pass keys route tests
  - 06-01: queueQueries.findByUrl implementation must pass extended test block

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.stubGlobal('fetch', vi.fn()) for mocking global fetch in metadata tests"
    - "afterEach(() => vi.restoreAllMocks()) for global stub cleanup"
    - "captureRequest() helper pattern for building NextRequest with bearer tokens"
    - "PGRST116 error code pattern for not-found returns from Supabase"

key-files:
  created:
    - src/app/api/capture/__tests__/route.test.ts
    - src/app/api/keys/__tests__/route.test.ts
    - src/lib/capture/__tests__/extractHeadMetadata.test.ts
  modified:
    - src/lib/db/__tests__/queueQueries.test.ts

key-decisions:
  - "No decisions required — wave 0 Nyquist compliance scaffold, test contracts follow plan specs exactly"

patterns-established:
  - "Bearer token tests use captureRequest() helper to construct NextRequest with Authorization header"
  - "Rate limit tests mock supabaseAdmin.from count query response directly"
  - "isSafeUrl covers all RFC-1918 private ranges plus localhost and 169.254.x.x link-local"
  - "Metadata fallback tests verify {title: null, favicon_url: null, estimated_read_time: null, source_domain} structure"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 6 Plan 00: Capture API & Key Management Test Scaffolds Summary

**RED-state vitest scaffolds for bearer-auth capture endpoint, key management CRUD, and SSRF-safe metadata extraction — all test contracts defined before production code exists**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T15:41:04Z
- **Completed:** 2026-03-22T15:43:10Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `src/app/api/capture/__tests__/route.test.ts` with 8 test cases covering three 401 variants (no header, invalid format, revoked key), 429 rate limit, 400 invalid payload, 409 duplicate URL, 201 success, and metadata-failure resilience
- Created `src/app/api/keys/__tests__/route.test.ts` with 10 test cases covering GET (key present, key null, unauthenticated), POST (generate new, auto-revoke existing, no key_hash leak, unauthenticated), DELETE (revokes key, success with no key, unauthenticated)
- Created `src/lib/capture/__tests__/extractHeadMetadata.test.ts` with 16 test cases: 9 isSafeUrl SSRF/validation cases and 7 extractHeadMetadata cases (title extraction, og:title preference, favicon extraction, favicon fallback, fetch error fallback, timeout/AbortError fallback, estimated_read_time always null)
- Extended `src/lib/db/__tests__/queueQueries.test.ts` with `describe('findByUrl')` block covering 3 cases: found, not-found (PGRST116 -> null), non-PGRST116 error propagation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test scaffolds for capture route, keys route, and metadata extraction** - `331e0a4` (test)
2. **Task 2: Extend queueQueries.test.ts with findByUrl test case** - `73f2a0e` (test)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/api/capture/__tests__/route.test.ts` - 8 test cases for bearer-auth POST /api/capture endpoint
- `src/app/api/keys/__tests__/route.test.ts` - 10 test cases for GET/POST/DELETE /api/keys endpoint
- `src/lib/capture/__tests__/extractHeadMetadata.test.ts` - 16 test cases for isSafeUrl and extractHeadMetadata
- `src/lib/db/__tests__/queueQueries.test.ts` - Extended with findByUrl describe block (3 test cases)

## Decisions Made

None - followed plan as specified. Test contracts faithfully implement all behavioral requirements from the plan spec.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all test files created cleanly following existing project patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All test scaffolds are in RED state — production code does not exist yet
- Plans 01 and 02 can reference these files in their `<automated>` verify sections
- `findByUrl` in queueQueries.test.ts will remain RED until Plan 01 Task 1 implements it
- Tests establish behavioral contracts: Plans 01 and 02 must satisfy all test cases to reach GREEN

---
*Phase: 06-capture-api-key-management*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: src/app/api/capture/__tests__/route.test.ts
- FOUND: src/app/api/keys/__tests__/route.test.ts
- FOUND: src/lib/capture/__tests__/extractHeadMetadata.test.ts
- FOUND: .planning/phases/06-capture-api-key-management/06-00-SUMMARY.md
- FOUND commit: 331e0a4 (Task 1)
- FOUND commit: 73f2a0e (Task 2)
