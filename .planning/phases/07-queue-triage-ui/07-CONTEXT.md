# Phase 7: Queue Triage UI - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Staging Area queue interface inside the existing left-panel app shell so users can navigate to `/app/queue`, review queued items grouped by state, triage them inline, and feel gentle ambient pressure from unresolved Passive Debt without turning the product into an anxious dashboard.

</domain>

<decisions>
## Implementation Decisions

### Queue Page Composition
- **STACKED EDITORIAL SECTIONS**: The queue lives on one elegant, scrollable `/app/queue` page in the existing left panel.
- Sections appear in this fixed order: **Inbox** (urgent/new), **Passive Debt** (lingering), **Resources** (archived).
- Section headers should feel like a curated index rather than a dashboard: minimal typography, muted serif or crisp mono treatment, quiet spacing, and no loud KPI framing.

### Triage Action Surface
- **INLINE ACTIONS ONLY**: No detail pane, nested modal, or secondary preview surface in Phase 7.
- Queue actions live directly on each item row/card: archive as resource, mark read to passive debt, crystallize entry point, and delete where appropriate.
- Actions must stay extremely subtle: muted icons or small monochrome text buttons, with hover emphasis only. No bright CTA buttons, no chunky control bars, no colorful status pills.

### Auto-Advance Trigger
- **INBOX MEANS UNSEEN** and **PASSIVE DEBT MEANS CONSUMED BUT UNSYNTHESIZED**.
- The only automatic transition from `inbox` to `passive_debt` happens when the user explicitly clicks the external URL to actually read or watch the source content.
- Merely rendering the item, scrolling past it, or opening queue view itself does not count as consumption.

### Sidebar Badge Semantics
- **INBOX ONLY**: The sidebar queue badge counts only items in the `inbox` state.
- Passive Debt and Resources do not contribute to the badge count.
- The badge should feel like an unread inbox indicator that can return to zero, not a permanent backlog alarm.

### Passive Debt Pressure
- **HUMAN AGING + SEMANTIC RUST**: Passive Debt items display a small human-readable age label such as `3 days ago`.
- After a configurable aging threshold during implementation planning, the aging indicator should adopt the product's decay semantic color language.
- Use the muted rust / burnt terracotta semantic from `.impeccable.md` to imply "rusting knowledge" without reading as an error or alert state.
- Apply this pressure subtly, for example via the age text and/or a restrained left-border accent. Never use aggressive red warning UI.

### Visual Tone & Emotional Contract
- The queue must obey the `.impeccable.md` design contract: Danish Computation, low-anxiety atmosphere, tactile dark surfaces, and semantic color only when state meaning requires it.
- Baseline UI remains monochrome; semantic color appears only where the queue is communicating meaningful learning state, especially Passive Debt decay.
- The page should feel like a calm sanctuary and curated reading index, not a task manager or productivity inbox.

### Claude's Discretion
- Exact row/card density, spacing rhythm, and responsive breakpoints inside the 40vw left panel
- The precise typography pairing for section headers versus queue metadata
- Whether inline actions reveal on hover, stay always visible, or mix visibility by state as long as they remain subtle
- The exact aging threshold and mapping to semantic rust styling, provided it remains calm and low-anxiety

</decisions>

<specifics>
## Specific Ideas

- "Inbox Zero peace of mind" is the right emotional model for the sidebar badge.
- Passive Debt should feel like quiet rusting, not an error queue.
- The queue should read like an editorial index inside a minimalist Danish notebook rather than a noisy dashboard.
- Inline actions should resemble whispered controls in the margin, not primary CTA surfaces.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope
- `.planning/PROJECT.md` — Milestone v1.1 Staging Area vision, left-panel constraint, and product philosophy
- `.planning/REQUIREMENTS.md` — Phase 7 requirements `TRIAGE-01` through `TRIAGE-05`
- `.planning/ROADMAP.md` — Phase 7 goal and success criteria
- `.planning/STATE.md` — Current project position and carried-forward decisions

### Prior Phase Decisions
- `.planning/phases/05-data-layer-auth-foundation/05-CONTEXT.md` — Queue schema, forward-only state machine, mastered-item behavior, and queue routing decision
- `.planning/phases/06-capture-api-key-management/06-CONTEXT.md` — Capture endpoint behavior and Staging Area framing carried into queue triage

### Design Contract
- `.impeccable.md` — Danish Computation visual direction, low-anxiety emotional contract, and semantic color system for decay/rust states

### Implementation Anchors
- `src/app/(app)/layout.tsx` — Existing 40/60 app shell where the queue page must live
- `src/components/layout/AppSidebar.tsx` — Sidebar navigation surface and badge integration point
- `src/stores/graphStore.ts` — Confirms queue must remain a route, not a new left panel mode
- `src/lib/db/queueQueries.ts` — Existing queue fetch/update/delete primitives and active-item query behavior
- `src/lib/validation/queue.ts` — Valid queue states and forward-only transition rules
- `src/types/database.ts` — `KnowledgeQueueItem` and `QueueItemState` types

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/AppSidebar.tsx` already owns app navigation and is the natural place to add the Queue nav item plus Inbox-only badge
- `src/lib/db/queueQueries.ts` already provides `getActiveByUserId`, `getById`, `updateState`, and `deleteItem`, which cover most Phase 7 server interactions
- `src/lib/validation/queue.ts` already encodes the allowed funnel transitions, so Phase 7 should reuse these rules rather than redefining them

### Established Patterns
- The authenticated UI shell in `src/app/(app)/layout.tsx` reserves a fixed 40vw left panel for route content and keeps alternate left-panel modes limited to chat, neuron, and review
- Existing pages use tactile dark surfaces, restrained borders, and Framer Motion transitions; new queue UI should preserve that visual language while following `.impeccable.md`
- API routes and client fetch flows already use optimistic local UI patterns with server confirmation elsewhere in the app; Phase 7 can follow the same pattern for queue state changes

### Integration Points
- New route page should live under the authenticated app router at `/app/queue`
- Phase 7 likely needs queue-focused API routes or route handlers that wrap `queueQueries.updateState` and `queueQueries.deleteItem`
- Sidebar nav and badge logic will be extended in `src/components/layout/AppSidebar.tsx`
- Crystallize remains a Phase 8 feature, but Phase 7 must expose a subtle inline entry point so the later flow can plug into the triage surface cleanly

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within the Phase 7 boundary.

</deferred>

---

*Phase: 07-queue-triage-ui*
*Context gathered: 2026-03-22*
