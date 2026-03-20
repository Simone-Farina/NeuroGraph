# Phase 1: Knowledge Quality & Ephemerality - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Enforcing Active Extraction by preventing duplicate Neurons (AI Bouncer) and wiping ephemeral chats (14-day TTL).

</domain>

<decisions>
## Implementation Decisions

### The 14-day TTL Wipe
- **PROACTIVE UI COUNTDOWN**: This is a forcing function to incentivize extraction.
- The UI must broadcast this. The Left Panel's Sidebar (chat list) must display a subtle visual indicator (e.g., "12d left").
- When a chat is < 24 hours old, the indicator turns red/urgent. No silent wipes.
- Use a Supabase `pg_cron` job (or Edge Function) to physically delete the rows.

### AI Bouncer Rejection UX
- **SYSTEM CARD WITH ESCAPE HATCH**: It's a helpful guide, not an error.
- When the AI Bouncer (running `pgvector` similarity check) detects a semantic collision during Neurogenesis, it injects a custom React component into the chat stream.
- The UI clearly states: "This insight closely matches your existing Neuron: [[Neuron Title]]."
- Presents two buttons:
  - `Append to Existing` (Primary action: switches Left Panel to that Neuron's Markdown editor and queues the insight for injection).
  - `Force New Neuron` (Secondary, ghost button: escape hatch for false positives).

### Blocked Insight Persistence
- **IN-MEMORY HOLD (NO DRAFTS PAGE)**: Never lose user input, but avoid cluttering the app with drafts management.
- If intercepted, the generated insight or selected text is held in the React state of that specific Bouncer UI Card in the chat.
- If the user clicks `Append to Existing`, that exact held text is automatically passed to the `PATCH /api/neurons/[id]` endpoint.
- If the chat expires, the un-extracted text dies with it.

### Claude's Discretion
- Logic for selecting which elements to query pgvector against.
- Exact threshold for cosine similarity (initially defaulting to >0.85).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Conventions
- `.planning/codebase/ARCHITECTURE.md` — Core abstractions, 40/60 split UI, AI routing.
- `.planning/codebase/CONVENTIONS.md` — Style, State Management, and Supabase integration.

### Database
- `.planning/codebase/INTEGRATIONS.md` — Supabase `pgvector` usage.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The `leftPanelMode` Zustand store (to switch to the Neuron Markdown editor).
- The `src/lib/ai/providers.ts` environment-based routing.

### Established Patterns
- Zustand for bidirectional sync across the 40vw/60vw split.
- Vercel AI SDK v6 for chat streaming.

### Integration Points
- Add `pg_cron` migrations in Supabase SQL dashboard/files.
- Add AI Bouncer UI component to the Left Panel chat interface.
- Add vector search utility function for `neurons`.

</code_context>

<specifics>
## Specific Ideas

- Visual warning in the chat sidebar when `< 24h` old.
- "Append to Existing" behavior should immediately patch the Neuron.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-knowledge-quality-ephemerality*
*Context gathered: 2026-03-21*
