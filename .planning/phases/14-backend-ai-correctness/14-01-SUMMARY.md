---
phase: 14-backend-ai-correctness
plan: 01
subsystem: ai-schemas
tags: [bug-fix, zod, openai-structured-outputs, tdd]
dependency_graph:
  requires: []
  provides: [BUG-01-fix]
  affects:
    - src/app/api/architect/route.ts
    - src/app/api/neurons/route.ts
tech_stack:
  added: []
  patterns:
    - Zod .nullable() instead of .optional() for OpenAI structured output compatibility
    - zodSchema() JSON Schema required array assertion for contract verification
key_files:
  created:
    - src/lib/ai/__tests__/inferPrerequisites.test.ts
  modified:
    - src/lib/ai/architect.ts
    - src/lib/ai/__tests__/architect.test.ts
    - src/lib/ai/inferPrerequisites.ts
decisions:
  - "14-01-nullable-over-optional: Use .nullable() not .optional() for OpenAI structured output fields — optional omits from required array, nullable includes it"
  - "14-01-superrefine-null-check: superRefine guard changed from !== undefined to !== null to match new nullable contract"
  - "14-01-early-return-null: inferPrerequisites early return now returns suggested_next: null instead of [] to match nullable schema"
metrics:
  duration: "2min"
  completed: "2026-03-24"
  tasks: 2
  files: 4
---

# Phase 14 Plan 01: Fix OpenAI Structured Output Schema Errors Summary

Fixed two Zod schemas that used `.optional()` where `.nullable()` is required for OpenAI structured output compatibility — `architectResponseSchema.refusalReason` and `prerequisiteInferenceSchema.suggested_next`.

## What Was Built

BUG-01 fix: OpenAI's structured outputs API requires every field in `properties` to appear in the `required` array. Zod's `.optional()` omits fields from `required`; `.nullable()` keeps them in `required` while allowing null values. Two schemas had this bug causing schema validation errors at runtime.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix architectResponseSchema and update tests | 4a1b2cd | src/lib/ai/architect.ts, src/lib/ai/__tests__/architect.test.ts |
| 2 | Fix prerequisiteInferenceSchema and create test file | ad49511 | src/lib/ai/inferPrerequisites.ts, src/lib/ai/__tests__/inferPrerequisites.test.ts |

## Changes Made

### architect.ts
- Line 88: `refusalReason: z.string().min(1).optional()` → `z.string().min(1).nullable()`
- Line 114: `if (value.refusalReason !== undefined)` → `if (value.refusalReason !== null)`
- Error message updated: "must be omitted" → "must be null"

### inferPrerequisites.ts
- Line 20: `.optional().describe('Optional: ...')` → `.nullable().describe('..., or null if none')`
- Line 36: Early return `suggested_next: []` → `suggested_next: null`

### architect.test.ts (8 tests, all pass)
- Updated existing "accepts a valid acyclic architect graph" to include `refusalReason: null`
- Added: null accepted when isValid true
- Added: non-null string rejected when isValid true
- Added: null rejected when isValid false (reason required)
- Added: JSON Schema required array includes 'refusalReason'

### inferPrerequisites.test.ts (4 tests, all pass, new file)
- null accepted for suggested_next
- array accepted for suggested_next
- missing field (no key at all) rejected
- JSON Schema required array includes 'suggested_next'

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] UUID test fixture was not RFC-compliant**
- **Found during:** Task 2 GREEN phase
- **Issue:** Test used `00000000-0000-0000-0000-000000000001` which Zod v4's UUID validator rejects (the version nibble `1` at position 15 must fall within the UUID v1-v8 spec, but null UUID must be all zeros)
- **Fix:** Changed to `550e8400-e29b-41d4-a716-446655440000` (valid UUID v4)
- **Files modified:** src/lib/ai/__tests__/inferPrerequisites.test.ts
- **Commit:** ad49511

## Known Stubs

None — all schema changes are wired directly to production generateObject calls in the API routes.

## Verification Results

```
npx vitest run src/lib/ai/__tests__/architect.test.ts src/lib/ai/__tests__/inferPrerequisites.test.ts

Test Files  2 passed (2)
      Tests  12 passed (12)
```

All acceptance criteria passed:
- architect.ts uses .nullable() for refusalReason
- superRefine checks !== null (not !== undefined)
- inferPrerequisites.ts uses .nullable() for suggested_next
- Early return uses suggested_next: null
- inferPrerequisites.test.ts created with 4 tests covering nullable behavior
- JSON Schema required array assertions confirm the OpenAI structured output fix works

## Self-Check: PASSED
