# Phase 6: Capture API & Key Management - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

API route handlers for key generation/revocation + mobile capture endpoint. User can generate a personal API key from the browser sidebar and immediately POST to `/api/capture` from iOS Shortcuts to drop URLs into the inbox.

</domain>

<decisions>
## Implementation Decisions

### Key Management UI
- **SIDEBAR FOOTER SECTION**: Add a "Developer" / "API" section to the existing sidebar footer (near sign out). No new page or route needed.
- Show key prefix (`ng_XXXXXXXX`) if active, generate button if none, revoke button if exists.
- **INLINE REVEAL WITH COPY**: When generating a new key, it appears inline with a prominent copy-to-clipboard button and a warning: "This key won't be shown again." No modal ceremony.
- 1 key max per user (from Phase 5) — generating a new key auto-revokes the previous one.

### Capture Response Shape
- **ECHO FULL ITEM**: Successful capture returns `{ success: true, item: { id, title, url, source_domain, state: 'inbox' } }`. iOS Shortcut can show a rich confirmation notification with the extracted title.
- **REJECT DUPLICATES**: If the URL already exists in the user's queue (any state), return `{ success: false, error: 'duplicate', existing_id: 'uuid' }`. Prevents queue clutter.
- Error responses always use body-level JSON: `{ success: false, error: 'unauthorized' | 'rate_limited' | 'invalid_payload' | 'duplicate' }`. iOS Shortcuts reads the body, not HTTP status codes.

### URL Metadata Extraction (at capture time)
- **LIGHT FETCH ONLY**: Fetch the HTML `<head>` for `<title>` and `<meta>` tags. Parse URL for `source_domain`. ~500ms-1s latency.
- Full article extraction (content, word count) is deferred to Crystallize (Phase 8).
- `estimated_read_time` and `favicon_url` extracted from meta tags if available; null if not.
- **FALLBACK ON FAILURE**: If title fetch fails (timeout, 403, invalid URL), capture still succeeds. Use the URL domain as the title fallback. Never block a capture.
- For non-URL items (pure thoughts), skip all fetching — just store title + notes.

### API Route Architecture (from Phase 5 decisions)
- Capture endpoint uses **service role client** (not cookie-based session). Bearer token validated in route handler, not middleware (CVE-2025-29927).
- Rate limit: 60 captures/hour per key, checked via `last_used_at` timestamp.
- Key management routes (generate/revoke) use standard `createServerSupabaseClient()` — they require a browser session.

### Claude's Discretion
- Exact route structure: `/api/keys/generate`, `/api/keys/revoke` OR `/api/keys` with method switching
- HTML `<head>` fetch implementation (native fetch with AbortSignal timeout vs lightweight scraper)
- Copy-to-clipboard implementation (navigator.clipboard API vs fallback)
- Sidebar UI component structure (inline vs separate component)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 5 Outputs (Foundation)
- `src/lib/auth/apiKeys.ts` — `generateApiKey()`, `hashApiKey()`, `getKeyPrefix()`, `verifyApiKey()` functions
- `src/lib/db/apiKeyQueries.ts` — `apiKeyQueries.create()`, `.getActiveByUser()`, `.revokeAllForUser()`, `.findByHash()`, `.updateLastUsed()`
- `src/lib/db/queueQueries.ts` — `queueQueries.create()`, `.getByUser()`, `.updateState()`, `.deleteItem()`
- `src/lib/validation/queue.ts` — `QueueItemInsertSchema`, `VALID_TRANSITIONS`
- `src/lib/validation/apiKeys.ts` — `RawApiKeySchema` for bearer token format validation
- `src/types/database.ts` — `KnowledgeQueueItem`, `ApiKey`, `QueueItemState` types

### Auth Pattern
- `src/lib/auth/supabase.ts` — `createServerSupabaseClient()` for session-based routes
- `src/lib/auth/server.ts` — `getAuthenticatedUser()` helper for session routes

### Existing Route Patterns
- `src/app/api/neurons/route.ts` — Example of POST route handler with auth + Zod validation
- `src/app/api/neurons/extract/route.ts` — Example of AI-powered route with `getModelForRole()`

### UI Pattern
- `src/components/layout/AppSidebar.tsx` — Where key management UI will be added (footer section)

### Research
- `.planning/research/PITFALLS.md` — CVE-2025-29927 (route-handler auth requirement), iOS Shortcuts HTTP behavior
- `.planning/research/ARCHITECTURE.md` — Service role client pattern for capture endpoint

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apiKeys.ts`: All crypto functions ready — Phase 6 just wires them to route handlers
- `apiKeyQueries.ts`: All DB operations ready — create, revoke, find, updateLastUsed
- `queueQueries.ts`: Queue insert ready — create with user_id, title, url, notes, state
- `RawApiKeySchema`: Zod validation for bearer token format (`ng_` + 48 alphanumeric)
- `QueueItemInsertSchema`: Zod validation for queue item creation payload

### Established Patterns
- Route handlers: `export async function POST(request: NextRequest)` with Zod body parsing
- Auth in routes: `const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser();`
- Service role: `createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, ...)`

### Integration Points
- New route: `src/app/api/capture/route.ts` (service role auth)
- New route: `src/app/api/keys/route.ts` (session auth — generate + revoke)
- Modified: `src/components/layout/AppSidebar.tsx` (add key management footer section)

</code_context>

<specifics>
## Specific Ideas

- The sidebar key section should feel like a "developer console" whisper — small, subtle, not a feature users stumble into. Think: a small key icon in the footer area.
- The copy-to-clipboard moment should have a brief visual confirmation (icon change to checkmark for 2s) matching the monochrome aesthetic.
- iOS Shortcut notification format: "Captured: [title]" on success, "Already in queue" on duplicate.

</specifics>

<deferred>
## Deferred Ideas

- iOS Shortcut `.shortcut` downloadable file — document the API for now, build the template later
- Settings page — use sidebar footer for now, settings page can come with future features

</deferred>

---

*Phase: 06-capture-api-key-management*
*Context gathered: 2026-03-22*
