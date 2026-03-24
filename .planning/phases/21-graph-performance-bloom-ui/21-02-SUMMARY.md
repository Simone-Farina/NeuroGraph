---
phase: 21-graph-performance-bloom-ui
plan: 02
subsystem: ui
tags: [bloom, cognitive-depth, chat, keyword-analysis, usememo, react]

# Dependency graph
requires:
  - phase: 13-socratic-chat-engine
    provides: ChatPanel component and message structure (UIMessage)
  - phase: 16-socratic-agent-redesign
    provides: BLOOM_ANALYZE_SIGNALS patterns from conversationalist eval provider
provides:
  - Client-side Bloom level classifier (classifyBloomLevel) with 6-level keyword analysis
  - BloomDepthMeter 6-segment ambient UI component for cognitive depth visualization
  - ChatPanel integration showing real-time Bloom depth above the chat input
affects: [socratic-chat-engine, chat-ui, future-bloom-escalation-prompting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side keyword classification using regex patterns mirroring server-side eval signals"
    - "useMemo for zero-cost derived UI state from message list"
    - "Ambient indicator pattern: decorative/informational, never gating"

key-files:
  created:
    - src/lib/bloom/classifyBloomLevel.ts
    - src/components/chat/BloomDepthMeter.tsx
  modified:
    - src/components/chat/ChatPanel.tsx

key-decisions:
  - "BLOOM_QUESTION_EXEMPTION applied: messages ending with '?' capped at Understand (index 1) regardless of other signals — mirrors eval provider logic"
  - "Meter only advances (returns max across all scanned messages) — matches 'depth' metaphor; no session regression"
  - "bloomLevel derived via useMemo on messages, not stored in state — zero extra renders or API calls"
  - "BloomDepthMeter hidden when messages.length === 0 — avoids confusing indicator in empty chat state"
  - "Pre-existing TypeScript errors in test files (architect.test.ts, inferPrerequisites.test.ts) confirmed as pre-existing, not introduced by this plan"

patterns-established:
  - "Bloom keyword patterns: defined once in classifyBloomLevel.ts, mirroring conversationalist provider — future changes to detection logic should update both"
  - "6-segment ambient meter pattern: level prop 0-5, filled segments show max depth, active segment pulses"

requirements-completed: [BLOOM-01]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 21 Plan 02: Bloom Depth Meter Summary

**Real-time 6-segment Bloom cognitive depth meter added to chat interface using client-side keyword analysis of user messages — zero API calls, ambient editorial aesthetic**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T21:54:54Z
- **Completed:** 2026-03-24T21:56:56Z
- **Tasks:** 2 completed
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Created `classifyBloomLevel(userMessages: string[])` — scans last 3 user messages, returns max Bloom level 0-5 using keyword patterns matching existing eval provider signals
- Created `BloomDepthMeter` component — 6 horizontal segments (sky blue → teal → emerald → amber → orange → gold), active segment pulses, tooltip shows level name, max 180px wide
- Wired meter into `ChatPanel` via `useMemo` on `messages` — appears above ChatInput when chat has messages, hidden in empty state; no new state, no new API calls

## Task Commits

1. **Task 1: Create Bloom level classifier and BloomDepthMeter component** - `664ffbf` (feat)
2. **Task 2: Integrate BloomDepthMeter into ChatPanel** - `d88cd70` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/bloom/classifyBloomLevel.ts` - 6-level Bloom classifier with keyword patterns, BLOOM_QUESTION_EXEMPTION, max-across-messages logic
- `src/components/chat/BloomDepthMeter.tsx` - 6-segment ambient depth indicator component
- `src/components/chat/ChatPanel.tsx` - Added useMemo + bloomLevel derivation, BloomDepthMeter render above ChatInput

## Decisions Made

- Applied BLOOM_QUESTION_EXEMPTION: messages ending with `?` are capped at Understand (index 1), mirroring the conversationalist eval provider's pattern
- Meter advances only (max across messages) — depth metaphor; once user reaches Analyze, meter stays at Analyze even if next message is simpler
- Used `useMemo` not `useState` — level is derived data, zero extra renders or watchers
- BloomDepthMeter hidden when `messages.length === 0` — avoids a confusing indicator before conversation starts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `src/lib/ai/__tests__/architect.test.ts` and `src/lib/ai/__tests__/inferPrerequisites.test.ts` (Property 'required' does not exist on type 'PromiseLike<JSONSchema7>'). These are pre-existing and not introduced by this plan. New files compile without errors.

## Known Stubs

None - BloomDepthMeter receives live data from `classifyBloomLevel` wired to real `messages` array.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bloom UI component is live and functional
- classifyBloomLevel is available for reuse if future plans add Bloom escalation prompting
- The meter is informational only — no changes needed to neurogenesis gating logic

---
*Phase: 21-graph-performance-bloom-ui*
*Completed: 2026-03-24*
