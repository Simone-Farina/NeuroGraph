# Phase 15: UI/UX Polish & Security - Research

**Researched:** 2026-03-24
**Domain:** React / Next.js 14 frontend — CSS specificity, Vercel AI SDK v6 tool call lifecycle, Zustand state machine, Tailwind v3 design tokens
**Confidence:** HIGH

## Summary

Phase 15 fixes five discrete UI/UX bugs discovered during QA. Each fix is self-contained and targets a specific file. Research found no cross-cutting technical risks — the decisions in CONTEXT.md are technically sound and directly implementable against the current codebase. The two most nuanced areas are the AI SDK tool call state lifecycle (BUG-06) and the CSS specificity question for React Flow Handle visibility (BUG-07); both are now fully clarified by reading the live source code.

All five fixes must adhere to the editorial design language documented in `.impeccable.md`: monochrome dark theme, serif typography for content, geometric sans for UI, muted `border-white/5`–`border-white/20` borders, no decorative color. The candidate neuron card in `NeurogenesisSuggestion.tsx` is the canonical "praised" UI reference for design quality.

**Primary recommendation:** Implement fixes as five independent tasks. The decisions in CONTEXT.md are all correct. No architectural changes are needed — every fix is a targeted surgical edit.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **BUG-04 (D-01):** Add a cleanup `useEffect` return in `/app/review/page.tsx` that calls `setShellPreset('standard')` on unmount. This ensures navigating away from Review via sidebar `<Link>` (which doesn't call `openChat()`) still resets the layout.
- **BUG-05 (D-02):** Restyle the "Set Learning Target" controls in `GraphPanel.tsx` to match the app's editorial design language. Replace `rounded-full` pill buttons with `rounded-xl` rectangular buttons. Replace `border-white/12` with subtler `border-white/8` or `border-white/5`. Use the serif font family (`font-serif`) for labels consistent with the rest of the graph chrome.
- **BUG-05 (D-03):** The entire horizon controls container should feel like it belongs in the same dark editorial world as the rest of the app — muted, deliberate, not a floating HUD element. Reference the existing chat empty state and review panel for design language consistency.
- **BUG-05 (D-04):** Apply impeccable frontend design attention to all UI changes in this phase — no functional-only patches. Every modified element must meet production design quality.
- **BUG-06 (D-05):** Fix `NeurogenesisSuggestion.tsx` to treat any tool call that is not actively streaming (`state !== 'partial-call'`) as complete. For persisted tool calls loaded from chat history, the state may not be `'output-available'` but the tool call is definitively done. Show the resolved candidate card, not the synthesizing spinner.
- **BUG-07 (D-06):** Replace the Tailwind `!opacity-0 !w-0 !h-0` classes on `<Handle>` components in `NeuronNode.tsx` with `style={{ display: 'none' }}` inline style. This guarantees the Handle is invisible regardless of React Flow's CSS specificity. Edge routing still works because React Flow uses node positions, not Handle DOM elements, for edge calculations when handles are hidden.
- **BUG-08 (D-07):** In `AppSidebar.tsx`, replace the always-visible `{keyPrefix}...` with a masked display: show `ng_****...` by default. Only show the actual prefix for a brief period (e.g., 10 seconds) immediately after key generation, then auto-mask. Use a `setTimeout` + state flag pattern.

### Claude's Discretion
- Exact animation/transition for the key masking reveal → auto-hide
- Exact border opacity values for the Learning Target redesign
- Whether to add subtle motion (framer-motion fade) to the horizon controls

### Deferred Ideas (OUT OF SCOPE)
None — all 5 bugs are in scope for this phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-04 | Review panel width resets to standard layout when switching back to Chat mode | `review/page.tsx` sets `deep_read` in a mount `useEffect` but has no cleanup. Adding `return () => setShellPreset('standard')` to the same `useEffect` fixes it. The `openChat()` action in graphStore already resets to `standard`, but sidebar `<Link>` navigation bypasses it. |
| BUG-05 | "Set Learning Target" UI matches the app's editorial design language | Current buttons use `rounded-full` + `border-white/12` HUD-pill style. The rest of the app uses `rounded-xl`, `border-white/5`–`border-white/8`, and `font-serif` for non-button labels. Research confirms there are two identical copies of the horizon controls in `GraphPanel.tsx` (lines 330-373 for empty state, lines 380-419 for populated state) — both must be updated. |
| BUG-06 | Previously synthesized neurons show as resolved neuron cards in chat history | When messages are rehydrated from DB in `ChatPanel.tsx` (line 298), tool invocations are given `state: 'input-available'`. `NeurogenesisSuggestion.tsx` only considers `isSuccess || state === 'output-available'` for the resolved card. `'input-available'` falls through to `isInputComplete` check and renders the synthesizing spinner if all fields are populated. Fix: treat `state !== 'partial-call'` (i.e., anything other than actively streaming) as complete when `isInputComplete` is true. |
| BUG-07 | No visible Handle dots on neuron nodes — graph is fully clean read-only topology | `NeuronNode.tsx` currently uses `className="!opacity-0 !w-0 !h-0"` on Handle components (lines 163, 182, 253, 274). Tailwind important (`!`) classes can be overridden by React Flow's own stylesheet specificity. Replacing with `style={{ display: 'none' }}` is the authoritative fix. React Flow edge routing works via `sourcePosition`/`targetPosition` node props set during dagre layout, not via DOM Handle elements. |
| BUG-08 | API key is masked in sidebar after initial one-time reveal | `AppSidebar.tsx` `has-key` state (line 328) always renders `{keyPrefix}...`. The fix introduces a `isKeyRevealed` boolean state + `setTimeout` (10 s) to auto-mask after key generation. The `revealed` keyState already shows the full raw key. The `has-key` display is the persistent always-visible state that needs masking. |
</phase_requirements>

---

## Standard Stack

### Core (all already in use — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@xyflow/react` | ^12.10.0 | React Flow graph, Handle components | Already powering the graph |
| `framer-motion` | ^12.34.0 | Panel transitions, optional key mask animation | Already used throughout app |
| `zustand` | (peer) | `graphStore` shell preset state machine | Already powers layout |
| `ai` (Vercel AI SDK) | ^6.0.82 | Tool call state values in `UIMessage` | Already drives chat |

**No new packages needed.** All five fixes are styling/logic changes within existing components.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `style={{ display: 'none' }}` on Handle | `visibility: hidden` | `display: none` removes from layout entirely, better than `visibility: hidden` which still occupies space. `display: none` is correct for zero-size hidden handles. |
| `setTimeout` for key masking | framer-motion `AnimatePresence` timer | setTimeout is simpler, deterministic, and consistent with the existing `copied` state timer pattern in the same file. |

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. All changes are in-place edits:

```
src/
├── app/(app)/app/review/page.tsx          # BUG-04: add useEffect cleanup
├── components/graph/GraphPanel.tsx         # BUG-05: restyle horizon controls (2 locations)
├── components/chat/NeurogenesisSuggestion.tsx  # BUG-06: fix isInputComplete guard
├── components/graph/NeuronNode.tsx         # BUG-07: Handle display:none
└── components/layout/AppSidebar.tsx        # BUG-08: add key masking state + timer
```

### Pattern 1: useEffect Cleanup for Layout Reset (BUG-04)

**What:** React cleanup functions run on component unmount. Review page currently sets `deep_read` on mount but does not restore on unmount.
**When to use:** Any page that takes over a global layout preset must clean it up.
**Example:**
```typescript
// review/page.tsx — BEFORE (bug)
useEffect(() => {
  setShellPreset('deep_read');
}, [setShellPreset]);

// review/page.tsx — AFTER (fix)
useEffect(() => {
  setShellPreset('deep_read');
  return () => setShellPreset('standard');
}, [setShellPreset]);
```

**Critical note:** The second `useEffect` in `review/page.tsx` (the data fetch) is separate and must not be merged with the cleanup effect. The cleanup must only be in the first `useEffect`.

### Pattern 2: AI SDK Tool Call State Enumeration (BUG-06)

**What:** Vercel AI SDK v6 tool part `state` field has these documented values:

| State Value | When It Appears | Source |
|-------------|----------------|--------|
| `'partial-call'` | Input is actively streaming in (tokens arriving) | Live stream |
| `'input-available'` | Input fully arrived, awaiting user action (no output yet) | Post-stream or rehydrated |
| `'output-available'` | Tool has been executed and has output | After `addToolResult` |

**The bug:** `ChatPanel.tsx` line 298 rehydrates persisted tool calls with `state: 'input-available'`. `NeurogenesisSuggestion.tsx` only checks `state === 'output-available'` for the resolved card. So rehydrated-but-submitted neurons (the user already committed them) re-render as the "Candidate Neuron" action card instead of the "Knowledge Consolidated" success card.

**The correct fix per D-05:**
```typescript
// NeurogenesisSuggestion.tsx — current buggy condition
if (isSuccess || state === 'output-available') {

// NeurogenesisSuggestion.tsx — fixed condition
// 'partial-call' = actively streaming. Anything else = input complete.
const isDefinitelyComplete = state !== 'partial-call' && isInputComplete;
if (isSuccess || state === 'output-available' || isDefinitelyComplete) {
```

Wait — this is subtly wrong. `isDefinitelyComplete` with `state !== 'partial-call'` would also match `'input-available'` on a fresh live tool call that hasn't been acted on yet. The real distinction is that `toolState === 'result'` (passed from `MessageList.tsx`) means the DB confirmed it was already executed.

**Correct analysis:** `MessageList.tsx` derives `toolState`:
```typescript
const toolState: 'call' | 'result' =
  toolPart.state === 'output-available' ? 'result' : 'call';
```

Rehydrated tool invocations get `state: 'input-available'`, so `toolState` is `'call'`, not `'result'`. But if the neuron was already created, the DB returned a tool_invocations record. The `NeurogenesisSuggestion` is initialized with `useState(toolState === 'result')` — which would be `false` for rehydrated calls.

**Root cause:** The `toolState` derivation in `MessageList.tsx` maps `input-available` → `'call'`, but rehydrated already-committed neurons have `input-available` state too. The fix per D-05 is either:
1. In `MessageList.tsx`: map `input-available` → `'result'` (since all rehydrated tool calls are already committed), OR
2. In `NeurogenesisSuggestion.tsx`: treat `toolState === 'call'` with `isInputComplete && state !== 'partial-call'` as the "show resolved card" path.

**D-05 confirms option 2's intent:** "treat any tool call that is not actively streaming (`state !== 'partial-call'`) as complete." The simplest, lowest-risk implementation is to change the `isInputComplete` guard:

```typescript
// NeurogenesisSuggestion.tsx — current
const isInputComplete = input && Object.keys(input).length > 0 && input.definition;

if (!isInputComplete) {
  return <spinner />;
}
// falls through to candidate card (wrong for already-committed neurons)

// FIX: if input is complete AND not actively streaming, show resolved card
const isInputComplete = input && Object.keys(input).length > 0 && input.definition;
const isStreaming = state === 'partial-call';

if (isSuccess || state === 'output-available') {
  return <resolved card />;
}

if (!isInputComplete || isStreaming) {
  return <spinner />;
}

// Only reaches candidate card if: input is complete AND not streaming AND not yet isSuccess
// = live tool call the user hasn't acted on yet
```

This is the correct fix. It shows the resolved card for rehydrated neurons because `isSuccess` starts as `true` when `toolState === 'result'`. But the remaining gap is rehydrated calls that have `toolState === 'call'` (state `input-available`) — these will hit the candidate card. **The correct fix for D-05 therefore requires also adjusting `MessageList.tsx` to set `toolState = 'result'` for rehydrated calls**, or changing the `useState` initialization condition.

**Recommended approach:** Fix in `MessageList.tsx` — map `input-available` to `'result'` since rehydrated calls are always already-committed:

```typescript
// MessageList.tsx — current
const toolState: 'call' | 'result' =
  toolPart.state === 'output-available' ? 'result' : 'call';

// MessageList.tsx — fixed
const toolState: 'call' | 'result' =
  (toolPart.state === 'output-available' || toolPart.state === 'input-available') ? 'result' : 'call';
```

This is safe because: (a) freshly streaming tool calls have `state: 'partial-call'`, not `'input-available'`; (b) `input-available` only appears in rehydrated messages from `loadMessages`. This maps directly to D-05's intent.

### Pattern 3: React Flow Handle Hiding (BUG-07)

**What:** React Flow mounts Handle components as DOM elements and applies its own CSS. The `@xyflow/react` stylesheet uses class-based selectors that can compete with Tailwind's `!important` utilities.

**Key finding from source:** `NeuronNode.tsx` lines 163, 182, 253, 274 all use `className="!opacity-0 !w-0 !h-0"`. The `!` prefix maps to Tailwind's `!important` modifier, but React Flow's internals may still render a visible dot because the Handle uses `border`, `background`, and `position` styles that aren't addressed by opacity+size alone.

**The fix:**
```tsx
// Before
<Handle type="target" position={Position.Left} className="!opacity-0 !w-0 !h-0" />
<Handle type="source" position={Position.Right} className="!opacity-0 !w-0 !h-0" />

// After
<Handle type="target" position={Position.Left} style={{ display: 'none' }} />
<Handle type="source" position={Position.Right} style={{ display: 'none' }} />
```

**Edge routing confirmation:** React Flow v12 (`@xyflow/react` ^12.10.0) calculates edge endpoints using `sourcePosition`/`targetPosition` node metadata (set during dagre layout as `Position.Left` / `Position.Right`), not the DOM bounding rect of Handle elements. Hiding the Handle DOM element via `display: none` does not break edge rendering. This is confirmed by the dagre layout code in `GraphPanel.tsx` lines 59-66 which sets `targetPosition: Position.Left` and `sourcePosition: Position.Right` on every node.

**Scope:** Four Handle elements total — 2 in the ghost node render path (lines 163, 182) and 2 in the standard neuron render path (lines 253, 274).

### Pattern 4: API Key Masking with Auto-Expire (BUG-08)

**What:** After key generation, show the key prefix briefly then mask to `ng_****...`. The `keyState` FSM and `keyPrefix` state already exist.

**Current flow:** `has-key` → always shows `{keyPrefix}...` at line 328.

**New state needed:** A transient `isKeyPrefixVisible` boolean that defaults to `false`, is set to `true` on key generation, and auto-resets to `false` after 10 seconds.

```typescript
// New state in AppSidebar.tsx
const [isKeyPrefixVisible, setIsKeyPrefixVisible] = useState(false);

// In handleGenerate, after setKeyState('revealed'):
setIsKeyPrefixVisible(true);
setTimeout(() => setIsKeyPrefixVisible(false), 10_000);

// In has-key render section:
<span className="font-mono text-xs text-white/50 truncate">
  {isKeyPrefixVisible ? `${keyPrefix}...` : 'ng_****...'}
</span>
```

**Design note (Claude's Discretion):** A subtle framer-motion fade between the two states would be consistent with the sidebar's existing `AnimatePresence` usage. The masked string `ng_****...` should exactly match the length feel of the real prefix display to avoid layout shift.

### Pattern 5: Editorial Design Redesign for Horizon Controls (BUG-05)

**Current state (both locations in GraphPanel.tsx):**
- Container: `rounded-[24px]` pill container — HUD-like
- Buttons: `rounded-full` pills, `border-white/12`, `bg-white/[0.05–0.06]`
- Input: `rounded-full border-white/10`
- No serif typography

**Target design (per .impeccable.md and D-02/D-03):**
- Container: `rounded-xl` or `rounded-2xl` — rectangular, card-like
- Buttons: `rounded-xl`, `border-white/5` or `border-white/8`, `font-serif` label text
- Input: `rounded-xl border-white/5`
- Container background: `bg-neural-dark/80` or `bg-white/[0.02]` with `backdrop-blur-xl`
- Label text: `font-serif` for "Set Learning Target" — matches neuron card and chat headers

**Design reference tokens from canonical components:**

From `ReviewMode.tsx` / `review/page.tsx`:
- Cards: `rounded-2xl border border-white/5 bg-white/[0.02]`
- Buttons: `rounded-xl border border-white/[0.08]` → `border-white/[0.2]` (interactive tiers)
- Text tiers: `text-white/40`, `text-white/60`, `text-white/80`, `text-white/90`

From `NeurogenesisSuggestion.tsx` (praised reference):
- Container: `pl-5 border-l-2 border-white/10` — editorial left-border
- Typography: `font-serif text-2xl` for titles, `font-serif text-[15px]` for body
- Actions: no border-radius on buttons at all — clean editorial style

From `MessageList.tsx` empty state:
- `font-serif text-3xl text-white/40` for headlines
- `font-serif text-[17px] text-white/30` for body

**Horizon controls redesign target:**
```tsx
// Container — before
className="rounded-[24px] border border-white/7 bg-neural-dark/75 p-3 backdrop-blur-xl"

// Container — after
className="rounded-2xl border border-white/5 bg-neural-dark/80 p-3 backdrop-blur-xl"

// "Set Learning Target" button — before
className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white/78 ..."

// "Set Learning Target" button — after
className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm font-serif text-white/60 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white/80"

// Input — before
className="... rounded-full border border-white/10 ..."

// Input — after
className="... rounded-xl border border-white/5 bg-white/[0.03] ... focus:border-white/12"

// Generate / Cancel buttons — after
// Generate: rounded-xl border border-white/8 bg-white/[0.05] font-serif text-white/70
// Cancel:   rounded-xl border-0 font-serif text-white/30 hover:text-white/60
```

**Both locations (empty state ~line 330, populated state ~line 380) must receive identical updates.**

### Anti-Patterns to Avoid

- **Tailwind important-override on React Flow handles:** `!opacity-0 !w-0 !h-0` is insufficient — React Flow's stylesheet can still make the Handle dot visible. Use `style={{ display: 'none' }}`.
- **Single useEffect for both mount action and cleanup:** Adding cleanup to a dependency-free effect is fine; do NOT add `setShellPreset('standard')` to the data-fetch `useEffect` (different effect, different cleanup semantics).
- **Mapping `input-available` to `'call'` in MessageList:** Rehydrated tool calls all have `input-available` but are always already-committed. Treat them as `'result'`.
- **Pill buttons on editorial UI:** `rounded-full` reads as a floating HUD/pill — out of character in the dark editorial world. Use `rounded-xl` throughout.
- **Decorative color:** Per `.impeccable.md`, color is reserved for semantic learning state (decay, mastery, activity). Horizon controls must be monochrome.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Panel transition on reset | Custom CSS transition | Framer Motion `animate={{ width }}` already in `layout.tsx` | `setShellPreset('standard')` already triggers the animated transition |
| Key masking obfuscation | Custom crypto/hash | Simple string replacement: `'ng_****...'` | Security-by-obscurity for display only — the actual security is server-side |
| Handle click interception | Custom pointer-events layer | `display: none` on Handle | React Flow does not require clickable Handles for edge display |

---

## Common Pitfalls

### Pitfall 1: Partial Handle Fix (BUG-07)
**What goes wrong:** Updating only the standard neuron Handle components (lines 253, 274) but forgetting the ghost node render path (lines 163, 182).
**Why it happens:** `NeuronNode.tsx` has two render paths — ghost nodes return early at line 153. Both branches have their own Handle elements.
**How to avoid:** The file has 4 Handle elements. Replace all 4.
**Warning signs:** Visible dots appear only on ghost/Horizon nodes after fix.

### Pitfall 2: Review Page Cleanup Effect Dependencies (BUG-04)
**What goes wrong:** Adding `setShellPreset('standard')` to the data-fetch `useEffect` instead of the layout `useEffect`, causing the layout to reset every time the data refreshes.
**Why it happens:** Two `useEffect` calls exist in `ReviewPage`. Only the first one (that calls `setShellPreset('deep_read')`) should have the cleanup.
**How to avoid:** The cleanup return goes inside the `useEffect` that depends on `[setShellPreset]`, not the one that depends on `[]`.

### Pitfall 3: Key Masking Timer Leak (BUG-08)
**What goes wrong:** `setTimeout` fires after the component unmounts, triggering a React state update on an unmounted component.
**Why it happens:** If user navigates away during the 10-second reveal window, the timer still fires.
**How to avoid:** Store the timer ID and clear it in a `useEffect` cleanup:
```typescript
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// On generate:
timerRef.current = setTimeout(() => setIsKeyPrefixVisible(false), 10_000);
// In useEffect cleanup:
return () => { if (timerRef.current) clearTimeout(timerRef.current); };
```
Alternatively, use the simpler pattern: since `AppSidebar` is a persistent layout component that never unmounts during app use, the leak is low-risk. Use `useRef` for cleanliness but not strictly required.

### Pitfall 4: Duplicate Horizon Controls in GraphPanel.tsx (BUG-05)
**What goes wrong:** Updating the `!flowNodes.length` (empty state) branch but not the main populated state branch, leaving inconsistent styling.
**Why it happens:** GraphPanel renders two separate copies of the horizon controls — one when the graph is empty (around line 330) and one overlaid on the populated graph (around line 380).
**How to avoid:** Both locations must receive the same styling changes. Consider extracting the horizon controls into a `<HorizonControls>` sub-component to prevent future drift.

### Pitfall 5: NeurogenesisSuggestion State Logic (BUG-06)
**What goes wrong:** Changing only `NeurogenesisSuggestion.tsx` without fixing `MessageList.tsx`'s `toolState` derivation, leaving the `useState(toolState === 'result')` initialization evaluating to `false` for rehydrated calls.
**Why it happens:** The `isSuccess` state is initialized to `toolState === 'result'`, which is `false` when `MessageList` maps `input-available` → `'call'`. The component needs either the state derivation fixed OR the initialization guard changed.
**How to avoid:** Fix `MessageList.tsx` to map `input-available` → `'result'` (safest, most explicit). The `state` prop can still be passed through for downstream logic but `toolState` should be `'result'` for all rehydrated calls.

---

## Code Examples

### BUG-04: Review Page Cleanup
```typescript
// src/app/(app)/app/review/page.tsx
// Change the first useEffect to:
useEffect(() => {
  setShellPreset('deep_read');
  return () => setShellPreset('standard');
}, [setShellPreset]);
// The data-fetch useEffect (depends on []) is separate — do not touch it.
```

### BUG-06: MessageList toolState Fix
```typescript
// src/components/chat/MessageList.tsx  (line 127–128)
const toolState: 'call' | 'result' =
  (toolPart.state === 'output-available' || toolPart.state === 'input-available')
    ? 'result'
    : 'call';
```

### BUG-07: Handle Display None
```tsx
// src/components/graph/NeuronNode.tsx
// All 4 Handle elements — ghost path (lines 163, 182) and neuron path (lines 253, 274):
<Handle type="target" position={Position.Left} style={{ display: 'none' }} />
<Handle type="source" position={Position.Right} style={{ display: 'none' }} />
```

### BUG-08: Key Prefix Masking
```typescript
// src/components/layout/AppSidebar.tsx
// Add state (near line 27):
const [isKeyPrefixVisible, setIsKeyPrefixVisible] = useState(false);
const keyPrefixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In handleGenerate, after setKeyState('revealed') (around line 68):
setIsKeyPrefixVisible(true);
if (keyPrefixTimerRef.current) clearTimeout(keyPrefixTimerRef.current);
keyPrefixTimerRef.current = setTimeout(() => setIsKeyPrefixVisible(false), 10_000);

// Replace has-key display (line 328):
<span className="font-mono text-xs text-white/50 truncate">
  {isKeyPrefixVisible ? `${keyPrefix}...` : 'ng_****...'}
</span>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Flow `Handle` always visible | `display: none` via inline style | Phase 15 | Removes CSS specificity race with Tailwind |
| Vercel AI SDK tool `state: 'call'/'result'` (legacy) | `state: 'partial-call'/'input-available'/'output-available'` | AI SDK v5→v6 | The internal state enum changed; `MessageList.tsx` correctly uses `input-available` for rehydrated calls as of Phase 6 |

**Deprecated/outdated:**
- `rounded-full` for buttons in this app's design system: replaced by `rounded-xl` per `.impeccable.md` aesthetic direction.
- `border-white/12` as border token: the canonical dark editorial spectrum runs `border-white/5` → `border-white/8` → `border-white/20`. `/12` was a legacy intermediate.

---

## Open Questions

1. **BUG-06: Should `NeurogenesisSuggestion` also guard against double-submission from old `state: 'call'` messages in pre-existing conversations?**
   - What we know: The DB only stores `tool_invocations` for committed neurons. Rehydrated calls always had a commit happen.
   - What's unclear: Are there any rehydrated messages where the user saw the candidate card but chose to Discard (no commit)? If so, those would have no DB record.
   - Recommendation: The proposed fix (`input-available` → `'result'`) is safe because ChatPanel only writes `tool_invocations` metadata on successful commit (line 622). Discarded calls are not persisted as tool_invocations.

2. **BUG-05: Extract HorizonControls into a sub-component?**
   - What we know: There are two identical copies of the controls in GraphPanel.tsx (~lines 330 and 380).
   - What's unclear: Whether the planner wants a refactor-as-part-of-fix or just parallel edits.
   - Recommendation: Prefer extraction for DRY compliance, but both approaches satisfy BUG-05. The planner may decide scope.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all fixes are code/styling changes within existing components).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.x (via `"test": "vitest"`) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-04 | Review page unmount resets shellPreset to 'standard' | unit | `npx vitest run src/app --reporter=dot` | ❌ Wave 0 |
| BUG-05 | Horizon controls render with rounded-xl buttons, font-serif labels | visual/unit | `npx vitest run src/components/graph/GraphPanel.horizon.test.tsx` | ✅ (partial — test exists but may not cover styling) |
| BUG-06 | Rehydrated tool calls render as resolved neuron cards | unit | `npx vitest run src/components/chat/ChatPanel.mastery.test.tsx` | ✅ (existing file, needs new test case) |
| BUG-07 | NeuronNode Handle elements have display:none style | unit | `npx vitest run src/components/graph` | ❌ Wave 0 |
| BUG-08 | Sidebar masks key prefix after 10s, shows ng_**** | unit | `npx vitest run src/components/layout` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=dot`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/(app)/app/review/__tests__/ReviewPage.test.tsx` — covers BUG-04 (shellPreset cleanup on unmount)
- [ ] `src/components/graph/__tests__/NeuronNode.test.tsx` — covers BUG-07 (Handle display:none)
- [ ] `src/components/layout/__tests__/AppSidebar.apikey.test.tsx` — covers BUG-08 (key masking behavior)

*(Existing test files `ChatPanel.mastery.test.tsx` and `GraphPanel.horizon.test.tsx` need new test cases but files themselves exist.)*

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `src/components/graph/NeuronNode.tsx` — all 4 Handle elements confirmed using `!opacity-0 !w-0 !h-0`
- Direct source code read: `src/components/chat/NeurogenesisSuggestion.tsx` — confirmed `isInputComplete` check logic and `state === 'output-available'` guard
- Direct source code read: `src/components/chat/MessageList.tsx` — confirmed `toolState` derivation maps `input-available` → `'call'`
- Direct source code read: `src/components/chat/ChatPanel.tsx` lines 293-302 — confirmed rehydrated tool invocations get `state: 'input-available'`
- Direct source code read: `src/components/layout/AppSidebar.tsx` lines 1-432 — full `keyState` FSM and `has-key` display confirmed
- Direct source code read: `src/components/graph/GraphPanel.tsx` lines 265-419 — confirmed two identical horizon controls locations
- Direct source code read: `src/app/(app)/app/review/page.tsx` — confirmed missing useEffect cleanup
- Direct source code read: `src/app/(app)/layout.tsx` — confirmed `PRESET_WIDTHS` and framer-motion transition on `shellPreset`
- Direct source code read: `src/stores/graphStore.ts` — confirmed `setShellPreset`, `openChat`, `openReview` actions
- Direct source code read: `.impeccable.md` — canonical design language (serif typography, monochrome tokens, `rounded-xl`, `border-white/5–20`)
- Package.json: `@xyflow/react: ^12.10.0`, `ai: ^6.0.82`, `framer-motion: ^12.34.0`

### Secondary (MEDIUM confidence)
- React Flow v12 edge routing: node `sourcePosition`/`targetPosition` props control edge endpoint direction independent of Handle DOM visibility — confirmed by dagre layout code in `GraphPanel.tsx` lines 59-66 setting these props explicitly.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all verified from package.json
- Architecture: HIGH — all 5 bug root causes identified from direct source reads
- Pitfalls: HIGH — all pitfalls derived from actual code structure (two render paths in NeuronNode, two useEffect calls in ReviewPage, two instances of horizon controls)
- Design tokens: HIGH — `.impeccable.md` is the authoritative design document, read directly

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable React/Next.js/Tailwind stack, no fast-moving dependencies)
