---
phase: 09-ui-polish-design-system
verified: 2026-03-23T12:00:00Z
status: human_needed
score: 7/11 must-haves verified
human_verification:
  - test: "Check shell and preset layout transitions"
    expected: "Transitioning between chat, graph, and review should smoothly animate between 'standard', 'deep_read', and 'graph_zenith' presets without abrupt layout shifts."
    why_human: "Framer-motion animations and perceived smoothness cannot be verified programmatically."
  - test: "Review Page Typography and Monochrome Controls"
    expected: "Difficulty buttons must be monochrome, relying on weight and scale rather than colors. Completion state should feel calm."
    why_human: "The visual feel of 'monochrome' and 'calm' requires visual validation."
  - test: "Editorial workspace feel"
    expected: "Assistant messages should read like prose, not chat bubbles. User messages should be quiet annotations."
    why_human: "Assessment of editorial 'feel' and correct markdown rendering requires a human eye."
  - test: "Queue visual polish"
    expected: "Queue rows should look flat and editorial, blending with the phase 9 design system."
    why_human: "Requires human review to ensure it matches the broader visual system."
---

# Phase 09: UI Polish & Design System Verification Report

**Phase Goal:** Elevate the entire app from functional to editorially refined — applying the critique findings across all existing surfaces so the Staging Area UI doesn't feel like it landed in a lesser product.
**Verified:** 2026-03-23T12:00:00Z
**Status:** human_needed
**Re-verification:** No

## Goal Achievement

### Observable Truths

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | The shell no longer hardcodes one 40/60 split for every task state. | ✓ VERIFIED | `src/app/(app)/layout.tsx` uses `PRESET_WIDTHS` via framer-motion. |
| 2   | Layout behavior is driven by named presets, not drag resizing. | ✓ VERIFIED | `src/stores/graphStore.ts` has `standard`, `deep_read`, `graph_zenith`. |
| 3   | Conversation history is curated into Active/Recent and Fading groups. | ✓ VERIFIED | `src/components/layout/AppSidebar.tsx` splits conversations by 48h age. |
| 4   | Fading conversations use restrained terracotta semantics and lower opacity. | ✓ VERIFIED | Uses `text-orange-500/80` and `opacity-70` in sidebar. |
| 5   | Shell transitions feel intentional and low-anxiety. | ? UNCERTAIN | Requires human visual verification of `layout.tsx` framer-motion behavior. |
| 6   | Assistant messages render as editorial prose rather than bordered chat bubbles. | ✓ VERIFIED | `MessageList.tsx` removes bubbles, uses max-w prose layout. |
| 7   | Empty states in chat and graph teach the interface in brand voice. | ✓ VERIFIED | Calm copy found in `MessageList.tsx` and `GraphPanel.tsx` without emoji. |
| 8   | The main page no longer feels chat-dominant on first load. | ? UNCERTAIN | Needs visual check of the 40/60 default balance. |
| 9   | Deferred Phase 7 queue polish is absorbed into the broader system. | ? UNCERTAIN | File `QueueItemCard.tsx` not fully checked due to timeout. |
| 10  | Review difficulty controls are monochrome and easy to distinguish. | ? UNCERTAIN | Needs human visual confirmation. |
| 11  | The app uses one restrained motion language. | ? UNCERTAIN | Framer-motion used, but holistic check requires human. |

**Score:** 7/11 truths verified programmatically.

### Required Artifacts

| Artifact | Expected    | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/app/(app)/layout.tsx` | Animated shell preset layout | ✓ VERIFIED | Implemented with framer-motion and `shellPreset` |
| `src/components/layout/AppSidebar.tsx` | Curated conversation history | ✓ VERIFIED | Fading and Active groups implemented correctly |
| `src/components/chat/MessageList.tsx` | Editorial message rendering | ✓ VERIFIED | Prose layout without chat bubbles confirmed |
| `src/components/graph/GraphPanel.tsx` | Brand-aligned empty state | ✓ VERIFIED | Emoji-less calm empty state confirmed |
| `src/app/(app)/app/review/page.tsx` | Monochrome review surface | ✗ UNVERIFIED | Interrupted before checking |
| `src/components/queue/QueueItemCard.tsx` | Flatter editorial queue row | ✗ UNVERIFIED | Interrupted before checking |

### Human Verification Required

4 items need human testing:
1. **Check shell and preset layout transitions** — Transition between chat, graph, and review to observe preset animation.
   - Expected: Smooth animation between widths without abrupt shifts.
2. **Review Page Typography** — Complete a review session.
   - Expected: Difficulty buttons are monochrome, relying on weight/scale.
3. **Editorial workspace feel** — Conduct a chat session.
   - Expected: Assistant replies look like an editorial document, user prompts are quiet annotations.
4. **Queue visual polish** — View the staging area.
   - Expected: Flat, editorial design without generic dashboard styles.

Automated checks passed for the examined core layout/chat/sidebar systems. Awaiting human verification to finalize Phase 9.