# Architecture Research

**Domain:** Cognitive Funnel / Staging Area integration into existing Next.js + Supabase knowledge graph
**Researched:** 2026-03-22
**Confidence:** HIGH (based on direct codebase analysis)

---

## Standard Architecture

### System Overview — Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                    │
├──────────────────────────────┬──────────────────────────────────────────────┤
│  LEFT PANEL (40vw)           │  RIGHT PANEL (60vw)                          │
│  ┌────────────┐ ┌──────────┐ │  ┌─────────────────────────────────────────┐ │
│  │ AppSidebar │ │ ChatPanel│ │  │  GraphPanel (React Flow + dagre layout) │ │
│  │            │ │(chat mode│ │  │                                         │ │
│  │ - nav links│ │ useChat) │ │  │  NeuronDetailPanel (mode=neuron overlay)│ │
│  │ - conv list│ │          │ │  │                                         │ │
│  └────────────┘ └──────────┘ │  └─────────────────────────────────────────┘ │
│                               │                                               │
│  graphStore: leftPanelMode: 'chat' | 'neuron' | 'review'                    │
│  ConversationContext: currentConversationId, conversations[]                 │
├──────────────────────────────┴──────────────────────────────────────────────┤
│                     Next.js 14 App Router (Route Handlers)                   │
│  /api/chat        → streamText, suggestNeurogenesisTool, RAG context         │
│  /api/neurons     → create neuron, bouncer check, synapse auto-link          │
│  /api/neurons/[id]/synapses → upsert edge                                   │
│  /api/conversations/[id] → DELETE conversation                               │
│  /api/review      → FSRS rating endpoint                                    │
│  /api/youtube     → transcript extraction                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                          Supabase (PostgreSQL)                                │
│  neurons (pgvector 1536-dim, FSRS fields, content, RLS)                     │
│  synapses (PREREQUISITE | RELATED | BUILDS_ON, RLS)                         │
│  conversations + messages (14-day TTL via pg_cron, RLS)                     │
│  Auth: Supabase Auth + SSR cookies via middleware.ts                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### System Overview — Target State (v1.1 Staging Area)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                    │
├──────────────────────────────┬──────────────────────────────────────────────┤
│  LEFT PANEL (40vw)           │  RIGHT PANEL (60vw)                          │
│  ┌────────────┐ ┌──────────┐ │  ┌─────────────────────────────────────────┐ │
│  │ AppSidebar │ │ Panel    │ │  │  GraphPanel (unchanged)                 │ │
│  │ + "Queue"  │ │ switches │ │  │                                         │ │
│  │   nav item │ │ on mode  │ │  │  NeuronDetailPanel (unchanged)          │ │
│  │   + badge  │ │          │ │  │                                         │ │
│  └────────────┘ └──────────┘ │  └─────────────────────────────────────────┘ │
│                               │                                               │
│  graphStore: leftPanelMode adds 'queue' to union                             │
│  NEW: queueStore (items[], isLoading, optimistic mutations)                  │
│  ConversationContext: unchanged, used by crystallize handoff                 │
├──────────────────────────────┴──────────────────────────────────────────────┤
│                     Next.js 14 App Router (Route Handlers)                   │
│  --- EXISTING (unchanged) ---                                                │
│  /api/chat  /api/neurons  /api/review  /api/youtube                         │
│                                                                              │
│  --- NEW ---                                                                 │
│  /api/queue              → GET list, POST create (browser)                  │
│  /api/queue/[id]         → PATCH state transition, DELETE discard           │
│  /api/queue/[id]/crystallize → POST: fetch URL + summarize + seed convo     │
│  /api/capture            → POST with Bearer token (iOS Shortcuts)           │
│  /api/keys               → GET list, POST generate key                      │
│  /api/keys/[id]          → DELETE revoke                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                          Supabase (PostgreSQL)                                │
│  --- EXISTING (unchanged) ---                                                │
│  neurons, synapses, conversations, messages                                  │
│                                                                              │
│  --- NEW ---                                                                 │
│  knowledge_queue  (4-state funnel, source_url, extracted_content, RLS)      │
│  user_api_keys    (hashed_key, label, last_used_at, revoked_at, RLS)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Existing Components — What Changes

| Component | Current Role | v1.1 Change |
|-----------|-------------|-------------|
| `graphStore.ts` | `leftPanelMode: 'chat' | 'neuron' | 'review'` | Add `'queue'` to the union type. Add `openQueue()` action. |
| `AppSidebar.tsx` | Nav links (Chat, Review) + conversation list | Add "Queue" nav link with unread badge count. Pattern matches existing nav items. |
| `types/database.ts` | Types for neurons, synapses, conversations, messages | Add `KnowledgeQueueItem`, `QueueItemState`, `ApiKey` types. |
| `app/(app)/layout.tsx` | Renders sidebar + children in 40vw | No structural change; children routing handles queue panel. |
| `middleware.ts` | Cookie auth for `/app/*` | No change. `/api/capture` is a separate route that handles bearer auth internally. |
| `/api/chat` route | Cookie auth, RAG context, streamText | No change. AI isolation means queue table is never queried here. |

### New Components

| Component | Type | Responsibility |
|-----------|------|----------------|
| `src/app/(app)/app/queue/page.tsx` | Page | Renders `QueuePanel` when navigated to |
| `src/components/queue/QueuePanel.tsx` | Client Component | Master triage list: all items, state filter tabs, bulk actions |
| `src/components/queue/QueueItem.tsx` | Client Component | Single row: title, state badge, source URL chip, action buttons |
| `src/components/queue/QueueEmptyState.tsx` | Client Component | Onboarding prompt when queue is empty |
| `src/stores/queueStore.ts` | Zustand store | Local queue state: items array, optimistic mutations |
| `src/hooks/useQueue.ts` | Custom hook | Fetches `/api/queue`, provides typed CRUD operations |
| `src/app/api/queue/route.ts` | Route Handler | GET (list user queue) + POST (create from browser) |
| `src/app/api/queue/[id]/route.ts` | Route Handler | PATCH (state transition) + DELETE (discard) |
| `src/app/api/queue/[id]/crystallize/route.ts` | Route Handler | POST: fetch URL → summarize → seed conversation → return conversationId |
| `src/app/api/capture/route.ts` | Route Handler | POST with `Authorization: Bearer <key>` — mobile/iOS Shortcuts endpoint |
| `src/app/api/keys/route.ts` | Route Handler | GET list + POST generate |
| `src/app/api/keys/[id]/route.ts` | Route Handler | DELETE revoke |
| `src/lib/db/queue.ts` | DB queries module | `queueQueries` object following the existing `neuronQueries` pattern in `queries.ts` |
| `src/lib/queue/extractor.ts` | Server utility | URL content fetch + HTML-to-text extraction (fetch + Cheerio or similar) |
| `src/lib/queue/summarizer.ts` | Server utility | Calls `getModelForRole('synthesis_fast')` to produce a learning-context summary |
| `src/lib/auth/apiKeys.ts` | Server utility | `generateApiKey()`, `hashApiKey()`, `verifyApiKey()` — crypto.randomBytes + SHA-256 |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (app)/
│   │   └── app/
│   │       ├── page.tsx              # unchanged — ChatPanel
│   │       ├── review/               # unchanged
│   │       └── queue/
│   │           └── page.tsx          # NEW — renders QueuePanel
│   ├── api/
│   │   ├── chat/                     # unchanged
│   │   ├── neurons/                  # unchanged
│   │   ├── review/                   # unchanged
│   │   ├── queue/
│   │   │   ├── route.ts              # NEW — GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts          # NEW — PATCH state, DELETE
│   │   │       └── crystallize/
│   │   │           └── route.ts      # NEW — crystallize orchestration
│   │   ├── capture/
│   │   │   └── route.ts              # NEW — bearer token endpoint
│   │   └── keys/
│   │       ├── route.ts              # NEW — GET/POST keys
│   │       └── [id]/
│   │           └── route.ts          # NEW — DELETE/revoke
├── components/
│   ├── layout/
│   │   └── AppSidebar.tsx            # MODIFIED — add Queue nav item + badge
│   ├── chat/                         # unchanged
│   ├── graph/                        # unchanged
│   └── queue/                        # NEW directory
│       ├── QueuePanel.tsx
│       ├── QueueItem.tsx
│       └── QueueEmptyState.tsx
├── hooks/
│   ├── useQueue.ts                   # NEW
│   └── (existing hooks unchanged)
├── lib/
│   ├── auth/
│   │   ├── apiKeys.ts                # NEW — key generation + verification
│   │   └── (existing files unchanged)
│   ├── db/
│   │   ├── queue.ts                  # NEW — queueQueries following queries.ts pattern
│   │   └── (existing files unchanged)
│   └── queue/
│       ├── extractor.ts              # NEW — URL fetch + content extraction
│       └── summarizer.ts             # NEW — synthesis_fast model prompt
├── stores/
│   ├── graphStore.ts                 # MODIFIED — add 'queue' + openQueue()
│   ├── queueStore.ts                 # NEW — local queue state
│   └── (existing stores unchanged)
└── types/
    ├── database.ts                   # MODIFIED — add KnowledgeQueueItem, ApiKey rows
    └── queue.ts                      # NEW — QueueItemState enum, domain types
```

### Structure Rationale

- **`src/app/api/capture/`** is separate from `/api/queue/` because it uses bearer auth instead of cookie sessions. Keeping them in separate files prevents auth logic from cross-contaminating.
- **`src/lib/queue/`** groups URL extraction and summarization as a pure library layer, keeping route handlers thin. This mirrors the existing `src/lib/ai/` pattern where `embeddings.ts`, `rag.ts`, `bouncer.ts` are library modules called by route handlers.
- **`src/lib/auth/apiKeys.ts`** lives alongside `supabase.ts` in `lib/auth/` — key verification is an authentication concern, not a queue concern.
- **`src/stores/queueStore.ts`** is a separate Zustand store rather than extending `graphStore`. `graphStore` owns graph/UI-mode state; queue items have different shape, lifecycle, and consumer components. The only bridge is `graphStore.openQueue()`.

---

## Architectural Patterns

### Pattern 1: Bearer Token API Key Auth (mobile capture endpoint)

**What:** The `/api/capture` route does NOT use Supabase SSR cookies. It reads `Authorization: Bearer <key>`, hashes it, looks up `user_api_keys`, and identifies the user from the stored `user_id`.

**When to use:** Only on `/api/capture`. Every other route continues using `createServerSupabaseClient()` with cookie sessions unchanged.

**Trade-offs:** Stateless, trivial for iOS Shortcuts to call with a static header. Keys are long-lived so revocation must be fast (soft-delete via `revoked_at`). Hashing (SHA-256) protects against DB compromise — raw key is never stored.

**Note:** `/api/capture` requires a Supabase **service role** client to look up keys (bypasses RLS). Store `SUPABASE_SERVICE_ROLE_KEY` as a server-only env var. The existing `createServerSupabaseClient()` is cookie-based and cannot be used here.

**Example:**
```typescript
// src/lib/auth/apiKeys.ts
import crypto from 'node:crypto';

export function generateApiKey(): string {
  return `ng_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// src/app/api/capture/route.ts (auth section)
const authHeader = request.headers.get('Authorization');
const rawKey = authHeader?.replace('Bearer ', '').trim();
if (!rawKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const hashed = hashApiKey(rawKey);
const { data: keyRow } = await supabaseAdmin
  .from('user_api_keys')
  .select('user_id, revoked_at')
  .eq('hashed_key', hashed)
  .single();

if (!keyRow || keyRow.revoked_at) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// keyRow.user_id is the authenticated user — proceed with insert
```

### Pattern 2: Server-Side State Machine Transitions

**What:** `knowledge_queue.state` is a controlled enum. The PATCH endpoint validates that the requested transition is allowed before writing to the DB.

**When to use:** Every state change goes through `/api/queue/[id]` — never a direct Supabase client write from the browser.

**Trade-offs:** One more round-trip per action, but prevents invalid states and centralises side effects (e.g., nulling `extracted_content` when transitioning back to inbox).

**Allowed transitions:**
```
inbox         → passive_debt   (defer for later)
inbox         → crystallizing  (user starts Crystallize flow)
inbox         → discarded      (user rejects item)
passive_debt  → inbox          (reactivate)
passive_debt  → crystallizing
passive_debt  → discarded
crystallizing → mastered       (neuron created — client triggers this PATCH)
crystallizing → inbox          (abandon crystallize — move back to triage)
crystallizing → discarded
mastered      → (none)         terminal state
discarded     → (none)         terminal state
```

### Pattern 3: Crystallize Flow — Orchestrated in Route Handler

**What:** The crystallize action is a multi-step server-side orchestration that produces a ready-to-use conversation:
1. Fetch raw URL content (`extractor.ts` — fetch + HTML parse)
2. Summarize with `getModelForRole('synthesis_fast')` (`summarizer.ts`)
3. Create a `conversations` row (title = queue item title)
4. Create an initial `messages` row (role: `assistant`, content: summary)
5. Update queue item state to `crystallizing`, store `crystallized_conversation_id`
6. Return `{ conversationId }` to the client

The client then calls `setCurrentConversationId(conversationId)` and `useGraphStore.openChat()`.

**When to use:** Only on explicit user Crystallize action. URL fetching is never triggered automatically.

**Client-side trigger example:**
```typescript
// In QueueItem.tsx
const handleCrystallize = async (itemId: string) => {
  const res = await fetch(`/api/queue/${itemId}/crystallize`, { method: 'POST' });
  const { conversationId } = await res.json();
  setCurrentConversationId(conversationId);    // ConversationContext
  useGraphStore.getState().openChat();          // graphStore — switches leftPanelMode to 'chat'
  router.push('/app');                          // navigate to chat page
};
```

### Pattern 4: AI Isolation via Structural Separation

**What:** The RAG function (`getRelevantContext()` in `/api/chat`) queries only the `neurons` table via pgvector. The `knowledge_queue` table is never queried from any chat-related route. The isolation is structural (different table) — no code guard needed in the chat route.

**Why this is the right pattern:** The isolation cannot be accidentally broken by a future developer editing `/api/chat` unless they explicitly add a queue query. The system prompt is assembled only from neuron context. Queue items enter AI context only in the crystallize route, where they seed a new conversation, not the ongoing chat.

---

## Data Flow

### Flow 1: Mobile Capture (iOS Shortcut → Queue)

```
iOS Shortcut
  POST /api/capture
  Authorization: Bearer ng_<raw_key>
  Body: { url, title?, note? }
      ↓
/api/capture route handler
  hashApiKey(rawKey) → lookup user_api_keys (service role client)
  validate: row exists AND revoked_at IS NULL
  insert knowledge_queue { user_id, source_url, title, note, state: 'inbox' }
  update user_api_keys SET last_used_at = NOW() WHERE id = keyRow.id
      ↓
Response: 201 { id, title, state: 'inbox' }
```

### Flow 2: Browser Queue Triage (state transitions)

```
User clicks "Move to Passive Debt" in QueueItem
      ↓
queueStore.optimisticUpdate(id, { state: 'passive_debt' })   ← immediate UI
      ↓
PATCH /api/queue/{id}  Body: { state: 'passive_debt' }
  cookie auth → get user
  fetch current item state from DB
  validate transition: 'inbox' → 'passive_debt' is allowed
  UPDATE knowledge_queue SET state = 'passive_debt', updated_at = NOW()
      ↓
on success: no further action (optimistic update already applied)
on failure: queueStore.revertUpdate(id)  ← roll back UI
```

### Flow 3: Crystallize Flow (full orchestration)

```
User clicks "Crystallize" on a queue item
      ↓
POST /api/queue/{id}/crystallize
      ↓
Server Step 1: extractor.ts
  fetch(source_url, { signal: AbortSignal.timeout(5000) })
  parse HTML → extract main text content
  fallback: use item.title + item.note if fetch fails or URL is null
      ↓
Server Step 2: summarizer.ts
  getModelForRole('synthesis_fast')
  prompt: "You are preparing material for Socratic learning. Summarize
           the key ideas in this content so a student can engage with them
           actively: {extracted_text}"
  → summary string
      ↓
Server Step 3: create conversation
  INSERT conversations { user_id, title: item.title }
  INSERT messages { conversation_id, role: 'assistant', content: summary }
      ↓
Server Step 4: update queue item
  UPDATE knowledge_queue SET
    state = 'crystallizing',
    extracted_content = {extracted_text},
    crystallized_conversation_id = {conversationId}
      ↓
Response: { conversationId, summary }
      ↓
Client:
  setCurrentConversationId(conversationId)    ← ConversationContext
  useGraphStore.getState().openChat()          ← leftPanelMode = 'chat'
  router.push('/app')
      ↓
ChatPanel loads the pre-seeded conversation
User Socratizes with AI (existing flow, unchanged)
      ↓
On Neurogenesis (existing flow, unchanged):
  POST /api/neurons → neuron created
  Client also calls: PATCH /api/queue/{id} { state: 'mastered' }
```

### Flow 4: Chat AI — Queue Items Stay Invisible

```
User sends chat message
      ↓
POST /api/chat
  getRelevantContext(latestUserText, user.id, supabase)
      ↓
getRelevantContext() queries: neurons table ONLY (pgvector similarity)
knowledge_queue: NEVER QUERIED (different table, no reference in chat route)
      ↓
System prompt built from neuron embeddings only
Queue items are structurally invisible to the AI
```

### State Management

```
Zustand graphStore (MODIFIED)
  leftPanelMode: 'chat' | 'neuron' | 'review' | 'queue'  ← 'queue' added
  openQueue() action  ← NEW
  (all existing state and actions unchanged)
      ↓ (subscribe)
AppSidebar, layout, ChatPanel, QueuePanel

Zustand queueStore (NEW)
  items: KnowledgeQueueItem[]
  isLoading: boolean
  counts: { inbox: number; passive_debt: number; active: number }
  setItems(), updateItem(id, patch), removeItem(id)
      ↓ (subscribe)
QueuePanel, QueueItem, AppSidebar badge

React Context: ConversationContext (UNCHANGED)
  currentConversationId
  refreshConversations()
  Used by crystallize flow: setCurrentConversationId(crystallized conversationId)
```

---

## New Database Schema

### `knowledge_queue` table

```sql
CREATE TABLE knowledge_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  source_url TEXT,                     -- nullable (text notes have no URL)
  title TEXT NOT NULL,
  note TEXT,                           -- user annotation
  extracted_content TEXT,              -- populated on crystallize (server-side fetch)

  -- State machine (4 active states + 1 terminal per branch)
  state TEXT NOT NULL DEFAULT 'inbox'
    CHECK (state IN ('inbox', 'passive_debt', 'crystallizing', 'mastered', 'discarded')),

  -- Linkage (once crystallized/mastered)
  crystallized_neuron_id UUID REFERENCES neurons(id) ON DELETE SET NULL,
  crystallized_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE knowledge_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own queue items"
  ON knowledge_queue FOR ALL USING (auth.uid() = user_id);

-- Partial index: active items only (not terminal states)
CREATE INDEX idx_knowledge_queue_user_active
  ON knowledge_queue(user_id, state, created_at DESC)
  WHERE state NOT IN ('mastered', 'discarded');
```

### `user_api_keys` table

```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  label TEXT NOT NULL,                 -- "iPhone Shortcut", "Home Mac"
  hashed_key TEXT NOT NULL UNIQUE,    -- SHA-256 of raw key — raw key never stored
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,             -- NULL = active; non-null = revoked (soft delete)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
-- Users can read and delete their own keys via browser session
CREATE POLICY "Users can read own keys"
  ON user_api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own keys"
  ON user_api_keys FOR DELETE USING (auth.uid() = user_id);
-- INSERT done via service role in /api/keys route (bypasses RLS by design)
```

---

## Anti-Patterns

### Anti-Pattern 1: Exposing Queue Items to Chat RAG Context

**What people do:** Add `knowledge_queue` to the `getRelevantContext()` function to give the AI "more material to work with."

**Why it's wrong:** Breaks the core product constraint ("AI Isolation from Queue" in PROJECT.md). Queue items are unverified, unmastered content. Mixing them into the chat context blurs the boundary between the sacred Knowledge Graph and the staging area, undermining the product's central value proposition.

**Do this instead:** Queue data enters an AI prompt in exactly one place: the crystallize route (`/api/queue/[id]/crystallize`), where it seeds a new conversation. Never the ongoing chat context.

### Anti-Pattern 2: Client-Side State Transitions (Supabase Direct)

**What people do:** Write queue state directly to Supabase from the browser client (`supabase.from('knowledge_queue').update(...)`) and sync Zustand locally.

**Why it's wrong:** Bypasses server-side transition validation. A client could move an item from `inbox` directly to `mastered` without going through Crystallize. Also bypasses server-side side effects (like setting `crystallized_conversation_id` and `extracted_content`).

**Do this instead:** All state transitions go through `PATCH /api/queue/[id]`. The server validates allowed transitions. The client does an optimistic update immediately (for snappy UX) and reverts if the server returns an error.

### Anti-Pattern 3: Storing Raw API Keys in the Database

**What people do:** Store the actual `ng_<hex>` string in the `user_api_keys` table for easy equality comparison.

**Why it's wrong:** If the table is compromised (even via an RLS misconfiguration), all mobile capture endpoints across all users are exposed permanently. The damage cannot be undone without contacting each user.

**Do this instead:** Store only `SHA-256(rawKey)`. Show the raw key to the user exactly once at creation (copy-to-clipboard UI; make it clear it won't be shown again). Verification: hash the incoming bearer token and compare to stored hash. This is the GitHub Personal Access Token pattern.

### Anti-Pattern 4: Using Cookie-Based Client in `/api/capture`

**What people do:** Try to use `createServerSupabaseClient()` in the capture route because it's the established pattern in the codebase.

**Why it's wrong:** The capture endpoint has no browser session. iOS Shortcuts cannot negotiate Supabase cookie auth. `createServerSupabaseClient()` reads `next/headers` cookies — there are none. The result is a permanently unauthenticated client that rejects every request with 401.

**Do this instead:** Use a Supabase service role client (`createClient(url, serviceRoleKey)`) inside `/api/capture` only. This is the single exception to the cookie-auth pattern and must be documented at the top of that file.

### Anti-Pattern 5: Merging Queue State into graphStore

**What people do:** Add `queueItems`, `queueLoading`, etc. to `graphStore` for convenience since it's already the global store.

**Why it's wrong:** `graphStore` owns React Flow state (nodes, edges, activeNeuronId, viewport) consumed by graph rendering. Mixing queue items into it couples two different domains, inflates the store, and makes it harder to test either concern in isolation.

**Do this instead:** Separate `queueStore` with its own Zustand slice. The only coupling point between stores is `graphStore.openQueue()`, which flips `leftPanelMode` to `'queue'`. Queue components subscribe to `queueStore`; the sidebar badge subscribes to `queueStore.counts`.

---

## Suggested Build Order (Dependency-Aware)

Each step unblocks the next. No step depends on a later one.

### Step 1: Database Layer
**Deliverables:** Two migrations, updated `types/database.ts`, `src/lib/db/queue.ts`
- Migration: `knowledge_queue` table + RLS + partial index
- Migration: `user_api_keys` table + RLS
- Add `KnowledgeQueueItem`, `QueueItemState`, `ApiKey` types to `types/database.ts`
- Create `src/lib/db/queue.ts` with `queueQueries` (insert, getByUser, updateState, delete)

**Why first:** Every API route and UI component depends on the schema. No code can be tested without the tables.

### Step 2: API Key System
**Deliverables:** `src/lib/auth/apiKeys.ts`, `/api/keys/*`, `/api/capture`
- `src/lib/auth/apiKeys.ts` (generateApiKey, hashApiKey, verifyApiKey)
- `src/app/api/keys/route.ts` (GET list, POST generate)
- `src/app/api/keys/[id]/route.ts` (DELETE revoke)
- `src/app/api/capture/route.ts` (bearer auth, insert to queue)

**Why second:** The capture endpoint is the external-facing mobile surface. Building it before the UI means the iOS Shortcut can be configured and tested immediately in isolation, before any browser UI exists.

### Step 3: Queue CRUD API
**Deliverables:** `/api/queue/route.ts`, `/api/queue/[id]/route.ts`
- GET list (cookie auth, filter by user_id, exclude terminal states by default)
- POST create (from browser — same-session user creates an item directly)
- PATCH state transition (server-validates allowed transitions)
- DELETE discard (sets state = 'discarded', or hard-delete if preferred)

**Why third:** Simple CRUD with no external dependencies. The UI in Step 4 calls these endpoints. Building them first means the UI is built against real, testable endpoints from day one.

### Step 4: Triage UI
**Deliverables:** `queueStore.ts`, `useQueue.ts`, `QueuePanel`, `QueueItem`, sidebar modification, `graphStore.ts` modification, queue page
- `src/stores/queueStore.ts`
- `src/hooks/useQueue.ts`
- `src/components/queue/QueuePanel.tsx`, `QueueItem.tsx`, `QueueEmptyState.tsx`
- Modify `src/stores/graphStore.ts`: add `'queue'` to mode union + `openQueue()`
- Modify `src/components/layout/AppSidebar.tsx`: add Queue nav link + unread badge
- `src/app/(app)/app/queue/page.tsx`

**Why fourth:** UI is the highest layer. It depends on the DB schema (Step 1) and the CRUD API (Steps 2-3). Building after the API means no mock data needed — the panel works with real items from the moment it renders.

### Step 5: Crystallize Flow
**Deliverables:** `extractor.ts`, `summarizer.ts`, `/api/queue/[id]/crystallize`, QueueItem crystallize button wired
- `src/lib/queue/extractor.ts` (fetch URL with timeout + Cheerio HTML-to-text)
- `src/lib/queue/summarizer.ts` (synthesis_fast call)
- `src/app/api/queue/[id]/crystallize/route.ts` (orchestration route)
- Update `QueueItem.tsx`: wire Crystallize button, handle response, navigate to chat

**Why last:** The most complex step. Depends on queue items existing and being navigable (Steps 1-4). Introduces a new AI interaction pattern. Isolating it at the end minimises debugging surface area. The crystallize route reuses existing patterns: `conversations`/`messages` inserts already exist in `/api/chat`.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current synchronous approach is fine. URL extraction is inline in the crystallize route. Service role client in `/api/capture` is acceptable. |
| 1k-10k users | Move URL extraction to a background job (Supabase Edge Function or pg_cron). Crystallize returns immediately with `{ status: 'processing' }`. A webhook or polling on the client surfaces completion. |
| 10k+ users | Per-API-key rate limiting on `/api/capture`. pg_cron cleanup of `discarded` items older than 30 days. Partial index on `knowledge_queue` (already designed in Step 1) is essential at this scale. |

### Scaling Priorities

1. **First bottleneck:** URL extraction in the crystallize route. External HTTP calls are slow and flaky. Even at low scale, a poorly-behaved external site can cause the route handler to timeout (Vercel default: 10s on Hobby plan). Mitigation: 5-second `AbortSignal.timeout()` in `extractor.ts`, fallback to title-only if fetch fails or times out.
2. **Second bottleneck:** `knowledge_queue` full-table scans without the partial index. Step 1's partial index on `(user_id, state, created_at)` WHERE active items only is essential before any production load.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| External URLs (for crystallize) | `fetch()` with `AbortSignal.timeout(5000)` in `extractor.ts` | Must handle redirects, paywalls, and non-HTML gracefully. Fallback to title-only. |
| Supabase service role | `createClient(url, serviceRoleKey)` in `/api/capture` and `/api/keys` (insert only) | Never expose this client or key to browser. Server-only files. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| QueueItem → Crystallize route → ConversationContext | fetch POST → returns conversationId → client sets context | Thin handoff: route returns ID, client owns navigation |
| `/api/capture` → `knowledge_queue` | Service role insert (no cookie session) | Only exception to the cookie-auth pattern in the whole codebase |
| queueStore ↔ graphStore | `graphStore.openQueue()` only | No shared state. Mode flag is the only coupling. |
| Chat AI ↔ queue | NONE | Structural isolation — different DB tables, no reference in chat routes |

---

## Sources

- Direct codebase analysis (2026-03-22):
  - `/src/stores/graphStore.ts` — leftPanelMode union, action patterns
  - `/src/middleware.ts` — cookie auth scope (`/app/*` only)
  - `/src/app/(app)/layout.tsx` — 40/60vw split structure
  - `/src/app/api/chat/route.ts` — RAG context construction, AI isolation point
  - `/src/app/api/neurons/route.ts` — existing CRUD + bouncer pattern
  - `/src/lib/auth/supabase.ts` — `createServerSupabaseClient()` cookie pattern
  - `/src/lib/ai/providers.ts` — `getModelForRole()` for synthesis_fast
  - `/src/lib/db/queries.ts` — `neuronQueries` object pattern to follow
  - `/src/lib/contexts/ConversationContext.tsx` — `setCurrentConversationId` for crystallize handoff
  - `/src/types/database.ts` — existing type shape for new types to follow
  - `/src/lib/db/migrations/010_baseline_v2_reset.sql` — current schema baseline
- Project context: `/.planning/PROJECT.md`

---
*Architecture research for: NeuroGraph v1.1 Staging Area — Cognitive Funnel integration*
*Researched: 2026-03-22*
