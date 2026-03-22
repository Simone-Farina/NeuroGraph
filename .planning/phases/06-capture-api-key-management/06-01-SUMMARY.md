---
phase: 06-capture-api-key-management
plan: 01
subsystem: api
tags: [supabase, service-role, bearer-auth, rate-limiting, ssrf, metadata-extraction, ios-shortcuts]

# Dependency graph
requires:
  - phase: 05-data-layer-auth-foundation
    provides: apiKeys.ts crypto primitives, apiKeyQueries.ts, queueQueries.ts, validation schemas, database types
  - phase: 06-capture-api-key-management
    plan: 00
    provides: Nyquist test scaffolds for capture route, metadata extraction, and findByUrl

provides:
  - POST /api/capture route with bearer token auth, rate limiting, duplicate check, and URL metadata extraction
  - queueQueries.findByUrl method for duplicate URL detection
  - src/lib/capture/metadata.ts with extractHeadMetadata and isSafeUrl utilities

affects:
  - 06-02-PLAN (API key management UI -- depends on the capture endpoint being live)
  - 07-queue-triage-ui (queue items created by capture endpoint feed the triage UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service role Supabase client pattern for routes without cookie sessions (iOS Shortcuts)"
    - "CVE-2025-29927 mitigation: auth in route handler, never in middleware"
    - "PGRST116-as-null pattern for single() queries across queueQueries"
    - "SSRF guard: https-only + private IP range regex block before fetch"
    - "vi.hoisted() for mock objects referenced inside vi.mock() factory functions"

key-files:
  created:
    - src/app/api/capture/route.ts
    - src/lib/capture/metadata.ts
  modified:
    - src/lib/db/queueQueries.ts
    - src/app/api/capture/__tests__/route.test.ts

key-decisions:
  - "06-01-service-role-client: Service role Supabase client created module-level in capture route (not per-request) -- safe because credentials are env vars not user-scoped"
  - "06-01-test-scaffold-fixes: Three bugs fixed in 06-00 test scaffold: (1) vi.hoisted for mockSupabaseAdmin hoisting order, (2) VALID_TOKEN was 52 chars not 48, (3) Supabase count query mock must return Promise not {count: fn}"

patterns-established:
  - "Rate limit pattern: count query with .gte('created_at', oneHourAgo) on service role client"
  - "Metadata non-blocking: extractHeadMetadata never throws, duplicate check happens before fetch"
  - "Title fallback chain: parsed.data.title ?? meta?.title ?? meta?.source_domain ?? 'Untitled'"

requirements-completed: [AUTH-03, AUTH-04]

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 06 Plan 01: Capture API Endpoint Summary

**iOS Shortcuts capture endpoint with service-role bearer auth, 60/hr rate limiting, SSRF-safe metadata extraction, and duplicate URL detection via 5 structured JSON response paths**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T15:45:38Z
- **Completed:** 2026-03-22T15:53:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- POST /api/capture validates bearer tokens in-handler (CVE-2025-29927 mitigation) using Phase 5 crypto primitives
- URL metadata extraction fetches first 8KB, extracts og:title/twitter:title/title via regex, resolves favicon, never blocks capture
- Rate limiting enforced at 60 captures/hour via knowledge_queue.created_at count query
- Duplicate URL detection returns 409 with existing_id for client-side deduplication

## Task Commits

Each task was committed atomically:

1. **Task 1: Add findByUrl query + create metadata extraction utility** - `0e58991` (feat)
2. **Task 2: Build /api/capture POST route** - `a115f59` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/app/api/capture/route.ts` - POST endpoint: bearer auth, rate limit, duplicate check, metadata, insert
- `src/lib/capture/metadata.ts` - extractHeadMetadata (8KB fetch, regex title/favicon) and isSafeUrl (SSRF guard)
- `src/lib/db/queueQueries.ts` - Added findByUrl method (PGRST116-as-null pattern)
- `src/app/api/capture/__tests__/route.test.ts` - Fixed test scaffold bugs from 06-00

## Decisions Made
- Service role client created at module level (not per-request) — safe because `SUPABASE_SERVICE_ROLE_KEY` is an env var not user-scoped data
- `estimated_read_time` always null in this plan — deferred to Phase 8 full article extraction per spec
- Bearer token format validation (RawApiKeySchema) happens before hash lookup — fails fast on malformed tokens

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test scaffold VALID_TOKEN length (52 chars → 48)**
- **Found during:** Task 2 (running route tests)
- **Issue:** VALID_TOKEN in 06-00 scaffold was `ng_` + 52 chars; RawApiKeySchema requires exactly 48 body chars, so all auth-passing tests returned 401
- **Fix:** Changed to `ng_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv` (48 chars exactly)
- **Files modified:** src/app/api/capture/__tests__/route.test.ts
- **Verification:** 8/8 tests pass
- **Committed in:** a115f59 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed vi.mock hoisting: mockSupabaseAdmin not initialized in factory**
- **Found during:** Task 2 (running route tests)
- **Issue:** `const mockSupabaseAdmin` declared after `vi.mock('@supabase/supabase-js', () => ...)` factory. vi.mock is hoisted so factory ran before const was initialized → ReferenceError
- **Fix:** Moved `mockSupabaseAdmin` into `vi.hoisted()` call so it's available in the factory
- **Files modified:** src/app/api/capture/__tests__/route.test.ts
- **Verification:** No ReferenceError, tests run
- **Committed in:** a115f59 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed Supabase count query mock chain**
- **Found during:** Task 2 (rate limit test returning 201 instead of 429)
- **Issue:** Scaffold had `.gte()` returning `{ count: mockCountResult }` (plain object). Route awaits `.gte()` directly; plain object resolves to itself so `count` was the mock function, not 0/60
- **Fix:** Changed `.gte()` mock to `vi.fn().mockResolvedValue({ count: 0, data: null, error: null })` so it returns a real Promise
- **Files modified:** src/app/api/capture/__tests__/route.test.ts
- **Verification:** Rate limit test (429) passes; other tests unaffected
- **Committed in:** a115f59 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs in 06-00 test scaffold)
**Impact on plan:** All three bugs were in the Nyquist test scaffold from Phase 06-00, not in production code. Production code is correct. Test scaffold is now fully functional.

## Issues Encountered
None in production code. Three test scaffold bugs identified and fixed (documented above as deviations).

## User Setup Required
None - no external service configuration required in this plan. The capture endpoint requires `SUPABASE_SERVICE_ROLE_KEY` env var which was set up in Phase 5.

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.

## Next Phase Readiness
- `/api/capture` endpoint is complete and tested -- ready for iOS Shortcuts integration
- Plan 06-02 (API key management UI) can proceed immediately -- the capture auth infrastructure is live
- Phase 7 queue triage UI will display items captured via this endpoint
