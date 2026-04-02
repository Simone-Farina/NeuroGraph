---
phase: 26-chat-quality-bloom-unification
plan: 01
subsystem: ui
tags: [react, scroll, sentinel, streaming, chat, useCallback, useRef]

# Dependency graph
requires:
  - phase: 25-decoupled-architect-pipeline
    provides: ChatPanel.tsx with Bloom eval integration and conversation-switch useEffect
  - phase: 24-silent-observer
    provides: Bloom evaluator, messagesRef pattern, useCallback debounce conventions
provides:
  - Sentinel-based auto-scroll in ChatPanel with 16ms debounce and stick-to-bottom detection
  - Jump to latest button (absolute bottom-24 right-6) visible when user scrolls up during streaming
  - Instant scroll to bottom on conversation switch via requestAnimationFrame
  - sentinelRef prop threaded from ChatPanel to MessageList
affects:
  - 26-02-chat-quality-bloom-unification (uses same ChatPanel.tsx)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sentinel div at bottom of MessageList — zero visual footprint, scroll target only"
    - "scrollIntoView({ behavior: 'instant' | 'smooth' }) replaces scrollTop = scrollHeight"
    - "isAtBottomRef.current guards scrollToBottom — skips auto-scroll if user scrolled up"
    - "16ms setTimeout debounce on smooth scroll to prevent stutter during rapid streaming chunks"
    - "requestAnimationFrame wrapper on post-loadMessages scroll for DOM flush guarantee"

key-files:
  created: []
  modified:
    - src/components/chat/MessageList.tsx
    - src/components/chat/ChatPanel.tsx

key-decisions:
  - "26-01-sentinel-pattern: Replace scrollTop=scrollHeight with sentinel div + scrollIntoView — eliminates scroll-smooth animation queue buildup during rapid streaming"
  - "26-01-16ms-debounce: 16ms setTimeout debounce on smooth scroll (within D-05 15-20ms window) prevents per-chunk stutter while staying responsive"
  - "26-01-instant-on-switch: Conversation switch scrolls instantly via requestAnimationFrame after loadMessages resolves — D-06 compliance"
  - "26-01-80px-threshold: isAtBottom detection uses 80px slack threshold — handles minor rubber-band scroll offsets without false positives"

patterns-established:
  - "sentinelRef threading: invisible aria-hidden div as last child of message list, ref threaded as prop from parent"
  - "isAtBottomRef guard: ref (not state) for stick-to-bottom check to avoid re-render on every scroll event"

requirements-completed:
  - CHAT-01

# Metrics
duration: 2min
completed: 2026-04-03
---

# Phase 26 Plan 01: Chat Scroll — Sentinel Auto-Scroll with Jump Button Summary

**Sentinel div + scrollIntoView(16ms debounce) replaces broken scroll-smooth CSS queuing, adds stick-to-bottom detection and Jump to latest button**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T23:45:22Z
- **Completed:** 2026-04-02T23:47:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `scrollRef.current.scrollTop = scrollRef.current.scrollHeight` + `scroll-smooth` CSS with sentinel element approach — eliminates animation queue buildup during rapid streaming
- Added stick-to-bottom detection (`isAtBottomRef`) with 80px threshold and `showJumpButton` state — auto-scroll pauses when user scrolls up, Jump to latest button appears
- Wired instant scroll to bottom on conversation switch via `requestAnimationFrame` after `loadMessages` resolves

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sentinel element to MessageList and thread ref from ChatPanel** - `c8efe87` (feat)
2. **Task 2: Replace scroll useEffect with sentinel scroll logic, add jump button** - `72b79c3` (feat)

## Files Created/Modified

- `src/components/chat/MessageList.tsx` - Added `sentinelRef?: RefObject<HTMLDivElement | null>` prop, sentinel `<div ref={sentinelRef} aria-hidden="true" />` as last child of space-y-4 container
- `src/components/chat/ChatPanel.tsx` - Replaced broken scroll useEffect with sentinel-based scrollToBottom, added handleScroll, jump button JSX, cleanup effect, conversation-switch isAtBottom reset

## Decisions Made

- 16ms debounce chosen (within D-05's 15-20ms range) — matches typical rAF budget without being unnecessarily tight
- 80px stick-to-bottom threshold — matches Vercel AI Elements pattern, handles rubber-band bounce without false pausing
- Jump button positioned `absolute bottom-24 right-6` — clears ChatInput (96px from bottom) without overlapping GenerateNeuronButton

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

3 pre-existing TypeScript errors (architect.test.ts, inferPrerequisites.test.ts, providers.ts) are out of scope — not caused by this plan's changes. Documented for awareness.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Sentinel scroll infrastructure in place; 26-02 (AI response length calibration + Bloom unification) can proceed in parallel
- TypeScript compiles cleanly for all chat components
- Visual verification still needed: streaming jank elimination, jump button behavior, conversation switch scroll

---
*Phase: 26-chat-quality-bloom-unification*
*Completed: 2026-04-03*
