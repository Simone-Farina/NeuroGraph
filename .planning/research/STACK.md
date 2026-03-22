# Stack Research

**Domain:** Cognitive MicroSaaS / Graph-based Knowledge Management
**Researched:** 2026-03-21 (updated 2026-03-22 for v1.1 Staging Area milestone)
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js App Router | 14.2.x | Full-stack React framework | Server components excel for data-heavy dashboard layouts, and App Router API routes perfectly host AI streams. |
| Supabase | Latest | Auth & PostgreSQL DB | Native pgvector support is critical for the "AI Bouncer" background vector search to prevent duplicate Neurons. |
| React Flow (`@xyflow/react`) | Latest | Graph Visualization | Industry standard for node-based UIs with physics, interactive panning, and deep React component integration for Neurons. |
| Vercel AI SDK | 3.x+ | AI Orchestration & UI | `useChat` and `streamUI` allow seamless tool-calling and generative UI required for the Socratic engine and In-Place Extraction. |
| Zustand | 4.x+ | Global State | Necessary to bridge the 40/60 split; React Flow state needs to be accessible by the Left Panel chat components. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ts-fsrs` | Latest | Spaced Repetition | The core engine for Rigorous Retention and calculating the "rusting" of Neurons over time. |
| `zod` | Latest | Schema Validation | Absolutely required to enforce AI output structure for Neurogenesis and tool calls. |
| `lucide-react` | Latest | Iconography | Standardized semantic icons for UI toolbars and DAG node statuses (locked, rusted, active). |
| `framer-motion` | 11.x | Fluid Animations | Smooth transition for the "Fog of War" clearing, and when nodes spawn from Neurogenesis. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain | Overly abstracted and heavy for a Next.js edge environment. Hard to debug tool outputs. | Vercel AI SDK Core with direct provider logic |
| React Context for Graph State | Re-render hell across a 100-node graph when a single chat message streams in. | Zustand with scoped selectors |
| LocalStorage for Graph Persistence | Exceeds quota quickly and breaks cross-device syncing. | Supabase with optimistic UI updates |

---

## v1.1 Staging Area — New Additions Only

The sections below cover only what must be **added** for the Staging Area milestone. The base stack above is already validated and in production.

### (1) Personal API Key Generation & Validation

**Decision: nanoid + Node.js built-in crypto — zero new dependencies.**

| What | How | Why |
|------|-----|-----|
| Key generation | `nanoid(48)` with custom alphabet `A-Za-z0-9` | 48 chars = ~286 bits of entropy; cryptographically secure (uses `crypto.getRandomValues`); URL-friendly; no prefix needed |
| Key storage | SHA-256 hash stored in Supabase `user_api_keys` table | Never store plaintext. `crypto.createHash('sha256').update(key).digest('hex')` is zero-dependency and available in Node.js. |
| Key validation | Middleware helper: hash incoming `Authorization: Bearer <key>` and look up in table with `timing-safe` compare | SHA-256 of the request key is compared against stored hash via `crypto.timingSafeEqual()` to prevent timing attacks. |
| Key format | `ng_<48-char-alphanum>` prefix | `ng_` prefix identifies the issuer in logs and makes the token recognizable to users. |

**nanoid** is already an indirect dependency in the project (used by several AI SDK packages). Import directly from `nanoid` — already in lockfile, no net-new install required. Confirm with `ls node_modules/nanoid`.

**No JWT overhead.** JWT-based API keys (the Supabase Vault pattern) adds Supabase Vault extension setup, RPC plumbing, and vault secrets management. For a single-user-scoped capture token that never needs role claims, a simple opaque token + hash table row is significantly simpler to implement, debug, and revoke.

**Supabase table schema (pure SQL migration — no new library):**

```sql
CREATE TABLE user_api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash     TEXT NOT NULL UNIQUE,         -- SHA-256 hex of the raw key
  label        TEXT NOT NULL DEFAULT 'iOS Shortcut',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON user_api_keys
  USING (auth.uid() = user_id);
```

**Validation helper (server-side, no new library):**

```typescript
import { createHash, timingSafeEqual } from 'crypto';

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export async function resolveApiKeyUser(
  rawKey: string,
  supabaseAdmin: SupabaseClient
): Promise<string | null> {
  const keyHash = hashApiKey(rawKey);
  const { data } = await supabaseAdmin
    .from('user_api_keys')
    .select('user_id, key_hash')
    .eq('key_hash', keyHash)
    .single();
  if (!data) return null;
  // timingSafeEqual redundancy: DB lookup is already exact-match, but good practice
  const stored = Buffer.from(data.key_hash, 'hex');
  const incoming = Buffer.from(keyHash, 'hex');
  if (stored.length !== incoming.length) return null;
  return timingSafeEqual(stored, incoming) ? data.user_id : null;
}
```

The mobile capture endpoint uses `SUPABASE_SERVICE_ROLE_KEY` (server-only) to call this, bypassing cookie-based auth entirely.

### (2) URL Content Extraction

**Decision: `@extractus/article-extractor` v8 — single install, best DX for this use case.**

| Library | Version | Verdict |
|---------|---------|---------|
| `@extractus/article-extractor` | 8.0.20 | **Use this.** Wraps fetch + DOM parsing + content extraction in one call. Returns structured `{ title, description, content, author, published }` object. Works in Node.js runtime (not edge). |
| `@mozilla/readability` + `jsdom` | 0.5.x + 24.x | Alternative. More control, but two packages, requires constructing a full JSDOM document from fetched HTML. Worth it only if fine-grained control over extraction rules is needed. |
| `cheerio` | 1.0.x | Avoid for this use case. Cheerio is a DOM query library, not an article extractor. Would require writing your own boilerplate extraction logic on top. |

**Critical runtime constraint:** `@extractus/article-extractor` uses `linkedom` for DOM parsing. This works in the **Node.js runtime** but will fail in the **Edge runtime**. The capture/extract API route must explicitly NOT declare `export const runtime = 'edge'`. The default Next.js App Router runtime is Node.js, so no action is needed — just don't add the edge export.

**Installation:**

```bash
npm install @extractus/article-extractor
```

**Usage pattern for the Crystallize endpoint:**

```typescript
import { extract } from '@extractus/article-extractor';

const article = await extract(url, {
  descriptionLengthThreshold: 100,
  contentLengthThreshold: 200,
}, {
  signal: AbortSignal.timeout(10_000), // 10s hard timeout
});

if (!article || !article.content) {
  throw new Error('Could not extract content from URL');
}
// article.title, article.content (HTML), article.description
```

**YouTube URLs are already handled** by the existing `youtube-transcript` + `youtube/route.ts`. The extract endpoint should detect YouTube URLs first (use existing `isYouTubeUrl()` from `src/lib/youtube`) and route to the existing transcript fetcher. Only non-YouTube URLs go through `@extractus/article-extractor`.

### (3) Knowledge Queue Data Model

**Decision: Plain Supabase table with a `status` enum column — no pgmq, no external queue library.**

pgmq (Supabase Queues) is designed for background job processing with visibility timeouts and worker consumers. The Staging Area is a *user-facing editorial list*, not a background job queue. Use a simple table with an application-level state machine.

**Four states (matching the Cognitive Funnel in PROJECT.md):**

```
inbox → passive_debt → crystallizing → (deleted or promoted to neuron)
```

`crystallizing` is a transient UI state — it signals the Crystallize flow is in progress (URL being fetched, AI chat being initialized). It is never persisted long-term; the row is either promoted to a Neuron conversation or reverted to `passive_debt` on failure.

**Migration SQL:**

```sql
CREATE TYPE queue_item_status AS ENUM (
  'inbox',          -- Just captured, untriaged
  'passive_debt',   -- User acknowledged it exists but hasn't processed it
  'crystallizing'   -- Crystallize flow in progress (transient)
);

CREATE TABLE queue_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          queue_item_status NOT NULL DEFAULT 'inbox',
  source_type     TEXT NOT NULL CHECK (source_type IN ('url', 'text', 'youtube')),
  source_url      TEXT,
  raw_content     TEXT,                -- User's note or pasted text
  extracted_title TEXT,               -- Populated after URL extraction
  extracted_text  TEXT,               -- Populated after URL extraction
  captured_via    TEXT NOT NULL DEFAULT 'web',  -- 'web' | 'ios_shortcut'
  neuron_id       UUID REFERENCES neurons(id) ON DELETE SET NULL,  -- Set when Crystallized
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own queue" ON queue_items
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_queue_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER queue_items_updated_at
  BEFORE UPDATE ON queue_items
  FOR EACH ROW EXECUTE FUNCTION update_queue_items_updated_at();
```

**AI isolation** is enforced at the application layer: `getRelevantContext()` in `src/lib/ai/rag.ts` only queries `neurons` — it never touches `queue_items`. No schema change needed to achieve this constraint.

**Index for Staging Area list queries:**

```sql
CREATE INDEX queue_items_user_status_idx ON queue_items(user_id, status, created_at DESC);
```

### (4) iOS Shortcut-Compatible REST Endpoint

**Decision: Standard Next.js App Router route handler with `Authorization: Bearer` header — no new library.**

iOS Shortcuts' "Get Contents of URL" action supports:
- HTTP method: POST
- Headers: arbitrary key/value pairs (use `Authorization: Bearer <api_key>`)
- Request Body: JSON

This maps perfectly to an existing Next.js route handler pattern. The endpoint must:

1. Extract the `Authorization` header (not a cookie — iOS has no session)
2. Strip the `Bearer ` prefix, hash the key, resolve the user via `user_api_keys`
3. Accept a minimal JSON body: `{ url?: string, text?: string }`
4. Validate with Zod (same pattern as all existing routes)
5. Insert into `queue_items` with `captured_via: 'ios_shortcut'`
6. Return `{ id, status: 'inbox' }` — simple, parseable by Shortcuts

**Endpoint shape:**

```
POST /api/capture
Authorization: Bearer ng_<key>
Content-Type: application/json

{ "url": "https://example.com/article", "note": "optional text" }
```

**No CORS configuration needed** — iOS Shortcuts makes server-to-server style requests, not browser requests. Vercel's default CORS headers are sufficient.

**Rate limiting:** Reuse the existing `check_rate_limit` Supabase RPC but call it with the resolved `user_id` via the service role client. No new rate-limiting library needed.

---

## Installation Summary (Net New for v1.1)

```bash
# One new package only
npm install @extractus/article-extractor
```

`nanoid` is already in the lockfile as a transitive dependency. All other capabilities (SHA-256 hashing, Supabase table migrations, Next.js route handlers, Zod validation) use existing infrastructure.

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@extractus/article-extractor` | `@mozilla/readability` + `jsdom` | Two packages instead of one; requires manually fetching HTML then constructing a JSDOM document. More control, but not needed here. |
| Opaque token + SHA-256 hash table | Supabase Vault JWT pattern | Vault pattern adds extension setup, RPC overhead, and Vault management complexity for what is essentially a simple bearer token lookup. |
| Plain `queue_items` table | Supabase pgmq queues | pgmq is for background worker queues with visibility timeouts. The Staging Area is a user-facing list, not a job processor. |
| `crypto` (built-in) for hashing | `bcrypt` or `argon2` | Password-stretching algorithms like bcrypt/argon2 are too slow (~100ms+) for per-request API key validation. SHA-256 is correct for token comparison because tokens are already high-entropy (not user-chosen passwords). |
| `nanoid(48)` opaque token | JWT | JWTs encode claims and require signature verification logic. For a simple user-scoped capture token, the extra complexity is pure overhead. |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@extractus/article-extractor@^8.0.20` | Node.js 18+, Next.js 14 | Must run in Node.js runtime (not edge). Do not add `export const runtime = 'edge'` to the extract route. |
| `nanoid@^5.1.7` (already in lockfile) | Node.js 18+, ESM | Import as `import { nanoid } from 'nanoid'`. No CommonJS require. |
| `@supabase/supabase-js@^2.95.3` (existing) | All new tables | `user_api_keys` and `queue_items` follow same RLS pattern as existing tables. |

## Sources

- [nanoid GitHub](https://github.com/ai/nanoid) — v5.1.7 current, cryptographically secure via `crypto.getRandomValues` — HIGH confidence
- [nanoid npm](https://www.npmjs.com/package/nanoid) — Version confirmed — HIGH confidence
- [@extractus/article-extractor npm](https://www.npmjs.com/package/@extractus/article-extractor) — v8.0.20 current — HIGH confidence
- [@extractus/article-extractor GitHub README](https://github.com/extractus/article-extractor/blob/main/README.md) — API shape verified — HIGH confidence
- [Supabase API Key pattern gist](https://gist.github.com/j4w8n/25d233194877f69c1cbf211de729afb2) — JWT+Vault pattern (considered but rejected for simpler approach) — MEDIUM confidence
- [Supabase API Keys docs](https://supabase.com/docs/guides/api/api-keys) — Hash storage best practice confirmed — HIGH confidence
- [Node.js crypto docs](https://nodejs.org/api/crypto.html) — `createHash`, `timingSafeEqual` built-in — HIGH confidence
- [iOS Shortcuts JSON POST pattern](https://www.trovster.com/blog/2024/05/using-a-json-api-and-ios-shortcut-to-update-my-website) — Bearer header + JSON body confirmed working — MEDIUM confidence
- [makerkit Supabase API key management](https://makerkit.dev/blog/tutorials/supabase-api-key-management) — SHA-256 hash storage pattern — MEDIUM confidence

---
*Stack research for: Cognitive MicroSaaS — v1.1 Staging Area milestone*
*Researched: 2026-03-22*
