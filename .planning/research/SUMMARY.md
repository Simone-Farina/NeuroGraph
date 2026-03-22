# Project Research Summary

**Project:** NeuroGraph — Cognitive MicroSaaS / Knowledge Graph
**Domain:** PKM Staging Area & Cognitive Funnel (v1.1 Milestone)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

NeuroGraph v1.1 adds a Staging Area — a knowledge inbox with a deliberate cognitive funnel — on top of an already-production graph-based knowledge system. The fundamental challenge is not technical: it is philosophical. Every competitor (Readwise Reader, Recall.ai, Instapaper) treats ingestion as the product; NeuroGraph must treat ingestion as a liability. The Staging Area must be an uncomfortable pressure surface that forces Crystallization — an active Socratic engagement with captured content — not a passive archive. The product's central thesis only survives if the queue architecture makes passive accumulation feel costly and Crystallization feel like the only resolution.

The recommended technical approach is surgical: one new package (`@extractus/article-extractor`), two new DB tables (`knowledge_queue`, `user_api_keys`), five new API route groups, and a dedicated Zustand `queueStore` alongside the existing `graphStore`. The existing React Flow graph, Socratic chat engine, FSRS review system, and Neurogenesis flow remain entirely untouched. The Crystallize flow is a wrapper that seeds an existing chat session with extracted article content — the Socratic mechanics are already built. The mobile capture surface (iOS Shortcuts via `POST /api/capture` with a bearer token) is a clean addition that does not touch the cookie-based auth pattern used everywhere else.

The dominant risks are architectural, not implementation-level: (1) AI context isolation between `knowledge_queue` and `neurons` must be structural — separate tables, no joins in chat routes — not enforced by convention; (2) API key authentication must live inside the route handler itself, not middleware (CVE-2025-29927 is a live CVSS 9.1 bypass affecting all Next.js < 14.2.25); (3) the Queue must route as `/app/queue` via the sidebar nav, not as a fourth `leftPanelMode` value, to avoid a mode-explosion that compounds with every future milestone.

---

## Key Findings

### Recommended Stack

The v1.1 stack requires exactly one new dependency. All other capabilities are already present or use Node.js built-ins. `@extractus/article-extractor` v8 handles URL fetch + DOM parse + content extraction in a single call and runs in the Node.js runtime (not Edge). API key generation uses `nanoid` (already a transitive dependency) with `ng_` prefix and SHA-256 hashing via Node.js `crypto` — no bcrypt, no JWT overhead, no Vault setup. The `knowledge_queue` state machine uses a plain Supabase table with a status TEXT enum column; pgmq is explicitly wrong here because the queue is a user-facing editorial list, not a background job processor.

**Core technologies (existing, unchanged):**
- **Next.js 14 App Router**: Full-stack framework — all new routes follow existing route handler patterns
- **Supabase + pgvector**: Auth, PostgreSQL, vector similarity for Neurons — new tables follow established RLS pattern
- **React Flow (`@xyflow/react`)**: Graph panel — no changes required for v1.1
- **Vercel AI SDK 3.x**: AI orchestration — Crystallize uses `getModelForRole('synthesis_fast')` already wired
- **Zustand**: New `queueStore` added alongside existing `graphStore`

**New for v1.1 (one install):**
- `@extractus/article-extractor` v8: URL content extraction — Node.js runtime only, must not declare `export const runtime = 'edge'`
- `nanoid` (already in lockfile as transitive dep): 48-char `ng_`-prefixed API key generation
- Node.js `crypto` built-in: SHA-256 key hashing, `timingSafeEqual` comparison

**Do not use:** LangChain, browser extensions for capture, pgmq (wrong abstraction), bcrypt/argon2 for API keys (too slow per-request — tokens are already high-entropy), React Context for queue state, JWT for API keys (unnecessary claim encoding overhead).

See `.planning/research/STACK.md` for full detail including SQL schemas and code patterns.

### Expected Features

The v1.1 feature set is well-defined with clear P1/P2/P3 tiers. Table-stakes features are low-complexity and mostly structural; the differentiators define NeuroGraph against competitors.

**Must have (table stakes — P1):**
- `queue_items` DB schema with 4-state lifecycle (`inbox`, `passive_debt`, `crystallizing`, `mastered`) — prerequisite for everything
- `user_api_keys` table with SHA-256 hashed key storage — prerequisite for mobile capture
- `POST /api/capture` endpoint with bearer token auth — enables iOS Shortcut
- Inbox list UI as sidebar nav route `/app/queue` — shows items with status labels, not a panel mode
- Manual triage controls: promote to Resource, mark as Passive Debt, delete
- "Add URL" desktop input field — covers non-mobile capture
- Crystallize flow: URL extraction to Socratic chat seed — the core differentiator
- AI isolation: `knowledge_queue` never queried in chat context

**Should have (competitive differentiators — P2):**
- Passive Debt count badge on sidebar nav item — ambient pressure signal, not a comfort indicator
- Pre-generated AI triage summary on ingest (validate demand first — extra AI call per capture)
- Auto-advance queue item to `mastered` when Neurogenesis fires from a Crystallize session
- Plain text note capture via iOS Shortcut (same endpoint, `content_type: 'note'`)

**Defer to v2+:**
- Bulk onboarding import (capped at 10 with warning — only if onboarding friction is measured)
- Open Graph preview images in queue list
- Queue item tagging / manual categorization
- Browser extension capture (significant build cost, redundant given web input field)

**Anti-features to avoid:** Auto-summarize to auto-create Neurons (this is Recall.ai — breaks the thesis), bulk archive / "mark all read," scheduled Crystallize reminders, full-text search of inbox.

See `.planning/research/FEATURES.md` for competitor analysis and full prioritization matrix.

### Architecture Approach

The v1.1 architecture integrates the Staging Area by adding two parallel subsystems — the queue data layer and the mobile capture surface — while touching existing code in exactly three places: `graphStore.ts` (add `openQueue()` action only; do NOT add `'queue'` to `leftPanelMode`), `AppSidebar.tsx` (add Queue nav link with unread badge), and `types/database.ts` (add new types). The Queue renders as an App Router page at `/app/queue`, consistent with how `/app/review` already works. A separate `queueStore` (Zustand) owns queue state; `graphStore` retains sole ownership of React Flow and panel mode state. The only coupling between the two stores is a single `graphStore.openQueue()` call that fires after Crystallize navigates the user to chat.

**Major components:**
1. **`/api/capture` (bearer auth)**: The sole exception to cookie-auth in the codebase. Uses a Supabase service role client. Must contain its own auth logic — never delegate to middleware.
2. **`/api/queue/[id]/crystallize` (orchestration)**: Five-step server route: fetch URL → extract text → AI summary via `synthesis_fast` → create conversation with seeded message → update queue item state. Returns `{ conversationId }` to client, which navigates to chat.
3. **`queueStore` (Zustand)**: Owns `items[]`, `counts`, optimistic mutations. Consumed by `QueuePanel`, `QueueItem`, and the sidebar badge. Bridge to `graphStore` is `openQueue()` only.
4. **`src/lib/queue/extractor.ts`**: URL fetch + HTML-to-text extraction. 8–10s `AbortSignal.timeout`. Returns a structured failure signal on insufficient content — never proceeds to Crystallize with empty context.
5. **`src/lib/auth/apiKeys.ts`**: `generateApiKey()`, `hashApiKey()`, `verifyApiKey()`. Zero new dependencies.

**Key patterns to follow:**
- State transitions via server-validated PATCH only — client optimistic update, server-side transition allowlist, rollback on failure
- AI isolation is structural: `getRelevantContext()` queries `neurons` only; `knowledge_queue` has no reference in any chat route
- Queue content enters AI context in exactly one place: the Crystallize route seeding a new conversation (never ongoing chat)
- All new routes use cookie-based auth except `/api/capture`, which is documented as the single exception

See `.planning/research/ARCHITECTURE.md` for full data flow diagrams, component registry, and anti-patterns.

### Critical Pitfalls

1. **The Passive Bookmark Graveyard** — Label queue items "Unprocessed" / "Passive Debt," never "Saved." Crystallize must be the only path to resolution. No bulk-archive action. Soft cap warning at 10 unprocessed items. Never auto-preview article content inline. Address in Phase 1 (schema state labels) and Phase 3 (UI language).

2. **AI Context Contamination** — `knowledge_queue` must be a structurally separate table, never embedded, never joined in chat routes. Enforce with a CI test: "Chat API system prompt contains zero `knowledge_queue` rows." Address in Phase 1 (schema isolation) and Phase 2 (Crystallize flow tests).

3. **Middleware-Only Auth Bypass (CVE-2025-29927)** — Live CVSS 9.1 vulnerability in Next.js < 14.2.25. API key validation must live inside the `/api/capture` route handler itself. Verify Next.js >= 14.2.25 before shipping Phase 2.

4. **URL Extraction Brittleness** — `@extractus/article-extractor` fails on SPAs, paywalled content, PDFs, and login-gated URLs (~30–40% of real-world URLs). Always check body text length; return `{ success: false, reason }` on failure; present a "paste content manually" fallback. Store extracted content at capture time, not at Crystallize time. Address in Phase 4 (Crystallize flow).

5. **Left Panel Mode Explosion** — Do NOT add `'queue'` to `leftPanelMode`. Queue is a route (`/app/queue`), not a panel mode. A fourth mode in the union creates a pseudo-router in Zustand that compounds with every future milestone. Address in Phase 3 (architecture decision locked in PR review).

6. **iOS Shortcuts Silent Failure** — iOS "Get Contents of URL" ignores HTTP status codes; it only returns the response body. Always return `{ success: boolean, id?, error? }`. The Shortcut template must include an explicit error branch. Test with an invalid key before shipping.

See `.planning/research/PITFALLS.md` for full SSRF prevention checklist, security mistake catalog, and recovery strategies.

---

## Implications for Roadmap

The architecture research provides a dependency-aware build order that maps cleanly to five implementation phases. This ordering is non-negotiable: every later phase depends on the earlier ones being production-ready and security-correct.

### Phase 1: Data Layer & Authentication Foundation

**Rationale:** Every API route, UI component, and mobile capture flow depends on the schema. No code can be meaningfully tested without the tables. API key auth must be correct from day one — retrofitting hash storage after plaintext keys have been shown to users requires key revocation and user communication. AI isolation must be structural from the first migration.
**Delivers:** Two Supabase migrations (`knowledge_queue`, `user_api_keys` with RLS + partial indexes), updated `types/database.ts`, `src/lib/db/queue.ts` (queueQueries following existing `neuronQueries` pattern), `src/lib/auth/apiKeys.ts`
**Addresses:** `queue_items` DB schema, `user_api_keys` auth (P1 features)
**Avoids:** Plaintext API key storage (Pitfall 5), AI context contamination via structural table separation (Pitfall 2), passive graveyard via schema-level state labels with no ambiguity (Pitfall 1)

### Phase 2: Mobile Capture & API Routes

**Rationale:** The external-facing capture endpoint can be configured and tested with an iOS Shortcut immediately, before any browser UI exists. Queue CRUD API built before UI means the panel is built against real endpoints from day one — no mock data needed. Security-critical routes must be complete and audited before UI work begins.
**Delivers:** `/api/capture` (bearer token, service role client, SSRF protection), `/api/keys` + `/api/keys/[id]` (generate, list, revoke), `/api/queue` (GET list, POST create), `/api/queue/[id]` (PATCH state machine with transition allowlist, DELETE)
**Uses:** `nanoid` + `crypto` (apiKeys.ts), `queueQueries` (db/queue.ts), Zod validation on all routes
**Avoids:** CVE-2025-29927 — auth in route handler, not middleware (Pitfall 4); iOS Shortcuts silent failure — structured `{ success, error }` response body (Pitfall 7); SSRF via `https://` scheme validation and private IP blocking; cookie-auth antipattern in capture endpoint

### Phase 3: Queue Triage UI

**Rationale:** UI is the highest layer; it depends on the DB schema (Phase 1) and all CRUD APIs (Phase 2). The critical architecture decision — Queue as sidebar route, not `leftPanelMode` value — must be locked before any component is built. Language choice ("Passive Debt," "Unprocessed") is a product decision, not a polish decision.
**Delivers:** `queueStore.ts`, `useQueue.ts`, `QueuePanel`, `QueueItem`, `QueueEmptyState`, sidebar Queue nav link + unread badge count, minimal `graphStore.ts` modification (add `openQueue()` only), `/app/queue` page
**Implements:** Separate `queueStore` Zustand slice, optimistic mutations with rollback, status badge count query, deliberate "Unprocessed" / "Passive Debt" UI language, empty state prompting capture
**Avoids:** Mode explosion — Queue renders at `/app/queue`, not as a `leftPanelMode` union value (Pitfall 6); passive graveyard via uncomfortable state labels (Pitfall 1); article content auto-preview in queue list (UX pitfall)

### Phase 4: Crystallize Flow

**Rationale:** The most complex step. Depends on queue items existing and being triage-able (Phases 1–3). Introduces URL extraction, AI summarization, and the conversation handoff — three new integration points. Isolating it at the end minimizes debugging surface area. Crystallize reuses existing patterns: `conversations`/`messages` inserts already exist in `/api/chat`.
**Delivers:** `src/lib/queue/extractor.ts` (fetch + extraction with failure signal), `src/lib/queue/summarizer.ts` (`synthesis_fast` prompt), `/api/queue/[id]/crystallize` (5-step orchestration), wired Crystallize button in `QueueItem.tsx` with navigation handoff
**Uses:** `@extractus/article-extractor` v8, `getModelForRole('synthesis_fast')`, `ConversationContext.setCurrentConversationId`, `graphStore.openChat()`
**Avoids:** URL extraction brittleness — explicit failure signal + "paste content manually" fallback path (Pitfall 3); AI context contamination — queue data enters chat in exactly one place (Pitfall 2); re-fetching URL at Crystallize time (content stored at capture, Pitfall from technical debt table)

### Phase 5: Polish & P2 Enhancements

**Rationale:** Only after the core cognitive funnel is validated should optional pressure signals and automation be added. Pre-generated AI summaries cost an extra API call per capture — validate demand exists before shipping. Auto-advance to `mastered` requires linking `queue_item_id` through the Neurogenesis flow.
**Delivers:** Passive Debt count badge on sidebar, pre-generated AI triage summary on ingest, auto-advance queue item to `mastered` on Neurogenesis, plain text note capture via iOS Shortcut
**Condition:** Only proceed if Phase 4 usage metrics show Crystallize is being used. If the funnel is working, these enhance it. If not, investigate Phase 3/4 UX before adding Phase 5 complexity.

### Phase Ordering Rationale

- **Schema first**: Key storage decisions cannot be changed after users have real API keys; AI isolation must be structural from the first migration, not retrofitted
- **API before UI**: Testable endpoints expose integration edge cases (iOS Shortcuts, SSRF, timeout behavior, state machine edges) before UI complexity is layered on
- **UI before Crystallize**: Crystallize needs items to exist and state transitions to work; debugging extraction failures in isolation is far simpler than debugging them embedded in a UI interaction
- **P2 features last**: They enhance a working funnel; shipping prematurely risks optimizing a flow that hasn't been validated with real usage

### Research Flags

Phases needing deeper research during planning:

- **Phase 4 (Crystallize / URL Extraction)**: URL extraction failure rates against the actual target URL corpus (news, academic papers, Twitter threads, paywalled content) are empirically unknown. Run a pre-Phase-4 extraction test harness against 20+ real URLs to calibrate the failure threshold and "paste manually" UX trigger. `@extractus/article-extractor` vs `@mozilla/readability` + `jsdom` tradeoffs should be validated with actual content samples before committing.
- **Phase 2 (iOS Shortcuts integration)**: The Shortcut template `.shortcut` deep-link format for pre-filling endpoint URL and API key placeholder has not been device-tested. Validate on a physical iPhone before considering Phase 2 done. Simulate error responses (401, 422) and confirm the Shortcuts error branch fires correctly.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Data Layer)**: Well-documented Supabase migration pattern, identical RLS structure to existing tables. `gen_random_uuid()`, `TIMESTAMPTZ`, and RLS policy patterns are all in production.
- **Phase 3 (Queue UI)**: Zustand store pattern, optimistic mutations, and sidebar nav link follow established patterns already in the codebase. No novel integration points.
- **Phase 5 (Polish)**: Count badge is a trivial Supabase `count()` query. Auto-advance is a one-line hook into the existing Neurogenesis flow.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library choices verified against official docs and npm. One net-new install (`@extractus/article-extractor`). `nanoid` confirmed already in lockfile. SQL schemas and code patterns fully specified. |
| Features | HIGH | Table stakes and architecture patterns verified against competitors. Mobile capture patterns MEDIUM — iOS Shortcuts behavior confirmed via multiple sources but requires physical device testing. |
| Architecture | HIGH | Based on direct codebase analysis of existing files (`graphStore.ts`, `middleware.ts`, `queries.ts`, etc.). Component boundaries derived from real code, not inference. Build order is dependency-verified. |
| Pitfalls | HIGH (core), MEDIUM (integration specifics) | CVE-2025-29927 is a real, documented vulnerability — confirmed. URL extraction failure rates are projected from library limitations, not measured against real URLs. iOS Shortcuts silent failure behavior confirmed from Apple docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **URL extraction failure rate on real content**: `@extractus/article-extractor` covers ~70% of use cases per library claims. Actual failure rate on NeuroGraph's target URL corpus is untested. Run a pre-Phase-4 extraction test harness against 20+ diverse real URLs before committing to the fallback UX threshold.
- **Vercel deployment tier timeout**: Architecture assumes a 10s function timeout budget (Hobby tier). If the project is on Pro tier, the budget is 60s and the extraction strategy can be more lenient. Confirm Vercel plan before Phase 4 implementation.
- **iOS Shortcuts template behavior**: The `.shortcut` deep-link format for pre-filling API key placeholders is documented but has not been validated on a physical device. Confirm before declaring Phase 2 complete.
- **`synthesis_fast` model cost at scale (Phase 5 gating)**: If pre-generated AI summaries are shipped in Phase 5, each capture triggers an AI call. Establish a usage baseline in Phase 4 before enabling auto-summary to avoid surprise cost increases.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis (2026-03-22): `graphStore.ts`, `middleware.ts`, `queries.ts`, `ConversationContext.tsx`, `layout.tsx`, `api/chat/route.ts`, `api/neurons/route.ts`, `lib/auth/supabase.ts`, `lib/ai/providers.ts`, `types/database.ts`, `migrations/010_baseline_v2_reset.sql`
- [nanoid GitHub](https://github.com/ai/nanoid) — v5.1.7, cryptographic security via `crypto.getRandomValues`
- [@extractus/article-extractor GitHub](https://github.com/extractus/article-extractor) — v8.0.20, API shape and Node.js runtime requirement verified
- [Node.js crypto docs](https://nodejs.org/api/crypto.html) — `createHash`, `timingSafeEqual` confirmed built-in
- [Supabase API Keys docs](https://supabase.com/docs/guides/api/api-keys) — hash storage best practice confirmed
- [Mozilla Readability GitHub](https://github.com/mozilla/readability) — extraction capabilities and SPA limitations
- CVE-2025-29927: [ProjectDiscovery Analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass), [Vercel Postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass), [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-29927)
- [Vercel Function Limitations](https://vercel.com/docs/functions/limitations) — timeout tiers per plan confirmed

### Secondary (MEDIUM confidence)
- [iOS Shortcuts "Get Contents of URL" — Apple Support](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) — POST with bearer header confirmed
- [trovster.com — iOS Shortcut JSON API pattern, 2024](https://www.trovster.com/blog/2024/05/using-a-json-api-and-ios-shortcut-to-update-my-website) — Bearer + JSON body confirmed working
- [makerkit.dev — Supabase API key management](https://makerkit.dev/blog/tutorials/supabase-api-key-management) — SHA-256 hash storage pattern
- [Readwise Reader, Recall.ai, Instapaper feature analysis](https://medium.com/macoclock/readwise-reader-vs-instapaper-vs-pocket-which-one-wins-in-2025-2c5e182ca979) — competitor comparison

### Tertiary (LOW confidence — needs validation)
- URL extraction failure rate (~30–40% on SPAs/paywalled content) — inferred from library limitations, not measured against real corpus
- iOS Shortcuts `.shortcut` deep-link template format — documented but not device-tested

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
