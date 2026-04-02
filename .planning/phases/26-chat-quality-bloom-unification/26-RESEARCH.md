# Phase 26: Chat Quality & Bloom Unification - Research

**Researched:** 2026-04-03
**Domain:** React streaming scroll, LLM prompt calibration, dead-code removal
**Confidence:** HIGH

## Summary

Phase 26 is a tightly scoped quality pass covering three non-overlapping concerns: (1) replacing a broken scroll `useEffect` with a sentinel + `scrollIntoView` pattern to eliminate streaming jank, (2) rewriting the `CHAT_SYSTEM_PROMPT` to default to 1-2 paragraph responses rather than a rigid 3-paragraph structure, and (3) confirming and formally documenting that the Phase 21 client-side Bloom heuristic was never merged and therefore BLOOM-01 is already satisfied — followed by cleanup of the stale worktree artifacts.

All three work items are contained within a small set of well-understood files. The existing codebase pattern for debounced `useRef`/`useCallback` operations (see `triggerBloomEval`) is directly reusable for the sentinel scroll logic. The prompt-eval harness already has a JavaScript assertion scaffold; adding a paragraph-count assertion is a mechanical extension. The Bloom verification is a grep audit plus `git worktree remove` calls.

**Primary recommendation:** Implement sentinel scroll first (highest user-visible impact), then prompt rewrite with eval assertion, then Bloom cleanup. All three can be parallelised across plans if desired; they have zero code overlap.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Streaming Auto-Scroll (CHAT-01)**
- D-01: Replace current `useEffect([messages])` + `scrollTop = scrollHeight` with a sentinel element approach — invisible div at bottom of message list, `scrollIntoView()` called per streaming chunk
- D-02: Stick-to-bottom behavior: auto-scroll keeps viewport pinned during streaming. If user scrolls up manually, auto-scroll pauses until they scroll back down
- D-03: Show a subtle "jump to latest" button when user scrolls up and new messages arrive. Fades when at bottom
- D-04: Remove the `scroll-smooth` CSS class from the scroll container — it causes queued animations that stutter during rapid streaming. The sentinel's `scrollIntoView` handles smoothness itself
- D-05: Add 15-20ms debounce on scroll-to-bottom calls during streaming to prevent stutter from rapid chunk updates. Instant scroll (no debounce) on conversation load/switch
- D-06: On conversation switch (loading persisted messages), always scroll to bottom — most recent message first

**AI Response Length Calibration (CHAT-02)**
- D-07: Prompt rewrite only — no `maxTokens` cap or code changes to the chat route. Adjust `CHAT_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`
- D-08: Default density is balanced: 1-2 paragraphs per turn. 3 paragraphs only when the topic genuinely demands elaboration. Replace "One to three paragraphs per turn" with explicit shorter-default instruction
- D-09: Strengthen opening variety: add explicit anti-pattern instruction — "Never start two consecutive replies the same way. Vary between building on the user's point, introducing a new angle, or asking directly."
- D-10: Loosen the mandatory question constraint: "Usually close with a question, but occasionally a brief observation or reframe is enough." Replace the rigid "Always close with exactly one focused follow-up question" rule
- D-11: Add a promptfoo eval assertion checking paragraph count. FAIL if response always has 3+ paragraphs across all test cases. Ensures the prompt change actually works

**Bloom Unification (BLOOM-01)**
- D-12: BLOOM-01 is already satisfied — the Phase 21 client-side heuristic (`classifyBloomLevel.ts`, `BloomDepthMeter.tsx`) was never merged to develop/main. The sole Bloom classification source is the Phase 24 LLM evaluator at `POST /api/bloom-evaluate`
- D-13: Verify: grep the codebase to confirm no heuristic references (`classifyBloomLevel`, `BLOOM_ANALYZE_SIGNALS`, `BloomDepthMeter`) exist in main source. Document the verification
- D-14: Clean up stale worktree branches that contain the never-merged Phase 21 heuristic code (e.g., `worktree-agent-ac5685ca`)
- D-15: The existing inline Bloom status badge in `GenerateNeuronButton` (showing level + confidence %) is sufficient Bloom UI — no separate `BloomDepthMeter` component needed

### Claude's Discretion
- Exact debounce timing within the 15-20ms range
- Exact wording of the strengthened prompt instructions (D-08 through D-10)
- Scroll behavior during crystallize state
- Jump-to-bottom button visual design (position, opacity, animation)
- Which specific eval cases to add or modify for the length assertion
- How to structure the worktree cleanup (manual `git worktree remove` or scripted)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | Chat streaming auto-scrolls smoothly without scrollbar jank or UI blocking | Sentinel + scrollIntoView pattern confirmed; existing `useRef`/`useCallback` pattern in ChatPanel is directly reusable |
| CHAT-02 | Conversationalist sometimes responds with 1-2 paragraphs instead of always 3 — sharper, more varied turns | Prompt rewrite targeting `CHAT_SYSTEM_PROMPT` lines 1-33; promptfoo paragraph-count assertion extends existing eval scaffold |
| BLOOM-01 | Single Bloom classification source — Phase 24 LLM evaluator only. Phase 21 client-side heuristic removed or replaced | Grep audit confirms heuristic never merged; three affected files (`classifyBloomLevel.ts`, `BloomDepthMeter.tsx`, modified `ChatPanel.tsx`) are isolated in worktree `worktree-agent-ac5685ca` only |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ai-sdk/react` (`useChat`) | Already in project | Chat SDK with `status` field for streaming state gating | Canonical — already used; `status === 'streaming'` gates scroll behavior |
| React `useRef` / `useCallback` | Built-in | Sentinel ref + debounce timer ref | The exact pattern used by `triggerBloomEval` — no new primitives needed |
| Native `scrollIntoView` | Browser API | Scroll sentinel into view on each chunk | No library needed; `behavior: 'smooth'` or `'instant'` selected per context |
| Tailwind CSS | Already in project | Jump-to-bottom button styling | Existing design system; `opacity`, `transition`, `pointer-events-none` classes |
| promptfoo | Already in project | Eval assertion for paragraph count | `npm run eval:conversationalist` — existing harness |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `IntersectionObserver` | Browser API | Detect whether sentinel is visible (user-scrolled-up detection) | Alternative to manual scroll position math for stick-to-bottom detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sentinel + `scrollIntoView` | `scrollTop = scrollHeight` (current) | Current approach queues CSS transitions when `scroll-smooth` is on — causes stutter. Sentinel is standard for AI chat. |
| `IntersectionObserver` | Manual `scrollTop >= scrollHeight - clientHeight - threshold` | Both are valid for stick-to-bottom detection. Manual math is simpler to reason about in the existing code structure. |
| promptfoo paragraph assertion | Manual spot-check | Assertion gives repeatable regression protection — locked by D-11. |

**Installation:** No new packages required — all stack components are already present in the project.

---

## Architecture Patterns

### Recommended Project Structure

No structural changes. All modifications are within existing files:

```
src/
├── components/chat/
│   ├── ChatPanel.tsx        # scroll logic rewrite (sentinel, debounce, jump button)
│   └── MessageList.tsx      # add sentinel <div> at bottom of list
├── lib/ai/
│   └── prompts.ts           # CHAT_SYSTEM_PROMPT rewrite (lines 1-33)
prompt-eval/
└── conversationalist/
    └── cases.yaml           # add paragraph-count assertion case
```

### Pattern 1: Sentinel + Stick-to-Bottom

**What:** Render an invisible `<div ref={sentinelRef} />` as the last child of `MessageList`. In `ChatPanel`, maintain an `isAtBottom` ref. On each streaming chunk (or `messages` update), call `sentinelRef.current.scrollIntoView()` — but only when `isAtBottom` is true. On manual scroll up, set `isAtBottom = false`. On scroll back down past threshold, set `isAtBottom = true` again.

**When to use:** Any AI chat stream where tokens arrive in rapid succession.

**Example:**
```typescript
// ChatPanel.tsx — sentinel scroll (replaces lines 268-272)
const sentinelRef = useRef<HTMLDivElement>(null);
const isAtBottomRef = useRef(true);
const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Called per streaming message update
const scrollToBottom = useCallback((instant = false) => {
  if (!isAtBottomRef.current) return;
  if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
  if (instant) {
    sentinelRef.current?.scrollIntoView({ behavior: 'instant' });
    return;
  }
  scrollDebounceRef.current = setTimeout(() => {
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 16); // within 15-20ms window (D-05)
}, []);

// Scroll container onScroll handler
const handleScroll = useCallback(() => {
  const el = scrollRef.current;
  if (!el) return;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  isAtBottomRef.current = atBottom;
  setShowJumpButton(!atBottom);
}, []);
```

```tsx
// MessageList.tsx — sentinel element at bottom
export function MessageList({ messages, isLoading, sentinelRef }: MessageListProps) {
  // ... existing render ...
  return (
    <div className="space-y-4 px-8 py-8 md:px-12">
      {/* existing message map */}
      {showThinking && <ThinkingIndicator />}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
```

**Key change:** Remove `scroll-smooth` from the scroll container div (line 391, currently `className="... scroll-smooth"`). The `scrollIntoView` with `behavior: 'smooth'` replaces it — but only when appropriate. On conversation switch, use `behavior: 'instant'` (D-06).

### Pattern 2: Jump-to-Latest Button

**What:** A small, absolutely-positioned button that appears when `showJumpButton` is true and fades when false. Clicking it calls `scrollToBottom(true)` (instant) and resets `isAtBottomRef.current = true`.

**Example:**
```tsx
// Inside ChatPanel return, inside the relative container
{showJumpButton && (
  <button
    onClick={() => {
      isAtBottomRef.current = true;
      scrollToBottom(true);
    }}
    className="absolute bottom-24 right-6 text-[11px] font-medium uppercase tracking-wider
               text-white/50 bg-white/[0.05] border border-white/10 px-3 py-1.5
               transition-opacity duration-300 opacity-100 hover:opacity-80"
  >
    Jump to latest
  </button>
)}
```

### Pattern 3: Paragraph-Count Eval Assertion

**What:** A new promptfoo case in `cases.yaml` that asserts the model does NOT always produce 3+ paragraphs. The provider already returns `{ response, socratic_score }` — the JavaScript assertion counts `\n\n`-delimited blocks.

**Example:**
```yaml
# cases.yaml — new case for CHAT-02 regression guard
- description: "response-length — model should sometimes produce 1-2 paragraphs, not always 3+"
  vars:
    messages:
      - role: user
        content: "What is a closure in JavaScript?"
    final_user_message: "So it's like the function remembers its outer scope?"
  assert:
    - type: javascript
      value: |
        // Paragraph count check: count \n\n-separated blocks (standard paragraph delimiter).
        // FAIL only if ALL responses have 3+ paragraphs — this case uses a short conversational
        // turn that should elicit a 1-2 paragraph reply.
        const result = JSON.parse(output);
        const text = result.response.trim();
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        if (paragraphs.length >= 3) {
          return {
            pass: false,
            score: 0,
            reason: `Response has ${paragraphs.length} paragraphs — expected 1-2 for a short conversational turn`
          };
        }
        return { pass: true, score: 1, reason: `Response has ${paragraphs.length} paragraph(s) — matches shorter-default expectation` };
```

### Pattern 4: CHAT_SYSTEM_PROMPT Rewrite Target

The current prompt (lines 1-33) has two rigid constraints that produce the 3-paragraph default:
1. `"One to three paragraphs per turn"` — reads as a floor-and-ceiling, but models anchor to the ceiling
2. `"Always close with exactly one focused follow-up question"` — forces a formulaic ending that pads responses

**Replacement language (Claude's discretion for exact wording):**
- Line 5: Replace `"One to three paragraphs per turn"` with something like: `"Respond in 1 to 2 paragraphs as a default. Reserve a third paragraph only when the topic genuinely requires it."`
- Line 7: Replace `"Then close with exactly one focused question"` with: `"Usually close with a question, but occasionally a brief observation or reframe is enough."`
- Add to the opening instructions: `"Never start two consecutive replies the same way. Vary between building on the user's point, introducing a new angle, or asking directly."`

### Anti-Patterns to Avoid

- **Removing `scroll-smooth` from the wrong element:** The class is on the `scrollRef` div (line 391). `MessageList` itself has no scroll CSS. Only the outer `overflow-y-auto` div needs the change.
- **Calling `scrollIntoView` outside of `isAtBottomRef.current` guard:** Without the guard, the sentinel will yank the user back to bottom when they scroll up to read earlier messages.
- **Debouncing the conversation-switch scroll:** D-06 says instant scroll on load/switch. Applying the 15-20ms debounce here would show a flash of un-scrolled content.
- **Forgetting to pass `sentinelRef` through `MessageList` props:** The sentinel lives in `MessageList` DOM but is controlled from `ChatPanel`. The ref must be threaded through as a prop — add it to `MessageListProps`.
- **Eval provider's `maxOutputTokens: 600` cap:** The provider sends 600 tokens max. Short-response assertions must account for this — a 1-paragraph response is well within range.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position tracking | Custom scroll physics / virtual scroll | Native `scrollIntoView` + `onScroll` handler | Browser-native, no layout thrash, no dependencies |
| Streaming chunk detection | Polling `messages.length` in `setInterval` | React re-render on `messages` change (already happens) | `useEffect([messages])` fires on every token; replace only the scroll call inside it |
| Paragraph count in response | LLM judge for length | Simple `\n\n` split in promptfoo JS assertion | Structural assertion is deterministic and zero-cost |
| Bloom heuristic replacement | Any new client-side classifier | Nothing — Phase 24 LLM evaluator already running | BLOOM-01 is pre-satisfied; the task is verification + cleanup only |

**Key insight:** All three requirements are refinements of already-working systems, not new capabilities. The risk of over-engineering is higher than the risk of under-building.

---

## Common Pitfalls

### Pitfall 1: `scroll-smooth` Re-Queue Stutter

**What goes wrong:** The current `scrollRef` container has `scroll-smooth` class. During rapid streaming, each `scrollTop = scrollHeight` assignment enqueues a CSS scroll animation before the previous one finishes. The scroll bar visibly stutters and falls behind the latest token.

**Why it happens:** `scroll-smooth` uses CSS `scroll-behavior: smooth` which animates every programmatic scroll assignment. At 20-50 tokens/second, animations stack.

**How to avoid:** Remove `scroll-smooth` from the container (D-04). Let `scrollIntoView({ behavior: 'smooth' })` on the sentinel handle smoothness — the sentinel call replaces the previous one, it doesn't queue.

**Warning signs:** Scrollbar moving in jerky increments; visible "catch-up" motion after streaming ends.

### Pitfall 2: Sentinel Ref Is Null During Server Render

**What goes wrong:** `sentinelRef.current` is null during SSR (the component is `'use client'` but refs are always null on first render pass).

**Why it happens:** Refs don't hydrate — they're assigned after mount.

**How to avoid:** All `sentinelRef.current?.scrollIntoView(...)` calls already use optional chaining. Ensure `useEffect` with `[messages]` dependency only calls scroll after mount (React guarantees this).

### Pitfall 3: `isAtBottomRef` State Race on Conversation Switch

**What goes wrong:** User switches conversation while `isAtBottomRef.current = false`. The new conversation's `loadMessages` call completes, messages render, but scroll never fires because the guard is false.

**Why it happens:** `isAtBottomRef` is not reset during the conversation switch flow.

**How to avoid:** Reset `isAtBottomRef.current = true` inside the `useEffect` that responds to `currentConversationId` changes (the same effect that calls `loadMessages`). Then call `scrollToBottom(true)` (instant) after `loadMessages` resolves.

### Pitfall 4: Prompt Paragraph Floor vs. Ceiling Framing

**What goes wrong:** Replacing "One to three paragraphs" with "One or two paragraphs" may cause the model to anchor to two, defeating the intention of genuine brevity on short turns.

**Why it happens:** LLMs treat ranges as targets-with-floor. "1-2 paragraphs" can still produce 2 every time.

**How to avoid:** Frame the shorter response as the default, not the minimum: "Keep responses concise — one tight paragraph is often enough. Add a second only when genuinely needed. Reserve a third for rare cases requiring elaboration."

### Pitfall 5: Worktree Removal Leaves Orphaned Remote Branch

**What goes wrong:** `git worktree remove` removes the local worktree directory and linked worktree entry, but the remote tracking branch `origin/worktree-agent-ac5685ca` remains. The branch list appears clean locally but the remote is polluted.

**Why it happens:** `git worktree remove` only manages local worktrees, not remote branches.

**How to avoid:** After `git worktree remove`, also run `git push origin --delete worktree-agent-ac5685ca` if the branch was pushed. Check first with `git ls-remote --heads origin worktree-agent-ac5685ca`.

### Pitfall 6: Eval `maxOutputTokens: 600` Truncates Long Responses

**What goes wrong:** The conversationalist provider caps output at 600 tokens. A 3-paragraph response may be truncated mid-paragraph, making it appear as 2 paragraphs in the assertion.

**Why it happens:** `generateText({ maxOutputTokens: 600 })` in `neurograph-conversationalist-provider.mjs`.

**How to avoid:** The paragraph-count assertion should select a test case with a short conversational turn (like the closure example) where even a 3-paragraph response would fit in 600 tokens. Avoid assertions on cases that might naturally produce long responses.

---

## Code Examples

### Current Scroll Implementation (to replace)

```typescript
// ChatPanel.tsx lines 268-272 — CURRENT (broken during streaming)
useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [messages]);
```

```tsx
// ChatPanel.tsx line 391 — CURRENT (remove scroll-smooth)
<div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
```

### Sentinel Pattern (replacement target)

```typescript
// ChatPanel.tsx — new refs alongside existing bloomDebounceRef pattern
const sentinelRef = useRef<HTMLDivElement>(null);
const isAtBottomRef = useRef(true);
const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [showJumpButton, setShowJumpButton] = useState(false);
```

### Bloom Verification Commands

```bash
# Confirm heuristic is absent from main source (VERIFIED: returns no output)
grep -r "classifyBloomLevel\|BLOOM_ANALYZE_SIGNALS\|BloomDepthMeter" src/

# List all active worktrees
git worktree list

# Remove the Phase 21 heuristic worktree
git worktree remove .claude/worktrees/agent-ac5685ca

# Delete the associated branch
git branch -d worktree-agent-ac5685ca

# Check if it was pushed to remote
git ls-remote --heads origin worktree-agent-ac5685ca
```

### Promptfoo Eval Run Command

```bash
# Run conversationalist eval suite (including new length assertion)
npm run eval:conversationalist

# Full eval suite
npm run eval:all
```

---

## Runtime State Inventory

This section is not applicable — Phase 26 involves no rename, rebrand, refactor, or migration. The Bloom heuristic was never integrated into the production data layer (it was UI-only), so no stored data requires migration. The only "state" is the stale worktree files, which are handled by `git worktree remove`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `scrollTop = scrollHeight` on messages change | Sentinel + `scrollIntoView` with stick-to-bottom guard | Phase 26 | Eliminates stutter caused by `scroll-smooth` queuing |
| `scroll-smooth` CSS class | Remove class; `scrollIntoView` handles animation | Phase 26 | `scroll-smooth` + rapid programmatic scroll = jank |
| "One to three paragraphs" (de facto floor = 3) | "1-2 paragraphs default, 3 only when needed" | Phase 26 | Shorter, more conversational responses |
| Rigid "always close with exactly one question" | "Usually a question, occasionally an observation" | Phase 26 | Removes formulaic endings that inflate response length |
| Phase 21 heuristic (keyword classifier) | Phase 24 LLM evaluator only | Never merged to develop | BLOOM-01 already satisfied — no code change needed |

---

## Open Questions

1. **Should `showJumpButton` use React state or a ref?**
   - What we know: `useState` triggers a re-render on every scroll event, which is expensive. `useRef` + manual DOM manipulation avoids re-renders but is less React-idiomatic.
   - What's unclear: Whether the scroll container fires enough events to cause perceptible jank from `useState`.
   - Recommendation: Use `useState` with the `onScroll` throttled to ~100ms. The container scrolls at human speed, not streaming speed.

2. **How many worktree branches to clean up?**
   - What we know: `worktree-agent-ac5685ca` is confirmed to contain the Phase 21 heuristic. The other 13 worktrees (`agent-a055b821` through `agent-af297eae`) are from other phases.
   - What's unclear: Whether any other worktree branches contain partially-applied Phase 21 heuristic code.
   - Recommendation: Scope cleanup to `worktree-agent-ac5685ca` only. Others are separate phase worktrees and out of scope.

3. **Does the promptfoo eval run against the live OpenRouter provider or a mock?**
   - What we know: The provider checks `AI_PROVIDER === 'mock'` and `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`. Falls back to heuristic mode if no key is found.
   - What's unclear: Whether the CI/dev environment has keys available for the eval to run against a real model.
   - Recommendation: Document both modes. The paragraph-count assertion must pass in heuristic mode too — the heuristic response is 1 paragraph, so it passes by default.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | promptfoo eval scripts | Yes | (project standard) | — |
| `npm run eval:conversationalist` | D-11 paragraph assertion | Yes | promptfoo already installed | — |
| `git worktree remove` | D-14 worktree cleanup | Yes | Git built-in | Manual `rm -rf` + `git branch -d` |
| Browser `scrollIntoView` | D-01 sentinel scroll | Yes | All modern browsers | — |
| Browser `IntersectionObserver` | Optional alternative for stick-to-bottom | Yes | All modern browsers | Manual scroll math |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | promptfoo (conversationalist eval suite) |
| Config file | `prompt-eval/conversationalist/promptfooconfig.yaml` |
| Quick run command | `npm run eval:conversationalist` |
| Full suite command | `npm run eval:all` |

Note: CHAT-01 (scroll behavior) and BLOOM-01 (heuristic absence grep) are verified manually / via shell commands, not automated test frameworks. CHAT-02 paragraph calibration is covered by the promptfoo assertion.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | Sentinel scroll replaces `useEffect` + `scrollTop` assignment; `scroll-smooth` removed | Manual visual + code review | — (no automated scroll test) | N/A |
| CHAT-02 | Response produces 1-2 paragraphs on short conversational turns | promptfoo assertion | `npm run eval:conversationalist` | New case needed in `cases.yaml` |
| BLOOM-01 | No `classifyBloomLevel`, `BLOOM_ANALYZE_SIGNALS`, or `BloomDepthMeter` in `src/` | Shell grep | `grep -r "classifyBloomLevel\|BLOOM_ANALYZE_SIGNALS\|BloomDepthMeter" src/` (expects empty output) | Inline command |

### Sampling Rate
- **Per task commit:** `grep -r "classifyBloomLevel\|BLOOM_ANALYZE_SIGNALS\|BloomDepthMeter" src/` (BLOOM-01 verification)
- **Per wave merge:** `npm run eval:conversationalist`
- **Phase gate:** All three requirements verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New promptfoo case in `prompt-eval/conversationalist/cases.yaml` — covers CHAT-02 paragraph-count assertion (Wave 0 task: write this case before implementing the prompt change, so baseline is captured)

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/components/chat/ChatPanel.tsx` — scroll implementation, `useChat` integration, `triggerBloomEval` debounce pattern
- Direct code inspection: `src/components/chat/MessageList.tsx` — message rendering, sentinel insertion point
- Direct code inspection: `src/lib/ai/prompts.ts` — `CHAT_SYSTEM_PROMPT` lines 1-33, exact text to modify
- Direct code inspection: `prompt-eval/conversationalist/cases.yaml` + `promptfooconfig.yaml` — eval harness, assertion scaffold
- Direct code inspection: `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — `maxOutputTokens: 600` cap, heuristic fallback mode, `extractChatPrompt` regex
- Shell verification: `grep -r "classifyBloomLevel\|BLOOM_ANALYZE_SIGNALS\|BloomDepthMeter" src/` — returned no output (confirmed: heuristic absent from develop branch)
- Shell verification: `git worktree list` — confirmed `worktree-agent-ac5685ca` is the Phase 21 heuristic worktree
- Shell verification: `git diff develop...worktree-agent-ac5685ca --name-only` — confirmed heuristic is in `src/lib/bloom/classifyBloomLevel.ts`, `src/components/chat/BloomDepthMeter.tsx`, and a modified `ChatPanel.tsx`
- 26-CONTEXT.md — all locked decisions (D-01 through D-15)

### Secondary (MEDIUM confidence)
- 26-CONTEXT.md `<specifics>` section — "Research confirms: sentinel + scrollIntoView with 15-20ms debounce is the standard pattern for AI chat streaming (Vercel's own AI Elements uses this approach)"

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture: HIGH — sentinel pattern verified against existing `triggerBloomEval` debounce blueprint; scroll container structure confirmed in source
- Pitfalls: HIGH — scroll-smooth stutter confirmed by inspection of line 391; race condition on conversation switch identified from existing `skipNextLoadRef` pattern; heuristic worktree contents confirmed by `git diff`

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable stack, low churn risk)
