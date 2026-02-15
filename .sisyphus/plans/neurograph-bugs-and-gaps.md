# NeuroGraph — Bugs & Spec Gaps Fix

## TL;DR

> **Quick Summary**: Fix 4 correctness bugs and close 8 spec gaps identified in the deep code review, bringing the MVP to full spec compliance. Also adds conversation and crystal deletion for usability.
>
> **Deliverables**:
> - Fixed FSRS crystal initialization (retrievability was 0 → now 1.0 for new cards)
> - Server-side review filtering with FSRS-computed interval previews on rating buttons
> - Dagre auto-layout for the knowledge graph (replaces rigid grid)
> - 5-state decay visualization with animations and hover tooltips (spec section 6.7.1)
> - Markdown rendering in AI chat messages (react-markdown + syntax highlighting)
> - "Review (N due)" badge in app header
> - Conversation deletion and crystal deletion APIs + UI
> - Dead code cleanup + stricter chat validation
>
> **Estimated Effort**: Medium (7 tasks)
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 6

---

## Context

### Origin
This plan was generated from a comprehensive deep code review (`.sisyphus/drafts/deep-review.md`) that audited all 38 source files against the original specifications (`specifications.md`) and the MVP plan (`.sisyphus/plans/neurograph-mvp.md`). The review identified 4 bugs, 10 spec divergences, and 10 creative evolution proposals.

### Scope Decisions (from interview)
| Item | Decision | Rationale |
|------|----------|-----------|
| Bugs (BUG-1 through BUG-4) | **ALL IN** | Correctness issues |
| Spec gaps (10 identified) | **8 IN, 2 OUT** | Closing MVP spec compliance |
| GAP-2: Fly-to-graph animation | **OUT** | Visual polish, deferred |
| GAP-9: Multi-provider embeddings | **OUT** | Keep OpenAI, document requirement |
| GAP-6: Conversation deletion | **IN** | User confirmed — usability need |
| Test infrastructure (Tasks 12-13) | **OUT** | Deferred to separate round |
| Creative evolutions (10 proposals) | **OUT** | Separate planning session |

---

## Work Objectives

### Core Objective
Fix all known bugs and close spec divergences so the MVP matches the original specification and works correctly end-to-end, particularly around FSRS values, review flow, graph layout, and decay visualization.

### Concrete Deliverables
- Crystal creation sets `retrievability: 1.0` with proper `calculateRetrievability()` guard for stability === 0
- GET `/api/review` endpoint using existing `getDueForReview()` server-side query
- Review rating buttons show FSRS-computed intervals via `scheduler.repeat()` preview
- Review page has back navigation to main app
- Graph uses dagre automatic layout (replaces `index % 4 * 220` grid)
- CrystalNode has 5 visual states matching spec section 6.7.1 (Fresh/Stable/Fading/Decaying/Critical)
- Assistant messages render markdown with syntax-highlighted code blocks
- App header shows "Review (N due)" badge linking to review page
- DELETE `/api/conversations/[id]` with UI button in sidebar
- DELETE `/api/crystals/[id]` with cascade edge deletion
- `graphStore` has `updateNode`, `removeNode`, `removeEdge` operations
- Dead code removed (`createMiddlewareClient`), chat validation tightened
- SQL fixup script for existing crystals with `retrievability: 0`

### Definition of Done
- [ ] `npm run build` passes with 0 errors after all changes
- [ ] New crystals show as "Fresh" (cyan glow) on graph immediately after creation
- [ ] Review page loads only due crystals, shows FSRS-computed intervals, has back nav
- [ ] Graph auto-layouts with dagre — nodes don't overlap, edges are visible
- [ ] Decaying crystals show correct visual state (amber/red) with tooltip
- [ ] AI messages render markdown (code blocks, bold, lists, headers)
- [ ] Header shows due crystal count with link to review
- [ ] Conversations and crystals can be deleted

### Must Have
- All 4 bugs fixed (BUG-1 through BUG-4)
- All 8 in-scope spec gaps closed
- `npm run build` passes after every task
- No regression to existing working features

### Must NOT Have (Guardrails)
- **No ChatPanel.tsx refactoring** — it's a god component (636 lines) but functional. Decomposition is a separate effort.
- **No layout split changes** — keep 35% chat / 65% graph as-is
- **No FSRS engine changes** — `src/lib/ai/fsrs.ts` is correctly implemented. Only fix initial values and add guards.
- **No crystal editing UI** — even with deletion, no editing. AI generates, user accepts or deletes.
- **No graph detail panel on click** — `selectedNodeId` exists but detail panel is an evolution, not a gap.
- **No graph minimap, search, or filtering** — per MVP guardrails
- **No new npm dependencies beyond**: `@dagrejs/dagre`, `react-markdown`, `rehype-highlight` (or `remark-gfm`)
- **No fly-to-graph animation** — deferred by user decision
- **No changes to embedding model** — keep OpenAI `text-embedding-3-small`

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks are verified by running commands or using tools.
> No human testing required.

### Test Decision
- **Infrastructure exists**: NO (only 1 Playwright auth test, no unit tests)
- **Automated tests**: NO (deferred to separate round)
- **Agent-Executed QA**: YES — PRIMARY verification method for all tasks

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)
Every task includes Playwright or Bash (curl) verification scenarios.
QA scenarios are the PRIMARY and ONLY verification method.
All evidence captured to `.sisyphus/evidence/`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — all independent):
├── Task 1: Critical Bug Fixes (BUG-1, BUG-4, GAP-7)
├── Task 3: Dagre Graph Layout (GAP-1)
├── Task 5: Markdown Rendering (GAP-5)
└── Task 7: Conversation & Crystal Deletion (GAP-6, GAP-8)

Wave 2 (After Wave 1):
├── Task 2: Review System Overhaul (BUG-2, BUG-3, GAP-10)
└── Task 4: Decay Visualization Enhancement (GAP-4)

Wave 3 (After Task 2):
└── Task 6: Header Review Badge (GAP-3)

Critical Path: Task 1 → Task 2 → Task 6
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 4 | 3, 5, 7 |
| 2 | 1 | 6 | 4 |
| 3 | None | None | 1, 5, 7 |
| 4 | 1 | None | 2 |
| 5 | None | None | 1, 3, 7 |
| 6 | 2 | None | None |
| 7 | None | None | 1, 3, 5 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Categories |
|------|-------|----------------------|
| 1 | 1, 3, 5, 7 | quick, unspecified-high, quick, unspecified-low (parallel) |
| 2 | 2, 4 | unspecified-high, visual-engineering (parallel) |
| 3 | 6 | quick |

---

## TODOs

- [x] 1. Critical Bug Fixes (BUG-1, BUG-4, GAP-7)

  **What to do**:
  - **BUG-1 — Fix crystal FSRS initialization** in `src/app/api/crystals/route.ts`:
    - Change line 129: `retrievability: 0` → `retrievability: 1.0`
    - Note: `stability: 0` and `difficulty: 0` are CORRECT for ts-fsrs New cards. The first `scheduler.repeat()` call transitions them to proper values. Do NOT change these.
    - Add retrievability guard in `src/lib/ai/fsrs.ts` `calculateRetrievability()`: if `stability === 0` (New card), return `1.0` immediately instead of dividing by zero.
    - Create SQL fixup script at `src/lib/db/migrations/003_fix_retrievability.sql`:
      ```sql
      UPDATE crystals SET retrievability = 1.0 WHERE state = 'New' AND retrievability = 0;
      ```
  - **BUG-4 — Fix chat message validation** in `src/app/api/chat/route.ts`:
    - Replace `messages: z.array(z.any()).min(1)` at line 80 with a proper schema:
      ```typescript
      messages: z.array(z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.union([z.string(), z.array(z.any())]),
      }).passthrough()).min(1)
      ```
    - Use `.passthrough()` to allow Vercel AI SDK's additional fields without breaking
  - **GAP-7 — Remove dead code** in `src/lib/auth/supabase.ts`:
    - Delete the `createMiddlewareClient()` function (lines 58-83) which is never used
    - `src/middleware.ts` builds its own inline Supabase client
  - **GAP-9 — Document embedding requirement**:
    - Add a comment in `src/lib/ai/embeddings.ts` explaining that OpenAI API key is always required for embeddings regardless of `AI_PROVIDER` setting
    - Update `.env.example` with clear note: `OPENAI_API_KEY` is required for embeddings even when using Anthropic/Google for chat

  **Must NOT do**:
  - Do NOT change `stability: 0` or `difficulty: 0` initial values — these are correct per ts-fsrs convention for New cards
  - Do NOT modify `src/lib/ai/fsrs.ts` beyond adding the stability === 0 guard
  - Do NOT change the Zod schema to reject unknown fields — Vercel AI SDK sends extra fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Four independent small fixes across different files. No architectural decisions. Clear before/after.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work in this task
    - `playwright`: Not needed for code fixes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 5, 7)
  - **Blocks**: Tasks 2, 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/app/api/crystals/route.ts:114-133` — Crystal creation code. Line 129 has `retrievability: 0` (the bug). Lines 122-128 show stability/difficulty/state/reps/lapses which are CORRECT at 0 for New cards.
  - `src/lib/ai/fsrs.ts:45-55` — `calculateRetrievability()` function. Line 49 divides by `card.stability` which produces NaN when stability === 0. Add guard: `if (card.stability === 0) return 1.0;` before the calculation.
  - `src/app/api/chat/route.ts:78-82` — Zod validation schema. Line 80 has `messages: z.array(z.any()).min(1)`.
  - `src/lib/auth/supabase.ts:58-83` — Dead `createMiddlewareClient()` function. The real middleware client is built inline in `src/middleware.ts:10-25`.
  - `src/lib/ai/embeddings.ts:1-15` — Hardcoded OpenAI embedding model at line 6.

  **API/Type References**:
  - `src/types/chat.ts` — UIMessage type definition that the Zod schema should align with

  **Documentation References**:
  - `specifications.md:238-243` — FSRS integration: `createEmptyCard()` returns stability:0, difficulty:0 for New cards. This is correct.
  - `specifications.md:277-283` — `calculateRetrievability()` spec: must handle state === New by returning 1.0

  **External References**:
  - ts-fsrs createEmptyCard: https://github.com/open-spaced-repetition/ts-fsrs — Source confirms stability:0 for New cards

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: New crystal has retrievability 1.0
    Tool: Bash (curl)
    Preconditions: Dev server running, authenticated session
    Steps:
      1. POST /api/crystals with valid crystal data (title, definition, etc.)
      2. Parse response JSON
      3. Assert: response.crystal.retrievability === 1.0
      4. Assert: response.crystal.stability === 0 (correct for New)
      5. Assert: response.crystal.state === 'New'
    Expected Result: New crystal created with R=1.0
    Evidence: Response body captured

  Scenario: calculateRetrievability handles stability=0
    Tool: Bash (node REPL)
    Steps:
      1. Import calculateRetrievability from fsrs.ts
      2. Call with card { stability: 0, state: 'New', last_review: null }
      3. Assert: returns 1.0 (not NaN, not Infinity)
    Expected Result: Guard prevents division by zero
    Evidence: REPL output

  Scenario: Chat API rejects truly malformed messages
    Tool: Bash (curl)
    Steps:
      1. POST /api/chat with messages: [{"bad": "data"}]
      2. Assert: HTTP 400 (validation failure)
      3. POST /api/chat with messages: [{"id":"1","role":"user","content":"hello"}]
      4. Assert: HTTP 200 or streaming response (valid message accepted)
    Expected Result: Validation rejects bad payloads, accepts good ones
    Evidence: Response status codes

  Scenario: Build passes after all fixes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No TypeScript or build errors introduced
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `fix(core): correct crystal retrievability init, tighten chat validation, remove dead code`
  - Files: `src/app/api/crystals/route.ts`, `src/lib/ai/fsrs.ts`, `src/app/api/chat/route.ts`, `src/lib/auth/supabase.ts`, `src/lib/ai/embeddings.ts`, `src/lib/db/migrations/003_fix_retrievability.sql`, `.env.example`
  - Pre-commit: `npm run build`

---

- [x] 2. Review System Overhaul (BUG-2, BUG-3, GAP-10)

  **What to do**:
  - **BUG-2 — Server-side review filtering**:
    - Create `GET /api/review` endpoint in `src/app/api/review/route.ts` (or modify existing):
      - Use `crystalQueries.getDueForReview(userId)` which already exists in `src/lib/db/queries.ts:66-78`
      - Returns only crystals where `next_review_due <= NOW()` — no embeddings needed in response
      - Remove embedding field from response to reduce payload size
    - Update `src/app/app/review/page.tsx`:
      - Replace `fetch('/api/crystals')` + client-side filter with `fetch('/api/review')`
      - Remove the `allCrystals.filter(c => new Date(c.next_review_due) <= now)` client-side logic
  - **BUG-3 — FSRS-computed interval previews**:
    - In review page, before rendering rating buttons, call `scheduler.repeat(card, now)` to get the preview for all 4 ratings
    - This can be done either:
      - **Server-side** (recommended): Add interval preview to GET `/api/review` response — for each due crystal, include `previews: { again: "10m", hard: "1d", good: "3d", easy: "7d" }` with human-readable interval strings
      - **Client-side**: Import FSRS scheduler in the review page component and compute locally
    - Replace the hardcoded interval labels (`"1m"`, `"2d"`, `"4d"`, `"7d"`) at lines 159-174 with dynamic values
    - Format intervals as human-readable: "10m", "1d", "3d 2h", "2w", etc.
  - **GAP-10 — Review page navigation**:
    - Add a header bar to the review page with:
      - Back arrow/link to `/app` (main graph+chat view)
      - "NeuroGraph" logo (matching main app header)
      - Progress indicator ("3 of 12 reviewed")
    - Style consistent with the Dark Neural theme from `src/app/(app)/layout.tsx`

  **Must NOT do**:
  - Do NOT modify `src/lib/ai/fsrs.ts` — it's correct
  - Do NOT add pagination to review API (cap at 20 per session is already in review page)
  - Do NOT change the review rating submission logic (POST /api/review already works)
  - Do NOT add keyboard shortcuts or swipe gestures to review page

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Touches API route, database query integration, FSRS scheduler preview computation, and review page UI. Medium complexity with multiple interconnected changes.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Review page navigation bar needs Dark Neural theme consistency
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/app/app/review/page.tsx:25-43` — Current client-side fetching logic to replace. Line 28: `fetch('/api/crystals')`. Lines 32-33: client-side date filter.
  - `src/app/app/review/page.tsx:159-174` — Hardcoded interval labels on rating buttons. The button labels "1m", "2d", "4d", "7d" must be replaced with FSRS-computed values.
  - `src/lib/db/queries.ts:66-78` — `getDueForReview(userId, limit)` — existing server-side query that filters by `next_review_due <= NOW()`. This should be used by the new GET /api/review endpoint.
  - `src/app/api/review/route.ts` — Existing review API. Currently only has POST (submit rating). Add GET handler for fetching due crystals.
  - `src/lib/ai/fsrs.ts:8-20` — FSRS scheduler initialization. Use `scheduler.repeat(card, now)` to preview all 4 rating outcomes. Returns `Record<Rating, { card: Card, log: ReviewLog }>`.
  - `src/app/(app)/layout.tsx:39-57` — Main app header styling to match for review page header bar.

  **External References**:
  - ts-fsrs scheduler.repeat: https://github.com/open-spaced-repetition/ts-fsrs — `repeat()` returns a Record mapping each Rating to the resulting Card state, including the new `due` date and `scheduled_days`.

  **WHY Each Reference Matters**:
  - `review/page.tsx:25-43` shows exact code to replace (the client-side fetch + filter)
  - `queries.ts:66-78` shows the server-side query that already exists but is unused
  - `fsrs.ts:8-20` shows how to get the scheduler instance for interval preview
  - `layout.tsx:39-57` provides the header design pattern to replicate on review page

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: GET /api/review returns only due crystals
    Tool: Bash (curl)
    Preconditions: User has crystals, some with next_review_due in the past
    Steps:
      1. GET /api/review with auth cookie
      2. Assert: HTTP 200
      3. Assert: response.crystals is an array
      4. Assert: all returned crystals have next_review_due <= now
      5. Assert: response does NOT include embedding vectors (payload optimization)
    Expected Result: Server-side filtering works, no unnecessary data
    Evidence: Response body

  Scenario: Rating buttons show FSRS-computed intervals
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user has 1+ due crystals
    Steps:
      1. Navigate to http://localhost:3000/app/review
      2. Wait for review card visible (timeout: 10s)
      3. Find the 4 rating buttons (Again, Hard, Good, Easy)
      4. Assert: each button shows an interval label (not "1m", "2d", "4d", "7d" static values)
      5. Assert: Easy interval >= Good interval >= Hard interval (logical ordering)
      6. Screenshot: .sisyphus/evidence/task-2-computed-intervals.png
    Expected Result: Dynamic FSRS intervals shown on buttons
    Evidence: .sisyphus/evidence/task-2-computed-intervals.png

  Scenario: Review page has back navigation
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to http://localhost:3000/app/review
      2. Assert: back link/button visible (pointing to /app)
      3. Click back link
      4. Wait for navigation (timeout: 5s)
      5. Assert: URL is /app (main split view)
    Expected Result: User can navigate back to main app
    Evidence: Navigation assertion

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No build errors
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `fix(review): use server-side filtering, show FSRS-computed intervals, add navigation`
  - Files: `src/app/api/review/route.ts`, `src/app/app/review/page.tsx`
  - Pre-commit: `npm run build`

---

- [x] 3. Dagre Graph Layout (GAP-1)

  **What to do**:
  - Install dagre: `npm install @dagrejs/dagre` (or `dagre` — check which works with @xyflow/react v12)
  - Update `src/components/graph/GraphPanel.tsx`:
    - Replace the rigid grid positioning (lines 58-61: `x: 120 + (index % 4) * 220, y: 100 + Math.floor(index / 4) * 140`) with dagre automatic layout
    - Create a `getLayoutedElements(nodes, edges)` function that:
      1. Creates a dagre graph with `rankdir: 'TB'` (top-to-bottom — shows prerequisite hierarchy naturally)
      2. Sets node dimensions (estimate ~200px width, ~80px height based on CrystalNode)
      3. Adds all nodes and edges to the dagre graph
      4. Calls `dagre.layout()`
      5. Maps dagre positions back to React Flow node positions
    - Apply layout on initial load and whenever nodes/edges change (crystallization, deletion)
    - Handle edge case: 0 edges — dagre should still position nodes in a reasonable arrangement
    - Handle edge case: single node — center it
  - Update `src/components/chat/ChatPanel.tsx`:
    - Remove the duplicated position calculation at lines 397-399 (the `x: 120 + (index % 4) * 220` formula)
    - When adding a new node via crystallization, set a temporary position (dagre will recompute on next render)
    - OR: don't set position at all — let the graph store trigger a dagre re-layout
  - After dagre layout, call `reactFlowInstance.fitView()` to center the graph

  **Must NOT do**:
  - No custom force-directed physics — dagre only
  - No ElkJS (more complex than needed)
  - No domain clustering or color grouping (that's an evolution proposal)
  - No layout direction toggle (hardcode TB)
  - No animation between layout transitions (just snap to new positions)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires understanding React Flow node positioning model, dagre API, and coordinating between GraphPanel and ChatPanel. The dagre integration pattern is well-documented but needs careful adaptation.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Graph layout is visual engineering — node spacing, proportions, visual hierarchy
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 5, 7)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/components/graph/GraphPanel.tsx:50-70` — Current node mapping with grid positioning at lines 58-61. This is the code to replace with dagre.
  - `src/components/graph/GraphPanel.tsx:75-95` — Current edge mapping. Edges are already in the correct format for React Flow — dagre only changes node positions.
  - `src/components/chat/ChatPanel.tsx:395-400` — Duplicated position calculation for new crystal nodes. Remove this or make it a temporary position.
  - `src/components/graph/CrystalNode.tsx` — Custom node component. Its rendered size (~200×80px) determines dagre node dimensions.
  - `src/stores/graphStore.ts` — Graph state. `setGraph()` sets both nodes and edges. After dagre layout, call `setGraph()` with layouted positions.

  **External References**:
  - React Flow dagre layout example: https://reactflow.dev/examples/layout/dagre — Official example showing the exact integration pattern: dagre graph setup, node/edge mapping, fitView. This is the primary reference.
  - @dagrejs/dagre npm: https://www.npmjs.com/package/@dagrejs/dagre — ES module fork of dagre, compatible with modern bundlers.

  **WHY Each Reference Matters**:
  - The React Flow dagre example at reactflow.dev is THE canonical pattern — copy it directly and adapt
  - GraphPanel lines 58-61 show exactly what to replace
  - ChatPanel lines 395-400 show the duplicated logic that becomes unnecessary

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Graph uses dagre layout instead of grid
    Tool: Playwright (playwright skill)
    Preconditions: User has 5+ crystals with edges between them
    Steps:
      1. Navigate to http://localhost:3000/app
      2. Wait for .react-flow element visible (timeout: 10s)
      3. Get positions of all crystal nodes
      4. Assert: nodes are NOT in a rigid grid pattern (y values vary, not just multiples of 140)
      5. Assert: connected nodes are positioned near each other (dagre respects edge topology)
      6. Assert: no nodes overlap (dagre spaces them)
      7. Screenshot: .sisyphus/evidence/task-3-dagre-layout.png
    Expected Result: Graph shows topology-aware layout, not a spreadsheet grid
    Evidence: .sisyphus/evidence/task-3-dagre-layout.png

  Scenario: Graph re-layouts after new crystal
    Tool: Playwright (playwright skill)
    Steps:
      1. Note current node positions on graph
      2. Crystallize a new insight from chat
      3. Wait for new node to appear (timeout: 10s)
      4. Assert: new node is visible (not at 0,0 or offscreen)
      5. Assert: graph has re-layouted (fitView applied)
      6. Screenshot: .sisyphus/evidence/task-3-relayout.png
    Expected Result: New crystal integrates into dagre layout
    Evidence: .sisyphus/evidence/task-3-relayout.png

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No build errors
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(graph): replace grid layout with dagre automatic positioning`
  - Files: `src/components/graph/GraphPanel.tsx`, `src/components/chat/ChatPanel.tsx`, `package.json`
  - Pre-commit: `npm run build`

---

- [x] 4. Decay Visualization Enhancement (GAP-4)

  **What to do**:
  - Expand `src/components/graph/CrystalNode.tsx` from 3 visual states to 5, matching spec section 6.7.1:
    - **Fresh** (R > 0.9): Bright cyan glow, fully opaque, `animate-pulse-cyan` (existing)
    - **Stable** (R 0.7–0.9): Normal brightness, no glow, solid cyan border
    - **Fading** (R 0.5–0.7): Slightly dimmed, amber/yellow tint, reduced opacity
    - **Decaying** (R 0.3–0.5): Noticeably dim, amber/orange, subtle trembling animation (CSS `@keyframes tremble`)
    - **Critical** (R < 0.3): Dark red tint, pulsing animation (CSS `@keyframes pulse-red`), bold visual warning
  - Current thresholds (lines 12-40): `< 0.45` (amber), `> 0.85` (cyan), middle (purple). Replace with the 5-tier system above.
  - Add CSS animations to `src/app/globals.css` (or Tailwind config):
    - `@keyframes tremble` — small random displacement, 0.3s cycle, subtle
    - `@keyframes pulse-red` — opacity 0.6↔1.0, 1.5s cycle, attention-grabbing
  - Add hover tooltip showing:
    - "Retrievability: XX%" (exact percentage)
    - "Last reviewed: N days ago" (or "Never reviewed" for New cards)
    - "Review recommended" for Critical state
    - Use a simple CSS tooltip (no library needed) or `title` attribute
  - Add `updateNode` operation to `src/stores/graphStore.ts`:
    - `updateNode(id: string, data: Partial<NodeData>)` — updates a single node's data without replacing the entire graph
    - Used for: updating retrievability values on timer, reflecting review results
  - Add periodic retrievability recalculation:
    - In GraphPanel or a parent component, set `setInterval` every 5 minutes to recalculate R for all visible nodes
    - Call `calculateRetrievability()` for each crystal and update node data via `updateNode()`
  - Update edge styling: edges connected to Critical (R < 0.3) crystals should also dim/fade

  **Must NOT do**:
  - No hard blocking — decay is visual only, never prevents interaction
  - No notification popups for decayed crystals
  - No custom decay curves — use `calculateRetrievability()` from fsrs.ts
  - No visual legend explaining color states (keep it intuitive)
  - No Framer Motion for trembling/pulsing — CSS animations are sufficient and lighter

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Pure visual implementation — CSS animations, color gradients, hover states, dynamic styling based on data. Core competency of visual-engineering.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Color design, animation timing, visual hierarchy, Dark Neural theme consistency
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: None
  - **Blocked By**: Task 1 (needs correct retrievability values for meaningful visualization)

  **References**:

  **Pattern References**:
  - `src/components/graph/CrystalNode.tsx:12-40` — Current 3-state decay logic. Lines 14-22 define amber (R < 0.45) and cyan (R > 0.85) states. This entire block needs replacement with 5 states.
  - `src/components/graph/CrystalNode.tsx:24-55` — Current node rendering. The `className` and `style` sections need conditional classes based on the 5-state system.
  - `src/app/globals.css` — Contains existing `@keyframes pulse-cyan`. Add `tremble` and `pulse-red` animations here.
  - `src/lib/ai/fsrs.ts:45-55` — `calculateRetrievability()` function. Call this for each crystal to determine visual state.
  - `src/stores/graphStore.ts:4-12` — Current store operations. Add `updateNode` here.

  **Documentation References**:
  - `specifications.md:296-301` — The authoritative definition of the 5 decay states:
    - Fresh (R > 0.9): Cyan glow, full opacity
    - Stable (R 0.7–0.9): Normal brightness
    - Fading (R 0.5–0.7): Amber, slightly faded
    - Decaying (R 0.3–0.5): Amber/orange, trembling animation
    - Critical (R < 0.3): Red, pulsing, "Review recommended" tooltip

  **External References**:
  - CSS @keyframes: https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Fresh crystal shows cyan glow
    Tool: Playwright (playwright skill)
    Preconditions: User has a crystal reviewed today (R ≈ 1.0)
    Steps:
      1. Navigate to http://localhost:3000/app
      2. Wait for graph panel visible
      3. Find the fresh crystal node
      4. Assert: node has cyan-tinted border/glow
      5. Assert: node is fully opaque
      6. Hover over node → Assert tooltip shows "Retrievability: ~100%"
      7. Screenshot: .sisyphus/evidence/task-4-fresh-node.png
    Expected Result: Fresh crystal is visually prominent with cyan glow
    Evidence: .sisyphus/evidence/task-4-fresh-node.png

  Scenario: Critical crystal shows red pulsing
    Tool: Playwright (playwright skill)
    Preconditions: Crystal with last_review far in the past (R < 0.3). Can create this by directly updating DB: UPDATE crystals SET last_review = NOW() - INTERVAL '90 days', stability = 5 WHERE id = 'xxx'
    Steps:
      1. Navigate to graph view
      2. Find the critical crystal node
      3. Assert: node has red/dark red tint
      4. Assert: node has CSS animation (check computed animation-name)
      5. Hover over node → Assert tooltip contains "Review recommended"
      6. Screenshot: .sisyphus/evidence/task-4-critical-node.png
    Expected Result: Critical state is visually alarming
    Evidence: .sisyphus/evidence/task-4-critical-node.png

  Scenario: Five distinct visual states visible
    Tool: Playwright (playwright skill)
    Preconditions: Set up crystals at R ≈ 1.0, 0.8, 0.6, 0.4, 0.2 via direct DB manipulation
    Steps:
      1. Navigate to graph view
      2. Screenshot all 5 crystals
      3. Assert: each has a visually distinct appearance (different colors/opacity/animation)
      4. Screenshot: .sisyphus/evidence/task-4-five-states.png
    Expected Result: All 5 spec states are visually distinguishable
    Evidence: .sisyphus/evidence/task-4-five-states.png

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No build errors
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(decay): expand decay visualization to 5 states with animations and tooltips`
  - Files: `src/components/graph/CrystalNode.tsx`, `src/app/globals.css`, `src/stores/graphStore.ts`
  - Pre-commit: `npm run build`

---

- [x] 5. Markdown Rendering in Chat Messages (GAP-5)

  **What to do**:
  - Install markdown dependencies: `npm install react-markdown rehype-highlight`
    - `react-markdown`: Renders markdown as React components
    - `rehype-highlight`: Adds syntax highlighting to code blocks
    - Optionally: `remark-gfm` for GitHub Flavored Markdown (tables, strikethrough, task lists)
  - Update `src/components/chat/MessageList.tsx`:
    - Replace `{part.text}` at line 49 with a `<ReactMarkdown>` component
    - Only apply markdown rendering to **assistant** messages (user messages stay as plain text)
    - Configure plugins: `remarkPlugins={[remarkGfm]}` and `rehypePlugins={[rehypeHighlight]}`
  - Style markdown output for Dark Neural theme:
    - Code blocks: dark background (#1a1a2e or similar), monospace font, slight border
    - Inline code: subtle background highlight
    - Headers: slightly larger, proper spacing
    - Lists: proper indentation
    - Links: cyan color to match theme
    - Tables: bordered, alternating row colors
    - Add styles in `src/app/globals.css` or as a scoped CSS module
  - Handle edge cases:
    - Very long code blocks: add horizontal scroll, max-height with overflow
    - Nested markdown: ensure proper rendering
    - Raw HTML in markdown: sanitize (react-markdown does this by default)

  **Must NOT do**:
  - No KaTeX/math rendering (post-MVP)
  - No Mermaid diagram rendering
  - No custom markdown extensions
  - No copy-to-clipboard button on code blocks (nice-to-have, not now)
  - No markdown rendering for user messages (only assistant)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-documented library integration. Install, configure, style. No complex logic.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Markdown styling for Dark Neural theme requires design sensibility
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 7)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/components/chat/MessageList.tsx:45-55` — Current message rendering. Line 49 renders `{part.text}` as plain text. Wrap assistant message text parts with `<ReactMarkdown>`.
  - `src/components/chat/MessageList.tsx:30-42` — Message role check. Use `message.role === 'assistant'` to conditionally apply markdown rendering.
  - `src/app/globals.css` — Global styles. Add markdown-specific styles here (code blocks, headers, lists for dark theme).

  **External References**:
  - react-markdown: https://github.com/remarkjs/react-markdown — Usage, component override API, plugin system
  - rehype-highlight: https://github.com/rehypejs/rehype-highlight — Syntax highlighting plugin
  - remark-gfm: https://github.com/remarkjs/remark-gfm — GitHub Flavored Markdown support
  - highlight.js dark themes: https://github.com/highlightjs/highlight.js/tree/main/src/styles — Pick a dark theme CSS (e.g., `atom-one-dark` or `github-dark`)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Code blocks render with syntax highlighting
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, authenticated
    Steps:
      1. Navigate to http://localhost:3000/app
      2. Send message: "Show me a Python function that calculates fibonacci numbers"
      3. Wait for assistant response (timeout: 30s)
      4. Assert: response contains a <pre><code> element (code block rendered)
      5. Assert: code block has syntax highlighting (colored tokens, not plain monospace)
      6. Assert: code block has dark background
      7. Screenshot: .sisyphus/evidence/task-5-code-block.png
    Expected Result: Code blocks are syntax-highlighted in dark theme
    Evidence: .sisyphus/evidence/task-5-code-block.png

  Scenario: Bold and lists render correctly
    Tool: Playwright (playwright skill)
    Steps:
      1. Send message: "Give me 3 key principles of object-oriented programming with bold headers"
      2. Wait for assistant response (timeout: 30s)
      3. Assert: response contains <strong> elements (bold)
      4. Assert: response contains <ul> or <ol> elements (lists)
      5. Assert: user's message is NOT rendered as markdown (stays plain text)
      6. Screenshot: .sisyphus/evidence/task-5-markdown-formatting.png
    Expected Result: Rich markdown formatting visible in assistant messages
    Evidence: .sisyphus/evidence/task-5-markdown-formatting.png

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No build errors
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(chat): add markdown rendering with syntax highlighting for assistant messages`
  - Files: `src/components/chat/MessageList.tsx`, `src/app/globals.css`, `package.json`
  - Pre-commit: `npm run build`

---

- [x] 6. Header Review Badge (GAP-3)

  **What to do**:
  - Update `src/app/(app)/layout.tsx` header to include a "Review" link with due count badge:
    - Position: between the logo and the user email/logout section
    - Text: "Review" with a small badge showing the count (e.g., "Review (3)")
    - Link: navigates to `/app/review`
    - Badge styling: small pill/circle with count, cyan accent color for visibility
    - If 0 due: show "Review" without badge (or with "0" in muted color)
    - If count > 0: badge should be visually prominent (attention-drawing)
  - Create a client component for the badge that:
    - Fetches due count from `GET /api/review` on mount (response from Task 2)
    - Shows loading state briefly (no spinner — just show "Review" without count while loading)
    - Re-fetches count on window focus (so it updates after completing reviews)
  - Style consistent with existing header: glassmorphism, cyan accents, Dark Neural theme

  **Must NOT do**:
  - No real-time polling or WebSocket for count updates
  - No notification sound or browser notification
  - No separate API endpoint for count-only — reuse GET /api/review response length
  - No animated badge (no bouncing, no shake)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small UI addition to existing header. Fetch + render a count. Well-scoped.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Badge design, header integration, Dark Neural theme
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: None
  - **Blocked By**: Task 2 (needs GET /api/review endpoint)

  **References**:

  **Pattern References**:
  - `src/app/(app)/layout.tsx:39-57` — Current header. Contains logo ("NeuroGraph"), Beta badge, user email, and Logout button. The Review link should be inserted between the logo and the user section.
  - `src/app/(app)/layout.tsx:15-20` — Auth check pattern. The badge component can use the same Supabase client to get the authenticated user.
  - `src/app/api/review/route.ts` — GET endpoint created in Task 2. Returns due crystals array. Badge uses `response.crystals.length` for the count.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Review badge shows due count in header
    Tool: Playwright (playwright skill)
    Preconditions: User has 3 crystals due for review
    Steps:
      1. Navigate to http://localhost:3000/app
      2. Wait for header visible (timeout: 5s)
      3. Find "Review" link in header
      4. Assert: badge shows count "3" (or "(3)")
      5. Click "Review" link
      6. Wait for navigation (timeout: 5s)
      7. Assert: URL is /app/review
      8. Screenshot: .sisyphus/evidence/task-6-review-badge.png
    Expected Result: Badge shows correct count and links to review page
    Evidence: .sisyphus/evidence/task-6-review-badge.png

  Scenario: Badge updates after completing reviews
    Tool: Playwright (playwright skill)
    Steps:
      1. Note badge count (e.g., 3)
      2. Click "Review" link to go to review page
      3. Complete 1 review (rate a crystal)
      4. Navigate back to /app
      5. Wait for badge to update (timeout: 5s)
      6. Assert: badge count decreased by 1 (e.g., now shows 2)
    Expected Result: Count reflects completed reviews
    Evidence: Count assertion

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No build errors
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(header): add Review badge with due crystal count`
  - Files: `src/app/(app)/layout.tsx`
  - Pre-commit: `npm run build`

---

- [x] 7. Conversation & Crystal Deletion (GAP-6, GAP-8)

  **What to do**:
  - **Conversation Deletion (GAP-6)**:
    - Create API route: `src/app/api/conversations/[id]/route.ts`
      - DELETE handler: deletes conversation and all associated messages
      - Auth check: verify conversation belongs to authenticated user
      - Handle orphaned crystals: set `source_conversation_id = NULL` on crystals that referenced this conversation (crystals survive deletion — they're independent knowledge)
      - If the schema doesn't allow NULL for `source_conversation_id`, add a migration
    - Update `src/components/chat/ChatPanel.tsx` conversation sidebar:
      - Add a delete button (small trash icon) on each conversation item
      - Show confirmation: "Delete this conversation?" (simple confirm dialog or inline confirmation)
      - On delete: call DELETE API, remove from local state, select another conversation (or show empty state)
      - If the currently active conversation is deleted, switch to empty/new conversation state
  - **Crystal Deletion (GAP-8)**:
    - Create API route: `src/app/api/crystals/[id]/route.ts`
      - DELETE handler: deletes crystal AND all connected edges (cascade)
      - Steps: 1) Delete from `crystal_edges` where source OR target = crystal.id, 2) Delete from `crystals`
      - Auth check: verify crystal belongs to authenticated user
      - `crystalQueries.delete()` already exists in `src/lib/db/queries.ts:57-64` — use it for crystal deletion, but handle edge cascade manually
    - No crystal delete UI in graph (per MVP guardrail: "No crystal editing UI"). The delete API exists for programmatic use and will be consumed by future features. But if a simple way exists to integrate (e.g., right-click context menu on node), add it minimally.
  - **GraphStore Operations**:
    - Add `removeNode(id: string)` to `src/stores/graphStore.ts`: filters out the node and any edges connected to it
    - Add `removeEdge(id: string)` to `src/stores/graphStore.ts`: filters out the edge

  **Must NOT do**:
  - No soft delete (hard delete for MVP simplicity)
  - No undo/restore functionality
  - No bulk delete
  - No crystal editing alongside deletion
  - No conversation archiving
  - No "are you sure?" modal — simple inline confirmation is sufficient

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: CRUD operations with standard patterns. API routes + simple UI additions. No complex logic.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Delete button design, confirmation UX, sidebar integration
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 5)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/lib/db/queries.ts:57-64` — `crystalQueries.delete(id, userId)` — existing delete query. Use this for crystal deletion. Doesn't handle edge cascade — add that.
  - `src/lib/db/queries.ts:25-35` — `crystalQueries.create()` pattern. Follow the same Supabase client pattern for the new conversation delete query.
  - `src/components/chat/ChatPanel.tsx:140-180` — Conversation sidebar rendering. Each conversation is rendered in a list. Add delete button alongside each item.
  - `src/components/chat/ChatPanel.tsx:50-70` — Conversation loading logic. After deletion, need to update this state.
  - `src/app/api/crystals/[id]/edges/route.ts` — Existing edge API route. Follow the same pattern for the crystal delete route at `src/app/api/crystals/[id]/route.ts`.
  - `src/stores/graphStore.ts:4-12` — Current store with `setGraph`, `addNode`, `addEdge`, `setSelectedNode`. Add `removeNode` and `removeEdge` here.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Conversation can be deleted
    Tool: Playwright (playwright skill)
    Preconditions: User has 3+ conversations
    Steps:
      1. Navigate to http://localhost:3000/app
      2. Count conversations in sidebar
      3. Find delete button on a non-active conversation
      4. Click delete button
      5. Confirm deletion (if confirmation prompt appears)
      6. Wait for sidebar to update (timeout: 5s)
      7. Assert: conversation count decreased by 1
      8. Assert: deleted conversation no longer visible in sidebar
      9. Screenshot: .sisyphus/evidence/task-7-conversation-deleted.png
    Expected Result: Conversation removed from sidebar and database
    Evidence: .sisyphus/evidence/task-7-conversation-deleted.png

  Scenario: Crystal can be deleted via API
    Tool: Bash (curl)
    Steps:
      1. GET /api/crystals → note a crystal ID and its edge count
      2. DELETE /api/crystals/[id] with auth cookie
      3. Assert: HTTP 200 (or 204)
      4. GET /api/crystals → Assert: deleted crystal no longer in list
      5. Check edges: Assert: edges connected to deleted crystal are also gone
    Expected Result: Crystal and its edges cascade-deleted
    Evidence: API response bodies

  Scenario: Deleting active conversation switches to empty state
    Tool: Playwright (playwright skill)
    Steps:
      1. Start chatting in a conversation (make it active)
      2. Delete the active conversation
      3. Assert: chat panel shows empty/new conversation state
      4. Assert: no messages visible
    Expected Result: Graceful handling of active conversation deletion
    Evidence: UI assertion

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: No build errors
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(crud): add conversation and crystal deletion with cascade edge cleanup`
  - Files: `src/app/api/conversations/[id]/route.ts`, `src/app/api/crystals/[id]/route.ts`, `src/components/chat/ChatPanel.tsx`, `src/stores/graphStore.ts`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `fix(core): correct crystal retrievability init, tighten chat validation, remove dead code` | crystals/route.ts, fsrs.ts, chat/route.ts, supabase.ts | `npm run build` |
| 2 | `fix(review): use server-side filtering, show FSRS-computed intervals, add navigation` | review/route.ts, review/page.tsx | `npm run build` |
| 3 | `feat(graph): replace grid layout with dagre automatic positioning` | GraphPanel.tsx, ChatPanel.tsx, package.json | `npm run build` |
| 4 | `feat(decay): expand decay visualization to 5 states with animations and tooltips` | CrystalNode.tsx, globals.css, graphStore.ts | `npm run build` |
| 5 | `feat(chat): add markdown rendering with syntax highlighting for assistant messages` | MessageList.tsx, globals.css, package.json | `npm run build` |
| 6 | `feat(header): add Review badge with due crystal count` | layout.tsx | `npm run build` |
| 7 | `feat(crud): add conversation and crystal deletion with cascade edge cleanup` | conversations/[id]/route.ts, crystals/[id]/route.ts, ChatPanel.tsx, graphStore.ts | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: build succeeds, 0 errors
```

### Final Checklist
- [ ] New crystals show R=1.0, display as "Fresh" cyan glow on graph
- [ ] Existing crystals with R=0 fixed via migration script
- [ ] calculateRetrievability() handles stability=0 without NaN
- [ ] Chat API validates message structure (rejects malformed payloads)
- [ ] Review page loads due crystals from server (not all crystals client-side)
- [ ] Rating buttons show FSRS-computed intervals (not hardcoded "1m", "2d", "4d", "7d")
- [ ] Review page has back navigation to main app
- [ ] Graph uses dagre layout (nodes positioned by topology, not grid)
- [ ] Graph re-layouts when crystals are added
- [ ] CrystalNode shows 5 distinct visual states (Fresh/Stable/Fading/Decaying/Critical)
- [ ] Decaying/Critical nodes have CSS animations (tremble/pulse)
- [ ] Hovering crystal node shows retrievability tooltip
- [ ] Assistant messages render markdown (code blocks, bold, lists, headers)
- [ ] Code blocks have syntax highlighting with dark theme
- [ ] App header shows "Review (N due)" badge linking to review page
- [ ] Conversations can be deleted from sidebar
- [ ] Crystals can be deleted via API (with cascade edge deletion)
- [ ] Dead `createMiddlewareClient()` function removed
- [ ] `npm run build` passes with 0 errors
