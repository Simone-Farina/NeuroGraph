# Phase 8: Crystallize Flow - Research

**Researched:** 2026-03-22
**Domain:** Session-authenticated crystallize orchestration, URL extraction, seeded chat handoff, queue provenance
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Crystallize entry and landing**
- Crystallize remains route-based and lands in the existing `/app` chat surface.
- `pendingCrystallizeItemId` in `queueStore` is the single source of truth for starting the flow.
- The session must open as a guided Socratic exchange, not a static report.

**Seed content shape**
- Successful crystallize opens with a concise assistant-authored briefing plus one Socratic opening question.
- Visible seed includes source title, source URL/domain, distilled summary, and queue notes when present.
- Full article text must not be dumped into the visible transcript.

**Failure and fallback**
- URL extraction happens only on explicit Crystallize.
- Timeout, paywall, empty extraction, or clearly unusable content all count as extraction failure.
- Failure stays inside the same chat flow and exposes manual paste inside chat.
- Manual paste must preserve queue provenance so Neurogenesis can still master the right queue item.

**Mastered transition**
- Crystallized sessions carry explicit provenance for exactly one queue item.
- Queue items become `mastered` only after successful Neurogenesis from that crystallize-linked conversation.
- The mastered handoff must be idempotent.

### Claude's Discretion
- Exact backend route split for start vs manual-paste continuation
- Exact loading choreography while extraction and summary generation run
- Exact message metadata shape for provenance and fallback detection

### Deferred Ideas (OUT OF SCOPE)
- Chat-side URL thumbnails
- Chat history redesign
- Prompt-engineering / agent system work
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRYST-01 | User can click "Crystallize" on a queue item to auto-fetch URL content, generate an AI summary, and open a new chat session seeded with the summary + notes | Dedicated `POST /api/crystallize` route should create the conversation, run extraction + summary, and persist a seeded assistant message before the chat view loads |
| CRYST-02 | If URL extraction fails (paywall, SPA, timeout), system shows a manual paste area for the user to provide content | Same conversation should be created with crystallize metadata and an assistant placeholder state of `awaiting_manual_paste`; chat UI reads that state and renders an embedded paste composer |
| CRYST-03 | When a Neuron is created from a Crystallize-initiated chat session, the originating queue item auto-transitions to `mastered` | `POST /api/neurons` should resolve queue provenance from `messages.metadata`, walk the existing allowlist path to `mastered`, and return the mastered queue item id for client refresh |
</phase_requirements>

---

## Summary

Phase 8 is best implemented as a three-part handoff:

1. A backend crystallize starter route creates a fresh conversation, attempts article extraction for URL-backed queue items, summarizes successful content, and persists a seeded assistant message with crystallize provenance in `messages.metadata`.
2. The chat surface detects queue-side crystallize intent, calls the starter route, and then either loads the seeded conversation or renders an embedded manual-paste composer when the route returns `awaiting_manual_paste`.
3. The neuron creation route resolves crystallize provenance from message metadata and advances the queue item to `mastered` by walking the existing state machine rather than bypassing it.

The cleanest provenance mechanism is `messages.metadata`, not a new table or a conversation-column migration. The database already has a `messages.metadata JSONB` column from `src/lib/db/migrations/009_add_messages_metadata.sql`; the missing piece is TypeScript type parity plus a shared crystallize metadata contract. This keeps provenance local to crystallized sessions, avoids widening the conversation schema, and lets the chat UI detect fallback/manual-paste state from messages it already loads.

The one new package needed is `@extractus/article-extractor`, which is already the locked choice from prior research but is not yet present in `package.json`. The extraction layer should run on the Node.js runtime with an 8 second timeout to stay within Vercel Hobby limits while leaving room for route overhead.

**Primary recommendation:** Use two routes: `POST /api/crystallize` to start the session and `POST /api/crystallize/manual` to continue a failed extraction with pasted text. Keep the visible transcript editorial by persisting only the assistant seed plus a small manual-paste marker message; do not store raw article text in visible chat content.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `next` App Router | existing | Session-authenticated route handlers | Existing server boundary |
| `@supabase/ssr` | existing | Cookie-session Supabase client | Existing auth pattern for browser-triggered flows |
| `ai` | existing | `generateText` for compressed crystallize summary generation | Already used in chat stack |
| `@ai-sdk/*` providers | existing | Use `getModelForRole('synthesis_fast')` for fast summary generation | Existing model routing layer |
| `zod` | existing | Route payload validation | Existing validation pattern |
| `zustand` | existing | Queue-side crystallize intent already lives in `queueStore` | Existing state source |

### New dependency

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@extractus/article-extractor` | latest compatible | Article extraction for URL-backed crystallize | Must be added to `package.json`; Node.js runtime only |

### What NOT to add

- No new Supabase Edge Functions
- No new queue/conversation linkage table
- No browser-side article extraction
- No full article-text persistence in visible messages

---

## Architecture Patterns

### Pattern 1: Dedicated `POST /api/crystallize` start route

**Why:** The current `/api/chat` route only persists a user message and streams a response. Phase 8 needs conversation creation before the user types anything, plus extraction/summary orchestration that should not leak into normal chat.

**Recommended contract:**

```typescript
type StartCrystallizeRequest = {
  queueItemId: string;
};

type StartCrystallizeResponse =
  | {
      conversationId: string;
      queueItemId: string;
      mode: 'seeded';
    }
  | {
      conversationId: string;
      queueItemId: string;
      mode: 'awaiting_manual_paste';
      reason: 'missing_url' | 'timeout' | 'paywall' | 'empty' | 'unsupported';
    };
```

Implementation notes:
- Validate session with `createServerSupabaseClient()`.
- Load the queue item for the user before doing any work.
- Create the conversation first with title `Crystallize: ${queueItem.title.slice(0, 80)}`.
- If there is no URL, skip extraction and immediately create the manual-paste placeholder.
- If there is a URL, attempt extraction with `AbortSignal.timeout(8000)`.
- Treat extraction as unusable when normalized content is shorter than 400 characters after trimming.

### Pattern 2: Provenance via `messages.metadata`

**Why:** The DB already has `messages.metadata JSONB`, and the chat loader already returns metadata. This gives both server and client a shared, session-local source of truth without a schema migration.

**Recommended metadata shape:**

```typescript
type CrystallizeFailureReason =
  | 'missing_url'
  | 'timeout'
  | 'paywall'
  | 'empty'
  | 'unsupported';

type CrystallizeMetadata = {
  crystallize: {
    queue_item_id: string;
    source_title: string;
    source_url: string | null;
    source_domain: string | null;
    status: 'seeded' | 'awaiting_manual_paste';
    failure_reason?: CrystallizeFailureReason;
    notes_present: boolean;
  };
};
```

Use this metadata on the first assistant message in the conversation. For manual-paste continuation, insert one small user marker such as `Source material pasted for crystallization.` with metadata carrying the same queue linkage plus `pasted_characters`.

### Pattern 3: Summary generation stays compressed and editorial

**Why:** Phase 8 must start a conversation, not create a passive note dump.

Use `generateText` with `getModelForRole('synthesis_fast')` and a prompt that returns compact JSON:

```json
{
  "briefing": "3-5 sentence editorial briefing",
  "openingQuestion": "One Socratic question"
}
```

The visible assistant seed should render:
- source title
- source domain / URL
- condensed briefing
- queue notes, if present
- one opening question

Do not include extracted raw body text in the visible message.

### Pattern 4: Manual paste stays in the same conversation

**Why:** The context explicitly rejects ejecting the user back to queue or into a separate wizard.

Recommended route:

```typescript
type ManualCrystallizeRequest = {
  conversationId: string;
  queueItemId: string;
  pastedText: string;
};
```

Implementation notes:
- Require `pastedText.trim().length >= 500`.
- Summarize the pasted text using the same summary helper as extraction success.
- Persist a small user marker message, not the raw pasted text.
- Persist the final seeded assistant message with `status: 'seeded'`.
- Return `{ success: true }`; the client can reload the conversation messages it already knows how to fetch.

### Pattern 5: Mastered transition walks the existing allowlist

**Why:** The locked queue state machine only allows `passive_debt -> mastered`, while crystallize can begin from `inbox`, `passive_debt`, or `resource`.

Do not bypass `queueQueries.updateState`. Instead, promote through allowed steps:
- `inbox -> passive_debt -> mastered`
- `resource -> passive_debt -> mastered`
- `passive_debt -> mastered`
- `mastered` -> no-op

This preserves the server-side transition authority already established in Phase 7 and keeps CRYST-03 compatible with the existing queue model.

---

## Risks And Mitigations

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Article extractor package not yet installed | Phase 8 backend route cannot compile until dependency exists | Make dependency install explicit in Plan 08-01 and keep helper interfaces stable for TDD before install |
| `messages.metadata` missing from local TS types | Crystallize metadata work will produce type drift and unsafe `any` usage | Update `src/types/database.ts` in Plan 08-01 before route wiring |
| Long extraction on Vercel Hobby | Starter route can drift toward timeout | Keep hard timeout at 8 seconds and treat timeout as first-class fallback |
| Queue mastery from `resource` or `inbox` | Direct `-> mastered` is invalid under current allowlist | Use sequential allowed transitions only |
| Manual paste transcript bloat | Violates the editorial brief and creates chat clutter | Persist only a short marker plus the seed summary, never the raw pasted body |

---

## Verification Recommendation

Before closing Phase 8, verify three concrete flows:

1. URL-backed queue item with successful extraction creates a conversation containing a seeded assistant message before the user types.
2. Extraction failure produces a conversation with `awaiting_manual_paste` metadata, shows an embedded paste composer, and succeeds after paste submission without leaving `/app`.
3. Creating a neuron from that conversation returns a mastered queue id and causes the originating queue item to disappear from active queue sections on the next refresh.

---

*Phase: 08-crystallize-flow*
*Research completed: 2026-03-22*
