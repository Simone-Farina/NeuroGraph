# Phase 9: UI Polish & Design System - Research

**Researched:** 2026-03-22
**Domain:** App-shell polish, conversation-history curation, editorial chat presentation, review UI, motion language
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- The main left-panel surface must feel like a calm editorial workspace rather than a generic chat app.
- Conversation history is curated into `Active/Recent` and `Fading`, with rust semantics and reduced opacity for aging sessions.
- Layout uses named presets, not fluid drag resizing:
  - `standard` around 40/60
  - `deep_read` around 60/40 or 70/30
  - `graph_zenith` around 20/80
- Phase 9 remains balanced, but shell/navigation/history takes priority when sequencing the work.
- Assistant messages should feel like editorial prose, review buttons should be monochrome, and motion must be restrained and intentional.

### Claude's Discretion

- Exact preset trigger rules and controls
- Exact semantic token names and typography steps
- Exact shell-state ownership and motion utility structure

### Deferred Ideas (OUT OF SCOPE)

- URL thumbnail rendering inside chat
- Agent/prompt-engineering system work
- New search/filtering capabilities for history or queue

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POLISH-01 | Chat AI messages render as editorial prose without bubble containers | `MessageList.tsx` should move assistant output to borderless/full-width prose blocks and demote user messages to quieter annotation-style containers |
| POLISH-02 | The 40/60 panel split is dynamic, flexing based on active content | `layout.tsx` should switch among named presets driven by store state and animated with Framer Motion rather than fixed `w-[40vw]/w-[60vw]` widths |
| POLISH-03 | Empty states for graph and chat teach the interface using brand voice and future-structure hints | The chat empty state in `MessageList.tsx` and graph empty state in `GraphPanel.tsx` need a coordinated editorial system instead of template copy and icon bubbles |
| POLISH-04 | Review page rating buttons are monochrome | `review/page.tsx` should replace color-coded ratings with hierarchy, type, and contrast-based distinctions |
| POLISH-05 | Panel transitions use intentional motion | Shell preset changes, conversation list reveals, and supporting transitions should share one restrained motion language |
</phase_requirements>

---

## Summary

Phase 9 is best executed as a three-wave polish pass:

1. Rebuild the shell structure first: introduce named layout presets, reorganize conversation history into `Active/Recent` and `Fading`, and reduce left-panel clutter.
2. Rework the left-panel surfaces into an editorial system: prose-first chat rendering, quieter new-account/empty states, and the deferred Phase 7 queue flattening and terracotta token work.
3. Finish the system with monochrome review controls, shared motion rules, and a final human checkpoint across the shell.

The codebase already contains the right seams for this. `layout.tsx` owns the left/right shell split, `AppSidebar.tsx` owns navigation and history, `MessageList.tsx` owns chat presentation, and `review/page.tsx` is isolated enough to receive a focused redesign. The main missing piece is a shell-level preset state model plus a shared visual vocabulary.

**Primary recommendation:** implement a dedicated shell preset state in Zustand, animate width changes via Framer Motion on the shell containers, and let route/context decide the initial preset while preserving a small amount of user control where needed. This keeps complexity lower than drag-resizing while still fulfilling the dynamic-layout requirement.

---

## Current UI Findings

### 1. The shell is fixed and over-commits to chat

- `src/app/(app)/layout.tsx` hardcodes `w-[40vw]` and `w-[60vw]`.
- The left panel therefore always has the same dominance regardless of task.
- This conflicts with the intended `standard / deep_read / graph_zenith` model.

### 2. Conversation history is visually noisy

- `AppSidebar.tsx` renders a long uniform list of conversations.
- Every row surfaces TTL countdown text, which makes history feel like operational clutter rather than curated memory.
- Titles are visually weak and metadata-heavy, which reinforces the “many unnamed chats” problem.

### 3. Chat still reads as a styled messaging app

- `MessageList.tsx` renders assistant output inside rounded bordered cards.
- The empty state is a single generic sentence in the center of the panel.
- The input bar and current message framing do not yet establish the “quiet desk” or “editorial workspace” feeling.

### 4. Empty states are still template-like

- `GraphPanel.tsx` uses an emoji-in-circle empty state with generic prose.
- `review/page.tsx` completion state uses celebratory emoji treatment and dashboard-like stat cards.
- These patterns are serviceable but not aligned with the product’s visual philosophy.

### 5. Review controls contradict the requirement

- `review/page.tsx` uses red/orange/blue/green button fills for `Again`, `Hard`, `Good`, `Easy`.
- Phase 9 explicitly requires monochrome controls with hierarchy conveyed through weight and emphasis.

### 6. Phase 7 queue debt still exists

- The existing Phase 7 audit explicitly deferred flatter row treatment, calmer micro-type, and semantic terracotta tokens into this phase.
- Those should be treated as part of the broader left-panel editorial system rather than a separate queue-only refactor.

---

## Recommended Architecture Patterns

### Pattern 1: Shell preset state with named modes

Recommended shape:

```typescript
type ShellPreset = 'standard' | 'deep_read' | 'graph_zenith';
```

Use a dedicated store field for the current preset and derive left/right width targets from that state. Keep the implementation declarative:

- `standard` for default `/app` and `/app/queue`
- `deep_read` for `/app/review` and other heavy reading/editing contexts
- `graph_zenith` for explicit graph-first contexts or detail-focused traversal

Avoid drag handles and free-form resizing.

### Pattern 2: Curated history derived from TTL windows

Use conversation timestamps to derive:

- `Active/Recent`: last 48h
- `Fading`: older than 48h but not yet expired

Presentation guidance:

- Active items: solid text, minimal metadata
- Fading items: terracotta/rust title treatment, 60% opacity, softer metadata
- TTL language should be collapsed into a quieter secondary line or hover/disclosure pattern rather than repeated hard countdown labels

### Pattern 3: Editorial chat rendering

Recommended presentation:

- Assistant messages become borderless or near-borderless prose blocks with generous measure, serif typography, and less “container” feeling
- User messages stay more compact and quieter than the assistant, behaving like annotations or prompts rather than peer chat bubbles
- Empty chat state becomes a composed editorial surface with large type, subtle structure lines, and a low-pressure entry point

### Pattern 4: Shared semantic tokens

Phase 9 should stabilize:

- terracotta/rust for fading/decay
- a tighter typography scale
- a smaller set of font weights
- motion timing tokens for shell/list/detail transitions

This is important because the current app mixes generic white utilities with one-off orange/red/green/blue usage.

### Pattern 5: Motion as structural reinforcement

Use Framer Motion to emphasize spatial shifts, not decoration:

- shell preset width transitions
- staggered conversation-section entry
- subtle fade/scale on supportive detail surfaces
- progress/state transitions on review and queue sections

Avoid bounce-heavy or game-like motion.

---

## Risks And Mitigations

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Preset logic becomes janky or conflicting | Shell state can become hard to reason about if route, local state, and user intent all fight | Keep one canonical preset field in store and establish a strict precedence order |
| History grouping obscures important sessions | Over-curation can make users feel like chats disappeared | Keep sections explicit and preserve all active sessions, just with calmer grouping |
| Editorial chat goes too minimal | Removing too much structure can make long AI output hard to parse | Keep quiet typographic rhythm and spacing, but not a totally structureless text wall |
| Review redesign loses clarity without colors | Users still need fast difficulty recognition | Use label hierarchy, interval text, position, and typography differences to retain clarity |
| Queue follow-through gets forgotten | Phase 7 audit debt is easy to miss once shell work starts | Bake queue row/tone updates into Phase 9 plan scope explicitly |

---

## Verification Recommendation

Before closing Phase 9, verify five concrete flows:

1. New-account or empty-chat `/app` state feels like a calm workspace, not a demand for immediate chat.
2. Conversation history clearly separates `Active/Recent` from `Fading`, and `Fading` communicates decay without shouting.
3. Switching into review or graph-heavy contexts visibly changes the shell preset and feels intentional rather than jarring.
4. Assistant messages read as editorial prose while still keeping user prompts legible.
5. Review difficulty controls are fully monochrome and still easy to use quickly.

---

*Phase: 09-ui-polish-design-system*
*Research completed: 2026-03-22*
