# NeuroGraph Polish Sprint

## TL;DR

> **Quick Summary**: Comprehensive polish sprint to make the existing Chat → Crystallize → Graph → Review loop feel complete and professional. Adds collapsible sidebar navigation, crystal-as-page detail panel with editing, mobile review responsiveness, guided onboarding tour, and several UX improvements.
>
> **Deliverables**:
> - Collapsible sidebar with conversation history, graph/review navigation
> - Crystal detail slide-out panel with in-place editing (title, definition, core_insight, content)
> - PATCH API endpoint + DB migration for crystal editing (content field, user_modified flag)
> - Mobile-responsive review page
> - Guided onboarding tour (driver.js, max 5-6 steps)
> - Error boundaries for all app routes
> - Stop generating button during AI streaming
> - Review session progress bar
>
> **Estimated Effort**: Large (~8 tasks, 3-4 days)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 7 → Task 8

---

## Context

### Original Request
Polish the existing MVP core loop to make it feel complete for personal use and demo purposes. User vision: NeuroGraph should evolve toward an Obsidian-like PKM tool where each crystal/node is like an Obsidian page with rich content.

### Interview Summary
**Key Discussions**:
- **Navigation**: Collapsible sidebar (ChatGPT-style) replacing the embedded `<aside>` in ChatPanel. Contains: conversation history, graph link, review link (with badge), sign out.
- **Crystal editing**: Allowed with constraints — `user_modified: boolean` flag preserves AI provenance. Editable: `title`, `definition`, `core_insight`, new `content` Markdown field. Read-only: `bloom_level`, FSRS fields. FSRS state does NOT reset on edit. Embedding MUST re-generate on content change.
- **Content model**: New `content TEXT` column (unlimited Markdown) for long-form notes. Keep `definition` (280 chars) and `core_insight` (500 chars) as summary metadata.
- **Node click behavior**: Slide-out detail panel (Notion-style "peek") showing full crystal details, editable in-place.
- **Mobile**: Review page only — make flashcard page responsive. Chat/Graph stays desktop-only.
- **Onboarding**: Guided tour (driver.js), max 5-6 steps, triggered via localStorage flag `neurograph_tour_completed`.
- **Target audience**: Personal use / demo — polish > hardening.

**Research Findings**:
- `selectedNodeId` exists in `graphStore.ts:7,14,46` but is completely unused — ready to wire up for detail panel.
- Conversation sidebar is embedded in `ChatPanel.tsx:550-588`, tightly coupled to chat state. Unused `useConversations.ts` hook exists with duplicate logic.
- Review page renders its own duplicate `<header>` (lines 86-94 and 125-137) on top of the layout header.
- `useChat` returns `stop` function but it's not destructured in ChatPanel (line 146-151).
- `crystalQueries.update()` exists in `queries.ts:47-57` but is only used by review endpoint. No PATCH API exists.
- No `error.tsx` files exist anywhere in `src/app/`.
- No localStorage usage exists anywhere in the codebase.

### Metis Review
**Identified Gaps** (addressed):
- G1: Sidebar extraction from ChatPanel is highest-risk task — must extract ONLY the `<aside>` and conversation callbacks, NOT restructure chat/crystallization logic.
- G2: No new database tables — only add columns to existing `crystals` table.
- G3: Review page duplicate header must be removed when sidebar is added.
- G4: Mobile responsiveness only for `/app/review`.
- G5: Onboarding tour: short tooltips (1-2 sentences), max 5-6 steps.
- G6: Crystal editing via slide-out detail panel — NOT a new page route.
- G7: Error boundaries are thin wrappers (`error.tsx` files) with retry button. No external error services.

---

## Work Objectives

### Core Objective
Make the existing NeuroGraph core loop feel complete and polished for personal use and demos, while laying architectural groundwork for the Obsidian-like PKM vision (crystal-as-page with editable rich content).

### Concrete Deliverables
- `src/app/(app)/error.tsx` — App-level error boundary
- `src/app/app/error.tsx` — Main page error boundary
- `src/app/app/review/error.tsx` — Review page error boundary
- `src/components/layout/AppSidebar.tsx` — New collapsible sidebar component
- Updated `src/app/(app)/layout.tsx` — Sidebar integration, header restructure
- `src/lib/db/migrations/005_add_content_and_editing.sql` — DB migration
- Updated `src/types/database.ts` — New Crystal fields
- `PATCH /api/crystals/[id]` — Crystal editing endpoint
- `src/components/graph/CrystalDetailPanel.tsx` — Slide-out detail/edit panel
- Updated `src/components/graph/GraphPanel.tsx` — Node click → detail panel
- Updated `src/components/chat/ChatInput.tsx` — Stop generating button
- Updated `src/app/app/review/page.tsx` — Progress bar + mobile responsive + header removal
- Onboarding tour integration (driver.js)

### Definition of Done
- [ ] All routes have error boundaries with retry buttons
- [ ] Sidebar collapses/expands, shows conversations, links to Graph/Review
- [ ] Clicking a graph node opens slide-out detail panel with crystal info
- [ ] Users can edit title, definition, core_insight, and content in the detail panel
- [ ] Edits trigger embedding re-generation and set `user_modified = true`
- [ ] Review page is usable on mobile screens (< 768px)
- [ ] Onboarding tour appears on first visit, dismissible, respects localStorage
- [ ] Stop button visible during AI streaming, cancels generation
- [ ] Progress bar shows review session progress
- [ ] `npm run build` succeeds with zero errors

### Must Have
- Error boundaries on all app routes
- Sidebar with conversation history + navigation links
- Crystal editing with `user_modified` flag and embedding re-generation
- Detail panel triggered by node click (NOT a new route)
- Mobile-responsive review page
- Onboarding tour with max 5-6 steps

### Must NOT Have (Guardrails)
- Ghost Nodes, FIRe, QuizCard, CodeSandbox, SocraticChat, ConceptVisualizer
- Full mobile support (chat/graph stay desktop-only)
- Rate limiting, token counting, pagination
- Graph search/filtering, minimap
- Resizable split view
- Per-user FSRS optimization, desired retention customization
- Data export (Markdown, JSON, Obsidian format)
- Backlinks, `[[wiki-links]]`, tags/folders
- New database tables (only ALTER existing `crystals` table)
- FSRS state reset on crystal edit
- External error reporting services (Sentry, etc.)
- `bloom_level` editing (read-only, AI-determined)
- Elaborate onboarding wizards (keep tooltips to 1-2 sentences each)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
>
> **FORBIDDEN** — acceptance criteria that require:
> - "User manually tests..." / "User visually confirms..."
> - "User interacts with..." / "Ask user to verify..."
> - ANY step where a human must perform an action
>
> **ALL verification is executed by the agent** using tools (Playwright, interactive_bash, curl, etc.). No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest + Playwright)
- **Automated tests**: Tests-after (same as MVP approach)
- **Framework**: Vitest for unit tests, Playwright for E2E

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Frontend/UI** | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| **API/Backend** | Bash (curl) | Send requests, parse responses, assert fields |
| **Build** | Bash (npm run build) | Build succeeds, zero errors |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Cleanup):
└── Task 0: Fix Migration Numbering (renumber 003 duplicates)

Wave 1 (Start Immediately After Wave 0):
├── Task 1: Error Boundaries (no dependencies)
├── Task 3: Crystal Editing Backend (depends on Task 0)
└── Task 5: Stop Generating Button (no dependencies)

Wave 2 (After Wave 1):
├── Task 2: Sidebar Extraction + Navigation (benefits from error boundaries)
├── Task 4: Crystal Detail Panel + Editing UI (depends on Task 3 PATCH API)
└── Task 6: Review Progress Bar (no hard dependency but logical grouping)

Wave 3 (After Wave 2):
└── Task 7: Review Mobile Responsiveness (depends on Task 2 for header cleanup)

Wave 4 (After Wave 3):
└── Task 8: Onboarding Tour (all features must exist to be toured)

Critical Path: Task 0 → Task 3 → Task 4 → Task 8
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | 3 | None |
| 1 | None | 2 | 3, 5 |
| 2 | 1 | 7, 8 | 4, 6 |
| 3 | 0 | 4 | 1, 5 |
| 4 | 3 | 8 | 2, 6 |
| 5 | None | None | 1, 3 |
| 6 | None | None | 2, 4 |
| 7 | 2 | 8 | None |
| 8 | 2, 4, 7 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 0 | 0 | 1 agent: quick(0) |
| 1 | 1, 3, 5 | 3 parallel: quick(1), unspecified-high(3), quick(5) |
| 2 | 2, 4, 6 | 3 parallel: visual-engineering(2), visual-engineering(4), quick(6) |
| 3 | 7 | 1 agent: visual-engineering(7) |
| 4 | 8 | 1 agent: unspecified-high(8) |

---

## TODOs

- [ ] 0. Fix Migration Numbering Conflicts

  **What to do**:
  - Rename the conflicting `003_*.sql` files to establish a linear order.
  - Current state:
    - `003_fix_recursive_query.sql`
    - `003_fix_retrievability.sql`
    - `003_fsrs_schema.sql`
    - `004_update_rpc_fsrs.sql`
  - **Action**: Renumber them based on creation time (or logical dependency if clear, otherwise alphabetical/arbitrary but stable).
  - Proposed order:
    1. `003_fix_recursive_query.sql` (keep as 003)
    2. `003_fsrs_schema.sql` -> `004_fsrs_schema.sql`
    3. `003_fix_retrievability.sql` -> `005_fix_retrievability.sql`
    4. `004_update_rpc_fsrs.sql` -> `006_update_rpc_fsrs.sql`
  - Update any references to these filenames if they exist in documentation (code references are unlikely as these are SQL files).

  **Must NOT do**:
  - Do NOT modify the _content_ of the SQL files, only the filenames.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file renaming operations.

  **Acceptance Criteria**:
  - [ ] `ls src/lib/db/migrations` shows strict sequential numbering (001, 002, 003, 004, 005, 006).
  - [ ] No duplicate prefixes exist.

  **Commit**: YES
  - Message: `chore(db): fix duplicate migration numbering`
  - Files: `src/lib/db/migrations/*`

---

- [ ] 1. Add Error Boundaries to All App Routes

  **What to do**:
  - Create `src/app/(app)/error.tsx` — catches errors in the app layout group
  - Create `src/app/app/error.tsx` — catches errors on the main chat+graph page
  - Create `src/app/app/review/error.tsx` — catches errors on the review page
  - Each error boundary must:
    - Be a `'use client'` component (Next.js requirement for error.tsx)
    - Accept `{ error, reset }` props (Next.js Error Boundary API)
    - Display a styled error message matching the neural-* theme (dark bg, glassmorphism card)
    - Show a "Try Again" button that calls `reset()`
    - Log `error.message` to console
    - NOT use any external error reporting service
  - Style consistently: use `.glass-panel` pattern or equivalent — `bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl`

  **Must NOT do**:
  - No Sentry, LogRocket, or external error services
  - No elaborate error analysis or stack trace display
  - No new components beyond the `error.tsx` files themselves

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple boilerplate files, minimal logic, well-documented Next.js pattern
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ensures error UI matches existing neural-* design system
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — build verification sufficient for static error components

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 5)
  - **Blocks**: Task 2 (sidebar extraction benefits from error boundaries being in place)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/(app)/layout.tsx:28-36` — Loading state UI pattern (centered spinner with neural-dark bg, neural-cyan accent). Error boundaries should use the same centered layout pattern.
  - `src/app/app/review/page.tsx:96-118` — Empty state card pattern (glassmorphism card with gradient text, icon, and action). Error UI should feel similar.
  - `tailwind.config.ts` — Custom `neural-*` color tokens: `neural-dark`, `neural-light`, `neural-cyan`, `neural-purple`, `neural-gray-*`

  **API/Type References**:
  - Next.js error.tsx convention: component receives `{ error: Error & { digest?: string }; reset: () => void }` as props

  **Documentation References**:
  - Next.js App Router error handling: `https://nextjs.org/docs/app/building-your-application/routing/error-handling`

  **WHY Each Reference Matters**:
  - `layout.tsx:28-36`: Provides the exact centering + background pattern so error pages feel native, not bolted on
  - `review/page.tsx:96-118`: Shows the glassmorphism card style for informational states — error UI should use the same visual language
  - `tailwind.config.ts`: Must use existing color tokens, not hardcoded hex values

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds with zero errors after adding error.tsx files
  - [ ] Three error.tsx files created: `src/app/(app)/error.tsx`, `src/app/app/error.tsx`, `src/app/app/review/error.tsx`

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Error boundary files exist and export correct component shape
    Tool: Bash
    Preconditions: Files created
    Steps:
      1. Verify file exists: ls src/app/\(app\)/error.tsx
      2. Verify file exists: ls src/app/app/error.tsx
      3. Verify file exists: ls src/app/app/review/error.tsx
      4. Verify each file contains 'use client' directive
      5. Verify each file exports a default function with error and reset params
      6. npm run build → Assert exit code 0
    Expected Result: All 3 files exist, build passes
    Evidence: Build output captured

  Scenario: Error boundary renders retry button (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Wait for: page load (timeout: 10s)
      3. Execute JS in console to test error boundary rendering:
         Inject a component that throws an error to verify the boundary catches it
      4. Assert: Text "Try Again" or "try again" visible on error
      5. Screenshot: .sisyphus/evidence/task-1-error-boundary.png
    Expected Result: Error boundary catches error and shows retry UI
    Evidence: .sisyphus/evidence/task-1-error-boundary.png
  ```

  **Commit**: YES
  - Message: `feat(app): add error boundaries to all app routes`
  - Files: `src/app/(app)/error.tsx`, `src/app/app/error.tsx`, `src/app/app/review/error.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 2. Extract Sidebar from ChatPanel + Build Collapsible Navigation

  **What to do**:
  - **Step A: Create `src/components/layout/AppSidebar.tsx`** — New standalone sidebar component
    - Extract the conversation list UI from `ChatPanel.tsx:550-588` (the `<aside>` block)
    - Sidebar receives conversation data and callbacks as props (NOT internal state)
    - Add navigation links: "Chat" (to `/app`), "Graph" (already on `/app`, could be an anchor or scroll), "Review" (to `/app/review`) with the existing `ReviewBadge` component
    - Add "Sign Out" button at sidebar bottom (move from header)
    - Collapsible: toggle button to collapse to icon-only rail (~60px) or expand to full width (~280px)
    - Store collapsed state in localStorage key `neurograph_sidebar_collapsed`
    - Style: dark panel matching `bg-neural-dark/30`, `border-r border-white/5` (same as current aside)
    - "+ New Chat" button at top of sidebar

  - **Step B: Restructure `src/app/(app)/layout.tsx`**
    - Change layout from `<header> + <main>` to `<div flex> + <AppSidebar> + <div flex-col><header><main></div>`
    - Sidebar sits to the LEFT of the header+content area
    - Header stays but is simplified: remove Sign Out (moved to sidebar), keep "NeuroGraph Beta" branding
    - ReviewBadge stays in header for at-a-glance visibility but ALSO appears in sidebar nav
    - User email display remains in header

  - **Step C: Remove conversation sidebar from `ChatPanel.tsx`**
    - Delete the `<aside>` block (lines 550-588)
    - Delete conversation-related state that's now handled by sidebar: `conversations`, `setConversations` useState, `loadConversations`, `loadConversation`, `handleNewConversation`, `handleDeleteConversation` functions (lines ~121, ~180-250)
    - REPLACE with: ChatPanel receives `conversationId`, `onConversationChange`, `onNewConversation` as props from the layout/page level
    - Consider using the existing `src/hooks/useConversations.ts` hook (currently unused) as the conversation state manager, lifted to layout level
    - **CRITICAL**: Do NOT modify the chat/crystallization logic (useChat, handleCrystallize, handleDismiss, edge suggestions). Only extract sidebar and conversation management.

  - **Step D: Update `src/app/app/page.tsx`**
    - Wire conversation props from layout context into ChatPanel
    - The page component now receives conversation callbacks through context or props

  - **Step E: Remove duplicate header from `src/app/app/review/page.tsx`**
    - Delete the `<header>` blocks at lines 86-94 (empty state header) and lines 125-137 (review state header)
    - The layout header + sidebar now provide navigation — no need for "Back" button
    - Keep the `{currentIndex + 1} / {crystals.length}` counter — move it into the review card area

  **Must NOT do**:
  - Do NOT restructure ChatPanel's chat logic, crystallization flow, or edge suggestion handling
  - Do NOT change the 35/65 split view grid
  - Do NOT add graph search, filtering, or any new sidebar features beyond what's listed
  - Do NOT use React Context unless truly needed — prefer prop drilling for this scope

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex layout restructure requiring precise CSS and component extraction, highest-risk task in the sprint
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Critical for layout, responsive behavior, glassmorphism styling, and ensuring the sidebar feels native to the design
  - **Skills Evaluated but Omitted**:
    - `playwright`: Agent will use Playwright for QA scenarios but doesn't need skill loaded for implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES (in Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7 (review mobile depends on header cleanup), Task 8 (tour references sidebar)
  - **Blocked By**: Task 1 (error boundaries should be in place before this risky refactor)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/components/chat/ChatPanel.tsx:550-588` — The exact `<aside>` block to extract. Contains conversation list with active state highlighting, delete buttons, date display. This HTML/JSX is the starting point for the sidebar component.
  - `src/components/chat/ChatPanel.tsx:120-128` — Conversation state declarations (`conversations`, `conversationId`, etc.) that must be lifted out of ChatPanel.
  - `src/components/chat/ChatPanel.tsx:180-250` — Conversation callback functions (`loadConversations`, `loadConversation`, `handleNewConversation`, `handleDeleteConversation`) that move to the sidebar's parent scope.
  - `src/hooks/useConversations.ts:15-102` — Pre-built hook with identical conversation management logic (load, switch, delete, new). Currently UNUSED. Consider adopting this as the canonical implementation instead of re-extracting from ChatPanel.
  - `src/app/(app)/layout.tsx:38-65` — Current layout structure. The sidebar must integrate here, wrapping around the existing `<header>` + `<main>`.
  - `src/components/ReviewBadge.tsx` — Existing review badge component. Must appear in both header and sidebar nav.

  **API/Type References**:
  - `src/types/chat.ts:ConversationSummary` — Type used for conversation list items
  - `src/app/(app)/layout.tsx:LogoutButton` (lines 7-22) — Sign out button to move into sidebar

  **Documentation References**:
  - ChatGPT sidebar behavior: collapsible to icon rail, full-width shows conversation titles, hover reveals delete button

  **WHY Each Reference Matters**:
  - `ChatPanel.tsx:550-588`: This is the EXACT code being extracted — the agent must know its structure to cleanly move it
  - `useConversations.ts`: Avoids re-implementing conversation logic — this hook already has the exact API needed
  - `layout.tsx:38-65`: The agent must understand the current DOM structure to safely insert the sidebar without breaking the header
  - `review/page.tsx:86-94,125-137`: These duplicate headers MUST be found and removed — missing them causes double headers

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds
  - [ ] `npx vitest run` passes (existing tests still work)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Sidebar renders with conversation list and navigation
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, at least 1 conversation exists
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Wait for: sidebar visible (timeout: 10s)
      3. Assert: Sidebar contains text "Conversations" or "New Chat"
      4. Assert: Sidebar contains link/button for "Review" navigation
      5. Assert: Sidebar contains "Sign Out" button
      6. Assert: No duplicate header with "Back" button on any page
      7. Screenshot: .sisyphus/evidence/task-2-sidebar-expanded.png
    Expected Result: Sidebar visible with all navigation elements
    Evidence: .sisyphus/evidence/task-2-sidebar-expanded.png

  Scenario: Sidebar collapses to icon rail
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in, sidebar visible
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Wait for: sidebar toggle button visible (timeout: 5s)
      3. Click: sidebar toggle/collapse button
      4. Assert: Sidebar width is approximately 60px (collapsed state)
      5. Assert: Conversation titles are hidden (only icons visible)
      6. Screenshot: .sisyphus/evidence/task-2-sidebar-collapsed.png
      7. Click: sidebar toggle button again
      8. Assert: Sidebar expands back to full width (~280px)
    Expected Result: Sidebar toggles between collapsed and expanded
    Evidence: .sisyphus/evidence/task-2-sidebar-collapsed.png

  Scenario: Review page has no duplicate header
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/app/review
      2. Wait for: page load (timeout: 10s)
      3. Assert: Only ONE header element exists (the layout header)
      4. Assert: No "Back" link/button exists
      5. Assert: Sidebar is visible with navigation
      6. Screenshot: .sisyphus/evidence/task-2-review-no-duplicate-header.png
    Expected Result: Single header, no duplicate, sidebar provides navigation
    Evidence: .sisyphus/evidence/task-2-review-no-duplicate-header.png

  Scenario: Conversation switching still works via sidebar
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in, at least 2 conversations exist
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Wait for: sidebar with conversation list (timeout: 10s)
      3. Click: second conversation in the list
      4. Wait for: messages to load in chat panel (timeout: 5s)
      5. Assert: Chat panel shows messages (not empty)
      6. Assert: Clicked conversation is highlighted in sidebar
      7. Screenshot: .sisyphus/evidence/task-2-conversation-switch.png
    Expected Result: Clicking sidebar conversation loads it in chat panel
    Evidence: .sisyphus/evidence/task-2-conversation-switch.png

  Scenario: New Chat button works from sidebar
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Click: "+ New Chat" button in sidebar
      3. Assert: Chat panel shows empty state (no messages)
      4. Assert: No conversation is highlighted in sidebar
    Expected Result: New chat clears messages and deselects conversation
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(layout): extract sidebar navigation from ChatPanel`
  - Files: `src/components/layout/AppSidebar.tsx`, `src/app/(app)/layout.tsx`, `src/components/chat/ChatPanel.tsx`, `src/app/app/page.tsx`, `src/app/app/review/page.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 3. Crystal Editing Backend (DB Migration + PATCH API)

  **What to do**:
  - **Step A: Create migration `src/lib/db/migrations/007_add_content_and_editing.sql`**
    ```sql
    -- Add content field for long-form markdown notes (Obsidian-like page content)
    ALTER TABLE crystals ADD COLUMN content TEXT;

    -- Track whether user has manually edited this crystal
    ALTER TABLE crystals ADD COLUMN user_modified BOOLEAN NOT NULL DEFAULT FALSE;

    -- Track when user last modified this crystal (separate from updated_at which tracks any change)
    ALTER TABLE crystals ADD COLUMN modified_at TIMESTAMPTZ;
    ```
    *(Note: Numbering updated to 007 to follow the fix in Task 0)*

  - **Step B: Update `src/types/database.ts`**
    - Add to `Crystal` type: `content: string | null`, `user_modified: boolean`, `modified_at: string | null`
    - Add to `Database.Tables.crystals.Insert`: `content?: string | null`, `user_modified?: boolean`, `modified_at?: string | null`
    - `Update` type is already `Partial<Crystal>` so it auto-includes new fields

  - **Step C: Add PATCH handler to `src/app/api/crystals/[id]/route.ts`**
    - Create Zod schema for updates (all fields optional):
      ```typescript
      const updateCrystalSchema = z.object({
        title: z.string().min(3).max(120).optional(),
        definition: z.string().min(10).max(280).optional(),
        core_insight: z.string().min(10).max(500).optional(),
        content: z.string().max(50000).nullable().optional(),
      });
      ```
    - Auth check (same pattern as DELETE handler)
    - Ownership check (crystal.user_id === user.id)
    - On valid update:
      1. Set `user_modified = true`
      2. Set `modified_at = new Date().toISOString()`
      3. If `title`, `definition`, or `core_insight` changed: re-generate embedding using `generateEmbedding()` with concatenated `title + definition + core_insight` (same pattern as POST handler line 142-143)
      4. Use `crystalQueries.update()` from `queries.ts:47-57`
    - Return updated crystal as JSON
    - **CRITICAL**: Do NOT modify FSRS fields (`stability`, `difficulty`, `state`, `reps`, etc.). Do NOT reset any review scheduling.
    - **CRITICAL**: Do NOT allow editing `bloom_level` — it stays AI-determined

  - **Step D: Update `GET /api/crystals` response**
    - Add `content`, `user_modified`, `modified_at` to the select list in `src/app/api/crystals/route.ts:71` (currently enumerates columns explicitly)

  **Must NOT do**:
  - Do NOT create new database tables
  - Do NOT modify FSRS fields or review scheduling on edit
  - Do NOT allow `bloom_level` editing
  - Do NOT add rate limiting to the PATCH endpoint

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend task spanning DB migration, type system, API route with business logic (embedding re-generation), and Zod validation
  - **Skills**: []
    - No special skills needed — standard TypeScript/Next.js API route work
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No frontend work in this task
    - `playwright`: API testing done via curl

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 5)
  - **Blocks**: Task 4 (detail panel needs PATCH API to save edits)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/api/crystals/[id]/route.ts:5-36` — DELETE handler pattern: auth check → ownership check → execute → return. PATCH must follow identical auth/ownership pattern.
  - `src/app/api/crystals/route.ts:46-54` — `createCrystalSchema` Zod schema with exact validation constraints. The update schema must use the same min/max values.
  - `src/app/api/crystals/route.ts:142-155` — Embedding generation pattern: concatenate `title + definition + core_insight`, call `generateEmbedding()`, update crystal with new embedding. Re-use this exact approach for PATCH.
  - `src/lib/db/queries.ts:47-57` — `crystalQueries.update()` — already accepts `Partial<Crystal>`, already returns updated crystal. Use this directly.

  **API/Type References**:
  - `src/types/database.ts:12-36` — Current Crystal type (add new fields here)
  - `src/types/database.ts:71-95` — Crystal Insert type (add new fields here)
  - `src/lib/ai/embeddings.ts:4-11` — `generateEmbedding(text: string): Promise<number[]>` — import and call for re-embedding

  **Test References**:
  - `src/lib/db/migrations/003_fsrs_schema.sql` — Example ALTER TABLE migration for reference on naming convention

  **Documentation References**:
  - Existing migration files in `src/lib/db/migrations/` — Follow naming convention: `005_descriptive_name.sql`

  **WHY Each Reference Matters**:
  - `[id]/route.ts:5-36`: The PATCH handler sits IN THIS FILE. The agent must add to it, not create a new file. The auth pattern must be identical.
  - `route.ts:142-155`: The embedding re-generation logic is non-trivial (concatenation order, async call, separate update). Agent must replicate exactly.
  - `queries.ts:47-57`: Confirms `update()` exists and is generic — no need to add a new query function.
  - `database.ts`: Type changes here affect the entire codebase. Agent must be precise about optional vs required fields.

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds
  - [ ] Migration SQL file created at `src/lib/db/migrations/007_add_content_and_editing.sql`
  - [ ] Crystal type in `database.ts` includes `content`, `user_modified`, `modified_at`

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: PATCH updates crystal title and sets user_modified
    Tool: Bash (curl)
    Preconditions: Dev server running on localhost:3000, user authenticated (obtain session cookie), at least 1 crystal exists
    Steps:
      1. GET /api/crystals → Extract first crystal ID
      2. PATCH /api/crystals/{id} with body: {"title": "Updated Test Title"}
         Include auth cookie in request
      3. Assert: HTTP status is 200
      4. Assert: response.title equals "Updated Test Title"
      5. Assert: response.user_modified equals true
      6. Assert: response.modified_at is not null
    Expected Result: Crystal updated, user_modified flag set
    Evidence: Response body captured

  Scenario: PATCH rejects invalid title (too short)
    Tool: Bash (curl)
    Preconditions: Dev server running, authenticated
    Steps:
      1. PATCH /api/crystals/{id} with body: {"title": "AB"}
      2. Assert: HTTP status is 400
      3. Assert: Response contains validation error
    Expected Result: Validation rejects title under 3 chars
    Evidence: Response body captured

  Scenario: PATCH rejects unauthenticated request
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. PATCH /api/crystals/{id} without auth cookie with body: {"title": "Test"}
      2. Assert: HTTP status is 401
    Expected Result: Unauthorized response
    Evidence: Response body captured

  Scenario: PATCH with content field stores markdown
    Tool: Bash (curl)
    Preconditions: Dev server running, authenticated, crystal exists
    Steps:
      1. PATCH /api/crystals/{id} with body: {"content": "# My Notes\n\nThis is a detailed note about the concept."}
      2. Assert: HTTP status is 200
      3. Assert: response.content equals the sent markdown
      4. Assert: response.user_modified equals true
    Expected Result: Content field saved as markdown text
    Evidence: Response body captured

  Scenario: GET /api/crystals includes new fields
    Tool: Bash (curl)
    Preconditions: Dev server running, authenticated, crystals exist
    Steps:
      1. GET /api/crystals
      2. Assert: HTTP status is 200
      3. Assert: First crystal object contains keys "content", "user_modified", "modified_at"
    Expected Result: New fields present in API response
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(api): add crystal editing with PATCH endpoint and content field`
  - Files: `src/lib/db/migrations/007_add_content_and_editing.sql`, `src/types/database.ts`, `src/app/api/crystals/[id]/route.ts`, `src/app/api/crystals/route.ts`
  - Pre-commit: `npm run build`

---

- [ ] 4. Crystal Detail Panel (Slide-Out with Editing UI)

  **What to do**:
  - **Step A: Create `src/components/graph/CrystalDetailPanel.tsx`**
    - Slide-out panel that appears from the RIGHT side of the graph area
    - Triggered when `selectedNodeId` is set in graphStore
    - Panel width: ~400px, overlays the graph (absolute positioning within graph container)
    - Close button (X) and click-outside-to-close behavior
    - Closing sets `selectedNodeId` to null via `setSelectedNode(null)` in graphStore

  - **Step B: Panel Content — Crystal Detail View**
    - Fetch full crystal data via `GET /api/crystals/{id}` (or from cached graph data in store)
    - Display:
      - Title (editable inline — click to edit, Enter to save, Esc to cancel)
      - Bloom level badge (read-only, styled tag)
      - Definition (editable textarea, 280 char limit shown)
      - Core Insight (editable textarea, 500 char limit shown)
      - Content (editable Markdown area — full-width textarea with monospace font, no limit display)
      - FSRS stats section (read-only): Retrievability %, Stability, State, Next Review date
      - Metadata: Created date, Last Modified date, `user_modified` badge if true
    - Each editable field: click to enter edit mode, show Save/Cancel buttons
    - On save: `PATCH /api/crystals/{id}` with changed fields only
    - On successful save: update the node in graphStore via `updateNode()` to reflect title change on the graph
    - Show loading spinner during save, error toast on failure

  - **Step C: Wire up GraphPanel.tsx**
    - Add `onNodeClick` callback to `<ReactFlow>` component (line 205)
    - `onNodeClick` calls `setSelectedNode(nodeId)` from graphStore
    - Render `<CrystalDetailPanel />` inside the `<section>` wrapper of GraphPanel (line 225)
    - Panel only renders when `selectedNodeId !== null`

  - **Step D: Update CrystalNode.tsx**
    - Add cursor pointer style to indicate clickability
    - Add visual "selected" state when node ID matches `selectedNodeId` from graphStore (e.g., brighter border, ring)

  - **Step E: Update node data in graph store**
    - After successful PATCH, update the node's `data.title` in graphStore so the graph label updates instantly
    - Also update `data.definition`, `data.core_insight` if they're used anywhere in node display

  **Must NOT do**:
  - Do NOT create a new page route for crystal details (slide-out panel only)
  - Do NOT add a rich text / WYSIWYG markdown editor (plain textarea is sufficient for this sprint)
  - Do NOT allow editing bloom_level or FSRS fields
  - Do NOT implement backlinks, [[wiki-links]], or cross-crystal navigation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex interactive UI component with slide-out animation, inline editing, state management, and API integration
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Slide-out panel with animations, inline editing UX, glassmorphism styling, responsive within graph container
  - **Skills Evaluated but Omitted**:
    - `playwright`: Will be used for QA but not needed as loaded skill

  **Parallelization**:
  - **Can Run In Parallel**: YES (in Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 2, 6)
  - **Blocks**: Task 8 (onboarding tour references detail panel)
  - **Blocked By**: Task 3 (needs PATCH API endpoint to save edits)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/stores/graphStore.ts:7,14,46` — `selectedNodeId` state + `setSelectedNode` action. Already exists, completely unused. Wire this up.
  - `src/components/graph/GraphPanel.tsx:204-220` — `<ReactFlow>` component where `onNodeClick` must be added as a prop
  - `src/components/graph/GraphPanel.tsx:223-231` — `<section>` wrapper where the detail panel component must be rendered (inside, as a sibling to ReactFlowProvider)
  - `src/components/graph/CrystalNode.tsx:82-166` — Current node component. Add click handler (the outer `<div>` at line 111) and selected state styling.
  - `src/components/graph/CrystalNode.tsx:6-13` — `CrystalNodeData` type. This defines what data is available on each node. May need to expand to include `definition`, `core_insight`, `content` for the detail panel.
  - `src/app/api/crystals/route.ts:71-74` — GET crystals select list. The detail panel may need to fetch individual crystal data if not all fields are in the graph response.

  **API/Type References**:
  - `PATCH /api/crystals/[id]` — Created in Task 3. The detail panel calls this to save edits.
  - `src/types/database.ts:Crystal` — Full crystal type with all fields including new `content`, `user_modified`, `modified_at`
  - `src/stores/graphStore.ts:13` — `updateNode(nodeId, data)` — Use this to sync graph node after edit

  **Documentation References**:
  - Notion "peek" panel: slide-in from right, overlay on content, ~400px width, close on click outside
  - Framer Motion `AnimatePresence` + slide animation — already used in `review/page.tsx:157-170` for card reveals

  **WHY Each Reference Matters**:
  - `graphStore.ts:7,14,46`: This is the PRE-BUILT state for node selection. The agent must NOT create new state — wire up what exists.
  - `GraphPanel.tsx:204-220`: The agent must add `onNodeClick` to the EXISTING ReactFlow component, not create a new one.
  - `CrystalNode.tsx:6-13`: Understanding node data shape is critical — the panel needs to know what's available from the graph vs. what requires an API fetch.
  - `review/page.tsx:157-170`: Shows existing Framer Motion animation pattern in the codebase — panel should use similar approach.

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds
  - [ ] `CrystalDetailPanel.tsx` component created
  - [ ] GraphPanel renders detail panel when node selected

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Clicking a graph node opens the detail panel
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, at least 1 crystal exists in graph
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Wait for: .react-flow__node visible (timeout: 10s) — at least one node rendered
      3. Click: first .react-flow__node element
      4. Wait for: detail panel slide-out visible (timeout: 3s)
      5. Assert: Panel contains crystal title text
      6. Assert: Panel contains "Definition" label or similar
      7. Assert: Panel contains "Core Insight" label or similar
      8. Assert: Panel contains FSRS stats (retrievability, stability)
      9. Screenshot: .sisyphus/evidence/task-4-detail-panel-open.png
    Expected Result: Detail panel slides in from right showing crystal details
    Evidence: .sisyphus/evidence/task-4-detail-panel-open.png

  Scenario: Editing crystal title via detail panel
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, detail panel open for a crystal
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Click: first graph node to open detail panel
      3. Wait for: detail panel visible (timeout: 3s)
      4. Click: title field to enter edit mode
      5. Clear existing title text
      6. Type: "Edited Crystal Title"
      7. Click: Save button (or press Enter)
      8. Wait for: save completes (loading indicator disappears, timeout: 5s)
      9. Assert: Title in panel shows "Edited Crystal Title"
      10. Assert: Node label in graph also shows "Edited Crystal Title"
      11. Screenshot: .sisyphus/evidence/task-4-edit-title.png
    Expected Result: Title updated in both panel and graph node
    Evidence: .sisyphus/evidence/task-4-edit-title.png

  Scenario: Closing detail panel
    Tool: Playwright (playwright skill)
    Preconditions: Detail panel is open
    Steps:
      1. Click: close button (X) on detail panel
      2. Wait for: panel to slide out / disappear (timeout: 2s)
      3. Assert: No detail panel visible
      4. Assert: Graph nodes are fully visible (no overlay)
    Expected Result: Panel closes cleanly
    Evidence: Terminal verification

  Scenario: Content field accepts and saves markdown
    Tool: Playwright (playwright skill)
    Preconditions: Detail panel open
    Steps:
      1. Click: content textarea to enter edit mode
      2. Type: "# My Notes\n\nThis concept relates to neural networks."
      3. Click: Save button
      4. Wait for: save completes (timeout: 5s)
      5. Assert: Content field shows the entered text
      6. Reload page, click same node
      7. Assert: Content persists after reload
    Expected Result: Markdown content saved and persisted
    Evidence: .sisyphus/evidence/task-4-content-saved.png
  ```

  **Commit**: YES
  - Message: `feat(graph): add crystal detail panel with inline editing`
  - Files: `src/components/graph/CrystalDetailPanel.tsx`, `src/components/graph/GraphPanel.tsx`, `src/components/graph/CrystalNode.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 5. Stop Generating Button

  **What to do**:
  - **Step A: Update `ChatInput.tsx`**
    - Add new optional props: `isStreaming: boolean`, `onStop: () => void`
    - When `isStreaming` is true, replace the Send button with a Stop button (square icon in a circle, red/orange accent)
    - Stop button calls `onStop()` on click
    - Button style: `border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20` (matches review page "Again" button style)

  - **Step B: Wire up in `ChatPanel.tsx`**
    - Destructure `stop` from `useChat()` (line 146-151 — it's returned but not destructured)
    - Pass `isStreaming={status === 'streaming'}` and `onStop={stop}` to `<ChatInput>`

  **Must NOT do**:
  - Do NOT change the chat logic or message handling
  - Do NOT add loading indicators beyond the stop button itself

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, well-scoped change — add a prop, add a button, wire one function
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Button styling must match existing design system
  - **Skills Evaluated but Omitted**:
    - `playwright`: Overkill for this simple task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/components/chat/ChatInput.tsx:5-10` — Current props type. Add `isStreaming` and `onStop` here.
  - `src/components/chat/ChatInput.tsx:38-48` — Current send button. The stop button replaces this when streaming.
  - `src/components/chat/ChatPanel.tsx:146-151` — `useChat` destructure. Add `stop` to the destructured values.
  - `src/components/chat/ChatPanel.tsx:655-660` — `<ChatInput>` usage. Add new props here.
  - `src/app/app/review/page.tsx:184` — Red-styled button example: `border-red-500/30 bg-red-500/10 text-red-400` — use similar accent for stop button

  **API/Type References**:
  - `useChat` from `@ai-sdk/react` returns `stop: () => void` — already available, just not destructured

  **WHY Each Reference Matters**:
  - `ChatInput.tsx:38-48`: The agent needs to conditionally render send vs stop button — must understand the current button structure
  - `ChatPanel.tsx:146-151`: The `stop` function is already returned by `useChat` but not captured. Single line change to add it.
  - `review/page.tsx:184`: Provides the exact red button styling pattern used elsewhere in the app — consistency matters

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Stop button appears during AI streaming
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Wait for: chat input visible (timeout: 5s)
      3. Fill: chat textarea with "Explain the theory of relativity in great detail"
      4. Click: send button
      5. Wait for: 500ms (let streaming begin)
      6. Assert: Stop button is visible (square icon or "Stop" text)
      7. Assert: Send button is NOT visible during streaming
      8. Screenshot: .sisyphus/evidence/task-5-stop-button-visible.png
      9. Click: stop button
      10. Wait for: 1s
      11. Assert: Send button reappears (streaming stopped)
      12. Assert: Partial response is visible in chat
    Expected Result: Stop button shown during streaming, clicking it stops generation
    Evidence: .sisyphus/evidence/task-5-stop-button-visible.png

  Scenario: Send button shows when not streaming
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, not currently streaming
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Assert: Send button visible (arrow icon)
      3. Assert: Stop button NOT visible
    Expected Result: Normal send button in idle state
    Evidence: Terminal verification
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(chat): add stop generating button during AI streaming`
  - Files: `src/components/chat/ChatInput.tsx`, `src/components/chat/ChatPanel.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 6. Review Session Progress Bar

  **What to do**:
  - Add a visual progress bar to the review page showing session progress
  - Replace the plain `{currentIndex + 1} / {crystals.length}` text (currently in the duplicate header at line 133-134) with a styled progress bar + text
  - Progress bar position: above the flashcard, below the header (or within the card area)
  - Style: thin bar (4px height), `bg-neural-cyan` fill on `bg-white/10` track, rounded-full
  - Show text label: "3 of 7 crystals reviewed" or similar
  - Width fills proportionally: `(currentIndex / crystals.length) * 100%`
  - Animate width changes with `transition-all duration-500`
  - When all done (empty state), progress shows 100% briefly before transitioning to "All caught up!"

  **Must NOT do**:
  - Do NOT add session summary statistics beyond what already exists in the empty state (lines 106-117)
  - Do NOT change the flashcard interaction (reveal/rate) mechanics
  - Do NOT add timing or accuracy tracking

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple UI addition — one progress bar component, CSS only
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Progress bar styling, animation, consistent with neural-* theme
  - **Skills Evaluated but Omitted**:
    - `playwright`: Simple visual addition, build check sufficient

  **Parallelization**:
  - **Can Run In Parallel**: YES (in Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 2, 4)
  - **Blocks**: None
  - **Blocked By**: None (no hard dependency, but grouped in Wave 2 for logical ordering)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/app/review/page.tsx:133-134` — Current plain text counter `{currentIndex + 1} / {crystals.length}`. Replace with progress bar.
  - `src/app/app/review/page.tsx:139-172` — Card area. Progress bar goes above or inside this section.
  - `src/components/graph/CrystalNode.tsx:154-161` — Existing retrievability progress bar pattern: `h-1.5 w-full rounded-full bg-black/40` track with colored fill. Re-use this exact pattern.
  - `src/app/app/review/page.tsx:29-30` — State variables `currentIndex` and `crystals` — these drive the progress calculation.

  **WHY Each Reference Matters**:
  - `review/page.tsx:133-134`: This is the exact text being replaced — agent must find and modify this location
  - `CrystalNode.tsx:154-161`: Provides the established progress bar visual pattern used in the app — consistency is key
  - `review/page.tsx:29-30`: The state variables needed for the calculation are already in scope

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Progress bar shows correct progress during review
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, multiple crystals due for review
    Steps:
      1. Navigate to: http://localhost:3000/app/review
      2. Wait for: review page loaded (timeout: 10s)
      3. Assert: Progress bar element visible
      4. Assert: Progress text shows "1 of N" or similar
      5. Click: "Show Answer" button
      6. Click: "Good" rating button
      7. Wait for: next card (timeout: 3s)
      8. Assert: Progress bar width increased
      9. Assert: Progress text shows "2 of N"
      10. Screenshot: .sisyphus/evidence/task-6-progress-bar.png
    Expected Result: Progress bar advances with each review
    Evidence: .sisyphus/evidence/task-6-progress-bar.png
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(review): add session progress bar`
  - Files: `src/app/app/review/page.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 7. Review Page Mobile Responsiveness

  **What to do**:
  - Make the review page (`/app/review`) usable on mobile screens (< 768px width)
  - **Responsive adjustments**:
    - Flashcard container: change `max-w-2xl` to responsive sizing, reduce padding on small screens
    - Card height: change `h-[500px]` (line 140) to `h-auto min-h-[300px]` on mobile, keep 500px on desktop
    - Rating buttons grid: change `grid-cols-4` to `grid-cols-2` on small screens (`sm:grid-cols-4`)
    - Button text: keep "Again/Hard/Good/Easy" labels but allow wrapping
    - Font sizes: slightly reduce `text-2xl` title to `text-xl` on mobile
    - Padding: reduce `p-8` to `p-4` on mobile, `sm:p-8` on desktop
    - "Show Answer" button: full width on mobile
  - **Sidebar interaction**: On mobile, sidebar should auto-collapse or use overlay mode. Since the sidebar (Task 2) is implemented as collapsible, on screens < 1024px the sidebar should start collapsed. The review page specifically should work without sidebar visible.
  - **Desktop message**: Keep the "best on desktop" message on the MAIN app page (`/app`), but NOT on the review page. Review page should be accessible on all screen sizes.
  - Ensure the layout header is also responsive (it already is via `hidden sm:inline-block` patterns)

  **Must NOT do**:
  - Do NOT make the chat page or graph page responsive (stays desktop-only)
  - Do NOT add touch gestures (swipe to rate, etc.)
  - Do NOT change the flashcard reveal/rate mechanics
  - Do NOT add a mobile navigation menu (sidebar handles this)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Pure CSS/responsive design work requiring careful breakpoint handling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Responsive design expertise, mobile-first CSS patterns
  - **Skills Evaluated but Omitted**:
    - `playwright`: Will verify via Playwright viewport but doesn't need as loaded skill

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential in Wave 3)
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: Task 8 (tour should work on the responsive review page)
  - **Blocked By**: Task 2 (sidebar must exist first for header/navigation cleanup)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/app/review/page.tsx:123-205` — Full review card render. Every class here needs responsive audit.
  - `src/app/app/review/page.tsx:140` — `h-[500px]` fixed height — problematic on mobile
  - `src/app/app/review/page.tsx:183` — `grid-cols-4` rating grid — too narrow on mobile
  - `src/app/app/review/page.tsx:124` — `p-8 pt-24` padding — too much on mobile
  - `src/app/app/page.tsx:11-14` — "best on desktop" message. This stays for the main page, but review page should NOT show it.
  - `src/app/(app)/layout.tsx:46-48` — `hidden sm:inline-block` pattern — existing responsive approach

  **WHY Each Reference Matters**:
  - `review/page.tsx:123-205`: This is the entire render output that needs responsive treatment — every line may need class changes
  - `page.tsx:11-14`: The mobile gatekeeper for `/app`. Review page must bypass this pattern.
  - `layout.tsx:46-48`: Shows the existing responsive utility approach — use `sm:` and `lg:` prefixes consistently

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Review page is usable on iPhone-sized screen
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in, crystals due for review
    Steps:
      1. Set viewport to: 375x667 (iPhone SE)
      2. Navigate to: http://localhost:3000/app/review
      3. Wait for: review card visible (timeout: 10s)
      4. Assert: Card is visible and not cut off
      5. Assert: Title text is readable (not overflowing)
      6. Assert: "Show Answer" button is visible and tappable
      7. Click: "Show Answer"
      8. Assert: Rating buttons are visible (may be 2x2 grid)
      9. Assert: All 4 rating buttons (Again/Hard/Good/Easy) are visible
      10. Assert: No horizontal scroll
      11. Screenshot: .sisyphus/evidence/task-7-mobile-review.png
    Expected Result: Review page fully usable at 375px width
    Evidence: .sisyphus/evidence/task-7-mobile-review.png

  Scenario: Review page works on tablet-sized screen
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport to: 768x1024 (iPad)
      2. Navigate to: http://localhost:3000/app/review
      3. Assert: Card centered, good proportions
      4. Assert: Rating buttons in 4-column layout
      5. Screenshot: .sisyphus/evidence/task-7-tablet-review.png
    Expected Result: Review page looks good on tablet
    Evidence: .sisyphus/evidence/task-7-tablet-review.png

  Scenario: Main app page still shows desktop message on mobile
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport to: 375x667
      2. Navigate to: http://localhost:3000/app
      3. Assert: Text "best experienced on desktop" visible
      4. Assert: Chat panel NOT visible
      5. Assert: Graph panel NOT visible
    Expected Result: Main page gated to desktop, review is not
    Evidence: Terminal verification
  ```

  **Commit**: YES
  - Message: `feat(review): make review page mobile responsive`
  - Files: `src/app/app/review/page.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 8. Onboarding Tour (driver.js)

  **What to do**:
  - **Step A: Install driver.js**
    - `npm install driver.js`
    - Lightweight (~5KB), no React wrapper needed, vanilla JS API

  - **Step B: Create `src/components/onboarding/OnboardingTour.tsx`**
    - Client component that initializes driver.js on mount
    - Check localStorage key `neurograph_tour_completed` — if `'true'`, do NOT show tour
    - Tour steps (max 5-6, short tooltips 1-2 sentences each):
      1. **Sidebar** (element: sidebar component): "Your conversations live here. Start a new chat or revisit past ones."
      2. **Chat Input** (element: chat textarea): "Ask questions, share YouTube links, or explore ideas. AI will identify key concepts."
      3. **Graph Panel** (element: graph section): "Your knowledge graph grows as you learn. Each crystal is a concept you've discussed."
      4. **Crystal Node** (element: first `.react-flow__node` if exists, or graph panel): "Click any crystal to see details, edit notes, and track your memory strength."
      5. **Review Badge** (element: ReviewBadge component): "When crystals are due for review, this badge lights up. Spaced repetition keeps your knowledge fresh."
    - On tour complete or dismissed: set `localStorage.setItem('neurograph_tour_completed', 'true')`
    - Tour theme: dark theme matching neural-* palette. driver.js supports custom CSS.
    - Add custom CSS for driver.js popover to match glassmorphism style

  - **Step C: Mount in layout**
    - Add `<OnboardingTour />` to `src/app/(app)/layout.tsx` (or the main app page)
    - Only renders on client side
    - Runs once on first mount if localStorage flag is not set

  - **Step D: Add "Start Tour" option**
    - Add a small "?" or "Tour" button in the sidebar footer (below Sign Out)
    - Clicking it resets localStorage and re-triggers the tour
    - This lets users replay the tour if needed

  **Must NOT do**:
  - Do NOT use react-joyride or heavy tour libraries (driver.js only, ~5KB)
  - Do NOT create elaborate multi-page wizard or modal onboarding
  - Do NOT exceed 6 tour steps
  - Do NOT make tooltip text longer than 2 sentences per step
  - Do NOT block the UI — tour should be dismissible at any point

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires installing a new library, creating a component, CSS customization, localStorage integration, and targeting specific DOM elements that must exist from previous tasks
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Tour visual styling, element targeting, dark theme CSS customization
  - **Skills Evaluated but Omitted**:
    - `playwright`: Will verify tour via Playwright but doesn't need as loaded skill

  **Parallelization**:
  - **Can Run In Parallel**: NO (must be last)
  - **Parallel Group**: Wave 4 (solo, final task)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 2, 4, 7 (all tour targets must exist: sidebar, detail panel, responsive review)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/(app)/layout.tsx` — Mount point for tour component. Add after `<AppLayoutContent>` children.
  - `src/components/chat/ChatInput.tsx:27` — Chat textarea element (tour step 2 target). Class: `.resize-none.rounded-xl` or use a data attribute.
  - `src/components/graph/GraphPanel.tsx:225` — Graph panel section with class `.graph-panel` (tour step 3 target)
  - `src/components/chat/ChatPanel.tsx:549` — Chat panel section with class `.chat-panel` (can be used as tour context)
  - `src/components/ReviewBadge.tsx` — Review badge component (tour step 5 target). Need to check if it has a stable class or add `data-tour="review-badge"`.

  **External References**:
  - driver.js docs: `https://driverjs.com/docs/installation` — Installation, API, custom theming
  - driver.js theming: `https://driverjs.com/docs/theming` — CSS variables for dark theme

  **WHY Each Reference Matters**:
  - `layout.tsx`: Tour component must mount at layout level to persist across page navigation
  - CSS selectors for each target: Tour steps need stable CSS selectors. If elements don't have unique classes, agent should add `data-tour="step-name"` attributes.
  - driver.js docs: Agent needs the exact API for `driver()` initialization, `defineSteps()`, and `drive()` methods

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `npm run build` succeeds
  - [ ] `driver.js` listed in `package.json` dependencies
  - [ ] OnboardingTour component created

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Tour appears on first visit
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in, localStorage cleared (no neurograph_tour_completed key)
    Steps:
      1. Execute JS: localStorage.removeItem('neurograph_tour_completed')
      2. Navigate to: http://localhost:3000/app
      3. Wait for: tour popover/overlay visible (timeout: 10s)
      4. Assert: First tooltip is visible with text about sidebar/conversations
      5. Assert: Backdrop/overlay highlights the target element
      6. Screenshot: .sisyphus/evidence/task-8-tour-step1.png
      7. Click: "Next" button in tour popover
      8. Assert: Second tooltip appears (about chat input)
      9. Continue clicking Next through all steps
      10. Assert: Tour completes (final step shows "Done" or "Finish")
      11. Click: Done/Finish
      12. Assert: Tour overlay disappears
      13. Assert: localStorage.getItem('neurograph_tour_completed') === 'true'
    Expected Result: Tour walks through all steps, sets localStorage on completion
    Evidence: .sisyphus/evidence/task-8-tour-step1.png

  Scenario: Tour does NOT appear on subsequent visits
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, localStorage has neurograph_tour_completed = 'true'
    Steps:
      1. Execute JS: localStorage.setItem('neurograph_tour_completed', 'true')
      2. Navigate to: http://localhost:3000/app
      3. Wait for: page fully loaded (timeout: 10s)
      4. Wait for: 3s (give tour time to appear if it would)
      5. Assert: No tour overlay/popover visible
    Expected Result: Tour suppressed by localStorage flag
    Evidence: Terminal verification

  Scenario: Tour can be dismissed mid-way
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, tour active (localStorage cleared)
    Steps:
      1. Execute JS: localStorage.removeItem('neurograph_tour_completed')
      2. Navigate to: http://localhost:3000/app
      3. Wait for: tour popover visible (timeout: 10s)
      4. Click: close/dismiss button (X) on tour popover
      5. Assert: Tour overlay disappears
      6. Assert: localStorage.getItem('neurograph_tour_completed') === 'true'
    Expected Result: Dismissing tour still sets completion flag
    Evidence: Terminal verification

  Scenario: "Start Tour" button retriggers tour
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, tour previously completed
    Steps:
      1. Navigate to: http://localhost:3000/app
      2. Assert: No tour visible
      3. Find and click: "Tour" or "?" button in sidebar
      4. Wait for: tour popover visible (timeout: 5s)
      5. Assert: First tour step appears
      6. Screenshot: .sisyphus/evidence/task-8-tour-restart.png
    Expected Result: Tour restarts from first step
    Evidence: .sisyphus/evidence/task-8-tour-restart.png
  ```

  **Commit**: YES
  - Message: `feat(onboarding): add guided tour with driver.js`
  - Files: `src/components/onboarding/OnboardingTour.tsx`, `src/app/(app)/layout.tsx`, `package.json`, `package-lock.json`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 0 | `chore(db): fix duplicate migration numbering` | migrations/* | `ls` check |
| 1 | `feat(app): add error boundaries to all app routes` | error.tsx (×3) | `npm run build` |
| 3 | `feat(api): add crystal editing with PATCH endpoint and content field` | migration (007), types, route | `npm run build` |
| 5 | `feat(chat): add stop generating button during AI streaming` | ChatInput, ChatPanel | `npm run build` |
| 2 | `feat(layout): extract sidebar navigation from ChatPanel` | AppSidebar, layout, ChatPanel, page, review | `npm run build` |
| 4 | `feat(graph): add crystal detail panel with inline editing` | CrystalDetailPanel, GraphPanel, CrystalNode | `npm run build` |
| 6 | `feat(review): add session progress bar` | review/page.tsx | `npm run build` |
| 7 | `feat(review): make review page mobile responsive` | review/page.tsx | `npm run build` |
| 8 | `feat(onboarding): add guided tour with driver.js` | OnboardingTour, layout, package.json | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: zero errors, successful build
npx vitest run         # Expected: all existing tests pass
```

### Final Checklist
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" items absent (no Ghost Nodes, no wiki-links, etc.)
- [ ] All tasks committed with passing builds
- [ ] Migration filenames are unique and sequential (001-007)
- [ ] Error boundaries catch and display errors gracefully
- [ ] Sidebar collapses/expands, navigates between pages
- [ ] Crystal detail panel opens on node click, allows editing
- [ ] Crystal edits persist, trigger embedding re-generation, set user_modified flag
- [ ] Review page usable on 375px mobile screen
- [ ] Onboarding tour appears once, respects localStorage
- [ ] Stop button visible and functional during AI streaming
- [ ] Progress bar advances during review session
- [ ] `npm run build` succeeds with zero errors
- [ ] Migration file `007_add_content_and_editing.sql` ready for Supabase deployment
