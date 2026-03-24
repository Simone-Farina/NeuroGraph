# Phase 17: Horizon & Crystallize UI Fixes - Research

**Researched:** 2026-03-24
**Domain:** React / React Flow / Zustand / Tailwind UI state bugs
**Confidence:** HIGH (all findings verified against live source code)

## Summary

This phase addresses five discrete UI/state bugs, all traceable to specific lines in existing source files. No new libraries are required. All fixes are targeted surgical edits to `ChatPanel.tsx`, `GraphPanel.tsx`, `GhostNeuronNode.tsx`, and `graphStore.ts`.

The most architecturally significant fix is HORIZON-06: `setHorizonDraft` atomically sets `shellPreset: 'graph_zenith'` alongside ghost node creation. The shell preset triggers a framer-motion width animation on the left panel, firing before dagre layout and React Flow rendering complete. Decoupling the preset change with a `setTimeout` (or `requestAnimationFrame`) is the correct fix per D-06.

The remaining four fixes are localized: a useEffect reset ordering issue in ChatPanel (CRYST-04), a conditional Tailwind class on the HorizonControls wrapper (HORIZON-04/D-03), incorrect Handle positions in GhostNeuronNode plus insufficient dagre height allocation (HORIZON-05), and a single JSX block removal (HORIZON-07).

**Primary recommendation:** Fix each bug in isolation as a separate plan wave. No shared state or cross-cutting concern spans more than two files per fix.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CRYST-04: Crystallize Paste State Cleanup**
- D-01: Always reset `activeCrystallizeSession` to `null` when `currentConversationId` changes, regardless of whether `loadMessages` runs. Add an explicit reset at the top of the conversation-switch `useEffect` in ChatPanel.tsx, before the `skipNextLoadRef` guard.

**HORIZON-04: Learning Target Container Sizing**
- D-02: Make the HorizonControls outer container size conditional on `isTargetOpen`. When collapsed (just the button), use minimal padding (`p-2`) and no fixed width. When expanded (showing input + buttons), use the current `p-3` with the existing max-width constraint.
- D-03: The parent positioning wrapper (`w-[min(460px,...)]`) should only apply width when `isTargetOpen` is true. When collapsed, the container should shrink to fit the button content.

**HORIZON-05: Ghost Node Layout**
- D-04: Increase the dagre node height allocation for ghost nodes. Use a larger `nodeHeight` (e.g., 160px) when the node type is `ghostNeuron`, keeping 80px for regular neurons. Pass node-specific dimensions to dagre's `setNode`.
- D-05: Fix `GhostNeuronNode.tsx` handle positions from `Position.Top`/`Position.Bottom` to `Position.Left`/`Position.Right` to match the LR dagre layout direction. Use `style={{ display: 'none' }}` to hide them (matching the NeuronNode pattern from Phase 15).

**HORIZON-06: Shell Preset Timing**
- D-06: Decouple the `shellPreset: 'graph_zenith'` change from `setHorizonDraft` in graphStore. Instead of setting the preset atomically with the ghost nodes, delay it by ~300ms (using `setTimeout` in the GraphPanel component after `setHorizonDraft` is called) to allow dagre layout and React Flow rendering to complete first.

**HORIZON-07: TARGET Label Removal**
- D-07: Remove the `{horizonTarget && ...}` block in HorizonControls that renders the "Target {horizonTarget}" and "horizonError" labels. The target name is already visible in the ghost nodes themselves.

### Claude's Discretion
- Exact dagre height for ghost nodes (160px is a starting point — may need calibration)
- Whether to use `requestAnimationFrame` vs `setTimeout` for the preset delay
- Exact padding values for collapsed vs expanded HorizonControls

### Deferred Ideas (OUT OF SCOPE)
None — all 5 bugs are in scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRYST-04 | Crystallize paste fallback state cleared on conversation switch | useEffect reset ordering in ChatPanel.tsx L339-357 — reset must occur before `skipNextLoadRef` guard |
| HORIZON-04 | "Set Learning Target" button container compact by default, expands when input shown | HorizonControls JSX L99-167 in GraphPanel.tsx — wrapper class conditioning on `isTargetOpen` |
| HORIZON-05 | Ghost node layout readable — no overlapping/stacked nodes | dagre setNode L47 uses fixed 80px for all types; GhostNeuronNode has Top/Bottom handles mismatched to LR layout direction |
| HORIZON-06 | Chat panel does not collapse when ghost nodes render | `setHorizonDraft` in graphStore L159-174 atomically sets `shellPreset: 'graph_zenith'` — must be delayed post-layout |
| HORIZON-07 | "TARGET X" label removed from below Learning Target controls | HorizonControls JSX L152-165 in GraphPanel.tsx — single block removal |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | existing | React Flow graph rendering + Handle | Already installed, Handle position constants are imported |
| dagre | existing | Automatic graph layout | Already used in `getLayoutedElements` |
| zustand | existing | graphStore shellPreset state | Already installed |
| framer-motion | existing | Panel width animation | Already drives PRESET_WIDTHS animations in layout.tsx |
| Tailwind CSS | existing | Conditional class strings | All UI classes are Tailwind |

**No npm installs required for this phase.**

---

## Architecture Patterns

### Recommended Project Structure
No structural changes. All edits are within existing files:
```
src/
├── components/
│   ├── chat/ChatPanel.tsx           # CRYST-04 fix
│   └── graph/
│       ├── GraphPanel.tsx           # HORIZON-04, HORIZON-06, HORIZON-07 fixes
│       └── GhostNeuronNode.tsx      # HORIZON-05 handle fix
└── stores/
    └── graphStore.ts                # HORIZON-06 preset removal
```

### Pattern 1: Eager State Reset Before Guard (CRYST-04)

**What:** The conversation-switch useEffect at ChatPanel.tsx L339-357 currently resets `activeCrystallizeSession` only inside the `!currentConversationId` early-return branch. When the user switches to a different existing conversation, `skipNextLoadRef.current` may be true, causing the guard at L351 to return early without resetting Crystallize state. The fix inserts an unconditional reset at the top of the effect, before the skipNextLoad guard.

**Current flow (bug):**
```typescript
// Source: src/components/chat/ChatPanel.tsx L339-357
useEffect(() => {
  if (!currentConversationId) {
    setMessages([]);
    setEdgeSuggestions([]);
    setConnectionNotice(null);
    setActiveCrystallizeSession(null);  // only resets here
    return;
  }

  if (skipNextLoadRef.current) {
    skipNextLoadRef.current = false;
    return;  // <-- exits without resetting activeCrystallizeSession
  }

  loadMessages(currentConversationId);
}, [currentConversationId, loadMessages, setMessages]);
```

**Fixed flow (D-01):**
```typescript
// Reset Crystallize state unconditionally — before skipNextLoadRef guard
useEffect(() => {
  setActiveCrystallizeSession(null);  // always reset on conversation change

  if (!currentConversationId) {
    setMessages([]);
    setEdgeSuggestions([]);
    setConnectionNotice(null);
    return;
  }

  if (skipNextLoadRef.current) {
    skipNextLoadRef.current = false;
    return;
  }

  loadMessages(currentConversationId);
}, [currentConversationId, loadMessages, setMessages]);
```

**Confidence:** HIGH — verified against live source.

### Pattern 2: Conditional Wrapper Width (HORIZON-04)

**What:** Two HorizonControls render sites in GraphPanel.tsx. The graph-empty state (L428) uses `w-[min(420px,...)]`. The graph-populated state (L449) uses `w-[min(460px,...)]`. Both must become conditional on `isTargetOpen` per D-03.

**Current (L449 — graph populated, the primary site):**
```typescript
// Source: src/components/graph/GraphPanel.tsx L449
<div className="pointer-events-none absolute left-5 top-5 z-20 w-[min(460px,calc(100%-2.5rem))]">
  <div className="pointer-events-auto">
    <HorizonControls ... />
  </div>
</div>
```

**Fixed:**
```typescript
<div className={`pointer-events-none absolute left-5 top-5 z-20 ${isTargetOpen ? 'w-[min(460px,calc(100%-2.5rem))]' : ''}`}>
  <div className="pointer-events-auto">
    <HorizonControls ... />
  </div>
</div>
```

Inside HorizonControls itself, the outer `div` at L100 must also be conditional:
```typescript
// Current (L100):
<div className="rounded-2xl border border-white/5 bg-neural-dark/80 p-3 backdrop-blur-xl">

// Fixed (D-02):
<div className={`rounded-2xl border border-white/5 bg-neural-dark/80 backdrop-blur-xl ${isTargetOpen ? 'p-3' : 'p-2'}`}>
```

**Confidence:** HIGH — JSX verified in source L99-167.

### Pattern 3: Per-Node Dagre Height (HORIZON-05 — layout)

**What:** `getLayoutedElements` at GraphPanel.tsx L41-70 calls `dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })` with a fixed 80px height for all nodes. Ghost nodes contain: Blueprint label, bloomLevel, title (multi-line serif 15px), definition (3-line clamp 12px), and footer row — significantly taller than a regular NeuronNode. 160px is the D-04 starting estimate.

**Current (L47):**
```typescript
// Source: src/components/graph/GraphPanel.tsx L47
nodes.forEach((node) => {
  dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
});
```

**Fixed:**
```typescript
nodes.forEach((node) => {
  const h = node.type === 'ghostNeuron' ? 160 : nodeHeight;
  dagreGraph.setNode(node.id, { width: nodeWidth, height: h });
});
```

The position offset must also use the per-node height when mapping back (L62-65):
```typescript
// Current (L62-65) — uses fixed nodeHeight for y centering:
position: {
  x: nodeWithPosition.x - nodeWidth / 2,
  y: nodeWithPosition.y - nodeHeight / 2,
},

// Fixed — use the actual allocated height:
const h = node.type === 'ghostNeuron' ? 160 : nodeHeight;
// ...
position: {
  x: nodeWithPosition.x - nodeWidth / 2,
  y: nodeWithPosition.y - h / 2,
},
```

**Note on discretion:** 160px is a calibration starting point. The GhostNeuronNode renders `w-52` (208px) with `px-5 py-4` padding, 3-line-clamp definition, and a footer. Actual rendered height with typical content is approximately 150-170px. 160px is a safe first pass.

**Confidence:** HIGH — dagre loop verified at L46-48.

### Pattern 4: GhostNeuronNode Handle Position Fix (HORIZON-05 — handles)

**What:** GhostNeuronNode.tsx uses `Position.Top` and `Position.Bottom` (lines 18 and 41), but the dagre layout uses `rankdir: 'LR'` (left-to-right), which aligns with `Position.Left` (target) and `Position.Right` (source). NeuronNode already uses the correct hidden-handle pattern at L163 and L182. GhostNeuronNode must match.

**Current (GhostNeuronNode.tsx L16-20 and L39-43):**
```typescript
<Handle
  type="target"
  position={Position.Top}
  className="!h-3 !w-3 !border !border-white/10 !bg-white/12"
/>
// ...
<Handle
  type="source"
  position={Position.Bottom}
  className="!h-3 !w-3 !border !border-white/10 !bg-white/12"
/>
```

**Fixed (D-05 — match NeuronNode pattern):**
```typescript
<Handle
  type="target"
  position={Position.Left}
  style={{ display: 'none' }}
/>
// ...
<Handle
  type="source"
  position={Position.Right}
  style={{ display: 'none' }}
/>
```

The `className` with visible colors can be dropped since handles are hidden. This matches NeuronNode L163 and L182 exactly.

**Confidence:** HIGH — both files verified. `rankdir: 'LR'` at GraphPanel.tsx L44.

### Pattern 5: Deferred Shell Preset (HORIZON-06)

**What:** In `graphStore.ts`, `setHorizonDraft` (L159-174) atomically returns `shellPreset: 'graph_zenith'` in the same state update as `ghostNodes`. The layout.tsx `AppLayoutContent` watches `shellPreset` and triggers framer-motion panel width animation immediately when the store updates — before dagre has run, before React Flow has committed. This causes the left panel to shrink to 25vw while nodes are still being positioned.

The fix per D-06 has two parts:
1. Remove `shellPreset: 'graph_zenith'` from `setHorizonDraft` return object in graphStore.ts.
2. In GraphPanel.tsx, after calling `setHorizonDraft(...)`, use `setTimeout` (or `requestAnimationFrame`) to call the existing `setShellPreset('graph_zenith')` action.

**Part 1 — graphStore.ts L159-174:**
```typescript
// Current:
setHorizonDraft: (target, draft) =>
  set(() => {
    const { ghostNodes, ghostEdges } = createGhostNodes(target, draft);
    return {
      ghostNodes,
      ghostEdges,
      horizonTarget: target,
      horizonError: null,
      isHorizonLoading: false,
      activeGhostNodeId: null,
      pendingHorizonSeed: null,
      leftPanelMode: 'chat',
      shellPreset: 'graph_zenith',   // <-- remove this line
    };
  }),

// Fixed:
setHorizonDraft: (target, draft) =>
  set(() => {
    const { ghostNodes, ghostEdges } = createGhostNodes(target, draft);
    return {
      ghostNodes,
      ghostEdges,
      horizonTarget: target,
      horizonError: null,
      isHorizonLoading: false,
      activeGhostNodeId: null,
      pendingHorizonSeed: null,
      leftPanelMode: 'chat',
      // shellPreset intentionally omitted — delayed by caller
    };
  }),
```

**Part 2 — GraphPanel.tsx, inside handleTargetSubmit (L399):**
```typescript
// After setHorizonDraft call, add:
setHorizonDraft(payload.target || target, payload.draft);
setTimeout(() => {
  useGraphStore.getState().setShellPreset('graph_zenith');
}, 300);
```

**`requestAnimationFrame` vs `setTimeout` discretion:** `requestAnimationFrame` fires before the next paint, which may still be too early if dagre runs synchronously on the same frame. A `setTimeout(fn, 300)` gives the layout effect (`useEffect` on `combinedNodes`) and React Flow's internal render cycle time to settle. Either is acceptable; 300ms is a conservative choice that matches the panel animation duration (`duration: 0.5` in layout.tsx L44).

Note: `clearHorizonDraft` at graphStore.ts L183-194 already sets `shellPreset: 'standard'` — this should remain unchanged so clearing the draft resets the panel.

**Confidence:** HIGH — store action verified at L159-174, `setShellPreset` is a defined action at L47 of graphStore.ts type definition.

### Pattern 6: TARGET Label Block Removal (HORIZON-07)

**What:** Lines 152-165 of GraphPanel.tsx (inside HorizonControls) render a `mt-3` div with a "Target X" badge and error badge. Per D-07, this entire block is removed.

**Block to remove (L152-165):**
```typescript
{(horizonTarget || horizonError) && (
  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
    {horizonTarget ? (
      <span className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-1 font-serif text-white/34">
        Target {horizonTarget}
      </span>
    ) : null}
    {horizonError ? (
      <span className="rounded-xl border border-orange-400/16 bg-orange-500/[0.08] px-3 py-1 font-serif text-orange-300/82">
        {horizonError}
      </span>
    ) : null}
  </div>
)}
```

After removal, `horizonError` is no longer rendered inside HorizonControls. Verify whether `horizonError` display is needed anywhere else (currently it is not — errors surface as a toast or are cleared by subsequent requests). The `horizonError` and `horizonTarget` props on HorizonControls can be removed from the type definition and all call sites after confirming no other usage.

**Confidence:** HIGH — JSX verified at L152-165.

### Anti-Patterns to Avoid

- **Do not use `useLayoutEffect` for the preset delay.** `useLayoutEffect` fires synchronously after DOM mutations — it would not give React Flow time to lay out nodes. Use `setTimeout`.
- **Do not move `shellPreset: 'standard'` out of `clearHorizonDraft`.** That reset must remain synchronous so the panel snaps back when the user clears the draft.
- **Do not remove `horizonTarget` from graphStore.** It is still used by the ghost node data and by `beginHorizonRequest`. Only remove it from HorizonControls rendering.
- **Do not change the dagre `nodesep`/`ranksep` constants.** The overlap is due to height under-allocation, not spacing. Changing spacing without fixing heights will not resolve the overlap.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph node spacing | Custom position math | dagre `setNode` with per-type height | dagre handles rank separation and edge routing |
| Panel animation | CSS transitions | framer-motion `animate={{ width }}` (already present) | Already wired to shellPreset |
| Handle visibility | CSS opacity or pointer-events tricks | `style={{ display: 'none' }}` | Established NeuronNode pattern; display:none removes from layout entirely |

---

## Runtime State Inventory

This is a code-only fix phase with no renames, migrations, or rebrandings.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None | None |

---

## Common Pitfalls

### Pitfall 1: The y-offset also uses nodeHeight
**What goes wrong:** Developer increases dagre height for ghost nodes in `setNode` but forgets to update the corresponding `y: nodeWithPosition.y - nodeHeight / 2` offset at L64. Ghost nodes appear shifted downward.
**Why it happens:** The dagre graph returns the node center — the offset must use the same height to recover the top-left corner.
**How to avoid:** Update both the `setNode` call and the position offset calculation together in the same function. They are 18 lines apart in `getLayoutedElements`.
**Warning signs:** Ghost nodes partially off-screen or vertically misaligned with their edges.

### Pitfall 2: `skipNextLoadRef` guard swallows the state reset
**What goes wrong:** When a Crystallize session ends and the same conversation remains active, a new conversation is started (`skipNextLoadRef.current = true`). The user then navigates to another conversation. The useEffect fires, `skipNextLoadRef.current` is true, and the return fires before resetting `activeCrystallizeSession`. The Crystallize paste UI leaks into the new conversation.
**Why it happens:** The guard was designed to prevent `loadMessages` from racing with the stream write — it was not designed to prevent state resets.
**How to avoid:** The D-01 fix (reset before the guard) is the correct solution. The reset is idempotent — resetting to `null` when already `null` has no side effects.
**Warning signs:** Paste composer visible in a conversation that has no Crystallize metadata.

### Pitfall 3: `shellPreset` removal from `setHorizonDraft` breaks `clearHorizonDraft`
**What goes wrong:** Developer sees `shellPreset: 'standard'` in `clearHorizonDraft` and removes it thinking the preset is now managed externally. The panel never resets when the user clears the horizon draft.
**Why it happens:** Misreading the scope of the HORIZON-06 change.
**How to avoid:** Only remove `shellPreset: 'graph_zenith'` from `setHorizonDraft`. Leave `shellPreset: 'standard'` in `clearHorizonDraft` untouched.
**Warning signs:** Panel stays at 25vw after clicking "Clear Draft".

### Pitfall 4: HorizonControls `horizonError` prop removed too early
**What goes wrong:** After removing the TARGET label block (HORIZON-07), developer assumes `horizonError` is dead and removes it from the HorizonControls prop type. However if the error span is removed but other parts of the component conditionally use the error in future, the type removal causes a TypeScript build error.
**Why it happens:** Removing UI and removing the type definition are separate steps.
**How to avoid:** Remove the rendering block first, verify the TypeScript build passes, then clean up unused props in a follow-up edit. For this phase, keeping the prop and simply not rendering it is acceptable.

### Pitfall 5: `requestAnimationFrame` fires too early for the preset delay
**What goes wrong:** Using `requestAnimationFrame` instead of `setTimeout` for D-06. `requestAnimationFrame` fires before the next paint — dagre runs synchronously in the layout `useEffect` triggered by the store update, but React Flow's internal node measurement and layout commit may span one or two additional render cycles.
**Why it happens:** `requestAnimationFrame` feels correct for "after render" but React Flow's internals may require a full event loop tick.
**How to avoid:** Prefer `setTimeout(fn, 300)` as the primary implementation. The 300ms aligns with the framer-motion animation duration (`duration: 0.5`s) — the user perceives a smooth panel expansion rather than an abrupt jump.

---

## Code Examples

### CRYST-04: Reset before guard
```typescript
// Source: src/components/chat/ChatPanel.tsx — conversation-switch useEffect
useEffect(() => {
  // D-01: Always reset Crystallize state on conversation change,
  // before skipNextLoadRef guard can short-circuit.
  setActiveCrystallizeSession(null);

  if (!currentConversationId) {
    setMessages([]);
    setEdgeSuggestions([]);
    setConnectionNotice(null);
    return;
  }

  if (skipNextLoadRef.current) {
    skipNextLoadRef.current = false;
    return;
  }

  loadMessages(currentConversationId);
}, [currentConversationId, loadMessages, setMessages]);
```

### HORIZON-05: Per-node dagre height
```typescript
// Source: src/components/graph/GraphPanel.tsx — getLayoutedElements
nodes.forEach((node) => {
  const h = node.type === 'ghostNeuron' ? 160 : nodeHeight;
  dagreGraph.setNode(node.id, { width: nodeWidth, height: h });
});

// ...later, in layoutedNodes map:
const layoutedNodes = nodes.map((node) => {
  const nodeWithPosition = dagreGraph.node(node.id);
  const h = node.type === 'ghostNeuron' ? 160 : nodeHeight;
  return {
    ...node,
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    position: {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - h / 2,
    },
  };
});
```

### HORIZON-05: Corrected GhostNeuronNode handles
```typescript
// Source: src/components/graph/GhostNeuronNode.tsx
// Match NeuronNode pattern (NeuronNode.tsx L163, L182)
<Handle
  type="target"
  position={Position.Left}
  style={{ display: 'none' }}
/>
// ... component content ...
<Handle
  type="source"
  position={Position.Right}
  style={{ display: 'none' }}
/>
```

### HORIZON-06: Delayed preset
```typescript
// Source: src/components/graph/GraphPanel.tsx — inside handleTargetSubmit
setHorizonDraft(payload.target || target, payload.draft);
setTargetInput('');
setIsTargetOpen(false);
// Delay graph_zenith preset to allow dagre layout + React Flow render
setTimeout(() => {
  useGraphStore.getState().setShellPreset('graph_zenith');
}, 300);
```

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all fixes are code-only edits to existing TypeScript/React files).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx src/components/graph/__tests__/GraphPanel.horizon.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRYST-04 | `activeCrystallizeSession` is null after conversation switch (even when `skipNextLoadRef` fires) | unit | `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx` | Partial — file exists, test for this specific case is missing |
| HORIZON-04 | HorizonControls outer wrapper has no fixed width when collapsed | unit (render) | `npx vitest run src/components/graph/__tests__/GraphPanel.horizon.test.tsx` | Partial — file exists, sizing test missing |
| HORIZON-05 | GhostNeuronNode handles use Position.Left/Right | unit | `npx vitest run src/components/graph/__tests__/GraphPanel.horizon.test.tsx` | Partial — file exists, handle position test missing |
| HORIZON-06 | `setHorizonDraft` does not immediately change `shellPreset` | unit (store) | `npx vitest run src/stores/__tests__/graphStore.test.ts` | Partial — store test file exists, this assertion missing |
| HORIZON-07 | "Target X" label is not rendered in HorizonControls | unit (render) | `npx vitest run src/components/graph/__tests__/GraphPanel.horizon.test.tsx` | Partial — file exists, label-removal test missing |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/chat/__tests__/ChatPanel.crystallize.test.tsx src/components/graph/__tests__/GraphPanel.horizon.test.tsx src/stores/__tests__/graphStore.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/chat/__tests__/ChatPanel.crystallize.test.tsx` — add test: "clears activeCrystallizeSession when switching conversations even when skipNextLoadRef is true" (covers CRYST-04)
- [ ] `src/components/graph/__tests__/GraphPanel.horizon.test.tsx` — add test: "GhostNeuronNode handles use Position.Left and Position.Right" (covers HORIZON-05)
- [ ] `src/stores/__tests__/graphStore.test.ts` — add assertion: "setHorizonDraft does not set shellPreset" (covers HORIZON-06)
- [ ] `src/components/graph/__tests__/GraphPanel.horizon.test.tsx` — add test: "HorizonControls does not render Target label" (covers HORIZON-07)

No new framework install needed — Vitest + jsdom already configured.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Position.Top`/`Position.Bottom` handles | `Position.Left`/`Position.Right` hidden handles | Phase 15 (NeuronNode) | Ghost nodes inherited old pattern, must be updated |
| Atomic shellPreset set in store action | Decoupled delayed set in component | This phase (D-06) | Ghost nodes now trigger panel animation after layout settles |

---

## Open Questions

1. **Ghost node height calibration (D-04 discretion)**
   - What we know: GhostNeuronNode is `w-52`, `px-5 py-4`, 3-line-clamp definition, title in 15px serif. Estimated rendered height: 150-170px.
   - What's unclear: Exact pixel height depends on font rendering, actual definition length, and whether `line-clamp-3` truncates.
   - Recommendation: Start with 160px. If nodes still overlap in manual QA, increase to 180px. No test can automate pixel-perfect layout validation — manual visual check is the gate.

2. **`requestAnimationFrame` vs `setTimeout` for preset delay (D-06 discretion)**
   - What we know: React Flow's `fitView` already uses `requestAnimationFrame` at L203. The dagre effect runs synchronously.
   - What's unclear: Whether one `requestAnimationFrame` tick is sufficient or if two ticks (nested rAF) are needed.
   - Recommendation: Use `setTimeout(fn, 300)` as the primary implementation. It is simpler to reason about and the 300ms delay is imperceptible given the 500ms framer-motion animation. If the delay feels sluggish during QA, reduce to 150ms.

---

## Sources

### Primary (HIGH confidence)
- `src/components/chat/ChatPanel.tsx` L180-357 — activeCrystallizeSession state declaration, useEffect conversation-switch, skipNextLoadRef guard
- `src/components/graph/GraphPanel.tsx` L38-70, L86-168, L449-465 — getLayoutedElements dagre function, HorizonControls component, parent wrapper JSX
- `src/components/graph/GhostNeuronNode.tsx` — full file — handle positions, node content structure
- `src/stores/graphStore.ts` L140-194 — setHorizonDraft, clearHorizonDraft, ShellPreset type
- `src/app/(app)/layout.tsx` L14-84 — PRESET_WIDTHS, framer-motion width animation, shellPreset consumption
- `src/components/graph/NeuronNode.tsx` L163, L182 — established hidden handle pattern (Position.Left/Right, display:none)

### Secondary (MEDIUM confidence — inferred from code structure)
- `src/components/graph/__tests__/GraphPanel.horizon.test.tsx` — existing test coverage gaps identified
- `src/components/chat/__tests__/ChatPanel.crystallize.test.tsx` — existing CRYST test gaps identified
- `vitest.config.ts` — confirmed test runner: Vitest 4.0.18, jsdom, `src/**/*.{test,spec}.{ts,tsx}`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all libraries verified in source
- Architecture: HIGH — all patterns traced to exact file + line numbers in live code
- Pitfalls: HIGH — each pitfall derived from reading the actual buggy code paths
- Test gaps: HIGH — existing test files inspected, missing test cases identified by name

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, no fast-moving dependencies)
