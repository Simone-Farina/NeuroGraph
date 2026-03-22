# Phase 8: Crystallize Flow - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn a queue item into an active Socratic chat session by extracting URL content on explicit Crystallize, generating a seed summary, handling extraction failure with a manual paste fallback, and marking the originating queue item as `mastered` only after successful Neurogenesis from that crystallize-linked conversation.

This phase clarifies the crystallize handoff and provenance loop. It does not expand the queue state machine, add queue search/filtering, redesign chat history, or add generalized document ingestion.

</domain>

<decisions>
## Implementation Decisions

### Crystallize entry and landing surface
- Crystallize remains route-based and reuses the existing `/app` chat surface; no separate wizard page or modal is introduced.
- The queue item selected in Phase 7 via `pendingCrystallizeItemId` is the single source of truth for starting the crystallize flow.
- A crystallized session should feel like entering a guided conversation, not reading a generated report. The seed summary exists to start the Socratic exchange, not to replace it.

### Seed content shape
- For a successful URL extraction, the new session should open with a concise assistant-authored briefing plus a Socratic opening question.
- The visible seed should include the source title, source URL/domain, the distilled summary, and any user notes from the queue item when present.
- The seed must remain editorial and compressed. Do not dump full article text into the visible chat transcript.

### Extraction and fallback contract
- URL extraction happens only on explicit Crystallize for URL-backed queue items; capture itself remains lightweight and summary-free.
- The extraction path stays Node.js based and bounded by a strict timeout. Timeout, paywall, empty extraction, or clearly unusable content all count as extraction failure.
- Extraction failure keeps the user in the same crystallize flow and exposes a manual paste path inside the chat surface rather than ejecting them back to the queue.
- Manual paste fallback must preserve the association to the originating queue item so the eventual Neurogenesis can still master the correct item.

### Queue provenance and mastered transition
- A crystallized chat session must carry explicit provenance for exactly one source queue item.
- The queue item does not become `mastered` when Crystallize starts, when extraction succeeds, or when the summary is generated. It becomes `mastered` only after a successful Neuron creation from that crystallize-linked conversation.
- If the user chats but never creates a neuron, the queue item remains in its prior triaged state.
- The mastered handoff should be idempotent: repeated Neurogenesis from the same crystallize-linked session must not create repeated or ambiguous queue transitions.

### Claude's Discretion
- The exact persistence mechanism for crystallize provenance (conversation-level metadata, a dedicated linkage record, or another implementation that cleanly fits the schema)
- Loading-state choreography while extraction and summarization are running
- The exact fallback component shape for manual paste, as long as it remains calm and embedded in the chat flow

</decisions>

<specifics>
## Specific Ideas

- [auto] `gsd-next` invoked this discussion in execute/default mode, so defaults were selected from existing project decisions instead of stopping for interactive questioning.
- The crystallize handoff should preserve AI isolation: queue items remain invisible to normal chat unless the user explicitly chose Crystallize.
- The conversation should open as a guided analysis session, not as a pre-filled archive note.
- The fallback should feel like continuity, not failure recovery theater: “paste the article text and continue” inside the same chat surface.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and milestone constraints
- `.planning/PROJECT.md` — Defines Active Extraction, AI isolation from the queue, and the v1.1 Staging Area milestone goals
- `.planning/REQUIREMENTS.md` — Defines CRYST-01 through CRYST-03 and the milestone traceability
- `.planning/STATE.md` — Captures the executed Phase 7 decisions and the post-Phase-7 hardening constraints
- `.planning/ROADMAP.md` — Defines the fixed Phase 8 boundary and success criteria

### Upstream queue decisions
- `.planning/phases/07-queue-triage-ui/07-CONTEXT.md` — Locked queue interaction decisions, especially route-based queue access and inbox-only behavior
- `.planning/phases/07-queue-triage-ui/07-02-SUMMARY.md` — Documents the current crystallize handoff trigger from queue items into `/app`
- `.planning/phases/07-queue-triage-ui/07-03-SUMMARY.md` — Documents shell-level queue hydration and confirms Phase 8 as the next dependent phase

### Capture and extraction constraints
- `.planning/phases/06-capture-api-key-management/06-CONTEXT.md` — Capture semantics, duplicate handling, and URL metadata expectations from the existing queue pipeline
- `.planning/phases/06-capture-api-key-management/06-RESEARCH.md` — Locked extraction choice: `@extractus/article-extractor` on Node.js runtime with bounded timeout and explicit failure signaling

### Design contract
- `.impeccable.md` — Danish Computation visual contract, low-anxiety interaction style, and semantic color rules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/queueStore.ts` — Already carries `pendingCrystallizeItemId`, `beginCrystallize()`, and `clearCrystallizeIntent()` for the queue-to-chat handoff
- `src/components/queue/QueuePageClient.tsx` — Already routes `Crystallize` actions from queue items back to `/app`
- `src/components/chat/ChatPanel.tsx` — Existing chat entrypoint with `useChat`, lazy conversation creation, message loading, and conversation refresh behavior
- `src/app/api/chat/route.ts` — Existing conversation creation and message persistence boundary; likely landing zone for crystallize-session seeding or adjacent orchestration
- `src/app/api/neurons/route.ts` — Already receives `source_conversation_id`, which is the current hook for deciding when a crystallize session should master its queue item

### Established Patterns
- Queue state stays in `queueStore`, separate from `graphStore`; route handlers remain the mutation boundary
- Session-authenticated App Router handlers are the norm for browser-triggered flows
- AI-assisted chat already streams through `/api/chat` and persists user/assistant messages to `messages`
- Queue content is structurally isolated from normal chat until an explicit handoff occurs

### Integration Points
- Queue → chat handoff begins in `src/components/queue/QueuePageClient.tsx`
- Chat session creation currently happens in `src/app/api/chat/route.ts`
- Neurogenesis completion currently flows through `src/components/chat/ChatPanel.tsx` into `src/app/api/neurons/route.ts`
- Mastered queue mutation will need to connect the neuron-creation path back to the originating queue item without breaking AI isolation elsewhere

</code_context>

<deferred>
## Deferred Ideas

- Chat-side URL thumbnail rendering in the NeuroGraph visual style — captured separately as a product note, but outside the fixed Phase 8 scope
- Redesign of the left-side chat history panel to better match the UX philosophy — Phase 9/UI polish territory
- Broader agent/prompt-engineering system work (DAG manager, Chat Analyzer, promptfoo evaluation) — separate future phase or milestone
- Generalized document ingestion beyond explicit crystallize/manual paste fallback — remains out of scope by product principle

</deferred>

---

*Phase: 08-crystallize-flow*
*Context gathered: 2026-03-22*
