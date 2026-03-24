---
phase: 15-ui-ux-polish-security
verified: 2026-03-24T00:00:00Z
status: gaps_found
score: 3/5 must-haves verified
gaps:
  - truth: "The Set Learning Target UI uses the app's editorial design language — no white pill buttons or mismatched border styles"
    status: failed
    reason: "Plan 02 commits (59ede2d, ac5748b) exist only on worktree-agent-ac8a339c and have NOT been merged into develop. GraphPanel.tsx on develop still has rounded-[24px], rounded-full, and border-white/12 classes on both horizon control locations — exactly the classes BUG-05 required to be replaced."
    artifacts:
      - path: "src/components/graph/GraphPanel.tsx"
        issue: "Lines 331, 337, 353, 358, 365, 381, 387, 403, 408, 415 still use rounded-[24px]/rounded-full/border-white/12. HorizonControls sub-component does not exist on this branch."
    missing:
      - "Merge worktree-agent-ac8a339c into develop (or cherry-pick 59ede2d)"
      - "HorizonControls extracted sub-component with rounded-2xl container, rounded-xl buttons, border-white/5, font-serif labels"
  - truth: "The API key in the sidebar is masked after its initial one-time reveal — only visible at the moment of generation"
    status: failed
    reason: "Plan 02 commit ac5748b exists only on worktree-agent-ac8a339c. AppSidebar.tsx on develop has no isKeyPrefixVisible state, no keyPrefixTimerRef, and no ng_****... masked display. The has-key render at line 328 shows the raw keyPrefix unconditionally — always visible."
    artifacts:
      - path: "src/components/layout/AppSidebar.tsx"
        issue: "Line 328 renders `{keyPrefix}...` unconditionally. No masking state, no auto-expire timer, no ng_****... fallback."
    missing:
      - "Merge worktree-agent-ac8a339c into develop (or cherry-pick ac5748b)"
      - "isKeyPrefixVisible state (default false), keyPrefixTimerRef, 10s timer in handleGenerate, useEffect cleanup, conditional ng_****... display"
human_verification:
  - test: "Navigate to Review page, then click Chat in sidebar. Confirm the graph/chat shell returns to standard (equal-split) layout."
    expected: "Panel widths reset to standard proportions without requiring a page reload."
    why_human: "Shell preset CSS layout cannot be verified programmatically without a running browser."
  - test: "Load a chat history that includes a previously crystallized neuron. Confirm the message shows the 'Knowledge Consolidated' green card, not a spinner."
    expected: "Rehydrated tool calls display resolved neuron card immediately on load."
    why_human: "Requires seeded DB data and browser rendering of the chat history."
  - test: "Open the graph canvas. Confirm that no small circular Handle dots are visible on any neuron node (ghost or standard)."
    expected: "Zero visible dots on any node. Edges still render between nodes correctly."
    why_human: "React Flow Handle visibility requires visual inspection in browser."
---

# Phase 15: UI/UX Polish & Security Verification Report

**Phase Goal:** All layout, visual, interaction, and security regressions from QA are resolved — the app feels coherent and the API key is properly masked after generation.
**Verified:** 2026-03-24
**Status:** GAPS FOUND
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Switching from Review mode back to Chat mode preserves the correct shell panel width — no reset to default layout | VERIFIED | `review/page.tsx` line 37–39: `useEffect(() => { setShellPreset('deep_read'); return () => setShellPreset('standard'); }, [setShellPreset])` — cleanup return present in first useEffect only; data-fetch effect is untouched |
| 2 | Previously synthesized neurons appear as resolved neuron cards in chat history, not as stuck Synthesizing spinners | VERIFIED | `MessageList.tsx` lines 127–130: `toolPart.state === 'output-available' \|\| toolPart.state === 'input-available'` both map to `'result'`; `NeurogenesisSuggestion.tsx` line 93: `const isStreaming = state === 'partial-call'`; line 95: `if (!isInputComplete \|\| isStreaming)` guards the spinner path |
| 3 | Neuron nodes on the graph canvas have no visible Handle dots — topology reads as clean and read-only | VERIFIED | `NeuronNode.tsx` lines 163, 182 (ghost path) and lines 253, 274 (standard path): all 4 `<Handle>` elements use `style={{ display: 'none' }}` |
| 4 | The Set Learning Target UI uses the app's editorial design language — no white pill buttons or mismatched border styles | FAILED | `GraphPanel.tsx` on `develop` branch retains `rounded-[24px]` (lines 331, 381), `rounded-full` (lines 337, 353, 358, 365, 387, 403, 408, 415), and `border-white/12` (lines 337, 358, 387, 408). Plan 02 commits exist only on `worktree-agent-ac8a339c` — not merged to `develop`. |
| 5 | The API key in the sidebar is masked after its initial one-time reveal — only visible at the moment of generation | FAILED | `AppSidebar.tsx` on `develop` branch: line 328 renders `{keyPrefix}...` unconditionally with no masking logic. `isKeyPrefixVisible`, `keyPrefixTimerRef`, and `ng_****...` are entirely absent. Plan 02 commit `ac5748b` not merged to `develop`. |

**Score:** 3/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(app)/app/review/page.tsx` | useEffect cleanup calling `setShellPreset('standard')` on unmount | VERIFIED | Line 38: `return () => setShellPreset('standard')` — present in the layout effect only |
| `src/components/graph/NeuronNode.tsx` | All 4 Handle elements hidden via `style={{ display: 'none' }}` | VERIFIED | Lines 163, 182, 253, 274 all use `style={{ display: 'none' }}` — zero use of the old `!opacity-0 !w-0 !h-0` classes |
| `src/components/chat/MessageList.tsx` | toolState derivation mapping `input-available` to `result` | VERIFIED | Lines 127–130: `(toolPart.state === 'output-available' \|\| toolPart.state === 'input-available') ? 'result' : 'call'` |
| `src/components/chat/NeurogenesisSuggestion.tsx` | `isStreaming` guard for `partial-call` state | VERIFIED | Line 93: `const isStreaming = state === 'partial-call'`; line 95: incorporated into spinner guard |
| `src/components/graph/GraphPanel.tsx` | HorizonControls restyled with `rounded-xl`, `border-white/5-8`, `font-serif` — both copies | STUB | On `develop`: still uses pre-fix pill aesthetic. Correct implementation exists on `worktree-agent-ac8a339c` (commit `59ede2d`) but not merged. |
| `src/components/layout/AppSidebar.tsx` | API key masking with `isKeyPrefixVisible` state and 10s auto-hide timer | STUB | On `develop`: no masking logic at all. Correct implementation exists on `worktree-agent-ac8a339c` (commit `ac5748b`) but not merged. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `review/page.tsx` | `graphStore.ts` | `setShellPreset('standard')` cleanup call | WIRED | `return () => setShellPreset('standard')` present on line 38; `useGraphStore` imported and used |
| `MessageList.tsx` | `NeurogenesisSuggestion.tsx` | `toolState` prop passed with `input-available` mapped to `'result'` | WIRED | `toolState={toolState}` passed at line 148; derivation maps both rehydrated states to `result`; `NeurogenesisSuggestion` initializes `isSuccess` from `toolState === 'result'` (line 39) |
| `GraphPanel.tsx` | editorial design tokens | `rounded-xl`, `border-white/5`, `font-serif` | NOT WIRED (on develop) | Plan 02 design token changes not present on current branch |
| `AppSidebar.tsx` | `setTimeout` | 10-second auto-mask timer with `useRef` cleanup | NOT WIRED (on develop) | Timer infrastructure absent from current branch |

---

## Data-Flow Trace (Level 4)

Truths 1–3 are layout/state fixes with no dynamic data rendering path requiring Level 4 trace.
Truths 4–5 failed at Level 2 (STUB on develop branch) — Level 4 not applicable until fixed.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Plan 01 commits in git history | `git log --oneline \| grep "74cc7b9\|0b12dca"` | Both found on `develop` | PASS |
| Plan 02 commits in git history | `git log --oneline \| grep "59ede2d\|ac5748b"` | NOT found on `develop`; found only on `worktree-agent-ac8a339c` | FAIL |
| GraphPanel still has pill classes | `grep "rounded-full" GraphPanel.tsx` | 9 matches on horizon control elements | FAIL |
| AppSidebar has masking code | `grep "isKeyPrefixVisible\|ng_\*\*\*\*" AppSidebar.tsx` | Zero matches | FAIL |
| NeuronNode handle visibility | `grep "display.*none" NeuronNode.tsx` | 4 matches (lines 163, 182, 253, 274) | PASS |
| review/page.tsx cleanup present | `grep "setShellPreset.*standard" review/page.tsx` | Line 38 — present in useEffect cleanup | PASS |
| MessageList input-available mapping | `grep "input-available" MessageList.tsx` | Line 128 — present in toolState derivation | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BUG-04 | 15-01-PLAN.md | Review panel width resets to standard layout when switching back to Chat mode | SATISFIED | `review/page.tsx` useEffect cleanup at line 38 resets to `standard` on unmount |
| BUG-05 | 15-02-PLAN.md | "Set Learning Target" UI matches app's editorial design language | BLOCKED | `GraphPanel.tsx` on `develop` retains pill aesthetic; Plan 02 commits not merged |
| BUG-06 | 15-01-PLAN.md | Previously synthesized neurons show as resolved neuron cards in chat history | SATISFIED | `MessageList.tsx` + `NeurogenesisSuggestion.tsx` both updated; `input-available` maps to `result` |
| BUG-07 | 15-01-PLAN.md | No visible Handle dots on neuron nodes | SATISFIED | All 4 Handle elements use `style={{ display: 'none' }}` in `NeuronNode.tsx` |
| BUG-08 | 15-02-PLAN.md | API key is masked in sidebar after initial one-time reveal | BLOCKED | `AppSidebar.tsx` on `develop` has no masking logic; Plan 02 commits not merged |

**Coverage:** 3/5 requirements satisfied. BUG-05 and BUG-08 are blocked by unmerged Plan 02 work.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/graph/GraphPanel.tsx` | 331, 381 | `rounded-[24px]` — pre-fix pill container still present | Blocker | BUG-05 goal not achieved; horizon controls visually inconsistent |
| `src/components/graph/GraphPanel.tsx` | 337, 353, 358, 365, 387, 403, 408, 415 | `rounded-full` — pre-fix pill buttons/inputs still present | Blocker | BUG-05 goal not achieved |
| `src/components/graph/GraphPanel.tsx` | 337, 358, 387, 408 | `border-white/12` — pre-fix border value still present | Blocker | BUG-05 goal not achieved |
| `src/components/layout/AppSidebar.tsx` | 328 | `{keyPrefix}...` rendered unconditionally — no masking | Blocker | BUG-08 goal not achieved; security regression persists |

---

## Human Verification Required

### 1. Review Layout Reset (BUG-04)

**Test:** Navigate to `/app/review`, then click "Chat" in the sidebar navigation.
**Expected:** The shell resets to the standard equal-split layout. The chat panel and graph panel return to their default proportions without a page reload.
**Why human:** CSS `setShellPreset` side effects and panel dimension transitions require browser rendering to observe.

### 2. Rehydrated Neurogenesis Spinner (BUG-06)

**Test:** Open a conversation that has a previously committed neuron in its history. Scroll to the neurogenesis card in chat history.
**Expected:** The card shows the "Knowledge Consolidated" green variant, not a spinning "Synthesizing new neuron..." indicator.
**Why human:** Requires a seeded database with a completed neurogenesis tool call and browser rendering of the rehydrated `input-available` state.

### 3. Graph Handle Dot Visibility (BUG-07)

**Test:** Open the graph canvas with several neurons and zoom in on any node (ghost or standard).
**Expected:** Zero visible circular dots on node edges. Edge lines still connect nodes correctly.
**Why human:** React Flow Handle rendering with `display: none` in a live browser may behave differently than in tests; visual confirmation required.

---

## Gaps Summary

Two of the five bugs (BUG-05 and BUG-08) are fully implemented but on the wrong branch. Plan 02 was executed in a worktree (`worktree-agent-ac8a339c`) and produced commits `59ede2d` (horizon controls redesign) and `ac5748b` (API key masking). These commits were never merged into `develop`.

**Root cause:** The worktree executor completed its work and updated SUMMARY.md to indicate completion, but the merge step back to the main working branch did not occur. The SUMMARY even documents a self-check confirming the commits were present "in the worktree-agent-ac8a339c branch" — which is accurate, but the integration into `develop` was the missing step.

**Impact:**
- `GraphPanel.tsx` on `develop` still shows the HUD pill aesthetic rejected by BUG-05.
- `AppSidebar.tsx` on `develop` still shows the raw API key prefix unconditionally, which is the exact security issue BUG-08 was meant to fix.

**Resolution path:** Merge or cherry-pick `59ede2d` and `ac5748b` from `worktree-agent-ac8a339c` into `develop`. Both commits are self-contained and conflict-free based on the files they touch. No additional code changes are needed — the implementation is correct and complete on that branch.

---

_Verified: 2026-03-24_
_Verifier: Claude (gsd-verifier)_
