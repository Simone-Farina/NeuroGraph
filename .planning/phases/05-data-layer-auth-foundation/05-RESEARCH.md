# Phase 5: Data Layer & Auth Foundation - Research

**Researched:** 2026-03-22
**Domain:** Supabase PostgreSQL schema, RLS, TypeScript types, Zod validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Queue Item Schema — MINIMAL + METADATA**
Fields: `id`, `user_id`, `title`, `url` (nullable — supports pure thoughts), `notes` (nullable), `state` (4-state enum), `source_domain` (auto-extracted from URL), `favicon_url` (auto-extracted), `estimated_read_time` (auto-extracted), `created_at`, `updated_at`.
- URL is optional — queue accepts both external URLs and text-only quick thoughts.
- The capture endpoint auto-extracts page `<title>`, `source_domain`, `favicon_url`, and `estimated_read_time` from the URL server-side. Client only sends the URL.

**API Key Storage & Limits**
- 1 key max per user. Generating a new key auto-revokes the previous one. No key management list needed.
- SHA-256 hash via Node.js `crypto.createHash`. `ng_` prefix stored for display. `crypto.timingSafeEqual` for comparison.
- No expiry — key lives until manually revoked.
- Rate limit: 60 captures/hour per key, checked via `last_used_at` timestamp comparison. Not a hard DB constraint — checked in the route handler.

**State Machine (Forward-Only Funnel)**
Valid transitions:
- `inbox` → `passive_debt` (auto on view/open)
- `inbox` → `resource` (manual archive)
- `passive_debt` → `mastered` (via Crystallize → Neurogenesis)
- `resource` → `passive_debt` (un-archive)

Blocked: `mastered` → anything (earned, permanent). `passive_debt` → `inbox` (can't unsee).
- Server-side allowlist validates all transitions. Client does optimistic update with rollback on rejection.
- Mastered items disappear from the queue list. They exist only as Neurons in the graph.
- Hard delete — no soft delete, no trash. Consistent with the 14-day TTL philosophy.

**RLS & AI Isolation**
- `knowledge_queue` table has its own RLS policies scoped to `auth.uid() = user_id`.
- Structural isolation: table is never joined or queried in chat routes, RAG context, or Neurogenesis flows.
- The capture endpoint will need a service role client (no cookie session from iOS Shortcuts). Isolated to the capture route handler — all other routes continue using `createServerSupabaseClient()`.

### Claude's Discretion
- Exact migration file naming and ordering
- Whether to use a PostgreSQL ENUM type or a CHECK constraint for the 4-state field
- Index strategy for the queue (probably `user_id` + `state` composite)
- Whether `estimated_read_time` is stored as integer (minutes) or text ("5 min read")

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | System stores queue items with title, URL (optional), notes (optional), and a 4-state enum (inbox, resource, passive_debt, mastered) | `knowledge_queue` migration SQL, TypeScript `KnowledgeQueueItem` type, Zod `QueueItemInsertSchema` |
| DATA-02 | System stores hashed API keys per user with key_prefix for display, created_at, and last_used_at timestamps | `user_api_keys` migration SQL, `hashApiKey()` function, TypeScript `ApiKey` type |
| DATA-03 | Queue items table has RLS policies scoped to the owning user and is structurally isolated from the neurons/embeddings pipeline | RLS policy SQL, isolation enforced by separate table never referenced in chat/RAG routes |
| DATA-04 | TypeScript types and Zod validation schemas exist for QueueItem and ApiKey entities | `Database` type extension in `src/types/database.ts`, Zod schemas for insert/update validation |
</phase_requirements>

---

## Summary

Phase 5 is purely a data layer phase — two SQL migrations, TypeScript type extensions, and Zod schemas. No UI, no API routes, no business logic. The goal is a structurally correct, RLS-secured foundation that phases 6–8 can build on without revisiting schema decisions.

The locked decisions from CONTEXT.md are precise: `knowledge_queue` has exactly 4 states (`inbox`, `passive_debt`, `resource`, `mastered`) as a forward-only funnel. `user_api_keys` stores a SHA-256 hex hash of the raw key, plus a display prefix. Both tables get standard `auth.uid() = user_id` RLS policies. AI isolation is structural — the tables simply don't exist in any chat/RAG query path.

The existing codebase patterns are mature and consistent: migrations use timestamp-prefixed SQL files, `src/types/database.ts` defines a `Database` type with `Row/Insert/Update` sub-types, DB queries use a `xyzQueries` object taking a `SupabaseClient<Database>`, and Zod schemas are co-located with route handlers (not a separate validation directory). Phase 5 must follow these patterns exactly to stay consistent with what phases 6+ will import.

**Primary recommendation:** Two migrations — one for `knowledge_queue`, one for `user_api_keys`. Extend `src/types/database.ts`. Add Zod schemas to `src/lib/validation/queue.ts` and `src/lib/validation/apiKeys.ts` (new directory per architecture plan). Use a CHECK constraint (not a PostgreSQL ENUM) for the state field — simpler to extend if the state machine ever needs a fifth state.

---

## Standard Stack

### Core (all already in the project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^0.8.0` (SSR) | Supabase client for migrations and RLS | Established project pattern; cookie-based auth via `createServerSupabaseClient()` |
| `zod` | `^4.3.6` | Schema validation | Already used in `neurons/extract` and `neurons/ai-action` routes |
| Node.js `crypto` | built-in | SHA-256 hashing, `timingSafeEqual` | Zero-dependency; locked decision in CONTEXT.md |
| TypeScript | project standard | Type safety for DB row shapes | `src/types/database.ts` pattern already established |

### Supporting (already in lockfile)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nanoid` | `3.3.11` (transitive) | Key generation | Used for generating the raw `ng_<48-char>` API key — **confirmed in `node_modules`** |

**Important:** `nanoid` in this project is v3.3.11, NOT v5.x. The import works as both CJS (`require('nanoid')`) and ESM (`import { nanoid } from 'nanoid'`). Use `customAlphabet` for the alphanumeric-only alphabet required for the key body. No install needed.

### No New Dependencies for Phase 5

Phase 5 installs nothing. All capabilities (SHA-256, Supabase migrations, Zod, TypeScript) are built-in or already present.

---

## Architecture Patterns

### Recommended New File Locations

```
supabase/migrations/
├── 20260217223000_add_messages_metadata.sql    (existing)
├── 20260302120000_unique_neuron_titles.sql     (existing)
├── 20260304000000_check_rate_limit.sql         (existing)
├── 20260321000000_ttl_cron.sql                 (existing)
├── 20260322000000_knowledge_queue.sql          (NEW — Wave 1)
└── 20260322000001_user_api_keys.sql            (NEW — Wave 1)

src/
├── types/
│   └── database.ts                             (MODIFIED — add new table types)
└── lib/
    └── validation/                             (NEW directory)
        ├── queue.ts                            (NEW — QueueItem Zod schemas)
        └── apiKeys.ts                          (NEW — ApiKey Zod schemas)
```

**Why a new `src/lib/validation/` directory:** The existing pattern co-locates schemas with route handlers (`const schema = z.object(...)` inline). Phase 5 creates schemas that will be consumed by *multiple* phases (Phase 6 for capture, Phase 7 for triage, Phase 8 for crystallize). Centralising them prevents drift.

### Pattern 1: Migration File Format

**What:** SQL files with timestamp-prefixed names. Idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... END $$`). Minimal — no application logic.

**Source:** Existing migrations in `supabase/migrations/`

```sql
-- Source: supabase/migrations/20260304000000_check_rate_limit.sql (pattern)
ALTER TABLE knowledge_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'knowledge_queue'
      AND policyname = 'Users can CRUD own queue items'
  ) THEN
    CREATE POLICY "Users can CRUD own queue items"
      ON knowledge_queue FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
```

### Pattern 2: Database Type Shape

**What:** `src/types/database.ts` exports a `Database` type with `public.Tables.<tablename>.Row | Insert | Update`. New types follow the same structure.

**Source:** `src/types/database.ts` (read directly)

```typescript
// Source: src/types/database.ts — follow this exact structure
export type QueueItemState = 'inbox' | 'passive_debt' | 'resource' | 'mastered';

export type KnowledgeQueueItem = {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  notes: string | null;
  state: QueueItemState;
  source_domain: string | null;
  favicon_url: string | null;
  estimated_read_time: number | null;  // integer minutes — Claude's discretion: use integer
  created_at: string;
  updated_at: string;
};

export type ApiKey = {
  id: string;
  user_id: string;
  key_prefix: string;       // "ng_" + first 8 chars — display only
  key_hash: string;         // SHA-256 hex — never exposed to client
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};
```

### Pattern 3: Zod Schema Co-Pattern

**What:** Schemas are defined with `z.object()` and exported as named constants. `safeParse()` is used at the handler boundary, not `parse()`. Error structure follows `{ error: 'Invalid payload', issues: parsed.error.issues }`.

**Source:** `src/app/api/neurons/extract/route.ts` and `src/app/api/neurons/ai-action/route.ts`

```typescript
// Source: existing route handler pattern
export const QueueItemInsertSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const QueueStateTransitionSchema = z.object({
  state: z.enum(['inbox', 'passive_debt', 'resource', 'mastered']),
});

export const ApiKeyInsertSchema = z.object({
  // No user-supplied fields — key is generated server-side
});
```

### Pattern 4: Database Queries Object

**What:** `src/lib/db/queries.ts` exports a `neuronQueries` object with typed async methods that accept a `SupabaseClient<Database>`. New `queueQueries` must follow the same pattern.

**Source:** `src/lib/db/queries.ts` (read directly)

```typescript
// Source: src/lib/db/queries.ts — neuronQueries pattern
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, KnowledgeQueueItem } from '@/types/database';

type TypedClient = SupabaseClient<Database>;
type QueueItemInsert = Database['public']['Tables']['knowledge_queue']['Insert'];

export const queueQueries = {
  async create(client: TypedClient, data: QueueItemInsert): Promise<KnowledgeQueueItem> {
    const { data: item, error } = await client
      .from('knowledge_queue')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return item;
  },

  async getActiveByUserId(client: TypedClient, userId: string): Promise<KnowledgeQueueItem[]> {
    const { data, error } = await client
      .from('knowledge_queue')
      .select('*')
      .eq('user_id', userId)
      .not('state', 'eq', 'mastered')   // mastered items are gone from list
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
```

### Anti-Patterns to Avoid

- **PostgreSQL ENUM type for state:** An ENUM type requires a `DROP TYPE` + `CREATE TYPE` migration cycle to add a new value. A `CHECK (state IN (...))` constraint can be altered with a simple `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT`. Use CHECK constraint.
- **`key_hash` column exposed via RLS SELECT:** The SELECT policy on `user_api_keys` must explicitly exclude `key_hash` in queries from client code — or the policy must be narrow. Phase 6 route handlers that serve key info to the browser must never return `key_hash`.
- **Soft delete on queue items:** CONTEXT.md says hard delete. Do not add a `deleted_at` column or a `discarded` state. Items are either deleted or in the 4-state machine.
- **`crystallizing` as a fifth state:** ARCHITECTURE.md research mentioned this as a transient state, but CONTEXT.md locked the state machine at exactly 4 states: `inbox`, `passive_debt`, `resource`, `mastered`. The `crystallizing` concept is handled at the application layer (loading spinner), not persisted to DB.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secure token generation | Custom random string builder | `nanoid` with `customAlphabet` (already in lockfile v3.3.11) | nanoid uses `crypto.getRandomValues` under the hood; ~286 bits of entropy with 48 alphanumeric chars |
| SHA-256 hashing | Manual crypto setup | Node.js built-in `crypto.createHash('sha256')` | Zero dependency; confirmed working in this Node.js runtime |
| Timing-safe comparison | Custom string comparison | `crypto.timingSafeEqual` | Prevents timing attacks — string `===` leaks key length via comparison short-circuit |
| Row-level security | Application-level user filtering | Supabase RLS `auth.uid() = user_id` | Pattern matches all existing tables; cannot be accidentally bypassed |
| Schema validation | Custom type guards | Zod `safeParse()` | Already a project dependency; establishes consistent error shape |

**Key insight:** This phase's "hard" problem is API key security. Both the entropy (nanoid), the hashing (crypto built-in), and the timing-safe comparison (crypto built-in) are already solved. No new packages required.

---

## Common Pitfalls

### Pitfall 1: State Machine Mismatch (CONTEXT vs. ARCHITECTURE research)
**What goes wrong:** The pre-phase ARCHITECTURE.md research defined 5 states (`inbox`, `passive_debt`, `crystallizing`, `mastered`, `discarded`). CONTEXT.md locked 4 states (`inbox`, `passive_debt`, `resource`, `mastered`). Building the migration with 5 states creates a schema mismatch with the Zod enums and TypeScript types.
**Why it happens:** The ARCHITECTURE.md was written before the CONTEXT.md user discussion. CONTEXT.md is authoritative.
**How to avoid:** Use exactly these 4 states: `inbox`, `passive_debt`, `resource`, `mastered`. No `crystallizing`. No `discarded`. Hard delete replaces the discarded state. The `crystallizing` concept is UI-only (loading indicator).
**Warning signs:** A CHECK constraint or Zod enum with 5+ values.

### Pitfall 2: API Key Hash Column Name Inconsistency
**What goes wrong:** STACK.md uses `key_hash`, ARCHITECTURE.md uses `hashed_key`. If the migration uses one name and TypeScript types use another, downstream phases break.
**Why it happens:** Two research documents written at slightly different times.
**How to avoid:** CONTEXT.md says "SHA-256 hash stored" without a column name preference — use `key_hash` as the canonical name (shorter, matches naming in STACK.md). Apply consistently across: migration SQL, `Database` type, and Zod schemas.
**Warning signs:** Migration has `hashed_key` but TypeScript has `key_hash` or vice versa.

### Pitfall 3: Missing `revoked_at` Column
**What goes wrong:** CONTEXT.md says "1 key max per user — generating a new key auto-revokes the previous one." If `user_api_keys` has no `revoked_at` column, Phase 6 cannot implement auto-revocation without a destructive DELETE (loses the audit trail).
**Why it happens:** Simple oversight — the revocation strategy requires a nullable timestamp column.
**How to avoid:** Include `revoked_at TIMESTAMPTZ` in the migration. NULL = active. Non-null = revoked. Phase 6 soft-revokes by setting this timestamp, then inserts a new key row.
**Warning signs:** Migration has no `revoked_at` column.

### Pitfall 4: RLS Policy Blocks Service Role on `user_api_keys`
**What goes wrong:** The capture endpoint (`/api/capture`, built in Phase 6) uses a service role client to look up keys. If the `user_api_keys` RLS policy uses `FOR ALL USING (auth.uid() = user_id)`, the service role client bypasses RLS by default — but any query that calls `supabase.auth.getUser()` first will fail because the service role has no user context.
**Why it happens:** Developers apply the standard RLS pattern from existing tables without checking that the service role client doesn't use `auth.uid()` resolution.
**How to avoid:** For `user_api_keys`, define narrow RLS policies: `FOR SELECT USING (auth.uid() = user_id)` and `FOR DELETE USING (auth.uid() = user_id)`. INSERT is done only by the service role (which bypasses RLS). This is the pattern from ARCHITECTURE.md and is correct. Do NOT add `FOR INSERT` or `FOR UPDATE` policies that check `auth.uid()`.
**Warning signs:** A single `FOR ALL` policy on `user_api_keys` that tries to scope INSERT to the user's uid.

### Pitfall 5: `nanoid` Version Mismatch
**What goes wrong:** STACK.md references `nanoid@^5.1.7` and says "No CommonJS require". The actual lockfile has `nanoid@3.3.11`. If Phase 6 or Phase 5 imports nanoid using the v5 ESM-only pattern expecting a default export, it works locally but could behave differently in edge cases.
**Why it happens:** nanoid 3.x and 5.x have identical JS API but different module formats.
**How to avoid:** With nanoid 3.3.11 in the project, use `import { customAlphabet } from 'nanoid'` (works in both CJS and ESM contexts in this project). Do NOT `npm install nanoid` — it would install v5 and potentially conflict with the lockfile. Use the existing transitive version confirmed in `node_modules`.

### Pitfall 6: `estimated_read_time` Type Ambiguity
**What goes wrong:** Claude's discretion covers this field. If the migration uses `TEXT` and the TypeScript type uses `number | null`, the Supabase client will return strings that TypeScript claims are numbers, causing silent type errors in Phase 7 UI.
**Why it happens:** Mismatch between SQL column type and TypeScript type.
**How to avoid:** Use `INTEGER` in the migration and `number | null` in TypeScript. Display formatting ("5 min read") is a UI concern handled in Phase 7. Store the raw integer in the DB.

---

## Code Examples

Verified patterns from existing codebase:

### Migration: `knowledge_queue` table

```sql
-- Source: supabase/migrations/20260322000000_knowledge_queue.sql
CREATE TABLE IF NOT EXISTS knowledge_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  url               TEXT,                              -- nullable: pure thoughts have no URL
  notes             TEXT,                              -- nullable: optional user annotation
  state             TEXT NOT NULL DEFAULT 'inbox'
                      CHECK (state IN ('inbox', 'passive_debt', 'resource', 'mastered')),
  source_domain     TEXT,                              -- auto-extracted from URL on capture
  favicon_url       TEXT,                              -- auto-extracted from URL on capture
  estimated_read_time INTEGER,                         -- minutes; auto-extracted on capture
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE knowledge_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'knowledge_queue'
      AND policyname = 'Users can CRUD own queue items'
  ) THEN
    CREATE POLICY "Users can CRUD own queue items"
      ON knowledge_queue FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Composite index: active items only (excludes mastered — terminal state)
CREATE INDEX IF NOT EXISTS idx_knowledge_queue_user_active
  ON knowledge_queue(user_id, state, created_at DESC)
  WHERE state != 'mastered';

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_knowledge_queue_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS knowledge_queue_updated_at ON knowledge_queue;
CREATE TRIGGER knowledge_queue_updated_at
  BEFORE UPDATE ON knowledge_queue
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_queue_updated_at();
```

### Migration: `user_api_keys` table

```sql
-- Source: supabase/migrations/20260322000001_user_api_keys.sql
CREATE TABLE IF NOT EXISTS user_api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_prefix    TEXT NOT NULL,                         -- "ng_" + first 8 chars of raw key
  key_hash      TEXT NOT NULL UNIQUE,                  -- SHA-256 hex of raw key; never stored plaintext
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,                           -- updated on each valid API call
  revoked_at    TIMESTAMPTZ                            -- NULL = active; non-null = revoked
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_api_keys'
      AND policyname = 'Users can read own keys'
  ) THEN
    CREATE POLICY "Users can read own keys"
      ON user_api_keys FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_api_keys'
      AND policyname = 'Users can delete own keys'
  ) THEN
    CREATE POLICY "Users can delete own keys"
      ON user_api_keys FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Only one active key per user (NULL revoked_at = active)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_active_per_user
  ON user_api_keys(user_id)
  WHERE revoked_at IS NULL;
```

### TypeScript types extension (`src/types/database.ts`)

```typescript
// Source: src/types/database.ts — follow existing Row/Insert/Update pattern

export type QueueItemState = 'inbox' | 'passive_debt' | 'resource' | 'mastered';

export type KnowledgeQueueItem = {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  notes: string | null;
  state: QueueItemState;
  source_domain: string | null;
  favicon_url: string | null;
  estimated_read_time: number | null;
  created_at: string;
  updated_at: string;
};

export type ApiKey = {
  id: string;
  user_id: string;
  key_prefix: string;
  key_hash: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

// Add to Database type in the Tables section:
knowledge_queue: {
  Row: KnowledgeQueueItem;
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    url?: string | null;
    notes?: string | null;
    state?: QueueItemState;
    source_domain?: string | null;
    favicon_url?: string | null;
    estimated_read_time?: number | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<KnowledgeQueueItem>;
  Relationships: [];
};
user_api_keys: {
  Row: ApiKey;
  Insert: {
    id?: string;
    user_id: string;
    key_prefix: string;
    key_hash: string;
    created_at?: string;
    last_used_at?: string | null;
    revoked_at?: string | null;
  };
  Update: Partial<ApiKey>;
  Relationships: [];
};
```

### Zod schemas (`src/lib/validation/queue.ts` and `src/lib/validation/apiKeys.ts`)

```typescript
// Source: pattern from src/app/api/neurons/extract/route.ts
// File: src/lib/validation/queue.ts

import { z } from 'zod';

export const QueueItemStateSchema = z.enum(['inbox', 'passive_debt', 'resource', 'mastered']);

export const QueueItemInsertSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  // source_domain, favicon_url, estimated_read_time are server-extracted — never client-supplied
});

export const QueueStateTransitionSchema = z.object({
  state: QueueItemStateSchema,
});

export type QueueItemInsert = z.infer<typeof QueueItemInsertSchema>;
export type QueueStateTransition = z.infer<typeof QueueStateTransitionSchema>;
```

```typescript
// File: src/lib/validation/apiKeys.ts

import { z } from 'zod';

// Validates an incoming bearer token format (ng_ prefix + alphanumeric body)
export const RawApiKeySchema = z.string()
  .regex(/^ng_[A-Za-z0-9]{48}$/, 'Invalid API key format');

export type RawApiKey = z.infer<typeof RawApiKeySchema>;
```

### Key generation helper (`src/lib/auth/apiKeys.ts`)

```typescript
// Source: pattern from src/lib/auth/server.ts — new file
import { createHash, timingSafeEqual } from 'node:crypto';
import { customAlphabet } from 'nanoid';  // v3.3.11 in lockfile

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateBody = customAlphabet(alphabet, 48);

/**
 * Generates a new raw API key. Returned once to the user; never stored.
 * Format: ng_<48 alphanumeric chars>
 */
export function generateApiKey(): string {
  return `ng_${generateBody()}`;
}

/**
 * Hashes an API key for storage. Uses SHA-256 — appropriate for high-entropy tokens.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Extracts the display prefix from a raw key.
 * Stored in user_api_keys.key_prefix for UI display.
 */
export function getKeyPrefix(rawKey: string): string {
  return rawKey.substring(0, 11); // "ng_" + first 8 chars = "ng_XXXXXXXX"
}

/**
 * Timing-safe comparison of two hashed keys.
 * Used in /api/capture to validate an incoming bearer token against stored hash.
 */
export function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const incoming = hashApiKey(rawKey);
  const a = Buffer.from(incoming, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bcrypt/argon2 for API key hashing | SHA-256 for high-entropy API tokens | Established best practice | SHA-256 is correct and ~1000x faster for tokens (not passwords). bcrypt/argon2 are for user-chosen passwords. |
| PostgreSQL ENUM type | CHECK constraint for state machine | This phase decision | CHECK constraints are easier to alter without full type migration cycles |
| Plaintext API keys | Hash-only storage, prefix for display | GitHub PAT pattern (2019+) | Compromised DB does not expose usable keys |
| Middleware-only auth | Route-handler auth (CVE-2025-29927) | March 2025 | Next.js middleware bypass at CVSS 9.1 — auth must live in the route handler |

---

## Open Questions

1. **`estimated_read_time` computation method**
   - What we know: field is auto-extracted from URL server-side; Claude's discretion on type (integer vs text)
   - What's unclear: Phase 5 only defines the column — the extraction logic is in Phase 6/8. For now, define as `INTEGER NULL` (minutes). The extraction endpoint in Phase 6 will compute it.
   - Recommendation: Define as `INTEGER NULL` in migration. Use average reading speed formula: `word_count / 200` (rounded up).

2. **`key_hash` column visibility in SELECT policy**
   - What we know: Phase 6 route handlers will serve key info to the browser for the key management UI.
   - What's unclear: Should the SELECT RLS policy include `key_hash`, or should Phase 6 explicitly never select that column?
   - Recommendation: RLS allows SELECT of full row (including `key_hash`). Phase 6 route handlers must explicitly select only safe columns (`id`, `key_prefix`, `created_at`, `last_used_at`, `revoked_at`) and never return `key_hash` in API responses. This is a Phase 6 concern, but Phase 5 should document it as a constraint.

3. **Unique partial index for one-active-key-per-user enforcement**
   - What we know: CONTEXT.md says "1 key max per user — generating a new key auto-revokes the previous one"
   - What's unclear: Should enforcement be at DB level (unique partial index) or application level (service checks before insert)?
   - Recommendation: Both. A partial unique index on `(user_id) WHERE revoked_at IS NULL` gives DB-level enforcement. Phase 6 application code additionally revokes existing keys before inserting a new one.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (confirmed in `vitest.config.ts`) |
| Config file | `/home/simone/projects/NeuroGraph/vitest.config.ts` |
| Quick run command | `vitest run src/lib/db/__tests__/` |
| Full suite command | `npm test` (`vitest`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | `knowledge_queue` insert/retrieve with 4-state enum | unit (mock client) | `vitest run src/lib/db/__tests__/queueQueries.test.ts -x` | Wave 0 |
| DATA-02 | `user_api_keys` insert with hashed key; `hashApiKey()` and `verifyApiKey()` | unit | `vitest run src/lib/auth/__tests__/apiKeys.test.ts -x` | Wave 0 |
| DATA-03 | Queue queries never reference neurons/chat tables; no cross-join | unit (structural) | `vitest run src/lib/db/__tests__/queueQueries.test.ts -x` | Wave 0 |
| DATA-04 | Zod schemas reject invalid payloads (missing title, invalid state, malformed URL) | unit | `vitest run src/lib/validation/__tests__/queue.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `vitest run src/lib/ --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/db/__tests__/queueQueries.test.ts` — covers DATA-01, DATA-03
- [ ] `src/lib/auth/__tests__/apiKeys.test.ts` — covers DATA-02
- [ ] `src/lib/validation/__tests__/queue.test.ts` — covers DATA-04
- [ ] `src/lib/auth/` directory — create alongside `apiKeys.ts` (directory exists: `/src/lib/auth/`)

Note: `src/lib/auth/` already exists (contains `supabase.ts` and `server.ts`). Only test files and `apiKeys.ts` are new. The mock client pattern from `src/lib/db/__tests__/queries.test.ts` is the correct template for Wave 0 tests.

---

## Sources

### Primary (HIGH confidence)
- `src/types/database.ts` — Existing `Database` type structure, directly read
- `src/lib/db/queries.ts` — `neuronQueries` object pattern, directly read
- `supabase/migrations/20260304000000_check_rate_limit.sql` — RLS + idempotent policy pattern, directly read
- `supabase/migrations/20260321000000_ttl_cron.sql` — Migration file format, directly read
- `src/app/api/neurons/extract/route.ts` — Zod `safeParse()` pattern, directly read
- `src/lib/auth/supabase.ts` — `createServerSupabaseClient()` pattern, directly read
- `src/lib/auth/server.ts` — `getAuthenticatedUser()` pattern, directly read
- `node_modules/nanoid/package.json` — Confirmed version 3.3.11, directly verified
- Node.js `crypto` docs — SHA-256, `timingSafeEqual` built-in, standard library

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — API key generation pattern (note: references nanoid v5; actual project has v3.3.11)
- `.planning/research/ARCHITECTURE.md` — Complete target architecture (note: 5-state machine predates CONTEXT.md lock to 4 states)
- `.planning/research/PITFALLS.md` — CVE-2025-29927 analysis, security checklist

### Tertiary (LOW confidence — require validation during implementation)
- nanoid v3 `customAlphabet` entropy calculation: 48 chars from 62-char alphabet = log2(62^48) ≈ 285 bits. Practical entropy is sufficient but not independently verified against a formal security standard.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly verified in node_modules and package.json
- Architecture: HIGH — patterns read directly from existing codebase files
- SQL migrations: HIGH — patterns copied from existing migrations with minimal modification
- Zod schemas: HIGH — pattern lifted directly from existing route handlers
- Pitfalls: HIGH — three of five pitfalls sourced from PITFALLS.md pre-research; one (nanoid version) discovered during this research pass

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable dependencies; schema is locked by CONTEXT.md decisions)

**Critical correction vs. pre-phase research:**
The ARCHITECTURE.md and STACK.md researched a 5-state machine (`inbox`, `passive_debt`, `crystallizing`, `mastered`, `discarded`). CONTEXT.md locked exactly 4 states (`inbox`, `passive_debt`, `resource`, `mastered`). This research document is authoritative. The planner must use 4 states only.
