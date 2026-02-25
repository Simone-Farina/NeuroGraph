# Epic 0: The Great Re-Wiring (Crystal → Neuron Domain Rename)

## TL;DR

> **Quick Summary**: Drop legacy `crystals` and `crystal_edges` DB tables, create `neurons` and `synapses` with identical schema, then cascade the rename through 44+ TypeScript files across types, queries, API routes, AI tools, components, hooks, and tests.
> 
> **Deliverables**:
> - `010_baseline_v2_reset.sql` migration (DROP + CREATE)
> - All TypeScript types renamed (Neuron, Synapse, SynapseType, etc.)
> - API routes moved from `/api/crystals/` to `/api/neurons/`
> - All UI components, hooks, and stores updated
> - All tests green, build passing, zero "crystal" references in source
> 
> **Estimated Effort**: Medium-Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (SQL) → Task 2 (Types) → Task 3 (Queries) → Tasks 4-6 (API+AI) → Tasks 7-9 (UI+Hooks) → Task 10 (Tests) → Task 11 (Verification)

---

## Context

### Original Request
Execute "Epic 0" from `REFACTOR_PLAN.md`: drop the old `crystals` and `crystal_edges` database tables and rename the entire application domain to "Neurons" and "Synapses". Generate a detailed implementation plan with task ordering that prevents TypeScript compilation errors during transition.

### Interview Summary
**Key Discussions**:
- User explicitly requested DROP + CREATE (destructive migration), not ALTER TABLE RENAME
- 4 sequential steps requested: SQL migration → TypeScript types → API routes → Store+UI
- Golden rule: task ordering must prevent type errors during transition

**Research Findings**:
- 44+ files contain "crystal" references across 10 layers of the stack
- 8 locations use string-based Supabase column references (`.or()`, `.eq()`, `onConflict`) that TypeScript CANNOT catch
- React Flow type strings (`'crystal'`, `'crystalEdge'`) are runtime-only — no compile-time safety
- ChatPanel.tsx has LOCAL type re-declarations duplicating `chat.ts` — must be updated independently
- Two separate `toGraphEdge()` implementations exist (ChatPanel.tsx AND useEdgeSuggestions.ts)
- Tool name `suggest_crystallization` is persisted in `messages.metadata` — historical messages need backward compat
- `verify-setup.ts`, `seed.ts`, `performance-spike.ts`, `benchmark-rag.ts` all need updates
- `src/app/api/review/route.ts` and `review/page.tsx` import Crystal types — missing from original REFACTOR_PLAN.md

### Metis Review
**Identified Gaps** (addressed):
- File count understated (44 → 62 files with crystal refs) — full list now included
- 8 TypeScript-invisible string couplings identified and explicitly called out per task
- ChatPanel.tsx local type duplications flagged as separate rename targets
- Both `toGraphEdge()` implementations identified
- Mock provider (`mock-provider.ts`) detection string `crystallize` must be updated
- Duplicate test files (`tools.test.ts` at two paths) both included
- `useConversations.ts` had 0 crystal refs (verified) — excluded
- Review route + review page included in plan

---

## Work Objectives

### Core Objective
Rename the entire application domain from Crystal/Edge to Neuron/Synapse across database, types, API, AI layer, hooks, components, and tests — preserving all existing behavior exactly.

### Concrete Deliverables
- `src/lib/db/migrations/010_baseline_v2_reset.sql`
- Updated `src/types/database.ts` and `src/types/chat.ts`
- Updated `src/lib/db/queries.ts`
- Moved and updated `src/app/api/neurons/` (was `crystals/`)
- Updated AI layer files (tools, prompts, rag, fsrs, mock-provider)
- Renamed component files (NeuronNode, NeuronDetailPanel, Synapse, NeurogenesisSuggestion)
- Updated hooks (`useSynapseSuggestions.ts`)
- Updated ChatPanel, MessageList, GraphPanel, OnboardingTour
- All test files updated and passing
- Zero "crystal" references remaining in `src/` or `e2e/`

### Definition of Done
- [ ] `npx tsc --noEmit` → exit code 0
- [ ] `grep -r "crystal" src/ --include="*.ts" --include="*.tsx" -l` → empty output
- [ ] `grep -r "crystal" e2e/ -l` → empty output
- [ ] `npm test -- --run` → all pass
- [ ] `npm run build` → exit code 0

### Must Have
- All DB tables renamed (neurons, synapses)
- All RPC functions renamed (find_similar_neurons, get_neuron_neighborhood)
- All TypeScript types renamed
- All API routes moved to /api/neurons/
- All component files renamed
- All UI strings updated (Crystal → Neuron, Crystallize → Generate Neuron, etc.)
- Backward compat for tool name in MessageList (handle BOTH `suggest_crystallization` AND `suggest_neurogenesis`)
- FSRS fields and embedding preserved exactly in new tables
- RLS policies preserved

### Must NOT Have (Guardrails)
- ❌ DO NOT consolidate duplicate code (toGraphEdge, edgeSuggestionKey) — rename only
- ❌ DO NOT rename `addEdge`/`addNode`/`removeEdge`/`removeNode` in graphStore — these are React Flow generic vocabulary
- ❌ DO NOT rename `RelationshipType` (`PREREQUISITE | RELATED | BUILDS_ON`) — already neutral
- ❌ DO NOT update `MASTER_SPECIFICATION.txt`, `specifications.md`, or `docs/specs/` — follow-up work
- ❌ DO NOT touch `tsconfig.tsbuildinfo` — auto-regenerates
- ❌ DO NOT change behavior, validation logic, error handling, or business rules while renaming
- ❌ DO NOT add new features, refactor patterns, or "improve" code during rename
- ❌ DO NOT delete old migration files (001-009) — keep as history
- ❌ DO NOT rename CSS class names that are used as E2E selectors (`.crystallization-suggestion` → update to `.neurogenesis-suggestion` only if E2E selectors are also updated in same task)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest + Playwright)
- **Automated tests**: Tests-after (update existing tests to match renames)
- **Framework**: Vitest for unit/integration, Playwright for E2E

### QA Policy
Every task MUST include a `grep` sweep + `tsc --noEmit` as minimum verification.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

### Compile Gate Protocol
After each wave completes, run:
```bash
npx tsc --noEmit  # Must exit 0
grep -rn "crystal" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -20
# Must show only expected remaining references (test files if not yet updated)
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — SEQUENTIAL, order matters):
├── Task 1: SQL Migration 010_baseline_v2_reset.sql [quick]
├── Task 2: TypeScript Types (database.ts + chat.ts) [quick]  
├── Task 3: DB Query Layer (queries.ts) [quick]
│
│   ⚡ COMPILE GATE: npx tsc --noEmit

Wave 2 (API + AI Layer — PARALLEL after Wave 1):
├── Task 4: API Routes - Move & Rename [unspecified-high]
├── Task 5: AI Layer (tools, prompts, rag, fsrs, mock-provider) [quick]
├── Task 6: Review Route + Review Page [quick]
│
│   ⚡ COMPILE GATE: npx tsc --noEmit

Wave 3 (Frontend — PARALLEL after Wave 2):
├── Task 7: Graph Components (rename files + update internals) [unspecified-high]
├── Task 8: Chat Components (ChatPanel, MessageList, NeurogenesisSuggestion) [unspecified-high]
├── Task 9: Hooks + OnboardingTour + Remaining UI [quick]
│
│   ⚡ COMPILE GATE: npx tsc --noEmit

Wave 4 (Tests + Final Verification — PARALLEL after Wave 3):
├── Task 10: Update ALL test files [unspecified-high]
├── Task 11: E2E Tests + Supporting Scripts (seed, verify-setup, perf-spike, benchmark-rag) [quick]
│
│   ⚡ FINAL GATE: tsc + grep + npm test + npm run build

Wave FINAL (After ALL tasks — independent review):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real QA - Playwright (unspecified-high)
├── Task F4: Scope fidelity check (deep)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2,3,4,5,6 | 1 |
| 2 | 1 | 3,4,5,6,7,8,9 | 1 |
| 3 | 2 | 4,5,6,7,8 | 1 |
| 4 | 2,3 | 7,8,10,11 | 2 |
| 5 | 2,3 | 8,10 | 2 |
| 6 | 2,3 | 10 | 2 |
| 7 | 2,4 | 10,11 | 3 |
| 8 | 2,4,5 | 10 | 3 |
| 9 | 2,4 | 10,11 | 3 |
| 10 | 4,5,6,7,8,9 | F1-F4 | 4 |
| 11 | 4,7,9 | F1-F4 | 4 |
| F1-F4 | 10,11 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks (sequential) — T1→`quick`, T2→`quick`, T3→`quick`
- **Wave 2**: 3 tasks (parallel) — T4→`unspecified-high`, T5→`quick`, T6→`quick`
- **Wave 3**: 3 tasks (parallel) — T7→`unspecified-high`, T8→`unspecified-high`, T9→`quick`
- **Wave 4**: 2 tasks (parallel) — T10→`unspecified-high`, T11→`quick`
- **FINAL**: 4 tasks (parallel) — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

---

### WAVE 1 — Foundation (Sequential: Task 1 → 2 → 3)

- [ ] 1. SQL Migration: `010_baseline_v2_reset.sql`

  **What to do**:
  - Create file `src/lib/db/migrations/010_baseline_v2_reset.sql`
  - `DROP TABLE IF EXISTS crystal_edges CASCADE;`
  - `DROP TABLE IF EXISTS crystals CASCADE;`
  - `DROP FUNCTION IF EXISTS find_similar_crystals(vector, uuid, float, int);`  ← must include signature (vector, uuid, float, int) per migration 004
  - `DROP FUNCTION IF EXISTS get_crystal_neighborhood(uuid, int);`  ← must include signature (uuid, int) per migration 002/007
  - CREATE TABLE `neurons` with ALL columns from the original `crystals` table:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `title TEXT NOT NULL`
    - `definition TEXT NOT NULL CHECK (char_length(definition) <= 280)`
    - `core_insight TEXT NOT NULL`
    - `bloom_level TEXT NOT NULL CHECK (bloom_level IN ('Remember','Understand','Apply','Analyze','Evaluate','Create'))`
    - `source_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE`
    - `source_message_ids UUID[] NOT NULL DEFAULT '{}'`
    - `embedding vector(1536)`
    - `stability NUMERIC NOT NULL DEFAULT 1.0`
    - `retrievability NUMERIC NOT NULL DEFAULT 1.0 CHECK (retrievability >= 0.0 AND retrievability <= 1.0)`
    - `difficulty NUMERIC NOT NULL DEFAULT 0`
    - `state TEXT NOT NULL DEFAULT 'New' CHECK (state IN ('New','Learning','Review','Relearning'))`
    - `reps INTEGER NOT NULL DEFAULT 0`
    - `lapses INTEGER NOT NULL DEFAULT 0`
    - `elapsed_days INTEGER NOT NULL DEFAULT 0`
    - `scheduled_days INTEGER NOT NULL DEFAULT 0`
    - `last_review TIMESTAMPTZ`
    - `next_review_due TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day')`
    - `review_count INTEGER NOT NULL DEFAULT 0`
    - `consecutive_correct INTEGER NOT NULL DEFAULT 0`
    - `content TEXT DEFAULT ''`
    - `user_modified BOOLEAN DEFAULT FALSE`
    - `modified_at TIMESTAMPTZ`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - CREATE TABLE `synapses` with ALL columns from original `crystal_edges` but renamed FK columns:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `source_neuron_id UUID NOT NULL REFERENCES neurons(id) ON DELETE CASCADE`  ← was `source_crystal_id`
    - `target_neuron_id UUID NOT NULL REFERENCES neurons(id) ON DELETE CASCADE`  ← was `target_crystal_id`
    - `type TEXT NOT NULL CHECK (type IN ('PREREQUISITE','RELATED','BUILDS_ON'))`
    - `weight NUMERIC NOT NULL DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0)`
    - `ai_suggested BOOLEAN NOT NULL DEFAULT FALSE`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `CONSTRAINT unique_synapse UNIQUE (source_neuron_id, target_neuron_id, type)`  ← was `unique_edge`
  - Recreate ALL indexes:
    - `idx_neurons_user_id`, `idx_neurons_next_review_due`, `idx_neurons_source_conversation`, `idx_neurons_embedding` (HNSW)
    - `idx_synapses_user_id`, `idx_synapses_source` (on `source_neuron_id`), `idx_synapses_target` (on `target_neuron_id`)
  - Recreate RLS policies:
    - `neurons_isolation ON neurons FOR ALL USING (auth.uid() = user_id)`
    - `synapses_isolation ON synapses FOR ALL USING (auth.uid() = user_id)`
  - Recreate `update_updated_at_column` trigger on `neurons`
  - Recreate RPC function `find_similar_neurons` (same logic as `find_similar_crystals` but referencing `neurons` table)
  - Recreate RPC function `get_neuron_neighborhood` (same logic as `get_crystal_neighborhood` but referencing `neurons`, `synapses`, `source_neuron_id`, `target_neuron_id`)
  - Include `rate_limit` function if it was in original schema (check migration 005)
  - End with verification `RAISE NOTICE` confirming tables created

  **Must NOT do**:
  - Do NOT delete migration files 001-009 (keep as history)
  - Do NOT change any column types, constraints, or defaults — exact replica with new names
  - Do NOT add new columns or features

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (first, sequential)
  - **Blocks**: Tasks 2, 3, 4, 5, 6
  - **Blocked By**: None

  **References**:
  - `src/lib/db/migrations/001_initial_schema.sql` — Original `crystals` + `crystal_edges` table definitions, indexes, RLS policies, triggers
  - `src/lib/db/migrations/002_query_functions.sql` — Original `find_similar_crystals` and `get_crystal_neighborhood` RPC function bodies
  - `src/lib/db/migrations/003_fsrs_schema.sql` — FSRS columns added to crystals (difficulty, state, reps, lapses, elapsed_days, scheduled_days) + removal of ease_factor
  - `src/lib/db/migrations/005_rate_limit.sql` — Rate limit function (verify if it references crystal tables)
  - `src/lib/db/migrations/006_fix_retrievability.sql` — Retrievability fix (UPDATE on crystals)
  - `src/lib/db/migrations/007_fix_recursive_query.sql` — Fixed `get_crystal_neighborhood` with bidirectional edges CTE — USE THIS VERSION of the function, not the one from 002
  - `src/lib/db/migrations/008_add_content_and_editing.sql` — Added `content`, `user_modified`, `modified_at` columns
  - `src/lib/db/migrations/009_add_messages_metadata.sql` — Messages metadata (does NOT reference crystals — skip)

  **Acceptance Criteria**:
  - [ ] File `src/lib/db/migrations/010_baseline_v2_reset.sql` exists
  - [ ] SQL is syntactically valid (no parse errors)
  - [ ] Contains DROP for `crystal_edges`, `crystals`, `find_similar_crystals`, `get_crystal_neighborhood`
  - [ ] Contains CREATE TABLE `neurons` with all 25+ columns matching original schema
  - [ ] Contains CREATE TABLE `synapses` with `source_neuron_id`, `target_neuron_id` (NOT `source_crystal_id`)
  - [ ] Contains HNSW index on `neurons.embedding`
  - [ ] Contains RLS policies for both tables
  - [ ] Contains `find_similar_neurons` RPC function querying `neurons` table
  - [ ] Contains `get_neuron_neighborhood` RPC function using `synapses`, `source_neuron_id`, `target_neuron_id`
  - [ ] `grep -c 'crystal' src/lib/db/migrations/010_baseline_v2_reset.sql` shows only DROP statements (no crystal refs in CREATE sections)

  **QA Scenarios:**
  ```
  Scenario: SQL file validates syntactically
    Tool: Bash
    Steps:
      1. Run: cat src/lib/db/migrations/010_baseline_v2_reset.sql | head -5
      2. Verify file starts with SQL comment header
      3. Run: grep -c 'CREATE TABLE' src/lib/db/migrations/010_baseline_v2_reset.sql
      4. Assert: output is '2' (neurons + synapses)
      5. Run: grep -c 'DROP TABLE' src/lib/db/migrations/010_baseline_v2_reset.sql
      6. Assert: output is '2' (crystals + crystal_edges)
      7. Run: grep -c 'CREATE.*FUNCTION' src/lib/db/migrations/010_baseline_v2_reset.sql
      8. Assert: output is >= 2 (find_similar_neurons + get_neuron_neighborhood)
    Expected Result: All counts match
    Evidence: .sisyphus/evidence/task-1-sql-validation.txt
  ```

  **Commit**: YES (group with Tasks 2, 3)
  - Message: `refactor(db): add 010_baseline_v2_reset migration with neurons/synapses schema`
  - Files: `src/lib/db/migrations/010_baseline_v2_reset.sql`

- [ ] 2. TypeScript Types: `database.ts` + `chat.ts`

  **What to do**:
  In `src/types/database.ts`:
  - Rename `EdgeType` → `SynapseType` (line 9)
  - Rename `Crystal` type → `Neuron` (line 12)
  - Rename `CrystalEdge` type → `Synapse` (line 41)
  - Inside `Synapse` type: rename `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
  - Inside `Database` type:
    - Rename key `crystals` → `neurons` (line 72), update `Row: Neuron`, `Insert` fields, `Update: Partial<Neuron>`
    - Rename key `crystal_edges` → `synapses` (line 105), update `Row: Synapse`, `Insert` fields with `source_neuron_id`/`target_neuron_id`, `Update: Partial<Synapse>`
    - Inside `Insert` for `synapses`: rename `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
    - Rename `Functions.find_similar_crystals` → `find_similar_neurons`, update `Returns: Array<Neuron & { similarity: number }>`
    - Rename `Functions.get_crystal_neighborhood` → `get_neuron_neighborhood`, rename `root_crystal_id` → `root_neuron_id`, update `Returns` to use `Neuron[]` and `Synapse[]`

  In `src/types/chat.ts`:
  - Rename `EdgeSuggestion` → `SynapseSuggestion` (line 30)
  - Inside `SynapseSuggestion`: rename `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
  - Rename `CreatedCrystalResponse` → `CreatedNeuronResponse` (line 40)
  - Inside `CreatedNeuronResponse`:
    - Rename `crystal` key → `neuron`
    - In `edges` array items: rename `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
    - Rename `edge_suggestions` → `synapse_suggestions`, type → `SynapseSuggestion[]`
  - Rename `EdgeUpsertResponse` → `SynapseUpsertResponse` (line 56)
  - Inside `SynapseUpsertResponse`: rename `edge` → `synapse`, rename inner `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
  - In `SuggestionInput` (line 9): rename `related_crystals` → `related_neurons`

  **Must NOT do**:
  - Do NOT rename `RelationshipType` — it's already neutral
  - Do NOT rename `BloomLevel`, `MessageRole`, `Conversation`, `Message` — unrelated
  - Do NOT change any field types or add/remove fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (must follow Task 1)
  - **Parallel Group**: Wave 1 (second, sequential)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `src/types/database.ts` — Full file, 172 lines. Every line with `Crystal` or `crystal` must be renamed
  - `src/types/chat.ts` — Full file, 64 lines. Rename all `crystal`/`edge` references

  **Acceptance Criteria**:
  - [ ] `grep -c 'crystal\|Crystal' src/types/database.ts` → 0
  - [ ] `grep -c 'crystal\|Crystal' src/types/chat.ts` → 0
  - [ ] `Neuron` type exported from database.ts
  - [ ] `Synapse` type exported from database.ts with `source_neuron_id` and `target_neuron_id`
  - [ ] `SynapseType` exported from database.ts
  - [ ] `Database['public']['Tables']` has keys `neurons` and `synapses` (not `crystals`/`crystal_edges`)
  - [ ] `Database['public']['Functions']` has `find_similar_neurons` and `get_neuron_neighborhood`
  - [ ] `SynapseSuggestion`, `CreatedNeuronResponse`, `SynapseUpsertResponse` exported from chat.ts

  **QA Scenarios:**
  ```
  Scenario: Zero crystal references in type files
    Tool: Bash
    Steps:
      1. Run: grep -ic 'crystal' src/types/database.ts
      2. Assert: output is '0'
      3. Run: grep -ic 'crystal' src/types/chat.ts
      4. Assert: output is '0'
      5. Run: grep -c 'Neuron' src/types/database.ts
      6. Assert: output is > 10 (type definition + all usages)
      7. Run: grep -c 'Synapse' src/types/database.ts
      8. Assert: output is > 5
    Expected Result: All crystal references eliminated, neuron/synapse references present
    Evidence: .sisyphus/evidence/task-2-type-grep.txt
  ```

  **Commit**: YES (group with Tasks 1, 3)
  - Files: `src/types/database.ts`, `src/types/chat.ts`

- [ ] 3. DB Query Layer: `queries.ts`

  **What to do**:
  In `src/lib/db/queries.ts`:
  - Update imports (line 2): `Crystal, CrystalEdge` → `Neuron, Synapse`
  - Rename type aliases (lines 6-8):
    - `CrystalInsert` → `NeuronInsert`, reference `Database['public']['Tables']['neurons']['Insert']`
    - `CrystalUpdate` → `NeuronUpdate`, reference `Database['public']['Tables']['neurons']['Update']`
    - `EdgeInsert` → `SynapseInsert`, reference `Database['public']['Tables']['synapses']['Insert']`
  - Rename `crystalQueries` → `neuronQueries` (line 10)
  - Update ALL `.from('crystals')` → `.from('neurons')` (lines 13, 24, 38, 49, 61, 70, 89, 149, 151)
  - Update `return crystal` → `return neuron` (or just keep generic `return data` — prefer consistency)
  - Update RPC calls:
    - `.rpc('find_similar_crystals', {...})` → `.rpc('find_similar_neurons', {...})` (line 89)
    - `.rpc('get_crystal_neighborhood', {...})` → `.rpc('get_neuron_neighborhood', {...})` (line 108)
    - Rename param `root_crystal_id` → `root_neuron_id` (line 109)
  - Update return types: `Promise<Crystal>` → `Promise<Neuron>`, `Crystal[]` → `Neuron[]`, `CrystalEdge[]` → `Synapse[]`
  - Rename `edgeQueries` → `synapseQueries` (line 184)
  - Update ALL `.from('crystal_edges')` → `.from('synapses')` (lines 137, 187, 198, 208, 218)
  - ⚠️ **CRITICAL STRING RENAMES** (TypeScript cannot catch these):
    - Line 139: `.or(\`source_crystal_id.in.(...)\`)` → `.or(\`source_neuron_id.in.(...)\`)`
    - Line 145-146: `edge.source_crystal_id` → `edge.source_neuron_id`, `edge.target_crystal_id` → `edge.target_neuron_id`
    - Line 162: `edge.source_crystal_id === id || edge.target_crystal_id === id` → `...source_neuron_id...target_neuron_id...`
    - Line 166-167: same pattern
    - Line 210: `.or(\`source_crystal_id.eq.${crystalId},...\`)` → `.or(\`source_neuron_id.eq.${neuronId},...\`)`
  - Rename parameter `crystalId` → `neuronId` in `getByCrystalId` → `getByNeuronId` (line 206)
  - Rename parameter `crystalIds` → `neuronIds` in `getNeighborhoodsBatch` (line 125)
  - Rename local variables: `crystalsMap` → `neuronsMap`, etc.

  **Must NOT do**:
  - Do NOT change query logic, filtering, or ordering
  - Do NOT consolidate or refactor query patterns

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (must follow Task 2)
  - **Parallel Group**: Wave 1 (third, sequential)
  - **Blocks**: Tasks 4, 5, 6, 7, 8
  - **Blocked By**: Task 2

  **References**:
  - `src/lib/db/queries.ts` — Full file, 306 lines. EVERY reference to crystal/edge must change
  - `src/types/database.ts` (updated in Task 2) — New type names to import

  **Acceptance Criteria**:
  - [ ] `grep -ic 'crystal' src/lib/db/queries.ts` → 0
  - [ ] `neuronQueries` and `synapseQueries` exported
  - [ ] All `.from()` calls use `'neurons'` or `'synapses'`
  - [ ] All `.rpc()` calls use `'find_similar_neurons'` and `'get_neuron_neighborhood'`
  - [ ] All `.or()` filter strings use `source_neuron_id` and `target_neuron_id`
  - [ ] `npx tsc --noEmit` succeeds for this file (may show errors in consumers — expected, they're updated in later tasks)

  **QA Scenarios:**
  ```
  Scenario: Zero crystal references in queries
    Tool: Bash
    Steps:
      1. Run: grep -inc 'crystal' src/lib/db/queries.ts
      2. Assert: output is '0'
      3. Run: grep -c 'neuronQueries' src/lib/db/queries.ts
      4. Assert: output is >= 1
      5. Run: grep -c 'synapseQueries' src/lib/db/queries.ts
      6. Assert: output is >= 1
      7. Run: grep -c 'source_neuron_id' src/lib/db/queries.ts
      8. Assert: output is >= 5 (multiple .or() and property access locations)
    Expected Result: Complete rename with no crystal remnants
    Evidence: .sisyphus/evidence/task-3-queries-grep.txt

  Scenario: Compile gate after Wave 1
    Tool: Bash
    Steps:
      1. Run: npx tsc --noEmit 2>&1 | head -50
      2. Note: Errors in CONSUMER files (api routes, components) are EXPECTED at this point
      3. Verify: No errors IN database.ts, chat.ts, or queries.ts themselves
    Expected Result: Type definition files are internally consistent
    Evidence: .sisyphus/evidence/task-3-tsc-wave1.txt
  ```

  **Commit**: YES (group with Tasks 1, 2)
  - Message: `refactor(db): rename Crystal/Edge types and queries to Neuron/Synapse`
  - Files: `src/lib/db/queries.ts`, `src/types/database.ts`, `src/types/chat.ts`, `src/lib/db/migrations/010_baseline_v2_reset.sql`

### WAVE 2 — API + AI Layer (Parallel: Tasks 4, 5, 6)

- [ ] 4. API Routes: Move & Rename `/api/crystals/` → `/api/neurons/`

  **What to do**:
  **Step A — Directory move:**
  - `mv src/app/api/crystals src/app/api/neurons`
  - Inside `src/app/api/neurons/[id]/edges/` → rename dir to `src/app/api/neurons/[id]/synapses/`

  **Step B — Update `src/app/api/neurons/route.ts` (was crystals/route.ts, ~320 lines):**
  - Rename local type `SimilarCrystalRow` → `SimilarNeuronRow`
  - Rename local type aliases: `EdgeType` → uses `Database['public']['Tables']['synapses']...`
  - Rename `EdgeInsert` → `SynapseInsert` (references `synapses` table)
  - Rename `EdgeRow` → `SynapseRow`
  - Rename `EdgeSuggestion` local type → `SynapseSuggestion` (update `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`)
  - Rename `createCrystalSchema` → `createNeuronSchema`
  - Rename field `related_crystals` → `related_neurons` in schema + destructuring
  - Update all `.from('crystals')` → `.from('neurons')` (multiple locations)
  - Update all `.from('crystal_edges')` → `.from('synapses')`
  - ⚠️ **CRITICAL STRING**: `onConflict: 'source_crystal_id,target_crystal_id,type'` → `'source_neuron_id,target_neuron_id,type'` (line ~270)
  - ⚠️ **CRITICAL STRING**: `.eq('source_crystal_id', crystal.id)` → `.eq('source_neuron_id', neuron.id)` (line ~294)
  - Update `.rpc('find_similar_crystals', {...})` → `.rpc('find_similar_neurons', {...})`
  - Rename local var `crystal` → `neuron` throughout
  - Update all `edgeKey()` calls to use `source_neuron_id`/`target_neuron_id`
  - Update response: `{ crystal, edges, edge_suggestions }` → `{ neuron, edges: createdSynapses, synapse_suggestions: synapseSuggestions }`
  - Update `relatedCrystalsInput` → `relatedNeuronsInput`
  - Update all `highConfidenceEdgeInserts` → `highConfidenceSynapseInserts`
  - Update `mediumSuggestionsByKey` keys to use `source_neuron_id`/`target_neuron_id`
  - Update `edgeKey` function: param names and internal refs

  **Step C — Update `src/app/api/neurons/[id]/route.ts` (was crystals/[id]/route.ts):**
  - Update import: `crystalQueries` → `neuronQueries`
  - Update `updateCrystalSchema` → `updateNeuronSchema`
  - Update all `existingCrystal` → `existingNeuron`, `updatedCrystal` → `updatedNeuron`
  - Update error messages: 'Crystal not found' → 'Neuron not found'
  - Update response keys: `{ crystal: updatedCrystal }` → `{ neuron: updatedNeuron }`

  **Step D — Update `src/app/api/neurons/[id]/synapses/route.ts` (was edges/route.ts):**
  - Update `createEdgeSchema` → `createSynapseSchema`
  - Update `deleteEdgeSchema` → `deleteSynapseSchema`
  - ⚠️ **CRITICAL STRING**: `.or(\`source_crystal_id.eq.${params.data.id},target_crystal_id.eq.${params.data.id}\`)` → `source_neuron_id`/`target_neuron_id` (lines ~44, ~189)
  - ⚠️ **CRITICAL STRING**: `.eq('source_crystal_id', ...)` / `.eq('target_crystal_id', ...)` (lines ~135-136)
  - Update all `.from('crystal_edges')` → `.from('synapses')`
  - Update all `.from('crystals')` → `.from('neurons')`
  - Update error messages: 'Invalid crystal id' → 'Invalid neuron id', 'Crystal not found' → 'Neuron not found', 'A crystal cannot connect to itself' → 'A neuron cannot connect to itself'
  - Update variable names: `sourceCrystal`/`targetCrystal` → `sourceNeuron`/`targetNeuron`
  - Update response: `{ edge }` → `{ synapse }`, `{ edges }` → `{ synapses }`

  **Must NOT do**:
  - Do NOT change validation logic, error handling patterns, or business rules
  - Do NOT consolidate the local type declarations — just rename them

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 5, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 7, 8, 10, 11
  - **Blocked By**: Tasks 2, 3

  **References**:
  - `src/app/api/crystals/route.ts` — Full file, 320 lines. Heavy rename (20+ string changes)
  - `src/app/api/crystals/[id]/route.ts` — 108 lines
  - `src/app/api/crystals/[id]/edges/route.ts` — 206 lines. Has 4 CRITICAL STRING locations
  - `src/types/database.ts` (updated in Task 2) — New type names
  - `src/lib/db/queries.ts` (updated in Task 3) — New query export names

  **Acceptance Criteria**:
  - [ ] Directory `src/app/api/neurons/` exists with route.ts, [id]/route.ts, [id]/synapses/route.ts
  - [ ] Directory `src/app/api/crystals/` does NOT exist
  - [ ] `grep -ric 'crystal' src/app/api/neurons/` → 0
  - [ ] All `.from()` calls use 'neurons' or 'synapses'
  - [ ] All `.or()` strings use source_neuron_id/target_neuron_id
  - [ ] `onConflict` uses 'source_neuron_id,target_neuron_id,type'

  **QA Scenarios:**
  ```
  Scenario: API directory structure correct
    Tool: Bash
    Steps:
      1. Run: ls -R src/app/api/neurons/
      2. Assert: Shows route.ts, [id]/route.ts, [id]/synapses/route.ts
      3. Run: test -d src/app/api/crystals && echo 'FAIL' || echo 'PASS'
      4. Assert: output is 'PASS' (old directory gone)
      5. Run: grep -ric 'crystal' src/app/api/neurons/ || echo '0'
      6. Assert: output is '0'
    Expected Result: Clean directory structure with zero crystal references
    Evidence: .sisyphus/evidence/task-4-api-structure.txt
  ```

  **Commit**: YES (group with Tasks 5, 6)
  - Message: `refactor(api): move /api/crystals to /api/neurons and rename internals`
  - Files: entire `src/app/api/neurons/` directory

- [ ] 5. AI Layer: tools, prompts, rag, fsrs, mock-provider

  **What to do**:
  **In `src/lib/ai/tools.ts`:**
  - Rename `crystallizationSchema` → `neurogenesisSchema` (line 40)
  - Rename `suggestCrystallizationTool` → `suggestNeurogenesisTool` (line 49)
  - Update tool description: 'crystallizing a durable insight' → 'generating a neuron from a durable insight'
  - Update `.describe()` strings: 'crystal' → 'neuron' in parameter descriptions (lines 11, 28, 37)

  **In `src/lib/ai/prompts.ts`:**
  - Update `CHAT_SYSTEM_PROMPT`:
    - 'crystallize durable insights' → 'generate neurons from durable insights'
    - 'suggest_crystallization' → 'suggest_neurogenesis' (line 16)
    - 'Crystallization Policy' → 'Neurogenesis Policy' (line 15)
    - 'Potential Crystal' → 'Potential Neuron' (line 30 area)
    - 'crystal catalog' → 'neuron catalog' (line 34)
    - 'related_crystals' → 'related_neurons' (line 34)
    - 'crystal' → 'neuron' throughout prompt text

  **In `src/lib/ai/rag.ts`:**
  - Update import: `crystalQueries` → `neuronQueries`, `Crystal` → `Neuron` (lines 3-4)
  - Update `.from('crystals')` → `.from('neurons')` (line 23)
  - Rename local vars: `similarCrystals` → `similarNeurons`, `recentCrystals` → `recentNeurons`
  - Update context line: `Crystal ${crystal.title}` → `Neuron ${neuron.title}` (line 60)
  - Rename `allCrystalsMap` → `allNeuronsMap` with type `Map<string, Neuron>`

  **In `src/lib/ai/fsrs.ts`:**
  - Update any `Crystal` type imports → `Neuron`
  - Update parameter types: `crystal: Crystal` → `neuron: Neuron` where applicable
  - (Note: verify actual references — function `calculateRetrievability` takes a Crystal param)

  **In `src/lib/ai/mock-provider.ts`:**
  - Update `toolName: 'suggest_crystallization'` → `'suggest_neurogenesis'` (line ~49)
  - Update detection string: `userText.toLowerCase().includes('crystallize')` → `includes('neurogenesis')` or similar (line ~38)

  **In `src/app/api/chat/route.ts`:**
  - Update import: `suggestCrystallizationTool` → `suggestNeurogenesisTool` (line 8)
  - Update tool registration: `suggest_crystallization: suggestCrystallizationTool` → `suggest_neurogenesis: suggestNeurogenesisTool` (line 199)
  - Update system prompt construction: 'Crystal Catalog' → 'Neuron Catalog' (line 187)
  - Update `ragCatalog` label in prompt string (line 187)

  **Must NOT do**:
  - Do NOT change model selection, token limits, or AI behavior
  - Do NOT change RAG retrieval logic or thresholds

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 4, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: Tasks 2, 3

  **References**:
  - `src/lib/ai/tools.ts` — 54 lines. Rename schema + tool exports
  - `src/lib/ai/prompts.ts` — 39 lines. CHAT_SYSTEM_PROMPT full rewrite of crystal refs
  - `src/lib/ai/rag.ts` — 74 lines. Import + local var + string renames
  - `src/lib/ai/fsrs.ts` — Check Crystal type usage
  - `src/lib/ai/mock-provider.ts` — Tool name + detection string
  - `src/app/api/chat/route.ts` — Lines 8, 187, 199. Tool import + registration + prompt

  **Acceptance Criteria**:
  - [ ] `grep -ric 'crystal' src/lib/ai/tools.ts src/lib/ai/prompts.ts src/lib/ai/rag.ts src/lib/ai/mock-provider.ts` → 0 per file
  - [ ] `grep -c 'crystal' src/app/api/chat/route.ts` → 0
  - [ ] `neurogenesisSchema` and `suggestNeurogenesisTool` exported from tools.ts
  - [ ] `neuronQueries` imported in rag.ts (not crystalQueries)
  - [ ] Chat route registers `suggest_neurogenesis` tool (not `suggest_crystallization`)

  **QA Scenarios:**
  ```
  Scenario: AI layer crystal references eliminated
    Tool: Bash
    Steps:
      1. Run: grep -ric 'crystal' src/lib/ai/tools.ts src/lib/ai/prompts.ts src/lib/ai/rag.ts src/lib/ai/fsrs.ts src/lib/ai/mock-provider.ts
      2. Assert: all counts are 0
      3. Run: grep 'suggest_neurogenesis' src/app/api/chat/route.ts
      4. Assert: matches found (tool registered)
    Expected Result: Clean AI layer
    Evidence: .sisyphus/evidence/task-5-ai-layer-grep.txt
  ```

  **Commit**: YES (group with Tasks 4, 6)
  - Files: `src/lib/ai/tools.ts`, `src/lib/ai/prompts.ts`, `src/lib/ai/rag.ts`, `src/lib/ai/fsrs.ts`, `src/lib/ai/mock-provider.ts`, `src/app/api/chat/route.ts`

- [ ] 6. Review Route + Review Page

  **What to do**:
  **In `src/app/api/review/route.ts`:**
  - Update all imports: `Crystal` → `Neuron`, `crystalQueries` → `neuronQueries`
  - Update `.from('crystals')` → `.from('neurons')` if present
  - Update all Crystal type references → Neuron
  - Update variable names: `crystal` → `neuron`, `crystals` → `neurons`
  - Update response keys if applicable

  **In `src/app/(app)/app/review/page.tsx`:**
  - Update `Crystal` type imports → `Neuron`
  - Update variable names: `crystal` → `neuron`
  - Update UI text: 'Crystal' → 'Neuron' in displayed strings
  - Update fetch URL if it calls `/api/crystals/` → `/api/neurons/`

  **In `src/app/(app)/error.tsx` and `src/app/(app)/app/review/error.tsx`:**
  - Update any 'crystal' references in error messages

  **Must NOT do**:
  - Do NOT change FSRS logic or review scoring

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 4, 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:
  - `src/app/api/review/route.ts` — Review API (imports Crystal, uses crystalQueries)
  - `src/app/(app)/app/review/page.tsx` — Review UI page
  - `src/app/(app)/error.tsx` — App error boundary
  - `src/app/(app)/app/review/error.tsx` — Review error boundary

  **Acceptance Criteria**:
  - [ ] `grep -ric 'crystal' src/app/api/review/route.ts` → 0
  - [ ] `grep -ric 'crystal' src/app/\(app\)/app/review/page.tsx` → 0
  - [ ] Review page UI shows 'Neuron' not 'Crystal'

  **QA Scenarios:**
  ```
  Scenario: Review files crystal-free
    Tool: Bash
    Steps:
      1. Run: grep -ric 'crystal' src/app/api/review/ src/app/\(app\)/
      2. Assert: all counts are 0
    Expected Result: Zero crystal references in review layer
    Evidence: .sisyphus/evidence/task-6-review-grep.txt
  ```

  **Commit**: YES (group with Tasks 4, 5)
  - Message: `refactor(api): rename crystal refs in review route and AI layer`
  - Files: review route + review page + error boundaries

### WAVE 3 — Frontend (Parallel: Tasks 7, 8, 9)

- [ ] 7. Graph Components: Rename Files + Update Internals

  **What to do**:
  **Step A — Rename files:**
  - `mv src/components/graph/CrystalNode.tsx src/components/graph/NeuronNode.tsx`
  - `mv src/components/graph/CrystalEdge.tsx src/components/graph/SynapseEdge.tsx`
  - `mv src/components/graph/CrystalDetailPanel.tsx src/components/graph/NeuronDetailPanel.tsx`

  **Step B — Update `src/components/graph/NeuronNode.tsx` (was CrystalNode.tsx):**
  - Rename type `CrystalNodeData` → `NeuronNodeData`
  - Rename type `CrystalFlowNode` → `NeuronFlowNode` (change generic param from `'crystal'` to `'neuron'`)
  - Rename function `CrystalNode` → `NeuronNode`
  - Update confirm dialog: 'delete this crystal?' → 'delete this neuron?'
  - Update fetch URL: `/api/crystals/${id}` → `/api/neurons/${id}`
  - Update error messages: 'Failed to delete crystal' → 'Failed to delete neuron'
  - Update UI label: `<p>Crystal</p>` → `<p>Neuron</p>` (line ~146)
  - Update delete button title: 'Delete crystal' → 'Delete neuron'

  **Step C — Update `src/components/graph/SynapseEdge.tsx` (was CrystalEdge.tsx):**
  - Rename exported component `CrystalEdge` → `SynapseEdge`
  - Update any internal crystal references

  **Step D — Update `src/components/graph/NeuronDetailPanel.tsx` (was CrystalDetailPanel.tsx):**
  - Rename function `CrystalDetailPanel` → `NeuronDetailPanel`
  - Update import: `Crystal` type → `Neuron`
  - Update state: `crystal` → `neuron`, `setCrystal` → `setNeuron`
  - Update fetch URL: `/api/crystals/${selectedNodeId}` → `/api/neurons/${selectedNodeId}` (lines ~36, ~74)
  - Update error messages: 'crystal details' → 'neuron details', 'update crystal' → 'update neuron'
  - Update UI heading: 'Crystal Details' → 'Neuron Details' (line ~109)
  - Update placeholder: 'Crystal Title' → 'Neuron Title' (line ~142)

  **Step E — Update `src/components/graph/GraphPanel.tsx` (~242 lines):**
  - Update imports (lines 20-22):
    - `CrystalEdge` → `SynapseEdge` from `./SynapseEdge`
    - `CrystalNode` → `NeuronNode` from `./NeuronNode`
    - `CrystalDetailPanel` → `NeuronDetailPanel` from `./NeuronDetailPanel`
  - Update import: `Crystal` type → `Neuron` from `@/types/database`
  - ⚠️ **CRITICAL REACT FLOW TYPE STRINGS:**
    - `nodeTypes = { crystal: CrystalNode }` → `{ neuron: NeuronNode }` (line ~28)
    - `edgeTypes = { crystalEdge: CrystalEdge }` → `{ synapseEdge: SynapseEdge }` (line ~32)
  - Update fetch URL: `/api/crystals` → `/api/neurons` (line ~142)
  - Update response destructuring: `payload.crystals` → `payload.neurons`, `payload.edges` → `payload.synapses` (lines ~146-147)
  - ⚠️ **CRITICAL NODE TYPE STRING**: `type: 'crystal'` → `type: 'neuron'` in node mapping (line ~151)
  - ⚠️ **CRITICAL EDGE TYPE STRING**: `type: 'crystalEdge'` → `type: 'synapseEdge'` in edge mapping (line ~168)
  - Update edge source/target: `edge.source_crystal_id` → `edge.source_neuron_id`, `edge.target_crystal_id` → `edge.target_neuron_id` (lines ~166-167)
  - Update local vars: `crystalEdges` → `synapses`, `crystals` → `neurons`
  - Update `crystalPartial` → `neuronPartial` in retrievability calc (line ~117)
  - Update `as Crystal` → `as Neuron` (line ~121)
  - Update empty state text: 'Knowledge Graph Empty' → 'Neural Network Empty', 'crystallized knowledge nodes' → 'neurons' (lines ~203-205)
  - Update `<CrystalDetailPanel />` → `<NeuronDetailPanel />` (line ~239)

  **Must NOT do**:
  - Do NOT rename `addEdge`/`addNode`/`removeEdge`/`removeNode` in graphStore — these are React Flow vocabulary
  - Do NOT change graph layout logic or dagre configuration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 8, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Tasks 2, 4

  **References**:
  - `src/components/graph/CrystalNode.tsx` — 166 lines. Rename component + type + UI strings + API URL
  - `src/components/graph/CrystalEdge.tsx` — Read file for Crystal refs to rename
  - `src/components/graph/CrystalDetailPanel.tsx` — 223 lines. Rename component + state + API URLs + UI
  - `src/components/graph/GraphPanel.tsx` — 242 lines. CRITICAL: 4 React Flow type strings + imports + fetch URL
  - `src/types/database.ts` (updated in Task 2) — New Neuron type

  **Acceptance Criteria**:
  - [ ] Files exist: NeuronNode.tsx, SynapseEdge.tsx, NeuronDetailPanel.tsx
  - [ ] Files do NOT exist: CrystalNode.tsx, CrystalEdge.tsx, CrystalDetailPanel.tsx
  - [ ] `grep -ric 'crystal' src/components/graph/` → 0
  - [ ] GraphPanel nodeTypes uses `neuron` key, edgeTypes uses `synapseEdge` key
  - [ ] All fetch URLs point to `/api/neurons/`
  - [ ] UI shows 'Neuron Details', 'Neural Network Empty', etc.

  **QA Scenarios:**
  ```
  Scenario: Graph component files renamed and crystal-free
    Tool: Bash
    Steps:
      1. Run: ls src/components/graph/
      2. Assert: Shows NeuronNode.tsx, SynapseEdge.tsx, NeuronDetailPanel.tsx, GraphPanel.tsx
      3. Assert: NO CrystalNode.tsx, CrystalEdge.tsx, CrystalDetailPanel.tsx
      4. Run: grep -ric 'crystal' src/components/graph/
      5. Assert: output is 0 for all files
      6. Run: grep "type: 'neuron'" src/components/graph/GraphPanel.tsx
      7. Assert: match found (node type registered correctly)
      8. Run: grep "type: 'synapseEdge'" src/components/graph/GraphPanel.tsx
      9. Assert: match found (edge type registered correctly)
    Expected Result: Clean graph component layer
    Evidence: .sisyphus/evidence/task-7-graph-components.txt
  ```

  **Commit**: YES (group with Tasks 8, 9)
  - Message: `refactor(ui): rename graph components from Crystal to Neuron/Synapse`
  - Files: all files in `src/components/graph/`

- [ ] 8. Chat Components: ChatPanel, MessageList, NeurogenesisSuggestion

  **What to do**:
  **Step A — Rename file:**
  - `mv src/components/chat/CrystallizationSuggestion.tsx src/components/chat/NeurogenesisSuggestion.tsx`

  **Step B — Update `src/components/chat/NeurogenesisSuggestion.tsx`:**
  - Rename type `CrystallizationSuggestionProps` → `NeurogenesisSuggestionProps`
  - Rename component `CrystallizationSuggestion` → `NeurogenesisSuggestion`
  - Update UI text: 'Insight Crystallized' → 'Neuron Generated', 'added to your graph' → 'added to your neural network'
  - Update heading: 'Potential Crystal' → 'Potential Neuron' (line ~68)
  - Update button text: 'Crystallize Insight' → 'Generate Neuron' (line ~104)
  - Update processing text: 'Crystallizing...' → 'Generating...' (line ~101)
  - Update CSS class: `.crystallization-suggestion` → `.neurogenesis-suggestion` (lines 31, 45, 62)

  **Step C — Update `src/components/chat/ChatPanel.tsx` (HEAVY — has local type duplications):**
  - ⚠️ **CRITICAL: LOCAL TYPE RE-DECLARATIONS** (lines ~37-69 area):
    - These are DUPLICATE types that exist separately from chat.ts
    - Rename `CreatedCrystalResponse` → `CreatedNeuronResponse` (local copy)
    - Rename `EdgeUpsertResponse` → `SynapseUpsertResponse` (local copy)
    - Inside these: `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
    - Rename `SuggestionInput.related_crystals` → `related_neurons`
  - ⚠️ **CRITICAL: LOCAL `toGraphEdge()` function** (separate from useEdgeSuggestions.ts):
    - Update `edge.source_crystal_id` → `edge.source_neuron_id`
    - Update `edge.target_crystal_id` → `edge.target_neuron_id`
    - Update `type: 'crystalEdge'` → `type: 'synapseEdge'`
  - ⚠️ **CRITICAL: LOCAL `edgeSuggestionKey()` function**:
    - Update `suggestion.source_crystal_id` → `suggestion.source_neuron_id`
    - Update `suggestion.target_crystal_id` → `suggestion.target_neuron_id`
  - Update import: `CrystallizationSuggestion` → `NeurogenesisSuggestion` from new path
  - Update tool name detection: `toolName === 'suggest_crystallization'` → handle BOTH `'suggest_crystallization'` AND `'suggest_neurogenesis'` for backward compat with stored messages
  - Update fetch URL: `/api/crystals` → `/api/neurons` (POST for creation + edge/synapse creation)
  - Update response destructuring: `.crystal` → `.neuron`, `.edges` → `.synapses`, `.edge_suggestions` → `.synapse_suggestions`
  - Update all local vars: `createdCrystal` → `createdNeuron`, etc.
  - ⚠️ **NODE TYPE STRING**: `type: 'crystal'` → `type: 'neuron'` (where creating nodes for React Flow)

  **Step D — Update `src/components/chat/MessageList.tsx`:**
  - Update tool name detection for backward compat:
    - `toolName === 'suggest_crystallization'` → `toolName === 'suggest_neurogenesis' || toolName === 'suggest_crystallization'`
    - This ensures old messages with stored `suggest_crystallization` tool calls still render
  - Update import: `CrystallizationSuggestion` → `NeurogenesisSuggestion`
  - Update JSX: `<CrystallizationSuggestion` → `<NeurogenesisSuggestion`

  **Must NOT do**:
  - Do NOT consolidate the local toGraphEdge/edgeSuggestionKey with useEdgeSuggestions.ts versions — just rename
  - Do NOT remove backward compat for old tool name in MessageList

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 7, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 4, 5

  **References**:
  - `src/components/chat/CrystallizationSuggestion.tsx` — 118 lines. Rename component + UI text
  - `src/components/chat/ChatPanel.tsx` — HEAVY. Has LOCAL type declarations at lines ~37-69 that DUPLICATE chat.ts types. Also has local toGraphEdge() and edgeSuggestionKey(). This is the most complex rename target.
  - `src/components/chat/MessageList.tsx` — Tool name detection + component import
  - `src/types/chat.ts` (updated in Task 2) — New type names

  **Acceptance Criteria**:
  - [ ] File exists: NeurogenesisSuggestion.tsx. File does NOT exist: CrystallizationSuggestion.tsx
  - [ ] `grep -ric 'crystal' src/components/chat/` → 0 (except backward compat tool name detection)
  - [ ] MessageList handles BOTH 'suggest_crystallization' AND 'suggest_neurogenesis' tool names
  - [ ] ChatPanel local types use `source_neuron_id`/`target_neuron_id`
  - [ ] ChatPanel toGraphEdge uses `type: 'synapseEdge'`
  - [ ] ChatPanel fetches from `/api/neurons`

  **QA Scenarios:**
  ```
  Scenario: Chat components renamed with backward compat
    Tool: Bash
    Steps:
      1. Run: ls src/components/chat/
      2. Assert: Shows NeurogenesisSuggestion.tsx (not CrystallizationSuggestion.tsx)
      3. Run: grep 'suggest_crystallization' src/components/chat/MessageList.tsx
      4. Assert: STILL PRESENT (backward compat — old tool name detection kept)
      5. Run: grep 'suggest_neurogenesis' src/components/chat/MessageList.tsx
      6. Assert: PRESENT (new tool name also detected)
      7. Run: grep -c "type: 'synapseEdge'" src/components/chat/ChatPanel.tsx
      8. Assert: >= 1 (edge type string updated)
      9. Run: grep '/api/neurons' src/components/chat/ChatPanel.tsx
      10. Assert: matches found
    Expected Result: Clean chat layer with backward compat for tool name
    Evidence: .sisyphus/evidence/task-8-chat-components.txt
  ```

  **Commit**: YES (group with Tasks 7, 9)
  - Files: all files in `src/components/chat/`

- [ ] 9. Hooks + OnboardingTour + Remaining UI

  **What to do**:
  **Step A — Rename hook file:**
  - `mv src/hooks/useEdgeSuggestions.ts src/hooks/useSynapseSuggestions.ts`

  **Step B — Update `src/hooks/useSynapseSuggestions.ts`:**
  - Rename type `EdgeLike` → `SynapseLike`
  - Inside: `source_crystal_id` → `source_neuron_id`, `target_crystal_id` → `target_neuron_id`
  - Rename `toGraphEdge` → `toGraphSynapse`
  - Update `type: 'crystalEdge'` → `type: 'synapseEdge'` (line ~28)
  - Update `edge.source_crystal_id` → `edge.source_neuron_id` (line ~26)
  - Update `edge.target_crystal_id` → `edge.target_neuron_id` (line ~27)
  - Rename `edgeSuggestionKey` → `synapseSuggestionKey`
  - Update internal refs: `suggestion.source_crystal_id` → `suggestion.source_neuron_id`

  **Step C — Update `src/components/onboarding/OnboardingTour.tsx`:**
  - Update any 'crystal' text references in onboarding steps
  - Update any references to Crystal/Crystallize in user-facing strings

  **Step D — Update `src/components/ReviewBadge.tsx` (if crystal refs exist):**
  - Check and update any crystal-related text

  **Must NOT do**:
  - Do NOT consolidate hook with ChatPanel's duplicate implementation

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 7, 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Tasks 2, 4

  **References**:
  - `src/hooks/useEdgeSuggestions.ts` — 36 lines. Type rename + function rename + string updates
  - `src/components/onboarding/OnboardingTour.tsx` — Check for crystal text in tour steps
  - `src/components/ReviewBadge.tsx` — Check for crystal text

  **Acceptance Criteria**:
  - [ ] File exists: `useSynapseSuggestions.ts`. File does NOT exist: `useEdgeSuggestions.ts`
  - [ ] `grep -ric 'crystal' src/hooks/useSynapseSuggestions.ts` → 0
  - [ ] `grep -ric 'crystal' src/components/onboarding/` → 0
  - [ ] `toGraphSynapse` and `synapseSuggestionKey` exported from hook

  **QA Scenarios:**
  ```
  Scenario: Hooks and remaining UI crystal-free
    Tool: Bash
    Steps:
      1. Run: ls src/hooks/
      2. Assert: Shows useSynapseSuggestions.ts, useConversations.ts
      3. Assert: NO useEdgeSuggestions.ts
      4. Run: grep -ric 'crystal' src/hooks/ src/components/onboarding/ src/components/ReviewBadge.tsx
      5. Assert: 0 for all
    Expected Result: Clean hooks and remaining UI
    Evidence: .sisyphus/evidence/task-9-hooks-ui.txt
  ```

  **Commit**: YES (group with Tasks 7, 8)
  - Message: `refactor(ui): rename hooks and remaining Crystal UI to Neuron/Synapse`
  - Files: hook + onboarding + review badge

### WAVE 4 — Tests + Final Verification (Parallel: Tasks 10, 11)

- [ ] 10. Update ALL Test Files

  **What to do**:
  Update every test file that references crystal/Crystal/edge patterns:

  **Unit/Integration Tests:**
  - `src/lib/db/__tests__/queries.test.ts` — Update mock data, import names (`crystalQueries` → `neuronQueries`, `edgeQueries` → `synapseQueries`), table names in assertions
  - `src/lib/db/__tests__/queries.neighborhood.test.ts` — Same pattern
  - `src/lib/ai/__tests__/rag.test.ts` — Update Crystal mock data → Neuron, crystalQueries → neuronQueries
  - `src/lib/ai/__tests__/fsrs.test.ts` — Update Crystal type references → Neuron
  - `src/lib/ai/__tests__/tools.test.ts` — Update `crystallizationSchema` → `neurogenesisSchema`
  - `src/lib/ai/tools.test.ts` — DUPLICATE test file, same updates as above
  - `src/lib/ai/__tests__/prompts.test.ts` — Update assertion: `expect(CHAT_SYSTEM_PROMPT).toContain('suggest_neurogenesis')`
  - `src/lib/ai/rag-perf.test.ts` — Update crystal refs in performance test
  - `src/app/api/crystals/route.test.ts` — Move to `src/app/api/neurons/route.test.ts`, update all refs
  - `src/app/api/crystals/__tests__/route.test.ts` — Move to `src/app/api/neurons/__tests__/route.test.ts`, update all refs
  - `src/app/api/review/route.test.ts` — Update crystal refs
  - `src/hooks/__tests__/useEdgeSuggestions.test.ts` — Move to `useSynapseSuggestions.test.ts`, update imports + assertions
  - `src/stores/__tests__/graphStore.perf.test.ts` — Update any crystal refs in test data
  - `src/components/chat/ChatPanel.test.tsx` — Update crystal refs
  - `src/components/__tests__/` — Check for any crystal refs

  **Must NOT do**:
  - Do NOT change test logic, assertions patterns, or test coverage
  - Do NOT delete or consolidate duplicate test files

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Task 11)
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4, 5, 6, 7, 8, 9

  **References**:
  - All test files listed above — each needs import renames, mock data updates, assertion updates
  - Updated source files from Tasks 2-9 — new export names to match

  **Acceptance Criteria**:
  - [ ] `grep -rl 'crystal' src/ --include='*.test.*' --include='*.spec.*'` → empty (zero matches)
  - [ ] Test files under `src/app/api/crystals/` moved to `src/app/api/neurons/`
  - [ ] `npm test -- --run` → all tests pass, exit code 0

  **QA Scenarios:**
  ```
  Scenario: All tests pass with zero crystal references
    Tool: Bash
    Steps:
      1. Run: grep -rl 'crystal' src/ --include='*.test.*' --include='*.test.tsx'
      2. Assert: empty output (zero matches)
      3. Run: npm test -- --run 2>&1 | tail -20
      4. Assert: All tests pass, exit code 0
    Expected Result: Clean test suite
    Evidence: .sisyphus/evidence/task-10-tests.txt
  ```

  **Commit**: YES (group with Task 11)
  - Message: `test: update all test files for Neuron/Synapse domain rename`
  - Files: all test files

- [ ] 11. E2E Tests + Supporting Scripts

  **What to do**:
  **E2E Tests:**
  - `e2e/core-loop.spec.ts` — Update:
    - API URLs: `/api/crystals` → `/api/neurons`
    - Selectors: `.crystallization-suggestion` → `.neurogenesis-suggestion`
    - Any 'Crystal'/'crystal' text assertions
  - `e2e/utils.ts` — Update any crystal helper functions

  **Supporting Scripts:**
  - `src/lib/db/seed.ts` — Update `.from('crystals')` → `.from('neurons')`, `.from('crystal_edges')` → `.from('synapses')`, update `source_crystal_id`/`target_crystal_id` → `source_neuron_id`/`target_neuron_id`
  - `src/lib/db/verify-setup.ts` — Update table name checks (`crystals` → `neurons`, `crystal_edges` → `synapses`), RPC function name checks
  - `src/lib/db/performance-spike.ts` — Update table references and Crystal type imports
  - `src/lib/db/benchmark-rag.ts` — Update Crystal refs and query imports
  - `src/lib/db/README.md` — Update all documentation references (table names, query examples, function names)

  **Must NOT do**:
  - Do NOT change E2E test flow or assertions logic
  - Do NOT change seed data structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Task 10)
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4, 7, 9

  **References**:
  - `e2e/core-loop.spec.ts` — E2E flow test with API URLs and selectors
  - `e2e/utils.ts` — E2E utilities
  - `src/lib/db/seed.ts` — Seed script with table refs
  - `src/lib/db/verify-setup.ts` — DB verification with table/function names
  - `src/lib/db/performance-spike.ts` — Performance test
  - `src/lib/db/benchmark-rag.ts` — RAG benchmark
  - `src/lib/db/README.md` — DB documentation

  **Acceptance Criteria**:
  - [ ] `grep -ric 'crystal' e2e/` → 0
  - [ ] `grep -ric 'crystal' src/lib/db/seed.ts src/lib/db/verify-setup.ts src/lib/db/performance-spike.ts src/lib/db/benchmark-rag.ts` → 0
  - [ ] `src/lib/db/README.md` references `neurons` and `synapses` tables
  - [ ] `npm run build` → exit code 0

  **QA Scenarios:**
  ```
  Scenario: Full project crystal-free verification
    Tool: Bash
    Steps:
      1. Run: grep -rl 'crystal' src/ --include='*.ts' --include='*.tsx' | grep -v node_modules
      2. Assert: empty output (ZERO matches in entire src/)
      3. Run: grep -rl 'crystal' e2e/
      4. Assert: empty output
      5. Run: npx tsc --noEmit
      6. Assert: exit code 0
      7. Run: npm test -- --run
      8. Assert: all tests pass
      9. Run: npm run build
      10. Assert: exit code 0
    Expected Result: Entire codebase is crystal-free and builds/tests pass
    Evidence: .sisyphus/evidence/task-11-final-verification.txt

  Scenario: README documentation updated
    Tool: Bash
    Steps:
      1. Run: grep -c 'neurons' src/lib/db/README.md
      2. Assert: > 0
      3. Run: grep -c 'crystal' src/lib/db/README.md
      4. Assert: 0
    Expected Result: Documentation reflects new naming
    Evidence: .sisyphus/evidence/task-11-readme.txt
  ```

  **Commit**: YES (group with Task 10)
  - Message: `test: update E2E tests and DB scripts for Neuron/Synapse rename`
  - Files: e2e/ + src/lib/db/ scripts + README

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npm test -- --run` + `npm run build`. Review all changed files for: leftover "crystal" strings, `as any` added during rename, empty catches, console.log in prod, commented-out code. Verify NO behavioral changes — only renames.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Crystal Refs [N remaining] | VERDICT`

- [ ] F3. **Real QA — Playwright** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Run full E2E: login → chat → neurogenesis suggestion → confirm → verify node appears in graph → review flow. Verify UI shows "Neuron" not "Crystal" everywhere. Screenshot evidence.
  Output: `E2E [PASS/FAIL] | UI Text [PASS/FAIL] | Screenshots [N captured] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Flag any behavioral changes disguised as renames.
  Output: `Tasks [N/N compliant] | Scope Creep [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **After Wave 1**: `refactor(db): add 010_baseline_v2_reset migration and rename types to Neuron/Synapse` — migration file + types + queries
- **After Wave 2**: `refactor(api): move crystal routes to /api/neurons/ and update AI layer` — API routes + AI layer + review
- **After Wave 3**: `refactor(ui): rename graph/chat components from Crystal to Neuron` — components + hooks
- **After Wave 4**: `test: update all test files for Neuron/Synapse domain rename` — tests + e2e + scripts
- **Final**: `chore: Epic 0 complete — Crystal→Neuron domain rename` — any remaining cleanup

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit                    # Expected: exit 0, zero errors
npm test -- --run                    # Expected: all tests pass
npm run build                        # Expected: exit 0, build succeeds
grep -r "crystal" src/ --include="*.ts" --include="*.tsx" -l  # Expected: empty (zero matches)
grep -r "crystal" e2e/ -l           # Expected: empty (zero matches)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Zero "crystal" string references in source code
- [ ] API endpoints respond at `/api/neurons/` paths
- [ ] UI displays "Neuron"/"Synapse" terminology throughout
