# Phase 6: Capture API & Key Management - Research

**Researched:** 2026-03-22
**Domain:** Next.js App Router API routes — bearer token auth, HTML `<head>` fetch, sidebar UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Key Management UI**
- SIDEBAR FOOTER SECTION: Add a "Developer" / "API" section to the existing sidebar footer (near sign out). No new page or route needed.
- Show key prefix (`ng_XXXXXXXX`) if active, generate button if none, revoke button if exists.
- INLINE REVEAL WITH COPY: When generating a new key, it appears inline with a prominent copy-to-clipboard button and a warning: "This key won't be shown again." No modal ceremony.
- 1 key max per user (from Phase 5) — generating a new key auto-revokes the previous one.

**Capture Response Shape**
- ECHO FULL ITEM: Successful capture returns `{ success: true, item: { id, title, url, source_domain, state: 'inbox' } }`. iOS Shortcut can show a rich confirmation notification with the extracted title.
- REJECT DUPLICATES: If the URL already exists in the user's queue (any state), return `{ success: false, error: 'duplicate', existing_id: 'uuid' }`. Prevents queue clutter.
- Error responses always use body-level JSON: `{ success: false, error: 'unauthorized' | 'rate_limited' | 'invalid_payload' | 'duplicate' }`. iOS Shortcuts reads the body, not HTTP status codes.

**URL Metadata Extraction (at capture time)**
- LIGHT FETCH ONLY: Fetch the HTML `<head>` for `<title>` and `<meta>` tags. Parse URL for `source_domain`. ~500ms-1s latency.
- Full article extraction (content, word count) is deferred to Crystallize (Phase 8).
- `estimated_read_time` and `favicon_url` extracted from meta tags if available; null if not.
- FALLBACK ON FAILURE: If title fetch fails (timeout, 403, invalid URL), capture still succeeds. Use the URL domain as the title fallback. Never block a capture.
- For non-URL items (pure thoughts), skip all fetching — just store title + notes.

**API Route Architecture (from Phase 5 decisions)**
- Capture endpoint uses service role client (not cookie-based session). Bearer token validated in route handler, not middleware (CVE-2025-29927).
- Rate limit: 60 captures/hour per key, checked via `last_used_at` timestamp.
- Key management routes (generate/revoke) use standard `createServerSupabaseClient()` — they require a browser session.

### Claude's Discretion
- Exact route structure: `/api/keys/generate`, `/api/keys/revoke` OR `/api/keys` with method switching
- HTML `<head>` fetch implementation (native fetch with AbortSignal timeout vs lightweight scraper)
- Copy-to-clipboard implementation (navigator.clipboard API vs fallback)
- Sidebar UI component structure (inline vs separate component)

### Deferred Ideas (OUT OF SCOPE)
- iOS Shortcut `.shortcut` downloadable file — document the API for now, build the template later
- Settings page — use sidebar footer for now, settings page can come with future features
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can generate a personal API key from the app UI | `POST /api/keys` route using `createServerSupabaseClient()` + `generateApiKey()` + `apiKeyQueries.create()` — all Phase 5 assets ready |
| AUTH-02 | User can revoke an existing API key | `DELETE /api/keys` (or dedicated revoke path) using `apiKeyQueries.revoke()` — sets `revoked_at`, service role needed for update |
| AUTH-03 | User can POST to `/api/capture` with a bearer token to create a new inbox item | Service role client + `apiKeyQueries.findByHash()` + `queueQueries.create()` — all assets ready; duplicate-URL check is new query |
| AUTH-04 | Capture endpoint validates bearer token in route handler (not middleware) and returns body-level success/error JSON compatible with iOS Shortcuts | Pattern locked from CVE-2025-29927 research; `RawApiKeySchema` validation + `verifyApiKey()` + structured `{ success, error }` body |
</phase_requirements>

---

## Summary

Phase 6 connects Phase 5's fully-tested crypto and DB layers to three surfaces: two API route files and one sidebar UI section. The crypto primitives (`generateApiKey`, `hashApiKey`, `verifyApiKey`), DB query objects (`apiKeyQueries`, `queueQueries`), and Zod schemas (`RawApiKeySchema`, `QueueItemInsertSchema`) are all complete and tested. This phase is primarily wiring, not building.

The most architecturally distinct piece is `/api/capture`: it is the only route in the codebase that uses a Supabase service role client (all other routes use `createServerSupabaseClient()` with cookie sessions). This pattern is necessary because iOS Shortcuts cannot negotiate cookie-based auth. The pattern is already documented in ARCHITECTURE.md and has a precedent in the Phase 5 design.

The sidebar extension is surgical: add a footer section below the sign-out button following the monochrome aesthetic (`text-white/30`, `border-white/[0.08]` existing tokens), with a key icon, inline key reveal, and copy-to-clipboard with 2s checkmark feedback.

**Primary recommendation:** Build `/api/capture` first (self-contained, zero UI dependency), then `/api/keys`, then the sidebar section. Each step is independently testable.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` (App Router) | existing | Route handlers at `src/app/api/*/route.ts` | Project standard |
| `@supabase/supabase-js` | existing | Service role client in capture route | Only Supabase client available |
| `@supabase/ssr` | existing | `createServerSupabaseClient()` for key management routes | Project standard for session routes |
| `zod` | existing | `RawApiKeySchema`, `QueueItemInsertSchema` validation | Project standard |
| `node:crypto` | built-in | `createHash`, `timingSafeEqual` in `apiKeys.ts` | Already used in Phase 5 |
| `nanoid` | v3.3.11 (transitive) | `generateApiKey()` body generation | Used in Phase 5 |

### Supporting (for metadata extraction)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| native `fetch` + `AbortSignal.timeout` | Node.js built-in | Fetch URL `<head>` for title/meta extraction | Light, no dependencies — sufficient for `<head>`-only extraction |
| `URL` constructor | Node.js built-in | Parse `source_domain` from raw URL string | `new URL(url).hostname` |

### What NOT to install

No new packages needed for Phase 6. The `<head>`-only fetch (not full article extraction) is light enough for native `fetch` + a simple string parser. Full HTML parsing libraries (`jsdom`, `cheerio`, `@mozilla/readability`) are deferred to Phase 8 Crystallize. Avoid introducing them here — they are large, Node.js-runtime-only dependencies.

### Installation

```bash
# No new packages. All dependencies already present.
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 6 additions only)

```
src/
├── app/api/
│   ├── capture/
│   │   └── route.ts          # NEW — service role bearer auth
│   └── keys/
│       └── route.ts          # NEW — GET active key + POST generate + DELETE revoke
├── components/layout/
│   └── AppSidebar.tsx        # MODIFIED — add API key footer section
```

Note: ARCHITECTURE.md suggested `/api/keys/[id]/route.ts` for revoke. Given 1-key-max per user, the simpler pattern is a single `DELETE /api/keys` that revokes the authenticated user's active key without needing an ID. The locked decision ("1 key max per user") makes the `[id]` route unnecessary ceremony.

### Pattern 1: Service Role Client for `/api/capture`

**What:** `/api/capture` creates a service role Supabase client — the single exception to the cookie-auth pattern used everywhere else.

**Why needed:** iOS Shortcuts cannot negotiate cookie-based Supabase auth. `createServerSupabaseClient()` reads `next/headers` cookies which do not exist in mobile API calls. The service role client is stateless and authenticates via the `SUPABASE_SERVICE_ROLE_KEY` env var.

**Critical:** Never use the service role client in routes accessible from the browser. Document the exception at the file level.

```typescript
// src/app/api/capture/route.ts
// ⚠️ EXCEPTION: This route uses the service role client.
// Reason: iOS Shortcuts bearer token auth — no cookie session available.
// Pattern: all other routes use createServerSupabaseClient().
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### Pattern 2: Bearer Token Validation in Route Handler

**What:** Extract the `Authorization` header, validate format with `RawApiKeySchema`, hash with `hashApiKey`, look up `apiKeyQueries.findByHash()`, reject if not found or `revoked_at` is set.

**Why in route handler:** CVE-2025-29927 allows `x-middleware-subrequest` header to bypass Next.js middleware entirely (CVSS 9.1). Auth MUST live inside the route handler.

```typescript
// Complete auth block for /api/capture
const authHeader = request.headers.get('Authorization');
const rawKeyResult = RawApiKeySchema.safeParse(
  authHeader?.replace(/^Bearer\s+/i, '').trim()
);
if (!rawKeyResult.success) {
  return NextResponse.json({ success: false, error: 'unauthorized' });
}

const keyHash = hashApiKey(rawKeyResult.data);
const keyRow = await apiKeyQueries.findByHash(supabaseAdmin, keyHash);
if (!keyRow) {
  return NextResponse.json({ success: false, error: 'unauthorized' });
}
// keyRow.user_id is the authenticated identity
```

Note: `findByHash` already filters `revoked_at IS NULL` (Phase 5 implementation confirmed). No additional revocation check needed.

### Pattern 3: Rate Limiting via `last_used_at`

**What:** Check if 60+ captures have occurred in the last hour by tracking `last_used_at`. The Phase 5 schema stores `last_used_at` per key, but rate limiting requires counting captures, not just the last timestamp.

**Gap:** The current `user_api_keys` table has `last_used_at` (single timestamp) but no per-key capture count or rolling window. The decision "rate limit: 60 captures/hour" requires a count query on `knowledge_queue` in the last hour for this user.

**Recommended implementation:**
```typescript
// Count captures in last 60 minutes for this user
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const { count } = await supabaseAdmin
  .from('knowledge_queue')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', keyRow.user_id)
  .gte('created_at', oneHourAgo);

if ((count ?? 0) >= 60) {
  return NextResponse.json({ success: false, error: 'rate_limited' });
}
```

This avoids a separate rate-limit table and leverages existing schema. The `knowledge_queue` table has `created_at` indexed (partial index from Phase 5 migration).

### Pattern 4: Duplicate URL Detection

**What:** Before inserting, check if a URL with the same value already exists in the user's queue (any state). Return `{ success: false, error: 'duplicate', existing_id }` if found.

**Gap:** `queueQueries` has no `findByUrl` method — this is a new query needed in Phase 6.

```typescript
// New query needed: queueQueries.findByUrl(client, userId, url)
const { data: existing } = await supabaseAdmin
  .from('knowledge_queue')
  .select('id')
  .eq('user_id', keyRow.user_id)
  .eq('url', url)
  .limit(1)
  .single();

if (existing) {
  return NextResponse.json({
    success: false,
    error: 'duplicate',
    existing_id: existing.id,
  });
}
```

This query should be added to `queueQueries.ts` (following Phase 5 pattern) rather than inlined in the route handler.

### Pattern 5: Light `<head>` Fetch for URL Metadata

**What:** After passing auth and duplicate checks, fetch only the `<head>` section of the URL for `<title>` and `<meta name="og:title">` / `<meta property="og:title">` tags.

**Implementation decision (Claude's Discretion):** Use native `fetch` with `AbortSignal.timeout(3000)` and simple regex/string parsing. No external parser needed for `<head>` extraction — jsdom/cheerio overhead is unjustified for title-only extraction.

```typescript
async function extractHeadMetadata(url: string): Promise<{
  title: string | null;
  favicon_url: string | null;
  estimated_read_time: number | null;
  source_domain: string;
}> {
  const source_domain = new URL(url).hostname;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'NeuroGraph/1.0 (+https://neurograph.app)' },
    });
    const html = await response.text();

    // Extract first 8KB only — <head> is always near the top
    const head = html.slice(0, 8192);

    // Priority: og:title > twitter:title > <title>
    const ogTitle = head.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
    const pageTitle = head.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    const title = ogTitle ?? pageTitle ?? null;

    // Favicon: look for <link rel="icon"> or use /favicon.ico
    const faviconPath = head.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1];
    const favicon_url = faviconPath
      ? (faviconPath.startsWith('http') ? faviconPath : `https://${source_domain}${faviconPath}`)
      : `https://${source_domain}/favicon.ico`;

    return { title, favicon_url, estimated_read_time: null, source_domain };
  } catch {
    // Timeout, 403, DNS failure — fallback to domain as title
    return { title: null, favicon_url: null, estimated_read_time: null, source_domain };
  }
}
```

**Title fallback logic in capture route:**
```typescript
const meta = url ? await extractHeadMetadata(url) : null;
const title = body.title ?? meta?.title ?? meta?.source_domain ?? 'Untitled';
```

### Pattern 6: Key Management Route (`/api/keys`)

**What:** Session-authenticated route for GET (active key), POST (generate), DELETE (revoke).

**Route structure decision (Claude's Discretion):** Single file `/api/keys/route.ts` with GET/POST/DELETE method handlers. No `[id]` sub-route needed — 1 key per user makes ID-based targeting unnecessary.

```typescript
// GET — return active key prefix (never the full hash)
export async function GET() {
  const { user, supabase, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  const key = await apiKeyQueries.getActiveByUserId(supabase, user.id);
  return NextResponse.json({ key: key ? { id: key.id, prefix: key.key_prefix, created_at: key.created_at, last_used_at: key.last_used_at } : null });
}

// POST — generate new key (auto-revokes existing)
export async function POST() {
  // Uses service role for INSERT (RLS: SELECT+DELETE only for users)
  // 1. Revoke any existing active key via supabase (cookie session, user-scoped)
  // 2. Generate rawKey, compute hash + prefix
  // 3. Insert via service role client
  // 4. Return rawKey ONCE — never stored
}

// DELETE — revoke active key
export async function DELETE() {
  const { user, supabase, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  const key = await apiKeyQueries.getActiveByUserId(supabase, user.id);
  if (key) await apiKeyQueries.revoke(supabase, key.id);
  return NextResponse.json({ success: true });
}
```

**RLS note from Phase 5 decisions:** `user_api_keys` RLS is SELECT+DELETE only for users. INSERT requires service role client. The POST handler needs a service role client for the INSERT step only. The GET and DELETE handlers can use the cookie session client.

### Pattern 7: Sidebar API Key Section

**What:** Footer section below sign-out in `AppSidebar.tsx`. Follows existing monochrome token vocabulary.

**States to render:**
1. No active key: show "API" label + "Generate key" button
2. Active key: show key prefix (`ng_XXXXXXXX...`) + "Revoke" button
3. Generating (loading): spinner replacing the generate button
4. Just generated: inline reveal panel with key text + copy button + "Won't be shown again" warning

**Implementation (Claude's Discretion):** Inline state machine in the sidebar footer section using `useState`. No separate component file needed — the section is compact (~60 lines).

```typescript
// Sidebar footer section additions (collapsed-aware, follows existing pattern)
type KeyUIState = 'loading' | 'no-key' | 'has-key' | 'generating' | 'revealed';
const [keyState, setKeyState] = useState<KeyUIState>('loading');
const [keyData, setKeyData] = useState<{ prefix: string } | null>(null);
const [rawKey, setRawKey] = useState<string | null>(null);
const [copied, setCopied] = useState(false);

// Copy-to-clipboard with 2s checkmark
const handleCopy = async () => {
  if (!rawKey) return;
  await navigator.clipboard.writeText(rawKey);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

**Collapsed state:** When sidebar is collapsed (`isCollapsed === true`), hide the key section entirely — it is not navigable or iconifiable without confusing the minimal icon row.

**Visual spec** (consistent with `.impeccable.md` monochrome design):
- Section label: `text-[10px] font-bold uppercase tracking-widest text-neural-light/40` (matches "Conversations" label)
- Key prefix display: `font-mono text-xs text-white/50`
- Buttons: `p-2 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors` (matches tour/sign-out buttons)
- Revealed key: `font-mono text-xs text-white/70 bg-white/[0.04] px-2 py-1.5 rounded border border-white/[0.08]`
- Warning text: `text-[10px] text-white/30`
- Copy checkmark: swap `ClipboardIcon` → `CheckIcon` for 2s

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API key crypto | Custom entropy generation | `generateApiKey()` from `src/lib/auth/apiKeys.ts` | Already tested; 285 bits entropy |
| Key hashing | Custom hash comparison | `hashApiKey()` + `verifyApiKey()` from `apiKeys.ts` | `timingSafeEqual` prevents timing attacks |
| Bearer token format validation | Custom regex | `RawApiKeySchema` from `src/lib/validation/apiKeys.ts` | Already tested |
| Queue item insertion | Direct Supabase client in route | `queueQueries.create()` from `apiKeyQueries.ts` | Tested, typed |
| API key DB operations | Direct Supabase queries in route | `apiKeyQueries.*` from `apiKeyQueries.ts` | Tested, typed |
| Full HTML parsing for `<head>` | jsdom/cheerio | Native `fetch` + 8KB string slice + regex | `<head>` metadata doesn't need a DOM parser; regex is sufficient and has zero overhead |
| Rate limiting table | New `capture_events` table | Count query on `knowledge_queue.created_at` | Avoids schema addition; `created_at` is already indexed |
| Modal for key reveal | Full modal component | Inline `revealed` state in sidebar footer | Decision locked: "inline reveal with copy" |

---

## Common Pitfalls

### Pitfall 1: Using Cookie Client in `/api/capture`

**What goes wrong:** Developer copies the `createServerSupabaseClient()` pattern from another route. The capture route receives no browser cookies. Every request returns 401.

**Why it happens:** `createServerSupabaseClient()` is used in every other route. Copy-paste is automatic.

**How to avoid:** Add a file-level comment to `route.ts` explaining the exception. The service role client is the ONLY client that works here.

**Warning signs:** `supabase.auth.getUser()` returning null in the capture route during testing.

### Pitfall 2: Relying on Middleware for Bearer Token Auth (CVE-2025-29927)

**What goes wrong:** Moving the `Authorization: Bearer` check to `middleware.ts` for DRY. An attacker sends `x-middleware-subrequest: middleware` header and bypasses middleware entirely.

**Why it happens:** Centralizing auth in middleware looks like good architecture. For cookie sessions it's fine. For the capture endpoint it is a CVSS 9.1 vulnerability.

**How to avoid:** Bearer token validation lives exclusively in `src/app/api/capture/route.ts`. Never move it to middleware.

### Pitfall 3: Returning HTTP Error Status Without Body (iOS Shortcuts)

**What goes wrong:** Route returns `401` or `422` with an empty or non-JSON body. iOS Shortcuts "Get Contents of URL" action reads the body, not the HTTP status. Shortcut silently succeeds; item is never captured.

**Why it happens:** Standard Next.js error pattern uses `{ status: 401 }` and optional message. Nobody tests with iOS Shortcuts during development.

**How to avoid:** EVERY response from `/api/capture` is JSON with a `success` boolean:
```typescript
// All error responses — always include success: false in the body
return NextResponse.json({ success: false, error: 'unauthorized' });
// NOT: return new Response('Unauthorized', { status: 401 });
```

### Pitfall 4: Logging the Authorization Header

**What goes wrong:** Developer adds `console.log(request.headers)` or Vercel log drain captures the full `Authorization: Bearer ng_XXXXXX` value. Key appears in plaintext logs permanently.

**Why it happens:** Standard debugging. The header is easily accessible.

**How to avoid:** Never log `request.headers.get('authorization')`. Log only `keyRow.key_prefix` (already safe for display) on successful auth.

### Pitfall 5: Showing Raw Key in GET `/api/keys` Response

**What goes wrong:** The key management GET route accidentally includes `key_hash` in the response. `key_hash` is a SHA-256 hex string — not the raw key, but still a secret that enables verification attacks if the rainbow-table-attack surface is relevant.

**Why it happens:** TypeScript spreads the full `ApiKey` row into the response without filtering.

**How to avoid:**
```typescript
// Return only safe fields — never key_hash
return NextResponse.json({
  key: { id: key.id, prefix: key.key_prefix, created_at: key.created_at, last_used_at: key.last_used_at }
});
```

### Pitfall 6: SSRF via URL Capture

**What goes wrong:** Capture endpoint fetches `http://169.254.169.254/latest/meta-data/` (AWS metadata endpoint) if an attacker provides that URL.

**Why it happens:** The light `<head>` fetch runs on the server; no URL restriction blocks private IPs.

**How to avoid:** Validate URL before fetching:
```typescript
function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    // Block private/loopback ranges
    const host = u.hostname;
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host)) return false;
    if (host === 'localhost') return false;
    return true;
  } catch {
    return false;
  }
}
```

### Pitfall 7: Auto-Revoking Previous Key Without Confirmation

**What goes wrong:** POST `/api/keys` silently revokes the existing key and generates a new one. The user forgets the old key was active in their iOS Shortcut. Shortcut breaks silently.

**Why it happens:** "1 key max" decision + generate button = auto-revoke. CONTEXT.md confirms this behavior is intentional.

**How to avoid (UX):** The sidebar UI should warn when an active key exists before generating: "This will revoke your existing key. Any iOS Shortcuts using the old key will stop working." A single confirmation step (not a modal — inline text + "Generate anyway" button) is sufficient given the locked "no modal ceremony" decision.

---

## Code Examples

Verified patterns from existing codebase:

### Route Handler Template (existing pattern)

```typescript
// Source: src/app/api/neurons/route.ts — established POST pattern
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    // ... business logic
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### `getAuthenticatedUser()` Pattern (existing helper)

```typescript
// Source: src/lib/auth/server.ts
const { user, supabase, errorResponse } = await getAuthenticatedUser();
if (errorResponse) return errorResponse;
// user is guaranteed non-null after this check
```

### Supabase Service Role Client (for capture + key INSERT)

```typescript
// Source: ARCHITECTURE.md — service role pattern
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### Complete Capture Route Skeleton

```typescript
// src/app/api/capture/route.ts
// ⚠️ EXCEPTION: Service role client — no cookie session (iOS Shortcuts bearer auth)
export async function POST(request: NextRequest) {
  // 1. Extract + validate bearer token
  const rawKey = RawApiKeySchema.safeParse(
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim()
  );
  if (!rawKey.success) return NextResponse.json({ success: false, error: 'unauthorized' });

  // 2. Look up key (findByHash filters revoked_at IS NULL)
  const keyHash = hashApiKey(rawKey.data);
  const keyRow = await apiKeyQueries.findByHash(supabaseAdmin, keyHash);
  if (!keyRow) return NextResponse.json({ success: false, error: 'unauthorized' });

  // 3. Rate limit: 60 captures/hour
  // ... count query on knowledge_queue

  // 4. Parse + validate body
  const body = QueueItemInsertSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ success: false, error: 'invalid_payload' });

  // 5. Duplicate URL check (new queueQueries.findByUrl)
  if (body.data.url) {
    // ... check existing URL
  }

  // 6. Light <head> fetch for metadata
  const meta = body.data.url ? await extractHeadMetadata(body.data.url) : null;

  // 7. Insert queue item
  const item = await queueQueries.create(supabaseAdmin, {
    user_id: keyRow.user_id,
    title: body.data.title ?? meta?.title ?? meta?.source_domain ?? 'Untitled',
    url: body.data.url ?? null,
    notes: body.data.notes ?? null,
    state: 'inbox',
    source_domain: meta?.source_domain ?? null,
    favicon_url: meta?.favicon_url ?? null,
    estimated_read_time: null,
  });

  // 8. Update last_used_at
  await apiKeyQueries.updateLastUsed(supabaseAdmin, keyRow.id);

  // 9. Return full item (iOS Shortcut rich notification)
  return NextResponse.json({
    success: true,
    item: { id: item.id, title: item.title, url: item.url, source_domain: item.source_domain, state: item.state },
  }, { status: 201 });
}
```

### Sidebar Footer Section (collapsed-aware pattern)

```typescript
// Source: src/components/layout/AppSidebar.tsx — existing footer pattern
{/* Existing footer */}
<div className="p-4 border-t border-white/5">
  {/* ... user email + tour + sign out (unchanged) */}
</div>

{/* NEW: API Key section — only visible when not collapsed */}
{!isCollapsed && (
  <div className="px-4 pb-4 border-t border-white/5 pt-3">
    <p className="text-[10px] font-bold uppercase tracking-widest text-neural-light/40 mb-2">
      API
    </p>
    {/* State-switched content: no-key | has-key | generating | revealed */}
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API keys validated in Next.js middleware | Validated in route handler body | CVE-2025-29927 (March 2025) | Middleware-only auth is now a CVSS 9.1 vulnerability |
| bcrypt for API key hashing | SHA-256 for high-entropy tokens | Industry consensus, 2024+ | SHA-256 is fast (~microseconds) and safe for 285-bit tokens; bcrypt's slow-hash property is unnecessary and adds per-request latency |
| `crypto.randomUUID()` for keys | `nanoid` with custom alphabet | Project standard (Phase 5) | nanoid v3 + custom 62-char alphabet produces URL-safe, predictable-length keys |
| iOS Shortcuts HTTP status handling | Body-level JSON with `success` boolean | iOS Shortcuts API limitation | Shortcuts does not natively surface HTTP status — body `success` field is the reliable signal |

**Deprecated/outdated:**
- `bcrypt` for API key hashing: overkill for high-entropy tokens, adds unnecessary latency. SHA-256 is the correct choice here (confirmed in Phase 5 research).
- `x-middleware-subrequest` bypass: Next.js >= 14.2.25 patches this, but route-handler auth is still the correct pattern regardless.

---

## Open Questions

1. **Next.js version check for CVE-2025-29927**
   - What we know: The patch requires Next.js >= 14.2.25
   - What's unclear: Current `package.json` `next` version — needs verification at build time
   - Recommendation: Add a note in the plan to verify `next` version; implement route-handler auth regardless (defense in depth)

2. **Rate limit false positive: non-URL items**
   - What we know: Rate limit counts knowledge_queue rows in last hour
   - What's unclear: Should non-URL pure-thought items (no `url`) count against the rate limit?
   - Recommendation: Yes, count all captures (url or not) — the limit is per-key throughput, not URL-specific

3. **`queueQueries.findByUrl` placement**
   - What we know: `findByUrl` is a new query needed in Phase 6 not present in Phase 5 output
   - What's unclear: Should it be added to `queueQueries.ts` (modifying Phase 5 output) or inlined in the route?
   - Recommendation: Add to `queueQueries.ts` — follows the module pattern and keeps route handlers thin. Include a test in the plan.

4. **Favicon URL validity**
   - What we know: We can attempt `https://{domain}/favicon.ico` as fallback
   - What's unclear: Many sites use non-standard favicon paths; `/favicon.ico` may 404
   - Recommendation: Store the extracted value and let the UI handle 404s gracefully (broken img is acceptable). Don't block capture on favicon resolution.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (configured in `vitest.config.ts`) |
| Config file | `vitest.config.ts` — `src/**/*.{test,spec}.{ts,tsx}` |
| Quick run command | `npx vitest run src/app/api/capture --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST `/api/keys` generates key, returns prefix + raw key once | unit (route mock) | `npx vitest run src/app/api/keys --reporter=verbose` | ❌ Wave 0 |
| AUTH-01 | GET `/api/keys` returns active key prefix (never hash) | unit (route mock) | `npx vitest run src/app/api/keys --reporter=verbose` | ❌ Wave 0 |
| AUTH-02 | DELETE `/api/keys` sets revoked_at; subsequent captures fail | unit (route mock) | `npx vitest run src/app/api/keys --reporter=verbose` | ❌ Wave 0 |
| AUTH-03 | POST `/api/capture` with valid bearer creates inbox item | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-03 | Duplicate URL returns `{ success: false, error: 'duplicate', existing_id }` | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-03 | Rate limit: 60th capture succeeds, 61st returns rate_limited | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-04 | Missing bearer returns `{ success: false, error: 'unauthorized' }` | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-04 | Revoked key returns `{ success: false, error: 'unauthorized' }` | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-04 | Malformed bearer (wrong format) returns unauthorized | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-03+04 | SSRF: `http://127.0.0.1` URL blocked before fetch | unit | `npx vitest run src/lib/capture --reporter=verbose` | ❌ Wave 0 |
| AUTH-04 | `x-middleware-subrequest` header does NOT bypass route-level auth | unit (route mock) | `npx vitest run src/app/api/capture --reporter=verbose` | ❌ Wave 0 |

Note: `queueQueries.findByUrl` (new method) should have a unit test alongside existing `queueQueries.test.ts`. Update that file in Wave 0.

### Sampling Rate
- **Per task commit:** `npx vitest run src/app/api/capture src/app/api/keys --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/capture/__tests__/route.test.ts` — covers AUTH-03, AUTH-04
- [ ] `src/app/api/keys/__tests__/route.test.ts` — covers AUTH-01, AUTH-02
- [ ] `src/lib/capture/__tests__/extractHeadMetadata.test.ts` — covers SSRF, timeout fallback, og:title extraction
- [ ] Update `src/lib/db/__tests__/queueQueries.test.ts` — add `findByUrl` test cases
- [ ] (Optional) `src/lib/capture/__tests__/isSafeUrl.test.ts` — covers SSRF URL validation

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis — `src/lib/auth/apiKeys.ts`, `src/lib/db/apiKeyQueries.ts`, `src/lib/db/queueQueries.ts`, `src/lib/validation/apiKeys.ts`, `src/lib/validation/queue.ts`, `src/types/database.ts`, `src/components/layout/AppSidebar.tsx`, `src/app/api/neurons/route.ts`, `src/lib/auth/supabase.ts`, `src/lib/auth/server.ts`
- `.planning/research/PITFALLS.md` — CVE-2025-29927, iOS Shortcuts body-level JSON, SSRF prevention
- `.planning/research/ARCHITECTURE.md` — service role client pattern, build order, data flows
- `.planning/phases/06-capture-api-key-management/06-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 5 executed decisions (SHA-256 hashing, RLS SELECT+DELETE scope, nanoid v3.3.11)
- `vitest.config.ts` + existing `__tests__/` files — confirmed test framework and mocking patterns

### Tertiary (LOW confidence)
- None — all claims sourced from project files or locked CONTEXT.md decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed present in `package.json`; no new installs needed
- Architecture: HIGH — route patterns and service role client directly verified in codebase
- Pitfalls: HIGH — CVE-2025-29927, iOS Shortcuts body-reading, SSRF all documented with sources in project research
- UI patterns: HIGH — `AppSidebar.tsx` read directly; Tailwind tokens confirmed from existing component

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable Next.js + Supabase APIs; no fast-moving dependencies in scope)
