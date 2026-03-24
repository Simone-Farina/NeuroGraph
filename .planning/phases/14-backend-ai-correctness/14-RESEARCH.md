# Phase 14: Backend AI Correctness - Research

**Researched:** 2026-03-24
**Domain:** Vercel AI SDK structured outputs, Zod schema serialization, Next.js API route validation, Supabase vector search + migrations
**Confidence:** HIGH

## Summary

Phase 14 fixes three confirmed bugs in the AI/backend layer. The research is grounded entirely in the live codebase (files read directly) and verified programmatically — no hypotheses are left unconfirmed.

**BUG-01 (Architect schema):** The bug and its fix are fully understood. Verified via live Node.js execution: `z.string().optional()` causes the Vercel AI SDK's `zodSchema()` to omit `refusalReason` from the JSON Schema `required` array. This is exactly what the OpenAI error message describes. Changing to `.nullable()` causes the SDK to place `refusalReason` in `required` with `anyOf: [{type: "string"}, {type: "null"}]` — valid for structured outputs. The `suggested_next` field in `inferPrerequisites.ts` has the identical issue and the same fix applies.

**BUG-02 (Bloom gate):** The system prompt instructs the LLM not to call `suggest_neurogenesis` below Analyze level, but `createNeuronSchema` in the neurons POST route accepts all six Bloom levels with no server-side rejection. The `suggestNeurogenesisTool` also advertises all six levels in its enum. Two code changes close this gap: restrict the tool enum to `['Analyze', 'Evaluate', 'Create']` and add a validation block in the POST handler after `safeParse` succeeds.

**BUG-03 (DAG wiring):** The `find_similar_neurons` RPC is called with `match_threshold: 0.3` and `match_count: 5`. These conservative parameters mean semantically adjacent neurons may not be surfaced as candidates for the Epistemological Inquisitor. Widening to `match_threshold: 0.15` / `match_count: 10` gives the LLM more material. The legacy edge cleanup is a simple targeted DELETE migration on `synapses` where `type = 'RELATED' AND ai_suggested = true`.

**Primary recommendation:** All three bugs are mechanical code changes. No new libraries required. Implement in three focused tasks: schema fix, Bloom gate, DAG/migration.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**BUG-01: Architect Schema Fix**
- D-01: Change `refusalReason` in `architectResponseSchema` from `z.string().min(1).optional()` to `z.string().nullable()`. OpenAI structured outputs requires all properties in the `required` array — `.optional()` is incompatible.
- D-02: Update the `.superRefine()` validation in `architect.ts` to check `!== null` instead of `!== undefined` for the `refusalReason` field.
- D-03: Apply the same `.optional()` → `.nullable()` fix to `suggested_next` in `inferPrerequisites.ts` (`prerequisiteInferenceSchema`) — it has the same OpenAI structured output incompatibility.

**BUG-02: Bloom Gate Runtime Enforcement**
- D-04: Add server-side validation in the neurons POST route (`src/app/api/neurons/route.ts`) that rejects neurogenesis when `bloom_level` is Remember, Understand, or Apply — unless the neuron is a ghost node (`is_ghost: true`).
- D-05: Restrict the `suggestNeurogenesisTool` schema enum to `['Analyze', 'Evaluate', 'Create']` only — defense in depth alongside the server-side gate.
- D-06: Return a clear 422 error with message explaining the Bloom threshold when a shallow neuron is rejected.

**BUG-03: DAG Prerequisite Wiring**
- D-07: Widen the `find_similar_neurons` RPC parameters: lower `match_threshold` from 0.3 to 0.15 and increase `match_count` from 5 to 10. This gives the LLM Epistemological Inquisitor more candidates to evaluate.
- D-08: Create a Supabase SQL migration that deletes all `synapses` rows where `type = 'RELATED'` AND `ai_suggested = true`. These are entirely legacy artifacts from the pre-v1.2 vector-similarity auto-wiring. The current system only creates `PREREQUISITE` edges via `inferPrerequisites`.

### Claude's Discretion
- Whether to add a broader candidate source (all user neurons) alongside widened vector search
- Exact error message wording for the Bloom gate 422 response
- Whether the legacy edge cleanup migration should be a Supabase migration file or a one-time API endpoint

### Deferred Ideas (OUT OF SCOPE)
- Wire LLM Bouncer into production neuron creation (v1.4+)
- Broader candidate source for prerequisite inference (all user neurons) — may not be needed if lowered threshold works
- More sophisticated legacy edge cleanup with embedding similarity scoring
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | Architect API `/api/architect` returns valid curriculum instead of schema error — `refusalReason` must be included in the OpenAI structured output `required` array or made truly optional in a way the provider accepts | Verified: `.optional()` → `.nullable()` fix confirmed by live JSON schema inspection |
| BUG-02 | Bloom-gated Neurogenesis is enforced at runtime — user cannot create a neuron from a shallow Remember/Understand conversation; the `suggest_neurogenesis` tool only fires at Analyze+ cognitive level | Verified: POST route has no Bloom-level guard; tool enum includes all 6 levels |
| BUG-03 | DAG agent (inferPrerequisites) creates prerequisite connections when appropriate; legacy nonsensical edges are cleaned up | Verified: RPC params confirmed at 0.3/5; `synapses` type+ai_suggested columns confirmed in schema |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | installed | `generateObject` with Zod schema → structured LLM output | Already used throughout codebase |
| `zod` | installed | Runtime schema validation and JSON Schema generation | Already used throughout codebase |
| `next` | installed | API route handlers | Already used throughout codebase |
| Supabase client | installed | Database operations and RPC calls | Already used throughout codebase |

**No new packages required for Phase 14.**

## Architecture Patterns

### Pattern 1: Zod `.nullable()` for OpenAI Structured Outputs

**What:** OpenAI structured outputs require every property listed in `properties` to also appear in `required`. The Vercel AI SDK's `zodSchema()` utility omits optional fields from `required` but includes them in `properties` — this triggers the OpenAI schema validation error. Using `.nullable()` keeps the field in `required` while allowing the LLM to return `null` instead of omitting it.

**Verified behavior (live Node.js test on installed packages):**

```typescript
// BEFORE — causes OpenAI error: "MISSING 'REFUSALREASON' IN REQUIRED ARRAY"
refusalReason: z.string().min(1).optional()
// JSON Schema produced: field appears in properties but NOT in required

// AFTER — valid for OpenAI structured outputs
refusalReason: z.string().min(1).nullable()
// JSON Schema produced:
// "refusalReason": { "anyOf": [{ "type": "string", "minLength": 1 }, { "type": "null" }] }
// AND "refusalReason" IS included in "required"
```

**The exact JSON Schema diffs (verified):**

Optional produces:
```json
{
  "required": ["isValid", "nodes"],
  "properties": {
    "isValid": { "type": "boolean" },
    "refusalReason": { "type": "string", "minLength": 1 },
    "nodes": { ... }
  }
}
```

Nullable produces:
```json
{
  "required": ["isValid", "refusalReason", "nodes"],
  "properties": {
    "isValid": { "type": "boolean" },
    "refusalReason": { "anyOf": [{ "type": "string", "minLength": 1 }, { "type": "null" }] },
    "nodes": { ... }
  }
}
```

**`suggested_next` in `inferPrerequisites.ts` — same issue confirmed:**

The current schema:
```typescript
suggested_next: z.array(...).max(2).optional()
```
Produces JSON Schema with `suggested_next` in `properties` but NOT in `required`. Same fix applies: change to `.nullable()`.

After fix, `inferPrerequisites.ts` line 35 early-return must also use `[]` for `suggested_next`:
```typescript
// Currently: return { prerequisites: [], suggested_next: [] };
// After fix: stays the same — [] is a valid non-null value
```

Also: the `inferPrerequisites` function line 213 checks `inferenceResult.suggested_next && inferenceResult.suggested_next.length > 0`. After the fix, the LLM will return `null` instead of omitting the field, so the condition `!= null && .length > 0` correctly handles this. No change needed at the call site.

### Pattern 2: `.superRefine()` Null vs Undefined Checks

**What:** After `refusalReason` changes from optional (`undefined` when absent) to nullable (`null` when absent), the superRefine validation logic must check `!== null` instead of `!== undefined`.

**Current code (lines 93-120 in `architect.ts`):**
```typescript
// Line 95 — checks for "falsy" which handles both null and undefined:
if (!value.refusalReason) { ... }

// Line 114 — must change from !== undefined to !== null:
if (value.refusalReason !== undefined) {
```

**After fix:**
```typescript
if (value.refusalReason !== null) {
```

The check at line 95 (`if (!value.refusalReason)`) works for both `null` and `undefined` — no change needed there. Only line 114 requires updating.

### Pattern 3: Bloom Gate in API Route

**What:** Add a guard block in the neurons POST route immediately after `safeParse` succeeds and before the embedding/DB operations. Ghost nodes (`is_ghost: true`) bypass the gate because they are created programmatically by the AI, not from user conversation depth.

**Where to add:** `src/app/api/neurons/route.ts`, after line 86 (after `safeParse` success check):

```typescript
// Bloom-level gate: reject shallow neurons from user conversations
const ALLOWED_BLOOM_LEVELS = ['Analyze', 'Evaluate', 'Create'] as const;
const { bloom_level, is_ghost } = parsed.data;

if (!is_ghost && !ALLOWED_BLOOM_LEVELS.includes(bloom_level as typeof ALLOWED_BLOOM_LEVELS[number])) {
  return NextResponse.json(
    {
      error: 'Neurogenesis requires Analyze, Evaluate, or Create level understanding. ' +
             `Received: ${bloom_level}. Continue the conversation to reach deeper insight.`,
    },
    { status: 422 }
  );
}
```

**Why ghost nodes are exempt:** Ghost nodes are created by `projectGhostNodes` (called later in the same POST handler) with placeholder Bloom levels. Blocking them would break the DAG projection feature.

### Pattern 4: Restricting `suggestNeurogenesisTool` Enum

**Current (all 6 levels):**
```typescript
bloom_level: z
  .enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
  .describe("Bloom's taxonomy level...")
```

**After fix (3 levels only):**
```typescript
bloom_level: z
  .enum(['Analyze', 'Evaluate', 'Create'])
  .describe("Bloom's taxonomy level — only Analyze, Evaluate, or Create level insights trigger neurogenesis")
```

**Impact on `neurogenesisSchema`:** `neurogenesisSchema` is exported from `tools.ts` and is an alias of the `parameters` object. If any consumer depends on the full 6-value enum (e.g., type assertions, test fixtures), it must be updated. Check `src/lib/ai/__tests__/tools.test.ts` — the existing test file uses `neurogenesisSchema` and may have fixtures with `bloom_level: 'Remember'` that will fail after the change.

### Pattern 5: `find_similar_neurons` RPC Parameter Change

**Current (neurons/route.ts lines 156-161):**
```typescript
const { data: similarNeurons, error: similarError } = await supabase.rpc('find_similar_neurons', {
  query_embedding: embedding,
  match_user_id: user.id,
  match_count: 5,
  match_threshold: 0.3,
});
```

**After fix:**
```typescript
  match_count: 10,
  match_threshold: 0.15,
```

**Why 0.15/10 is safe:** The RPC result feeds `inferPrerequisites`, which calls an LLM to filter candidates. The LLM only promotes neurons where `confidence >= 0.6`. So casting a wider net (lower threshold, more results) increases recall without degrading precision — the LLM acts as the quality filter. The vector distance at 0.15 cosine similarity is loose but reasonable for "in the same knowledge domain."

**Other callers of `find_similar_neurons`:** The query appears in `src/lib/db/queries.ts` (its own function with a default of 0.3) and `src/lib/ai/bouncer.ts` (fixed at 0.85 — collision detection, do NOT change). The change for BUG-03 only touches `neurons/route.ts`.

### Pattern 6: Supabase Migration for Legacy Edge Cleanup

**Migration convention (from existing files):** Filename format `YYYYMMDDHHMMSS_descriptive_name.sql`. Next sequential timestamp after `20260322000001_user_api_keys.sql` would be `20260324000000_cleanup_legacy_related_synapses.sql`.

**Migration content (safe, targeted DELETE):**
```sql
-- Migration: Remove legacy RELATED edges created by pre-v1.2 vector-similarity auto-wiring.
-- These edges were created when the system used cosine similarity to auto-link neurons.
-- Since v1.2, only the Epistemological Inquisitor (inferPrerequisites) creates graph edges.
-- All remaining RELATED+ai_suggested=true rows are noise artifacts.

DELETE FROM synapses
WHERE type = 'RELATED'
  AND ai_suggested = true;
```

**Safety:** This is non-destructive for the current system because:
1. `inferPrerequisites` only creates `PREREQUISITE` edges (confirmed in `createPrerequisiteSynapses`, line 98)
2. The architect route creates no synapses in the `synapses` table (it returns a draft only)
3. Manual user-created `RELATED` edges would have `ai_suggested = false` and are preserved
4. There are no foreign key cascades that would delete neurons

**Idempotent:** Running the migration twice is safe — the second run deletes zero rows.

**Decision note:** Use a Supabase migration file (not an API endpoint). Rationale: the migration is a one-time schema cleanup, tracked in git, applied deterministically via `supabase db push`. An API endpoint would require auth, request handling, and could be accidentally triggered.

### Anti-Patterns to Avoid

- **Changing `createNeuronSchema`'s `bloom_level` enum:** Do NOT restrict the schema-level enum. The schema validates structure; the business rule check comes after. Ghost nodes submitted by the AI would fail schema validation if the enum is restricted. The business logic gate (checking `is_ghost`) belongs in the handler body, not the Zod schema.
- **Modifying the `find_similar_neurons` RPC function itself:** The RPC accepts `match_threshold` and `match_count` as parameters — change the call site only, not the database function.
- **Using `supabase.rpc('delete_related_synapses')` for the cleanup:** Simpler to use a migration file. API-based cleanup is fragile and harder to audit.
- **Changing `RELATED` edges where `ai_suggested = false`:** These may be manually curated by users. Only delete `ai_suggested = true` rows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema from Zod | Custom schema serializer | `zodSchema()` from Vercel AI SDK | Already in use; handles all edge cases |
| Bloom level validation | Custom string comparison | Zod `.enum()` or simple `includes()` check | Straightforward; type-safe |
| Migration idempotency | Custom rollback logic | SQL `DELETE WHERE` | Idempotent by definition |

## Common Pitfalls

### Pitfall 1: `superRefine` After `.nullable()` — Semantic Shift
**What goes wrong:** After changing `refusalReason` to `.nullable()`, code that checks `value.refusalReason !== undefined` will now always be true (because the LLM will return `null`, not `undefined`). The logic inverts: when `isValid: true`, the check `!== undefined` fires on a `null` value, causing a spurious validation error.
**Why it happens:** `.optional()` fields are absent/`undefined`; `.nullable()` fields are present as `null`.
**How to avoid:** Change line 114 in `architect.ts` from `!== undefined` to `!== null`.
**Warning signs:** Schema parses successfully but `superRefine` adds issues on valid responses.

### Pitfall 2: Ghost Node Bloom Bypass Too Broad
**What goes wrong:** If the Bloom gate checks `!bloom_level_is_allowed` without the `!is_ghost` escape hatch, the `projectGhostNodes` flow breaks. Ghost nodes are created with whatever Bloom level the AI assigns — often `Remember` or `Understand` since they represent future learning targets.
**Why it happens:** `projectGhostNodes` calls the neurons POST endpoint to insert ghost rows.
**How to avoid:** Gate condition must be: `!is_ghost && bloom_level NOT IN ['Analyze','Evaluate','Create']`.
**Warning signs:** Ghost node projection returns empty array despite valid prerequisite inference.

### Pitfall 3: `tools.test.ts` Bloom Enum Regression
**What goes wrong:** The file `src/lib/ai/__tests__/tools.test.ts` and `src/lib/ai/tools.test.ts` contain fixtures or assertions about `suggestNeurogenesisTool`. After restricting the enum to 3 values, any test fixture with `bloom_level: 'Remember'` will fail schema validation.
**Why it happens:** Test fixtures written against the original 6-value enum become invalid.
**How to avoid:** Update test fixtures to use `bloom_level: 'Analyze'` (or another allowed value). Also update the `src/app/api/neurons/__tests__/route.test.ts` which uses `bloom_level: 'Remember'` in `validPayload` — this will now hit the 422 gate.
**Warning signs:** `vitest` run fails with Zod parse errors in test setup.

### Pitfall 4: `neurons/route.test.ts` Uses `bloom_level: 'Remember'`
**What goes wrong:** The existing `route.test.ts` (confirmed in `src/app/api/neurons/__tests__/route.test.ts`) uses `bloom_level: 'Remember'` in `validPayload`. After adding the Bloom gate, this test will return 422 instead of 201.
**Why it happens:** Test was written before the gate existed.
**How to avoid:** Update `validPayload.bloom_level` to `'Analyze'` in the test, and add a new test case verifying that `bloom_level: 'Remember'` returns 422 (unless `is_ghost: true`).
**Warning signs:** Existing neuron POST test suite breaks with 422 responses.

### Pitfall 5: `inferPrerequisites` Early Return After `suggested_next` Fix
**What goes wrong:** The early return at line 35 (`return { prerequisites: [], suggested_next: [] }`) returns `suggested_next: []`. After fixing the schema to `.nullable()`, the TypeScript type of `suggested_next` changes from `Array | undefined` to `Array | null`. The early return with `[]` is still valid (empty array, not null). No change needed — but the call site at line 213 must handle the `null` case: `if (inferenceResult.suggested_next !== null && inferenceResult.suggested_next.length > 0)`.
**Why it happens:** The current call site uses `if (inferenceResult.suggested_next && ...)` — truthy check covers both `null` and empty array, so no change is strictly needed. But be aware.
**Warning signs:** TypeScript compilation error on `suggested_next` type mismatch.

## Code Examples

### BUG-01: Complete `architectResponseSchema` Fix

```typescript
// src/lib/ai/architect.ts

// BEFORE:
refusalReason: z.string().min(1).optional(),

// AFTER:
refusalReason: z.string().min(1).nullable(),

// In superRefine — BEFORE (line 114):
if (value.refusalReason !== undefined) {

// AFTER:
if (value.refusalReason !== null) {
```

### BUG-01: Complete `prerequisiteInferenceSchema` Fix

```typescript
// src/lib/ai/inferPrerequisites.ts

// BEFORE:
suggested_next: z.array(z.object({...})).max(2).optional().describe('Optional: ...')

// AFTER:
suggested_next: z.array(z.object({...})).max(2).nullable().describe('Nullable: ...')

// Early return (line 35) — update to be explicit about null:
return { prerequisites: [], suggested_next: null };
// OR keep as [] — both are valid since [] is truthy and non-null
```

### BUG-02: Bloom Gate in `neurons/route.ts`

```typescript
// src/app/api/neurons/route.ts — add after line 86 (safeParse success check)

const NEUROGENESIS_BLOOM_THRESHOLD = ['Analyze', 'Evaluate', 'Create'] as const;

const { bloom_level, is_ghost } = parsed.data;
if (!is_ghost && !(NEUROGENESIS_BLOOM_THRESHOLD as readonly string[]).includes(bloom_level)) {
  return NextResponse.json(
    {
      error: `Neurogenesis requires Analyze, Evaluate, or Create level understanding. ` +
             `Received "${bloom_level}". Continue the conversation to reach deeper insight.`,
    },
    { status: 422 }
  );
}
```

### BUG-02: Restricted `suggestNeurogenesisTool` Enum

```typescript
// src/lib/ai/tools.ts

// BEFORE:
bloom_level: z
  .enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
  .describe("Bloom's taxonomy level that best describes the depth of understanding"),

// AFTER:
bloom_level: z
  .enum(['Analyze', 'Evaluate', 'Create'])
  .describe("Bloom's taxonomy level — only Analyze, Evaluate, or Create level insights qualify for neurogenesis"),
```

### BUG-03: Widened `find_similar_neurons` Parameters

```typescript
// src/app/api/neurons/route.ts — lines 156-161

// BEFORE:
const { data: similarNeurons, error: similarError } = await supabase.rpc('find_similar_neurons', {
  query_embedding: embedding,
  match_user_id: user.id,
  match_count: 5,
  match_threshold: 0.3,
});

// AFTER:
const { data: similarNeurons, error: similarError } = await supabase.rpc('find_similar_neurons', {
  query_embedding: embedding,
  match_user_id: user.id,
  match_count: 10,
  match_threshold: 0.15,
});
```

### BUG-03: Legacy Edge Cleanup Migration

```sql
-- supabase/migrations/20260324000000_cleanup_legacy_related_synapses.sql

-- Remove legacy RELATED edges created by pre-v1.2 vector-similarity auto-wiring.
-- Safe: only targets ai_suggested=true rows; user-created RELATED edges (ai_suggested=false) are preserved.
-- Idempotent: second run deletes zero rows.

DELETE FROM synapses
WHERE type = 'RELATED'
  AND ai_suggested = true;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `z.optional()` for nullable AI response fields | `z.nullable()` for OpenAI structured outputs | OpenAI structured outputs requirement | Required field in JSON Schema `required` array |
| Vector-similarity auto-wiring of RELATED edges | LLM prerequisite inference (Epistemological Inquisitor) | v1.2 | Legacy RELATED+ai_suggested=true rows are cleanup targets |
| Bloom gate enforced by prompt only | Bloom gate enforced by prompt + server-side validation + enum restriction | v1.3 (this phase) | Defense in depth |

## Open Questions

1. **`suggested_next` null vs empty array return type**
   - What we know: Changing `.optional()` to `.nullable()` makes TypeScript infer `suggested_next` as `Array | null` instead of `Array | undefined`
   - What's unclear: Does the call site at `neurons/route.ts` line 213 need updating from `if (inferenceResult.suggested_next && ...)` to an explicit null check?
   - Recommendation: The truthy check `if (inferenceResult.suggested_next && ...)` handles both `null` and `undefined`, so no functional change is required. However, updating the early return at line 35 to `{ prerequisites: [], suggested_next: null }` (matching the new type) avoids a TypeScript strictness warning. Use judgment.

2. **`inferPrerequisites` return type annotation**
   - What we know: `PrerequisiteInferenceResult` is inferred from `z.infer<typeof prerequisiteInferenceSchema>`. After the fix, `suggested_next` type changes from `{...}[] | undefined` to `{...}[] | null`.
   - What's unclear: Are there other consumers of `PrerequisiteInferenceResult` beyond `neurons/route.ts`?
   - Recommendation: Grep for `PrerequisiteInferenceResult` and `suggested_next` across the codebase. Based on current glob search, only `neurons/route.ts` and `inferPrerequisites.ts` itself use this type.

## Environment Availability

Step 2.6: SKIPPED — this phase involves only TypeScript code edits and one Supabase SQL migration. No new external tools, services, or runtimes are required.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (v latest, config at `vitest.config.ts`) |
| Config file | `/Users/simone/Desktop/Projects/NeuroGraph/vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/ai/__tests__/architect.test.ts src/app/api/neurons/__tests__/route.test.ts src/lib/ai/__tests__/tools.test.ts` |
| Full suite command | `npm test` (runs `vitest`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | `architectResponseSchema` accepts `refusalReason: null` for `isValid: true` responses | unit | `npx vitest run src/lib/ai/__tests__/architect.test.ts` | ✅ (extend existing) |
| BUG-01 | `architectResponseSchema` puts `refusalReason` in JSON Schema `required` | unit | `npx vitest run src/lib/ai/__tests__/architect.test.ts` | ✅ (new test case) |
| BUG-01 | `prerequisiteInferenceSchema` puts `suggested_next` in JSON Schema `required` | unit | `npx vitest run src/lib/ai/__tests__/inferPrerequisites.test.ts` | ❌ Wave 0 |
| BUG-02 | POST /api/neurons returns 422 for `bloom_level: 'Remember'` (non-ghost) | unit | `npx vitest run src/app/api/neurons/__tests__/route.test.ts` | ✅ (update + new case) |
| BUG-02 | POST /api/neurons returns 201 for `bloom_level: 'Remember'` with `is_ghost: true` | unit | `npx vitest run src/app/api/neurons/__tests__/route.test.ts` | ✅ (new test case) |
| BUG-02 | `suggestNeurogenesisTool` schema rejects `bloom_level: 'Remember'` | unit | `npx vitest run src/lib/ai/__tests__/tools.test.ts` | ✅ (update existing) |
| BUG-03 | `find_similar_neurons` called with `match_threshold: 0.15` and `match_count: 10` | unit | `npx vitest run src/app/api/neurons/__tests__/route.test.ts` | ✅ (new assertion on mock) |
| BUG-03 | Migration SQL targets only `type='RELATED' AND ai_suggested=true` | manual | Review SQL file | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/ai/__tests__/architect.test.ts src/app/api/neurons/__tests__/route.test.ts src/lib/ai/__tests__/tools.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ai/__tests__/inferPrerequisites.test.ts` — covers BUG-01 `suggested_next` nullable fix and JSON Schema shape
- [ ] Update `src/app/api/neurons/__tests__/route.test.ts` `validPayload.bloom_level` from `'Remember'` to `'Analyze'` (existing test will break after BUG-02 gate is added)

## Sources

### Primary (HIGH confidence)
- Live code read — `src/lib/ai/architect.ts`: confirmed `refusalReason: z.string().min(1).optional()` at line 88, superRefine checks at lines 95 and 114
- Live code read — `src/lib/ai/inferPrerequisites.ts`: confirmed `suggested_next: z.array(...).max(2).optional()` at line 20
- Live code read — `src/app/api/neurons/route.ts`: confirmed `match_threshold: 0.3, match_count: 5` at lines 159-160; confirmed no Bloom-level guard; confirmed `is_ghost` field in schema
- Live code read — `src/lib/ai/tools.ts`: confirmed full 6-value Bloom enum at line 21
- Live Node.js execution — `zodSchema(optionalSchema).jsonSchema` vs `zodSchema(nullableSchema).jsonSchema`: confirmed `optional` omits field from `required`, `nullable` includes field in `required` with `anyOf`
- Live code read — `src/types/database.ts`: confirmed `ai_suggested: boolean` and `type: SynapseType` on `Synapse` type
- Live code read — `src/app/api/neurons/__tests__/route.test.ts`: confirmed `bloom_level: 'Remember'` in `validPayload` (will require update for BUG-02)

### Secondary (MEDIUM confidence)
- OpenAI error message (from CONTEXT.md): `INVALID SCHEMA FOR RESPONSE_FORMAT 'RESPONSE': IN CONTEXT=(), 'REQUIRED' IS REQUIRED TO BE SUPPLIED AND TO BE AN ARRAY INCLUDING EVERY KEY IN PROPERTIES. MISSING 'REFUSALREASON'.` — corroborates JSON Schema finding

## Metadata

**Confidence breakdown:**
- BUG-01 fix: HIGH — verified by live code read + Node.js JSON schema inspection
- BUG-02 fix: HIGH — verified by live code read; logic is straightforward
- BUG-03 parameter change: HIGH — live code confirms current values; widening is low-risk
- BUG-03 migration: HIGH — `Synapse` type confirms `type` and `ai_suggested` columns; SQL is idempotent
- Test impact assessment: HIGH — existing test fixtures read directly

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — no fast-moving dependencies)
