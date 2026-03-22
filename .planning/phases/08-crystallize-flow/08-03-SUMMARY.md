---
phase: 08-crystallize-flow
plan: 03
subsystem: backend-ui-integration
tags: [nextjs, react, chat, queue, provenance, neurogenesis]
requires:
  - phase: 08-crystallize-flow
    plan: 01
    provides: crystallize routes and message metadata provenance
  - phase: 08-crystallize-flow
    plan: 02
    provides: chat-side crystallize bootstrap and manual continuation
provides:
  - Queue-item provenance resolution from crystallize-linked conversations
  - Mastered handoff during Neurogenesis through allowed queue transitions
  - Client-side queue refresh after mastery confirmation
affects: []
tech-stack:
  added: []
  patterns: [metadata-derived provenance, idempotent mastery handoff, queue refresh on server-confirmed mastery]
key-files:
  created:
    - src/lib/crystallize/provenance.ts
    - src/lib/crystallize/__tests__/provenance.test.ts
    - src/components/chat/__tests__/ChatPanel.mastery.test.tsx
  modified:
    - src/app/api/neurons/route.ts
    - src/app/api/neurons/__tests__/route.test.ts
    - src/components/chat/ChatPanel.tsx
key-decisions:
  - "Queue mastery walks the existing state machine instead of bypassing it with a direct mastered write."
  - "The client only refreshes queue state when the server confirms mastery through `mastered_queue_item_id`."
patterns-established:
  - "Crystallize conversation -> message metadata provenance -> Neurogenesis mastery handoff"
  - "Server-confirmed mastered handoff -> queue store refresh -> calm in-chat confirmation"
requirements-completed: [CRYST-03]
duration: 10min
completed: 2026-03-22
---

# Phase 8: Crystallize Flow Summary

**Crystallize-linked Neurogenesis now closes the queue loop by resolving provenance from chat metadata, advancing the originating item to mastered through allowed transitions, and refreshing queue state in the client**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-22T23:15:00Z
- **Completed:** 2026-03-22T23:25:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `src/lib/crystallize/provenance.ts` so neuron creation can recover the originating queue item from persisted `messages.metadata` and advance it to `mastered` without violating queue transition rules.
- Extended `POST /api/neurons` to return `mastered_queue_item_id` when a crystallize-linked conversation successfully closes the loop, including idempotent already-mastered cases.
- Updated `ChatPanel` to refresh the queue store and clear crystallize intent only after the server confirms mastery, while keeping the visible confirmation quiet and low-anxiety.
- Added integration coverage for provenance lookup, mastered handoff in the neurons route, and queue refresh behavior in the chat client.

## Files Created/Modified

- `src/lib/crystallize/provenance.ts` - conversation provenance and mastery transition helper
- `src/lib/crystallize/__tests__/provenance.test.ts` - provenance lookup and state-walking coverage
- `src/app/api/neurons/route.ts` - mastered handoff during successful Neurogenesis
- `src/app/api/neurons/__tests__/route.test.ts` - route contract coverage for crystallize-linked mastery and idempotence
- `src/components/chat/ChatPanel.tsx` - queue refresh and calm mastery notice after neuron creation
- `src/components/chat/__tests__/ChatPanel.mastery.test.tsx` - client integration coverage for queue refresh gating

## Decisions Made

- Provenance lookup uses existing conversation messages ordered by `created_at`, which keeps the linkage inside the persisted chat record instead of introducing a second storage path.
- Queue refresh remains explicitly gated on `mastered_queue_item_id` so normal neuron creation does not create incidental queue churn.

## Verification

- `npx vitest run src/lib/crystallize/__tests__/provenance.test.ts src/app/api/neurons/__tests__/route.test.ts src/components/chat/__tests__/ChatPanel.mastery.test.tsx --reporter=verbose`
- `npx tsc --noEmit`

## Deviations from Plan

- The initial Wave 3 tests assumed the chat bootstrap side effects were absent; they were adjusted to reflect the real `ChatPanel` lifecycle while keeping the mastery assertions isolated.

## Issues Encountered

- Type narrowing in the provenance helper needed one correction so the transition path stayed compatible with the queue state's non-mastered subset.

## User Setup Required

None

## Next Phase Readiness

- Phase 8 is ready for the blocking human verification pass covering seeded crystallize flow, manual paste fallback continuity, and mastered-state reflection in queue.

---
*Phase: 08-crystallize-flow*
*Completed: 2026-03-22*
