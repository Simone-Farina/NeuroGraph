# Phase 26: Chat Quality & Bloom Unification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 26-chat-quality-bloom-unification
**Areas discussed:** Streaming auto-scroll, AI response length, Bloom unification scope

---

## Streaming Auto-Scroll

### Auto-scroll behavior during streaming

| Option | Description | Selected |
|--------|-------------|----------|
| Stick-to-bottom | Auto-scroll pins to bottom during streaming. Pauses if user scrolls up. Standard chat UX. | ✓ |
| Always force bottom | Always jumps to bottom, even if user scrolled up. Simpler but frustrating. | |
| You decide | Claude picks based on codebase patterns. | |

**User's choice:** Stick-to-bottom (Recommended)

### Scroll technique

| Option | Description | Selected |
|--------|-------------|----------|
| Sentinel + scrollIntoView | Invisible div at bottom, scrollIntoView called per chunk. Clean, standard. | ✓ |
| rAF scroll loop | requestAnimationFrame loop during streaming. Max smoothness, more complexity. | |
| You decide | Claude picks smoothest approach for React/useChat. | |

**User's choice:** Sentinel + scrollIntoView (Recommended)

### Conversation switch scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Always bottom | Loading a conversation scrolls to most recent message. Standard chat behavior. | ✓ |
| Restore last position | Remember scroll position per conversation. More complex. | |

**User's choice:** Yes, always bottom (Recommended)

### Jump-to-bottom button

| Option | Description | Selected |
|--------|-------------|----------|
| Show jump button | Subtle button appears when user scrolls up and new messages arrive. | ✓ |
| No extra UI | User scrolls back down manually. Simpler. | |
| You decide | Claude decides based on complexity vs UX. | |

**User's choice:** Yes, show jump button (Recommended)

### Remove scroll-smooth CSS

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it | scroll-smooth causes queued animations that stutter. Sentinel handles smoothness. | ✓ |
| Keep it | Leave in place, may conflict with scrollIntoView. | |

**User's choice:** Remove it (Recommended)

### Scroll debounce

| Option | Description | Selected |
|--------|-------------|----------|
| 15-20ms debounce | Prevents stutter from rapid chunks. Standard practice. Instant on conversation load. | ✓ |
| No debounce | Direct call per chunk. Simpler but may stutter. | |
| You decide | Claude picks optimal timing. | |

**User's choice:** Yes, 15-20ms debounce (Recommended)

---

## AI Response Length

### Length calibration approach

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt rewrite only | Adjust CHAT_SYSTEM_PROMPT instructions. No code changes to chat route. | ✓ |
| Prompt + maxTokens cap | Rewrite prompt AND hard-cap with maxTokens. May cut off mid-thought. | |
| You decide | Claude picks based on model behavior. | |

**User's choice:** Prompt rewrite only (Recommended)

### Default response density

| Option | Description | Selected |
|--------|-------------|----------|
| Tight — 1 paragraph | Single paragraph most turns. Text message energy. | |
| Balanced — 1-2 paragraphs | Mix of 1 and 2. 3 only for deep analysis. Conversational but substantive. | ✓ |
| Current but varied | Keep 1-3 range, add stronger variation cues. | |

**User's choice:** Balanced — 1-2 paragraphs (Recommended)

### Eval enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Add length assertion | promptfoo assertion checking paragraph count. FAIL if always 3+. | ✓ |
| Manual QA only | Verify through manual testing. Length is subjective. | |
| You decide | Claude decides effort vs value. | |

**User's choice:** Yes, add length assertion (Recommended)

### Opening variety

| Option | Description | Selected |
|--------|-------------|----------|
| Strengthen variety cue | Add explicit anti-pattern: never start two consecutive replies the same way. | ✓ |
| Keep current wording | Existing instruction is sufficient. | |
| You decide | Claude decides based on model behavior. | |

**User's choice:** Strengthen the variety cue (Recommended)

### Mandatory question constraint

| Option | Description | Selected |
|--------|-------------|----------|
| Keep mandatory question | Always end with a question. Core Socratic mechanic. | |
| Allow occasional no-question | Sometimes a brief observation or reframe is better. | ✓ |
| You decide | Claude judges based on Socratic intent. | |

**User's choice:** Allow occasional no-question (Recommended)

---

## Bloom Unification Scope

### Bloom heuristic status

| Option | Description | Selected |
|--------|-------------|----------|
| Verify & close BLOOM-01 | Confirm no heuristic code in develop/main. Clean up worktree. Already satisfied. | ✓ |
| Implement BloomDepthMeter | Port 6-segment meter from worktree, rewire to LLM eval. | |
| Clean up + minimal verification | Delete worktree, verify no leaks, add code comment. | |

**User's choice:** Verify & close BLOOM-01 (Recommended)

### Stale worktree cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Clean them up | Delete stale worktree branches with old heuristic code. | ✓ |
| Leave them | Worktrees are harmless. Don't spend time. | |
| You decide | Claude decides if cleanup is worthwhile. | |

**User's choice:** Yes, clean them up (Recommended)

---

## Claude's Discretion

- Exact debounce timing within 15-20ms range
- Jump-to-bottom button visual design
- Scroll behavior during crystallize state
- Exact prompt wording for length/variety changes
- Specific eval cases to add/modify
- Worktree cleanup mechanics

## Deferred Ideas

None — discussion stayed within phase scope.
