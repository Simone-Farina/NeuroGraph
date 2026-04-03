# Phase 27: Neurogenesis UX & Operational Polish - Research

**Researched:** 2026-04-03
**Domain:** React component refactor, Zustand state guards, UI copy audit
**Confidence:** HIGH

## Summary

Phase 27 is a pure polish/bug-fix phase with three distinct sub-problems. First, the static `GenerateNeuronButton` must be replaced by a contextual inline card that appears automatically in the chat flow when Bloom confidence reaches the Analyze+ threshold — the underlying neurogenesis API pipeline is unchanged, only the trigger surface moves. Second, three jargon words ("crystallize", "neuron", "Bloom") must be hunted from all user-facing static string literals in `.tsx` files; code internals, variable names, and API routes are not touched. Third, two `setInterval` timers inside `GraphCanvas` and the focus/visibility event listeners in `QueueBootstrap` must be suppressed while the user is in active chat mode, using the already-available `leftPanelMode === 'chat'` flag from `graphStore`.

None of these require new libraries, new API routes, or schema migrations. All three changes are purely React/Zustand component-level edits. The riskiest sub-problem is replacing `GenerateNeuronButton` with the contextual trigger, because `ChatPanel` currently mounts `<GenerateNeuronButton />` as a static child — the new behavior requires reading Bloom state and conditionally rendering an inline suggestion near the message list.

**Primary recommendation:** Execute three discrete tasks in order: (1) contextual neurogenesis trigger swap, (2) polling guard, (3) jargon purge. Each task is independently deployable and verifiable.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Suggestion appears as an inline chat message-style card below the last AI message when Bloom hits Analyze+ — reuse the existing `NeurogenesisSuggestion.tsx` component pattern.
**D-02:** Trigger condition: Bloom evaluator detects Analyze+ AND confidence >= 0.75 — matches current `GenerateNeuronButton` threshold logic, driven by Zustand `bloomLevel` state.
**D-03:** Remove `GenerateNeuronButton` entirely — the contextual suggestion replaces it completely.
**D-04:** Suggestion auto-dismisses when user sends next message (non-intrusive) — can re-appear if still at Analyze+ after next evaluation.
**D-05:** Replace "crystallize", "neuron", "Bloom" in all static UI copy (graph empty state, labels, tooltips) — NOT in API internals, code comments, or variable names.
**D-06:** Replace "neuron" with "concept" or "idea" — neutral, user-friendly terms.
**D-07:** Replace "crystallize" with "extract" or "save" — plain action verbs.
**D-08:** Graph empty state: welcoming, plain language (e.g., "Start a conversation to build your knowledge graph") — no jargon.
**D-09:** Suppress `/api/queue`, `/api/review`, `/api/neurons` polling during active chat — per PERF-01.
**D-10:** Detect "active chat session" via `leftPanelMode === 'chat'` from graphStore.
**D-11:** Keep `QueueBootstrap.tsx` focus/visibility refresh but guard with panel mode check.
**D-12:** Pause `GraphPanel.tsx` `setInterval` timers when `leftPanelMode === 'chat'` — resume on panel switch.

### Claude's Discretion

- Exact styling and animation of the contextual suggestion appearance
- Specific replacement wording for each jargon instance (within the "concept"/"idea" and "extract"/"save" guidance)
- Implementation approach for interval pausing (cleanup vs. guard clause)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NGEN-01 | Neurogenesis trigger appears as an in-chat contextual suggestion (not a static button) when Bloom evaluator detects Analyze+ depth | D-01 through D-04; existing `NeurogenesisSuggestion.tsx` reuse; `GenerateNeuronButton` threshold logic carries over |
| UI-01 | Graph empty state and all static UI copy contain zero platform jargon ("crystallize", "neuron", "Bloom") | D-05 through D-08; jargon audit below identifies all hit sites |
| PERF-01 | No unnecessary API calls (/api/queue, /api/review, /api/neurons) fire during active chat sessions | D-09 through D-12; two setInterval targets in GraphPanel + QueueBootstrap event listeners |
</phase_requirements>

---

## Standard Stack

No new dependencies required. This phase uses only what is already installed.

### Core (already present)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | existing | Component rendering, state hooks | Project standard |
| Zustand | existing | `graphStore.leftPanelMode` for polling guard | Already used for all cross-component state |
| Tailwind CSS | existing | Inline card styling for contextual suggestion | Project's CSS system |

### No New Installations
All implementation is in existing `.tsx` files using existing patterns. No `npm install` step.

---

## Architecture Patterns

### Recommended Project Structure

The three sub-tasks touch different files with no overlap:

```
src/components/chat/
├── ChatPanel.tsx              # TASK 1: swap GenerateNeuronButton for contextual trigger
├── GenerateNeuronButton.tsx   # TASK 1: delete this file
├── NeurogenesisSuggestion.tsx # TASK 1: reuse existing component (new props signature)
src/components/graph/
├── GraphPanel.tsx             # TASK 2: add leftPanelMode guard to both setInterval calls
src/components/queue/
├── QueueBootstrap.tsx         # TASK 2: add leftPanelMode guard to focus/visibility handlers
src/components/graph/
│   GraphPanel.tsx             # TASK 3: jargon in empty state copy
src/components/chat/
│   NeurogenesisSuggestion.tsx # TASK 3: jargon in "Crystallizing..." and "Candidate Neuron"
src/components/queue/
│   QueueItemCard.tsx          # TASK 3: "Crystallize" button label
src/components/graph/
│   HorizonBriefingPanel.tsx   # TASK 3: "Start Learning (Crystallize)"
src/components/graph/
│   NeuronNode.tsx             # TASK 3: "Neuron" label in node UI
src/components/onboarding/
│   OnboardingTour.tsx         # TASK 3: jargon in tour descriptions
src/app/
│   layout.tsx                 # TASK 3: meta description
```

### Pattern 1: Contextual Neurogenesis Trigger (NGEN-01)

**What:** `ChatPanel` reads `bloomLevel` and `bloomConfidence` from Zustand, and renders a new `ContextualNeurogenesisSuggestion` (or adapted `NeurogenesisSuggestion`) inline below the message list when the Analyze+ threshold is met.

**When to use:** Replaces the static `GenerateNeuronButton` entirely.

**Key design decisions from code reading:**

`ChatPanel.tsx` already imports `useGraphStore` and reads `bloomLevel`/`bloomConfidence`/`isBloomPending`/`resetBloomEval`. The threshold logic (`ANALYZE_LEVELS`, `CONFIDENCE_THRESHOLD = 0.75`) lives inside `GenerateNeuronButton.tsx` — this must move into `ChatPanel`.

The existing `NeurogenesisSuggestion.tsx` expects a `toolCallId`, `input` object (title, definition, core_insight, bloom_level), `state`, `toolState`, `onNeurogenesis`, `onDismiss`, and `addResult` props. This was designed for the AI tool-call flow where the AI pre-populates the card fields. The new trigger fires Bloom-based, without tool-call pre-populated content — so the component must be adapted or a new simpler component created.

**Two viable implementation approaches (Claude's discretion):**

Option A — New lightweight inline suggestion component:
- Create `ChatNeurogenesisPrompt.tsx` — a simple card with a "Save to graph" CTA and brief text, no AI-pre-populated title/definition
- POSTs to `/api/neurogenesis` with `conversationId` (same as `GenerateNeuronButton`)
- Rendered by `ChatPanel` above `<ChatInput>`, conditioned on `isReady`

Option B — Reuse `NeurogenesisSuggestion.tsx` with empty/null input:
- Pass `input={}`, `state='call'`, `toolState='call'`
- Component handles missing `definition` by showing the loading/streaming state
- More complex prop threading

**Recommended: Option A** — lower risk, cleaner separation, satisfies D-01 (inline card) and D-03 (replaces button) without repurposing a component with mismatched semantics.

**Auto-dismiss on next message send (D-04):**
`ChatPanel.handleSend` already calls `resetBloomEval()` indirectly via `onFinish -> triggerBloomEval`. To auto-dismiss on send, add `resetBloomEval()` at the start of `handleSend` (before `sendMessage`). This collapses the card immediately when user sends, and it re-appears after the next evaluation if still at Analyze+.

**Example — where to render in ChatPanel.tsx:**
```tsx
// Source: existing ChatPanel.tsx structure (line ~462-472)
{isReady && !isGenerating && (
  <ChatNeurogenesisPrompt
    conversationId={currentConversationId}
    onSuccess={(neuron, synapses) => {
      addNeurogenesisResult(neuron, synapses);
      resetBloomEval();
    }}
    onDismiss={resetBloomEval}
  />
)}
<GenerateNeuronButton />  // <- remove this line
<ChatInput ... />
```

Where `isReady` is computed from the same threshold logic as `GenerateNeuronButton`:
```tsx
const ANALYZE_LEVELS = ['Analyze', 'Evaluate', 'Create'];
const isReady =
  bloomLevel !== null &&
  ANALYZE_LEVELS.includes(bloomLevel) &&
  bloomConfidence >= 0.75 &&
  !isBloomPending;
```

### Pattern 2: Polling Guard (PERF-01)

**What:** `GraphCanvas` contains two `setInterval` calls. Both must be suppressed when `leftPanelMode === 'chat'`.

**Identified targets in GraphPanel.tsx:**

1. **Retrievability timer (line 233):** `setInterval(updateRetrievability, 60 * 1000)`
2. **Graph reload timer (line 318):** `setInterval(loadGraph, 5 * 60 * 1000)`

Both are in separate `useEffect` hooks with their own cleanup returns.

**Implementation approach — add `leftPanelMode` dep and guard clause:**

```tsx
// Source: GraphPanel.tsx useEffect pattern — add leftPanelMode guard
const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

useEffect(() => {
  // Guard: do not poll while in chat mode
  if (leftPanelMode === 'chat') return;

  updateRetrievability();
  const interval = setInterval(updateRetrievability, 60 * 1000);
  return () => clearInterval(interval);
}, [updateNode, leftPanelMode]);  // leftPanelMode in deps causes cleanup+restart on switch

useEffect(() => {
  if (leftPanelMode === 'chat') return;

  loadGraph();
  const interval = setInterval(loadGraph, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [setGraph, leftPanelMode]);
```

When `leftPanelMode` changes from `'chat'` to another value, the effect re-runs, `loadGraph()` fires immediately (graph stays fresh on panel switch), and polling resumes. When switching back to chat, the cleanup fires and the interval is cleared.

**QueueBootstrap guard (D-11):**

`QueueBootstrap.tsx` uses `window.addEventListener('focus', ...)` and `document.addEventListener('visibilitychange', ...)`. Add `leftPanelMode` subscription and skip `refreshQueue` when in chat mode:

```tsx
// Source: QueueBootstrap.tsx — add panel mode check
const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

const handleFocus = () => {
  if (leftPanelMode === 'chat') return;
  void refreshQueue();
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && leftPanelMode !== 'chat') {
    void refreshQueue();
  }
};
```

Note: `leftPanelMode` must be captured in closure. The handlers are re-registered when `leftPanelMode` changes (add to `useEffect` deps array).

### Pattern 3: Jargon Purge (UI-01)

**Complete hit list from grep audit — static user-visible strings only:**

| File | Line | Current text | Replacement |
|------|------|-------------|-------------|
| `src/components/graph/GraphPanel.tsx` | 415-416 | "crystallize ideas in chat. This graph will hold your durable neurons" | "explore ideas in chat. This graph will hold your durable knowledge" |
| `src/components/graph/GraphPanel.tsx` | 413 | "An empty space." (h3) | "Your knowledge graph is empty." or "Start exploring." |
| `src/components/queue/QueueItemCard.tsx` | 166 | "Crystallize" (button label) | "Extract" or "Save to chat" |
| `src/components/graph/HorizonBriefingPanel.tsx` | 79 | "Start Learning (Crystallize)" | "Start Learning" |
| `src/components/graph/NeuronNode.tsx` | 258 | `<p>Neuron</p>` (node type label) | "Concept" |
| `src/components/chat/NeurogenesisSuggestion.tsx` | 100 | "Crystallizing..." / "Synthesizing new neuron..." | "Saving..." / "Extracting insight..." |
| `src/components/chat/NeurogenesisSuggestion.tsx` | 115 | "Candidate Neuron" (header) | "Candidate Concept" |
| `src/components/graph/HorizonBriefingPanel.tsx` | 50 | "Bloom {data.bloomLevel}" | "Depth: {data.bloomLevel}" or just the level name |
| `src/components/onboarding/OnboardingTour.tsx` | 48,59,71 | "neurons", "Neuron Node", "neurons" | "concepts", "Knowledge Node", "concepts" |
| `src/app/layout.tsx` | 22 | "Neuron Knowledge" in meta description | "Deep Knowledge" |
| `src/components/chat/BouncerCard.tsx` | 58 | "existing Neuron:" | "existing concept:" |

**Exclusions (NOT touched per D-05):**
- All `import` statements, type names, function names, variable names (e.g., `NeurogenesisSuggestion`, `addNeurogenesisResult`, `bloomLevel`)
- API route paths (`/api/neurons`, `/api/neurogenesis`)
- Code comments
- Test files (`__tests__/`) — test button selectors like `name: 'Crystallize'` will break if the label changes; tests for `QueueItemCard` must be updated alongside the label change

### Anti-Patterns to Avoid

- **Touching variable names / function names while doing jargon purge:** D-05 is explicit — only static UI string literals. Renaming `NeurogenesisSuggestion.tsx` or `bloomLevel` is out of scope.
- **Re-implementing neurogenesis logic from scratch:** The POST `/api/neurogenesis` call in `GenerateNeuronButton.tsx` is proven — copy it directly into the new component. No regression risk if the fetch call is identical.
- **Using `setInterval` ref-pausing instead of effect deps:** The `leftPanelMode`-in-deps pattern (cleanup + restart) is cleaner than keeping a ref and pausing/resuming. It also ensures the graph reloads once when the user returns to the graph panel.
- **Breaking existing `QueueBootstrap` tests:** Current tests assert that `refreshQueue` fires on focus and visibility change. After adding the panel mode guard, the test mock must inject `leftPanelMode !== 'chat'` to keep these tests green. Update the test mock in `QueueBootstrap.test.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Threshold check | Duplicate `ANALYZE_LEVELS` constant | Move constant to shared location or keep inline in `ChatPanel` | Single source of truth |
| Inline card UI | New animation system | Tailwind `animate-in fade-in duration-300` (already used in `NeurogenesisSuggestion.tsx` line 81) | Project convention |
| Panel mode detection | Custom event bus | `useGraphStore((s) => s.leftPanelMode)` | Already in Zustand |

**Key insight:** Every mechanism this phase needs already exists. The work is rewiring existing parts, not building new infrastructure.

---

## Runtime State Inventory

This phase is a UI/component refactor — no renames of stored keys, no API route changes, no database migrations.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — no DB column or key renames | None |
| Live service config | None — no external service config changes | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None — no package renames | None |

---

## Common Pitfalls

### Pitfall 1: Test breakage from QueueItemCard label change
**What goes wrong:** `src/components/queue/__tests__/QueueItemCard.test.tsx` line 28 asserts `screen.getByRole('button', { name: 'Crystallize' })`. Changing the button label to "Extract" will break this test.
**Why it happens:** Test uses the visible button label as the accessible name selector.
**How to avoid:** Update the test assertion alongside the label change in the same task.
**Warning signs:** `vitest` reports `Unable to find an accessible element with the role "button" and name "Crystallize"`.

### Pitfall 2: `QueueBootstrap` focus handler stale closure
**What goes wrong:** If `leftPanelMode` is captured at effect setup time and not in the handler closure, the guard always reads the initial value.
**Why it happens:** `useEffect` with `[loading, refreshQueue, userId]` deps — `leftPanelMode` not in deps means the handlers close over a stale value.
**How to avoid:** Add `leftPanelMode` to the `useEffect` deps array so handlers are re-registered when panel mode changes. The cleanup/re-register cost is negligible.
**Warning signs:** Queue still polls on focus even when in chat mode.

### Pitfall 3: Graph panel reloads on every chat message
**What goes wrong:** Adding `leftPanelMode` to the `useEffect` deps in `GraphPanel` causes `loadGraph()` to fire every time the mode changes. If mode toggles rapidly, this spams `/api/neurons`.
**Why it happens:** Each re-run of the effect calls `loadGraph()` unconditionally before setting the interval.
**How to avoid:** The guard `if (leftPanelMode === 'chat') return;` prevents `loadGraph()` from running in chat mode. When mode leaves chat, one fresh load fires — which is intentional (graph stays current). This is the correct behavior.
**Warning signs:** Network DevTools shows burst of `/api/neurons` calls when switching panels rapidly.

### Pitfall 4: Auto-dismiss race with Bloom re-evaluation
**What goes wrong:** User sends message → `resetBloomEval()` dismisses card → `onFinish` fires `triggerBloomEval()` → new evaluation at Analyze+ immediately re-shows card.
**Why it happens:** The evaluation fires on every `onFinish`, which runs right after send.
**How to avoid:** This is actually the correct behavior per D-04 ("can re-appear if still at Analyze+ after next evaluation"). The card will re-appear after the next AI response if the new conversation state still qualifies. This is expected, not a bug.
**Warning signs:** None — this is by design.

### Pitfall 5: `BouncerCard.tsx` line 58 jargon
**What goes wrong:** "This insight closely matches your existing Neuron:" is visible to users in collision scenarios but may be missed in a grep-based audit if the word is capitalized.
**Why it happens:** `Neuron` with capital N in a JSX string.
**How to avoid:** Replace with "This insight closely matches your existing concept:".
**Warning signs:** UI-01 test audit finds the word in rendered output.

---

## Code Examples

### Complete threshold condition (from GenerateNeuronButton.tsx)
```typescript
// Source: src/components/chat/GenerateNeuronButton.tsx lines 7-27
const ANALYZE_LEVELS = ['Analyze', 'Evaluate', 'Create'];
const CONFIDENCE_THRESHOLD = 0.75;

const isReady =
  bloomLevel !== null &&
  ANALYZE_LEVELS.includes(bloomLevel) &&
  bloomConfidence >= CONFIDENCE_THRESHOLD;
```

### Neurogenesis API call pattern (from GenerateNeuronButton.tsx)
```typescript
// Source: src/components/chat/GenerateNeuronButton.tsx lines 36-64
const response = await fetch('/api/neurogenesis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversationId: currentConversationId }),
});

if (response.ok) {
  const { neuron, synapses } = await response.json();
  addNeurogenesisResult(neuron, synapses);
  resetBloomEval();
}
```

### GraphPanel interval guard pattern
```typescript
// Source: adapted from GraphPanel.tsx lines 207-236
const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

useEffect(() => {
  if (leftPanelMode === 'chat') return;  // suppress polling in chat mode

  updateRetrievability();
  const interval = setInterval(updateRetrievability, 60 * 1000);
  return () => clearInterval(interval);
}, [updateNode, leftPanelMode]);
```

### QueueBootstrap guard pattern
```typescript
// Source: adapted from QueueBootstrap.tsx lines 20-38
const leftPanelMode = useGraphStore((state) => state.leftPanelMode);

useEffect(() => {
  if (loading || !userId) return;

  const handleFocus = () => {
    if (leftPanelMode === 'chat') return;
    void refreshQueue();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && leftPanelMode !== 'chat') {
      void refreshQueue();
    }
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [loading, refreshQueue, userId, leftPanelMode]);
```

### Inline card placement in ChatPanel.tsx
```tsx
// Source: ChatPanel.tsx lines 462-472 (current) — replace GenerateNeuronButton
{isReady && currentConversationId && (
  <ChatNeurogenesisPrompt
    conversationId={currentConversationId}
    onSuccess={(neuron, synapses) => {
      addNeurogenesisResult(neuron, synapses);
      resetBloomEval();
    }}
    onDismiss={resetBloomEval}
  />
)}
{/* GenerateNeuronButton removed */}
<ChatInput ... />
```

### GraphPanel empty state — jargon-free version
```tsx
// Source: GraphPanel.tsx lines 408-436 (current empty state)
// Replace existing copy with:
<h3 className="mb-4 font-serif text-3xl font-normal tracking-tight text-white/40">
  Your knowledge graph is empty.
</h3>
<p className="font-serif text-[17px] leading-relaxed text-white/30">
  Set a learning target or start a conversation to build your graph.
  Each deep insight you save here becomes a permanent node in your knowledge network.
</p>
```

---

## State of the Art

This phase does not involve framework upgrades. All patterns are already established in the codebase.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static `GenerateNeuronButton` below input | Contextual inline card triggered by Bloom state | Phase 27 | More natural UX; card appears in context of the conversation |
| Unrestricted polling during chat | `leftPanelMode === 'chat'` guard | Phase 27 | Eliminates 3 API endpoint classes from firing during chat |

---

## Open Questions

1. **Where exactly in the ChatPanel layout should the contextual card render?**
   - What we know: Currently `GenerateNeuronButton` renders between `CrystallizePasteComposer` and `ChatInput` (line ~462 in ChatPanel.tsx). The card should appear in the chat stream, not below the input.
   - What's unclear: Should it render inside `MessageList` as a pseudo-message, or as a sibling element above `ChatInput`? The CONTEXT.md says "below the last AI message" which suggests injection into the message stream, but that requires passing callbacks into MessageList.
   - Recommendation: Render above `<ChatInput>` as a sibling (simpler, no changes to MessageList), positioned with a visible top border or left-border card style matching `NeurogenesisSuggestion.tsx`. This satisfies "below the last AI message" visually since the scroll container places it directly below messages.

2. **Should `GraphCanvas` execute one `loadGraph()` call when panel mode changes away from chat?**
   - What we know: The `leftPanelMode`-in-deps pattern triggers `loadGraph()` on every mode-change-away-from-chat.
   - What's unclear: The user might switch panels rapidly; each switch causes a fresh `/api/neurons` call.
   - Recommendation: Accept this behavior — it keeps the graph fresh on panel switch, which is desirable. The polling interval prevents unnecessary re-fetching while on the graph panel.

---

## Environment Availability

Step 2.6: SKIPPED — phase is purely component/config changes with no new external dependencies. All required tools (Node, Next.js, Vitest) are already installed and verified by prior phases.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (present in devDependencies) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --run src/components/chat/ChatPanel.test.tsx src/components/queue/__tests__/QueueBootstrap.test.tsx src/components/queue/__tests__/QueueItemCard.test.tsx` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NGEN-01 | Contextual card appears when bloomLevel=Analyze and confidence>=0.75 | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | ✅ (needs new test case) |
| NGEN-01 | Card absent when bloomLevel=Remember | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | ✅ (needs new test case) |
| NGEN-01 | Card triggers POST /api/neurogenesis on confirm | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | ✅ (needs new test case) |
| NGEN-01 | Card dismisses when user sends next message | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | ✅ (needs new test case) |
| NGEN-01 | GenerateNeuronButton is absent from DOM | unit | `npm test -- --run src/components/chat/ChatPanel.test.tsx` | ✅ (needs new test case) |
| UI-01 | No jargon words in rendered graph empty state | smoke/manual | Network DevTools + visual inspection | manual-only |
| PERF-01 | refreshQueue not called on focus when leftPanelMode=chat | unit | `npm test -- --run src/components/queue/__tests__/QueueBootstrap.test.tsx` | ✅ (needs updated mock + new test case) |
| PERF-01 | refreshQueue called on focus when leftPanelMode!=chat | unit | `npm test -- --run src/components/queue/__tests__/QueueBootstrap.test.tsx` | ✅ (needs new test case) |

### Sampling Rate
- **Per task commit:** `npm test -- --run src/components/chat/ChatPanel.test.tsx src/components/queue/__tests__/QueueBootstrap.test.tsx src/components/queue/__tests__/QueueItemCard.test.tsx`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases in `src/components/chat/ChatPanel.test.tsx` — covers NGEN-01 (contextual trigger presence/absence, API call, dismiss)
- [ ] Updated test cases in `src/components/queue/__tests__/QueueBootstrap.test.tsx` — covers PERF-01 (panel mode guard on focus/visibility); existing tests must be updated to add `leftPanelMode` to mock
- [ ] Updated test cases in `src/components/queue/__tests__/QueueItemCard.test.tsx` — update button name assertion from "Crystallize" to "Extract" (or whichever replacement is chosen)

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `src/components/chat/GenerateNeuronButton.tsx` — threshold constants, API call pattern
- Direct source code read: `src/components/chat/ChatPanel.tsx` — mount point, existing state access
- Direct source code read: `src/components/graph/GraphPanel.tsx` — both interval targets, empty state copy
- Direct source code read: `src/components/queue/QueueBootstrap.tsx` — event listener pattern
- Direct source code read: `src/stores/graphStore.ts` — `leftPanelMode` type and values
- Direct source code read: `src/components/chat/NeurogenesisSuggestion.tsx` — existing card design patterns

### Secondary (MEDIUM confidence)
- Grep audit of all `.tsx` files for jargon strings — exhaustive, but visual rendering context requires human verification

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all verified from existing source files
- Architecture: HIGH — implementation approach derived directly from reading the canonical files
- Pitfalls: HIGH — derived from concrete code inspection (stale closures, test assertions)
- Jargon audit: MEDIUM — grep found all static string literals; rendering context for some strings (e.g., meta description) requires manual visual check

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable codebase, no fast-moving dependencies)
