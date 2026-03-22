# Phase 9: UI Polish & Design System - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Elevate the shipped Staging Area from a functional prototype into a high-end editorial workspace. This phase polishes existing shell, chat, queue, graph-empty, and review surfaces so they feel coherent with the Danish Computation design contract: calm, semantic, intentional, and low-anxiety.

This phase clarifies how to polish the app shell, navigation/history, chat prose, empty states, review controls, and motion language. It does not add new product capabilities such as URL thumbnails in chat, queue search/filtering, browser extensions, or agent/promptfoo systems.

</domain>

<decisions>
## Implementation Decisions

### Main page composition
- The left panel should feel like a calm editorial workspace, not a generic chat wrapper.
- On first load or empty/new-account states, the UI must not visually shout for chat interaction. It should read like a quiet desk or cognitive lab.
- Use Danish Computation cues: oversized serif or mono headlines, subtle 1px dividers, restrained surfaces, and a very understated input bar anchored at the bottom.
- Chat history should be visually suppressed until it is useful instead of competing with the primary workspace state.

### Conversation history model
- Conversation history should be curated rather than presented as a long stack of equally weighted chats.
- History is grouped into:
  - `Active/Recent` for the last 24-48 hours with solid text treatment
  - `Fading` for sessions approaching the 14-day TTL
- `Fading` conversations should visually communicate imminent loss through muted terracotta/rust semantics and reduced opacity rather than loud warning styling.
- The TTL should feel like a visual story of decay, not just a sudden deletion or a repeated row of countdown labels.
- History clutter must be reduced: fewer noisy metadata elements, stronger titling, and less “many unnamed chats” energy.

### Dynamic shell behavior
- The app uses named layout presets, not drag-to-resize.
- Preset A: `Standard / Explore` at roughly `40vw / 60vw` and used as the default shell.
- Preset B: `Deep Read / Write` at roughly `60/40` or `70/30`, used when review or heavy reading/writing is the primary task.
- Preset C: `Graph Zenith` at roughly `20/80`, used when traversing the DAG or hunting rust; the left side compresses to a thin supportive rail.
- Presets should be managed by Zustand and animated through Framer Motion, not by arbitrary resizer state.

### Phase 9 priority order
- Phase 9 stays balanced across all five POLISH requirements, but shell/navigation/history comes first if tradeoffs are required.
- Structural polish precedes ornamental polish: once the shell feels like a high-end lab, editorial chat and empty-state refinement becomes easier and more coherent.
- Remaining Phase 7 UI review work belongs here, especially flatter editorial queue treatment, calmer typography hierarchy, and stable terracotta semantic tokens.

### Chat, review, and motion direction
- Assistant messages should render as editorial prose rather than chat bubbles.
- Empty states for chat and graph must teach the interface in brand voice and feel intentional, not template-like.
- Review difficulty controls must be monochrome. Difficulty should be communicated through size, weight, spacing, and emphasis rather than red/orange/green/blue fills.
- Motion should express spatial intent with a small, consistent language: shell preset transitions, staggered list reveals, and restrained fade/scale choreography.

### Claude's Discretion
- Exact trigger rules and fallback logic for switching between `standard`, `deep_read`, and `graph_zenith`
- Exact typography token set and semantic color variable names
- Exact microcopy and disclosure level for fading conversation metadata
- Exact component boundaries for motion tokens and shell-preset state

</decisions>

<specifics>
## Specific Ideas

- “The left panel currently feels too much like a generic ChatGPT wrapper and not enough like a high-end Editorial Workspace / Cognitive Lab.”
- “On first load or empty state, the left panel should NOT scream ‘Chat with me!’.”
- “The 14-day TTL shouldn’t just be a sudden deletion; it should be a visual story.”
- “Treat Phase 9 as the moment NeuroGraph stops looking like a prototype and starts looking like a $30/month professional tool.”
- The `Fading` concept should use semantic rust, not alarm red.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase constraints
- `.planning/PROJECT.md` — Defines the Active Extraction core value and the v1.1 Staging Area milestone
- `.planning/REQUIREMENTS.md` — Defines POLISH-01 through POLISH-05
- `.planning/ROADMAP.md` — Defines the fixed Phase 9 boundary and success criteria
- `.planning/STATE.md` — Captures prior shell, queue, crystallize, and validation decisions

### Prior UI decisions
- `.planning/phases/07-queue-triage-ui/07-CONTEXT.md` — Locked low-anxiety queue, typography, and semantic-rust decisions
- `.planning/phases/07-queue-triage-ui/07-UI-REVIEW.md` — Deferred queue polish items explicitly absorbed into Phase 9
- `.planning/phases/08-crystallize-flow/08-CONTEXT.md` — Keeps chat continuity, calm fallback behavior, and AI-isolation expectations aligned

### Design contract and product notes
- `.impeccable.md` — Danish Computation visual contract, low-anxiety interaction style, semantic colors
- `.planning/notes/2026-03-22-current-main-page-ui.md` — Main page feels too chat-dominant
- `.planning/notes/2026-03-22-left-side-panel-chat-history.md` — History clutter and unnamed-chat problem statement

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(app)/layout.tsx` — Current 40/60 shell with left and right panel boundaries
- `src/components/layout/AppSidebar.tsx` — Navigation, queue badge, and current conversation-history presentation
- `src/components/chat/ChatPanel.tsx` — Current left-panel chat composition and crystallize notices
- `src/components/chat/MessageList.tsx` — Current bubble-like message rendering and chat empty state
- `src/components/graph/GraphPanel.tsx` — Current graph empty state and shell behavior
- `src/app/(app)/app/review/page.tsx` — Current review UI with colored rating buttons and generic completion state
- `src/components/queue/*` — Existing queue surface that still needs Phase 7 review follow-through
- `framer-motion` — Already present and used in the sidebar/review page

### Established Patterns
- Zustand owns cross-shell UI state; queue state remains isolated in `queueStore`
- Framer Motion is already an accepted dependency for shell and page transitions
- The app currently depends on utility-class styling inside components, with a need for calmer tokenization in typography and semantic colors
- Left-panel surfaces are route-backed and should stay low-ceremony rather than modal-heavy

### Integration Points
- Shell preset logic will affect `src/app/(app)/layout.tsx`, `AppSidebar`, and potentially graph detail behavior
- History grouping and fading semantics live in `AppSidebar` plus conversation context data
- Editorial prose rendering and empty states connect `ChatPanel`, `MessageList`, and `GraphPanel`
- Review-page polish is isolated enough to execute after shell and chat structural work

</code_context>

<deferred>
## Deferred Ideas

- Chat-side URL thumbnail rendering in the NeuroGraph visual style — valid product idea, but a separate capability outside the fixed Phase 9 scope
- Agent system construction, system prompt hardening, and promptfoo evaluation — separate future phase/todo
- Queue search/filtering, batch triage, or other backlog-management capabilities — separate future phase

</deferred>

---

*Phase: 09-ui-polish-design-system*
*Context gathered: 2026-03-22*
