# NeuroGraph MVP — Generative Mastery Learning Platform

## TL;DR

> **Quick Summary**: Build the core loop of NeuroGraph — a domain-agnostic thinking companion where users explore topics through AI chat, crystallize insights into a personal knowledge graph, and retain knowledge through spaced repetition with soft decay warnings.
>
> **Deliverables**:
> - Next.js 15 application with split-view UI (chat left, knowledge graph right)
> - AI-powered chat with multi-provider support (Vercel AI SDK) + YouTube URL transcript ingestion
> - User-confirmed crystallization: AI suggests insights → user clicks to crystallize → node appears on graph with animation
> - PostgreSQL + pgvector for graph storage, embeddings, and user state
> - Graph-aware chat context via vector similarity (RAG)
> - Spaced repetition (SM-2) with visual decay indicators and flashcard-style review
> - Email magic link auth (Supabase)
>
> **Estimated Effort**: Large (13 implementation tasks)
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 8 → Task 9 → Task 11

---

## Context

### Original Request
Build "NeuroGraph" — a Generative Mastery Learning Platform based on the "Gas-to-Crystal" metaphor. Users explore topics freely through AI chat (gas state), insights are crystallized into atomic knowledge nodes (phase transition), and nodes form a persistent knowledge graph with spaced repetition (solid state). The user's real use case is an intellectual explorer following curiosity across domains (e.g., watching a Davos speech → diving into geopolitics, economics, and philosophy in a single conversation → wanting that web of connections visible and navigable).

### Interview Summary
**Key Discussions**:
- **Crystallization Model**: User-confirmed (AI suggests, user clicks to crystallize). LLM Bloom's classification is 60-75% accurate — too unreliable for automation.
- **Blocking Mechanics**: Soft warning only (visual decay, recommendations not walls). Preserves organic discovery ethos.
- **Architecture**: Simplified to single PostgreSQL + pgvector. Original spec called for Neo4j + Pinecone + PostgreSQL ($500-800/mo) — simplified to $20/mo.
- **AI SDK**: Stable `useChat` with tool calls, NOT experimental RSC `streamUI` (paused development, production bugs).
- **Domain**: Domain-agnostic. User values cross-domain exploration (roadmap.sh-style emergent paths).
- **Content Input**: YouTube URLs via transcript extraction. No other video sources, no PDFs, no general web scraping.
- **UI Layout**: Split view — chat left, graph right, always visible side-by-side.
- **Auth**: Email magic links via Supabase. Minimal.
- **LLM**: Multi-provider via Vercel AI SDK abstraction.
- **Tests**: Tests after implementation, plus agent-executed QA scenarios.

### Research Findings
- **No competitor ships auto knowledge graph from conversations** — genuine first-to-market opportunity.
- **pgvector is faster than Pinecone** at 75% less cost for <10k vectors. Recursive CTEs handle 2-3 hop graph queries in ~3ms.
- **Vercel AI SDK RSC is officially experimental** with paused development. Stable UI path (`useChat`) recommended by Vercel's own docs.
- **Bloom's taxonomy LLM classification**: 60-75% accuracy. Higher-order skills (Analyze, Evaluate, Create) are hardest.
- **Math Academy's hard blocking**: Works for retention, causes churn. Users report it "feels like punishment."
- **Generative UI in education**: No production examples exist. NeuroGraph would be first.
- **Competitors analyzed**: Math Academy, RemNote, Anki, Obsidian + AI, Knowt, Traverse, Andy Matuschak's Orbit.

### Metis Review
**Identified Gaps** (addressed):
- Crystal data model undefined → Resolved: defined below as simplified KnowledgeNode from spec
- Review interaction flow undefined → Resolved: flashcard-style self-rated review (SM-2)
- Edge creation mechanism undefined → Resolved: AI-suggested during crystallization + vector similarity
- Graph-aware chat context missing → Resolved: pgvector RAG (top-5 relevant crystals injected into system prompt)
- Chat context overflow unhandled → Resolved: sliding window with summarization
- YouTube transcript reliability unvalidated → Resolved: added spike task + fallback error handling
- Mobile UX unaddressed → Resolved: desktop-only with graceful degradation message
- Implementation order critical → Resolved: dependency-ordered task sequence

---

## Work Objectives

### Core Objective
Validate whether the core loop — chat freely, crystallize insights, build a personal knowledge graph, maintain it through spaced repetition — creates genuine value for intellectually curious people who want their explorations to compound over time.

### Concrete Deliverables
- Running Next.js 15 application deployed to Vercel
- Split-view UI: chat panel (left) + interactive knowledge graph (right)
- AI chat with streaming responses (multi-provider)
- YouTube URL transcript extraction and injection into chat context
- Crystallization flow: AI suggests → user confirms → node created with animation
- Knowledge graph with auto-suggested edges between related crystals
- Graph-aware chat: AI knows about user's existing crystals via pgvector RAG
- Spaced repetition engine (SM-2) with review page
- Visual decay indicators on graph nodes (color/opacity shift)
- Email magic link authentication

### Definition of Done
- [ ] User can sign in, chat with AI, crystallize insights, see them on graph, review decayed crystals — full loop works end-to-end
- [ ] `bun test` passes all tests
- [ ] Playwright E2E test completes the full core loop
- [ ] Application deploys successfully to Vercel

### Must Have
- Streaming AI chat with tool calls
- User-confirmed crystallization (not automatic)
- Interactive knowledge graph (React Flow) with live updates
- AI-suggested edges between related crystals
- Graph-aware chat context (RAG)
- Spaced repetition with visual decay
- Flashcard-style review page
- YouTube URL support
- Email magic link auth

### Must NOT Have (Guardrails)
- **No crystal editing UI in MVP** — AI generates, user accepts or dismisses
- **No hard blocking** — decay is visual warning only, never locks nodes
- **No Ghost Nodes or FIRe** — post-MVP features
- **No custom graph layout algorithms** — React Flow built-in layouts only (dagre/elkjs)
- **No graph minimap, search, or filtering** — each is a feature unto itself
- **No chat branching, regeneration, or model selection UI** — not core loop
- **No conversation search or tagging** — not core loop
- **No prompt management system** — hardcoded system prompts as constants
- **No token counting or cost tracking UI** — operational concern
- **No video embedding, timestamp linking, or playback** — YouTube = transcript extraction only
- **No mobile-responsive split view** — desktop-only, "best on desktop" message below 1024px
- **No OAuth providers** — email magic link only
- **No profile page, settings page, or account management** — just login/logout
- **No graph editing beyond**: create node (crystallize), create edge (AI-suggested), delete node
- **No "smart" features** beyond crystallization: no gap detection, no path recommendation, no auto-clustering
- **Maximum 1 crystallization suggestion visible at a time** — no decision paralysis
- **Maximum 200 nodes rendered** — paginate/cluster beyond that

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> Every criterion is verified by running a command or using a tool.

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **Automated tests**: YES — Tests after implementation
- **Framework**: Vitest (unit/integration) + Playwright (E2E)
- **Setup**: Included as Task 12

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)
Every task includes Playwright, curl, or interactive_bash verification scenarios.
QA scenarios are the PRIMARY verification method.
All evidence captured to `.sisyphus/evidence/`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Project scaffolding + dependencies

Wave 2 (After Wave 1):
├── Task 2: Database schema + migrations (depends: 1)
└── Task 3: Auth — email magic links (depends: 1)

Wave 3 (After Wave 2):
├── Task 4: AI Chat — streaming + multi-provider (depends: 2, 3)
└── Task 5: Graph visualization — React Flow split view (depends: 2)

Wave 4 (After Wave 3):
├── Task 6: Crystallization flow — suggest + confirm + save (depends: 4, 5)
├── Task 7: YouTube URL transcript extraction (depends: 4)
└── Task 8: Edge creation — AI-suggested + vector similarity (depends: 6)

Wave 5 (After Wave 4):
├── Task 9: Graph-aware chat context — pgvector RAG (depends: 6, 8)
├── Task 10: Spaced repetition engine + review page (depends: 6)
└── Task 11: Decay visualization on graph nodes (depends: 5, 10)

Final (After Wave 5):
├── Task 12: Test infrastructure + tests (depends: all above)
└── Task 13: E2E core loop verification (depends: 12)

Critical Path: 1 → 2 → 4 → 6 → 8 → 9 → 12 → 13
Parallel Speedup: ~45% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None (first) |
| 2 | 1 | 4, 5, 6, 8, 10 | 3 |
| 3 | 1 | 4 | 2 |
| 4 | 2, 3 | 6, 7, 9 | 5 |
| 5 | 2 | 6, 11 | 3, 4 |
| 6 | 4, 5 | 8, 9, 10 | 7 |
| 7 | 4 | None | 6, 8 |
| 8 | 6 | 9 | 7, 10 |
| 9 | 6, 8 | 12 | 10, 11 |
| 10 | 6 | 11, 12 | 8, 9 |
| 11 | 5, 10 | 12 | 9 |
| 12 | all 1-11 | 13 | None |
| 13 | 12 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Categories |
|------|-------|----------------------|
| 1 | 1 | quick |
| 2 | 2, 3 | unspecified-low (parallel) |
| 3 | 4, 5 | unspecified-high, visual-engineering (parallel) |
| 4 | 6, 7, 8 | deep, quick, unspecified-low (parallel) |
| 5 | 9, 10, 11 | deep, unspecified-high, visual-engineering (parallel) |
| Final | 12, 13 | unspecified-high, deep |

---

## Data Model (Critical Foundation)

### Crystal Node (simplified from spec's KnowledgeNode)
```typescript
type Crystal = {
  id: string;                // UUID
  user_id: string;           // FK to auth.users
  title: string;             // e.g., "Vaclav Havel's Greengrocer Allegory"
  definition: string;        // Concise summary (max 280 chars)
  core_insight: string;      // The key takeaway from the conversation
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  source_conversation_id: string; // FK to conversations
  source_message_ids: string[];   // Which messages spawned this crystal
  embedding: number[];       // pgvector embedding for similarity search

  // Spaced Repetition (SM-2)
  stability: number;         // Current interval in days
  ease_factor: number;       // SM-2 ease factor (default 2.5, min 1.3)
  retrievability: number;    // Computed: e^(-t/S) where t=days since last review
  last_review: Date | null;
  next_review_due: Date | null;
  review_count: number;
  consecutive_correct: number;

  created_at: Date;
  updated_at: Date;
};
```

### Edge (Crystal Relationship)
```typescript
type CrystalEdge = {
  id: string;
  user_id: string;
  source_crystal_id: string;
  target_crystal_id: string;
  type: 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
  weight: number;            // 0.0-1.0 strength of connection
  ai_suggested: boolean;     // Was this edge AI-generated?
  created_at: Date;
};
```

### Conversation
```typescript
type Conversation = {
  id: string;
  user_id: string;
  title: string;             // Auto-generated from first message
  created_at: Date;
  updated_at: Date;
};

type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  youtube_url?: string;      // If message included a YouTube URL
  created_at: Date;
};
```

---

## TODOs

- [x] 1. Project Scaffolding + Dependencies

  **What to do**:
  - Initialize Next.js 15 project with App Router **inside the existing `NeuroGraph/` directory** (which already exists with `specifications.md`). Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir` from within the NeuroGraph folder (note the `.` — scaffolds into current directory, NOT creating a nested subdirectory)
  - Install core dependencies:
    - `ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google` (Vercel AI SDK multi-provider)
    - `@supabase/supabase-js @supabase/ssr` (auth + database)
    - `@xyflow/react` (React Flow v12 for graph)
    - `zustand` (state management)
    - `framer-motion` (animations)
    - `zod` (schema validation)
  - Set up project structure:
    ```
    src/
    ├── app/                    # Next.js App Router pages
    │   ├── (auth)/             # Auth routes (login, callback)
    │   ├── (app)/              # Authenticated app routes
    │   │   ├── page.tsx        # Main split-view (chat + graph)
    │   │   └── review/         # Review page
    │   ├── api/                # API routes
    │   │   ├── chat/           # AI chat endpoint
    │   │   ├── crystals/       # Crystal CRUD
    │   │   └── youtube/        # YouTube transcript
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── chat/               # Chat panel components
    │   ├── graph/              # Graph panel components
    │   ├── review/             # Review components
    │   └── ui/                 # Shared UI primitives
    ├── lib/
    │   ├── db/                 # Database client + queries
    │   ├── ai/                 # AI provider config + prompts
    │   ├── srs/                # Spaced repetition logic
    │   └── youtube/            # YouTube transcript extraction
    ├── stores/                 # Zustand stores
    └── types/                  # TypeScript types
    ```
  - Configure TailwindCSS with dark theme (background `#0a0a0a`, accent colors cyan/purple per spec)
  - Set up environment variables template (`.env.example`)
  - Verify dev server starts: `bun dev` → localhost:3000 renders

  **Must NOT do**:
  - No component library (shadcn, etc.) unless genuinely needed — keep lean
  - No Storybook or design system
  - No CI/CD setup (Vercel handles deployment)
  - No Docker or containerization

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard project scaffolding with clear dependencies list. No architectural decisions needed.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Tailwind config with dark theme requires design sensibility
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for scaffolding
    - `git-master`: Not needed yet

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None (first task)

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:108-114` — UI/UX guidelines: Dark Neural theme, color scheme (#0a0a0a, cyan/purple accents)
  - `NeuroGraph/specifications.md:23-26` — Frontend stack: Next.js 15, React Flow, Zustand, TailwindCSS, Framer Motion

  **External References**:
  - Next.js 15 App Router docs: https://nextjs.org/docs/app
  - React Flow v12 (renamed to @xyflow/react): https://reactflow.dev/
  - Vercel AI SDK: https://ai-sdk.dev/docs
  - Supabase Auth with Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs

  **Acceptance Criteria**:

  ```
  Scenario: Dev server starts and renders
    Tool: Bash
    Preconditions: Project initialized in NeuroGraph/
    Steps:
      1. cd NeuroGraph && bun install
      2. bun dev (background, wait 10s for compilation)
      3. curl -s http://localhost:3000 → Assert HTTP 200
      4. Assert response body contains "NeuroGraph" or Next.js root element
    Expected Result: Dev server runs, renders page
    Evidence: curl output captured

  Scenario: All dependencies installed correctly
    Tool: Bash
    Steps:
      1. cat NeuroGraph/package.json
      2. Assert "ai" in dependencies
      3. Assert "@xyflow/react" in dependencies
      4. Assert "@supabase/supabase-js" in dependencies
      5. Assert "zustand" in dependencies
      6. Assert "framer-motion" in dependencies
      7. bun run build → Assert exit code 0
    Expected Result: All deps present, project builds
    Evidence: package.json contents + build output

  Scenario: Project structure matches spec
    Tool: Bash
    Steps:
      1. ls -R NeuroGraph/src/
      2. Assert directories: app/, components/, lib/, stores/, types/
      3. Assert subdirectories: components/chat/, components/graph/, lib/db/, lib/ai/
    Expected Result: Directory structure matches plan
    Evidence: ls output
  ```

  **Commit**: YES
  - Message: `feat(scaffold): initialize Next.js 15 project with core dependencies and structure`
  - Files: entire project scaffold
  - Pre-commit: `bun run build`

---

- [x] 2. Database Schema + Migrations

  **What to do**:
  - Set up Supabase project (or Neon PostgreSQL) with pgvector extension
  - Create SQL migration files for the complete data model:
    - Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
    - `crystals` table (id, user_id, title, definition, core_insight, bloom_level, source_conversation_id, source_message_ids, embedding vector(1536), stability, ease_factor, retrievability, last_review, next_review_due, review_count, consecutive_correct, created_at, updated_at)
    - `crystal_edges` table (id, user_id, source_crystal_id, target_crystal_id, type, weight, ai_suggested, created_at)
    - `conversations` table (id, user_id, title, created_at, updated_at)
    - `messages` table (id, conversation_id, role, content, youtube_url, created_at)
    - Indexes: GIN index on `crystals.embedding` using `ivfflat` or `hnsw`, B-tree on user_id + foreign keys, index on `next_review_due` for review queries
    - RLS (Row Level Security) policies: users can only access their own data
  - Create database client utility in `src/lib/db/`
  - Create typed query helpers for:
    - CRUD operations on crystals
    - Crystal neighborhood query (recursive CTE, 2-hop max)
    - Crystals due for review (where `next_review_due <= NOW()`)
    - Vector similarity search (`ORDER BY embedding <=> $1 LIMIT 5`)
  - Seed script with sample data for development (5 crystals, 6 edges, 1 conversation)
  - **Technical spike**: Test recursive CTE performance with 500 nodes + 1500 edges → assert < 100ms

  **Must NOT do**:
  - No ORM (Prisma, Drizzle) — use Supabase client directly for simplicity
  - No complex graph algorithms (PageRank, community detection)
  - No graph traversal deeper than 3 hops
  - No materialized views (premature optimization)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Database design is foundational and requires careful schema decisions. Medium complexity.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No frontend work
    - `playwright`: No browser testing needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 4, 5, 6, 8, 10
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:41-78` — Complete data model: KnowledgeNode, Relationship, UserNodeState types
  - `NeuroGraph/specifications.md:34-38` — Data layer architecture: graph, vector, relational requirements

  **API/Type References**:
  - Data model section in this plan (Crystal, CrystalEdge, Conversation, Message types)

  **External References**:
  - Supabase pgvector guide: https://supabase.com/docs/guides/ai/vector-columns
  - PostgreSQL recursive CTEs: https://www.postgresql.org/docs/current/queries-with.html
  - Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

  **WHY Each Reference Matters**:
  - Spec data model provides the source-of-truth schema (adapted for MVP simplification)
  - pgvector guide shows embedding storage + similarity search syntax
  - Recursive CTE docs needed for crystal neighborhood queries

  **Acceptance Criteria**:

  ```
  Scenario: All tables created with correct columns
    Tool: Bash (Supabase CLI or psql)
    Steps:
      1. Run migration: supabase db push (or psql -f migration.sql)
      2. Query: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
      3. Assert tables exist: crystals, crystal_edges, conversations, messages
      4. Query: SELECT column_name FROM information_schema.columns WHERE table_name = 'crystals'
      5. Assert columns include: id, user_id, title, definition, core_insight, bloom_level, embedding, stability, ease_factor, next_review_due
    Expected Result: All tables and columns present
    Evidence: Query outputs captured

  Scenario: pgvector extension works for similarity search
    Tool: Bash (psql)
    Steps:
      1. INSERT a crystal with a test embedding (1536-dim vector)
      2. Run similarity query: SELECT id, embedding <=> '[test vector]' AS distance FROM crystals ORDER BY distance LIMIT 5
      3. Assert query returns results within 50ms
    Expected Result: Vector similarity search functional
    Evidence: Query result + timing

  Scenario: Recursive CTE neighborhood query performs under 100ms
    Tool: Bash (psql)
    Steps:
      1. Run seed script: INSERT 500 crystals + 1500 edges
      2. Run neighborhood query: WITH RECURSIVE walk AS (...) SELECT * FROM walk WHERE depth <= 2
      3. Assert: query execution time < 100ms (use EXPLAIN ANALYZE)
    Expected Result: Graph traversal performant at expected scale
    Evidence: EXPLAIN ANALYZE output

  Scenario: RLS policies enforce user isolation
    Tool: Bash (psql)
    Steps:
      1. Insert crystal as user_A
      2. Query crystals as user_B
      3. Assert: user_B sees 0 results
    Expected Result: Row-level security prevents cross-user data access
    Evidence: Query results
  ```

  **Commit**: YES
  - Message: `feat(db): add PostgreSQL schema with pgvector for crystals, edges, conversations`
  - Files: `src/lib/db/`, migration files, seed script
  - Pre-commit: migration runs without errors

---

- [x] 3. Authentication — Email Magic Links

  **What to do**:
  - Configure Supabase Auth with email magic link provider
  - Create auth middleware for Next.js App Router (protect `/(app)` routes)
  - Build minimal login page at `/(auth)/login`:
    - Email input field
    - "Send Magic Link" button
    - Success message: "Check your email for the login link"
    - Error handling for invalid email format
  - Build auth callback handler at `/(auth)/callback`
  - Create auth context/hook for client components (`useAuth()`)
  - Add logout button (no profile page, no settings)
  - Redirect unauthenticated users to `/login`
  - First magic link auto-creates account (no separate signup)
  - Desktop-only: show "NeuroGraph is best experienced on desktop" message for viewports < 1024px
  - **E2E test auth strategy**: Create a test helper that bypasses magic link for automated testing. Use Supabase Admin API (`supabase.auth.admin.createUser()` + `supabase.auth.admin.generateLink()`) to programmatically create sessions without email-clicking. Alternatively, use Supabase local dev stack (`supabase start`) which captures emails via Inbucket at `localhost:54324`. Document this approach so Task 13 (E2E) can authenticate without human intervention.

  **Must NOT do**:
  - No OAuth providers (Google, GitHub)
  - No profile page or settings page
  - No account deletion flow
  - No data export
  - No "remember me" or session management UI

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard Supabase auth setup with well-documented patterns. Low complexity.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Login page needs to match Dark Neural theme
  - **Skills Evaluated but Omitted**:
    - `playwright`: Can use for QA but not primary skill needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - Supabase Auth with Next.js SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
  - Supabase Auth magic links: https://supabase.com/docs/guides/auth/auth-email-passwordless

  **Acceptance Criteria**:

  ```
  Scenario: User signs in via magic link
    Tool: Playwright (playwright skill)
    Preconditions: Supabase project configured, dev server running
    Steps:
      1. Navigate to http://localhost:3000/login
      2. Wait for input[type="email"] visible (timeout: 5s)
      3. Fill input[type="email"] with "test@example.com"
      4. Click button containing "Send Magic Link"
      5. Wait for text "Check your email" visible (timeout: 5s)
      6. Assert page shows success message
      7. Screenshot: .sisyphus/evidence/task-3-login-page.png
    Expected Result: Magic link request sent, success message shown
    Evidence: .sisyphus/evidence/task-3-login-page.png

  Scenario: Unauthenticated user redirected to login
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to http://localhost:3000/ (main app route, no auth)
      2. Wait for navigation (timeout: 5s)
      3. Assert URL contains "/login"
    Expected Result: Redirect to login page
    Evidence: URL assertion

  Scenario: Desktop-only message on small viewport
    Tool: Playwright (playwright skill)
    Steps:
      1. Set viewport to 768x1024 (tablet)
      2. Navigate to http://localhost:3000/login
      3. Assert text "best experienced on desktop" is visible
      4. Screenshot: .sisyphus/evidence/task-3-mobile-message.png
    Expected Result: Mobile warning message displayed
    Evidence: .sisyphus/evidence/task-3-mobile-message.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add Supabase email magic link authentication`
  - Files: `src/app/(auth)/`, middleware, auth hooks
  - Pre-commit: `bun run build`

---

- [x] 4. AI Chat — Streaming + Multi-Provider

  **What to do**:
  - Create chat API route at `src/app/api/chat/route.ts` using Vercel AI SDK
  - Configure multi-provider support:
    - Default provider configurable via `AI_PROVIDER` env var
    - Support OpenAI (gpt-4o), Anthropic (claude-sonnet), Google (gemini-pro)
    - Provider abstraction: all use the same `streamText()` interface
  - Build chat UI in `src/components/chat/`:
    - `ChatPanel.tsx` — main container (left side of split view)
    - `MessageList.tsx` — scrollable message history with streaming support
    - `ChatInput.tsx` — text input with send button, YouTube URL detection
    - `CrystallizationSuggestion.tsx` — inline suggestion card (rendered via tool call)
  - Implement conversation persistence:
    - Create conversation on first message
    - Save all messages to database (messages table)
    - Load conversation history from DB on mount
    - Chat history sidebar: flat list, most recent first
  - Implement system prompt (hardcoded constant):
    - Role: knowledgeable, Socratic, encouraging exploration
    - Instructions: identify when user reaches an insight worth crystallizing
    - Context injection slot: for existing crystals (implemented in Task 9)
  - Register `suggest_crystallization` tool call:
    - AI calls this tool when it detects a crystallizable insight
    - Tool renders `CrystallizationSuggestion` component in the chat
    - User sees: title, definition preview, "Crystallize" button
    - Maximum 1 suggestion visible at a time
  - Handle chat context overflow: sliding window — keep last 30 messages + summary of earlier context

  **Must NOT do**:
  - No chat branching or message regeneration
  - No model selection UI (env var only)
  - No token counting display
  - No conversation search, tagging, or folders
  - No real-time collaboration
  - No prompt management system — hardcode system prompts as exported constants in `src/lib/ai/prompts.ts`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core feature with streaming, tool calls, multi-provider abstraction, and conversation persistence. Medium-high complexity.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Chat UI requires polished streaming UX, Dark Neural theme
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only, not primary implementation skill

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Tasks 6, 7, 9
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:29-31` — AI orchestration: Vercel AI SDK for streaming + tool calls, custom pipeline
  - `NeuroGraph/specifications.md:99-106` — Component registry: ConceptVisualizer, CodeSandbox, SocraticChat, QuizCard

  **External References**:
  - Vercel AI SDK useChat: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
  - Vercel AI SDK tool calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
  - Vercel AI SDK multi-provider: https://ai-sdk.dev/docs/ai-sdk-core/settings#model

  **WHY Each Reference Matters**:
  - `useChat` hook is the stable path for streaming chat UI (NOT `streamUI` which is experimental)
  - Tool calling docs show how to register `suggest_crystallization` as a tool the AI can invoke
  - Multi-provider docs show the abstraction layer for switching between OpenAI/Anthropic/Google

  **Acceptance Criteria**:

  ```
  Scenario: Chat streams AI response
    Tool: Playwright (playwright skill)
    Preconditions: Auth session active, dev server running, AI_PROVIDER env configured
    Steps:
      1. Navigate to http://localhost:3000/
      2. Wait for chat input visible
      3. Type "Explain the concept of supply and demand" in chat input
      4. Click send button (or press Enter)
      5. Wait for .message-assistant element visible (timeout: 30s)
      6. Assert: streaming text appears progressively (not all at once)
      7. Assert: response contains relevant content about supply/demand
      8. Screenshot: .sisyphus/evidence/task-4-chat-streaming.png
    Expected Result: AI streams a response about supply and demand
    Evidence: .sisyphus/evidence/task-4-chat-streaming.png

  Scenario: Crystallization suggestion appears via tool call
    Tool: Playwright (playwright skill)
    Steps:
      1. Have a multi-message conversation building depth on a topic
      2. Send a message demonstrating analytical thinking (e.g., "So the real insight is that supply elasticity depends on time horizon because...")
      3. Wait for .crystallization-suggestion element visible (timeout: 30s)
      4. Assert: suggestion shows a title and definition preview
      5. Assert: "Crystallize" button is visible
      6. Screenshot: .sisyphus/evidence/task-4-crystallization-suggestion.png
    Expected Result: AI tool call renders crystallization suggestion inline
    Evidence: .sisyphus/evidence/task-4-crystallization-suggestion.png

  Scenario: Conversation persists across page reload
    Tool: Playwright (playwright skill)
    Steps:
      1. Send a message in chat
      2. Wait for AI response
      3. Reload page (F5)
      4. Wait for chat panel to load (timeout: 5s)
      5. Assert: previous messages are still visible
    Expected Result: Conversation history loaded from database
    Evidence: Message presence assertion

  Scenario: Chat API responds correctly
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/api/chat \
           -H "Content-Type: application/json" \
           -H "Cookie: [auth-session-cookie]" \
           -d '{"messages":[{"role":"user","content":"Hello"}]}'
      2. Assert: HTTP 200
      3. Assert: response is streaming (Transfer-Encoding: chunked or text/event-stream)
    Expected Result: Chat API streams response
    Evidence: Response headers + body
  ```

  **Commit**: YES
  - Message: `feat(chat): add AI chat with streaming, tool calls, and conversation persistence`
  - Files: `src/app/api/chat/`, `src/components/chat/`, `src/lib/ai/`
  - Pre-commit: `bun run build`

---

- [x] 5. Graph Visualization — React Flow Split View

  **What to do**:
  - Build the main split-view layout:
    - `src/app/(app)/page.tsx` — flexbox split: chat panel (left, ~40%) + graph panel (right, ~60%)
    - Draggable divider between panels (optional nice-to-have)
  - Create graph components in `src/components/graph/`:
    - `GraphPanel.tsx` — React Flow canvas wrapper with controls
    - `CrystalNode.tsx` — custom React Flow node component:
      - Shows crystal title
      - Color indicator for retrievability state (bright = fresh, dim = decaying)
      - Click to select (shows details in a tooltip or small panel)
      - Visual states: LEARNING (cyan glow), MASTERED (solid bright), DECAYING (amber/red fade)
    - `CrystalEdge.tsx` — custom edge with type indicator (prerequisite = solid, related = dashed)
  - Use React Flow's built-in dagre layout algorithm for automatic positioning
  - Create Zustand store for graph state:
    - `src/stores/graphStore.ts` — nodes, edges, selected node, add/remove operations
    - Sync with database: load user's crystals + edges on mount, update on crystallization
  - Graph renders user's existing crystals from database
  - New crystal nodes animate in (Framer Motion) when crystallized
  - Zoom, pan, fit-to-view controls (React Flow built-in)
  - Empty state: when no crystals exist, show encouraging message ("Start a conversation to build your knowledge graph")

  **Must NOT do**:
  - No custom force-directed physics or layout algorithms
  - No minimap, graph search, or filtering
  - No graph editing UI (no drag-to-connect, no manual node creation)
  - No node clustering or grouping
  - No edge labels or annotations
  - Maximum 200 visible nodes (show message if exceeded)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Highly visual task — React Flow custom nodes, animations, split-view layout, dark theme styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Graph node design, animation polish, dark neural theme implementation
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: Tasks 6, 11
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:24` — React Flow for graph rendering, custom nodes
  - `NeuroGraph/specifications.md:108-114` — UI/UX guidelines: Dark Neural theme, node visual states (Mastered: luminous/pulsing, Decay: trembling/red, Ghost: 30% opacity dashed)

  **External References**:
  - React Flow custom nodes: https://reactflow.dev/learn/customization/custom-nodes
  - React Flow dagre layout: https://reactflow.dev/examples/layout/dagre
  - Framer Motion layout animations: https://www.framer.com/motion/layout-animations/

  **WHY Each Reference Matters**:
  - Custom node docs show how to build CrystalNode with custom rendering, colors, and click handlers
  - Dagre layout provides automatic node positioning without custom physics
  - Framer Motion layout animations enable the "node birth" animation when a crystal is created

  **Acceptance Criteria**:

  ```
  Scenario: Split view renders chat and graph side-by-side
    Tool: Playwright (playwright skill)
    Preconditions: Auth session active, dev server running
    Steps:
      1. Navigate to http://localhost:3000/
      2. Set viewport to 1440x900
      3. Wait for both .chat-panel and .graph-panel visible (timeout: 5s)
      4. Assert: .chat-panel width is approximately 40% of viewport
      5. Assert: .graph-panel width is approximately 60% of viewport
      6. Screenshot: .sisyphus/evidence/task-5-split-view.png
    Expected Result: Two-panel layout renders correctly
    Evidence: .sisyphus/evidence/task-5-split-view.png

  Scenario: Graph renders existing crystals from database
    Tool: Playwright (playwright skill)
    Preconditions: User has 3 crystals in database (from seed data)
    Steps:
      1. Navigate to http://localhost:3000/
      2. Wait for .react-flow element visible
      3. Assert: 3 crystal node elements exist in the graph
      4. Assert: each node shows a title text
      5. Screenshot: .sisyphus/evidence/task-5-graph-nodes.png
    Expected Result: Graph displays seeded crystal nodes
    Evidence: .sisyphus/evidence/task-5-graph-nodes.png

  Scenario: Empty state shows encouraging message
    Tool: Playwright (playwright skill)
    Preconditions: New user with 0 crystals
    Steps:
      1. Navigate to http://localhost:3000/
      2. Wait for .graph-panel visible
      3. Assert: text containing "Start a conversation" is visible in graph panel
      4. Screenshot: .sisyphus/evidence/task-5-empty-state.png
    Expected Result: Empty graph shows onboarding message
    Evidence: .sisyphus/evidence/task-5-empty-state.png

  Scenario: Graph zoom and pan work
    Tool: Playwright (playwright skill)
    Steps:
      1. With graph visible, scroll mouse wheel on graph area (zoom)
      2. Assert: zoom level changes (React Flow transform changes)
      3. Click and drag on graph background (pan)
      4. Assert: viewport position changes
    Expected Result: Standard React Flow interactions work
    Evidence: Interaction assertion
  ```

  **Commit**: YES
  - Message: `feat(graph): add React Flow knowledge graph with split-view layout and custom crystal nodes`
  - Files: `src/app/(app)/page.tsx`, `src/components/graph/`, `src/stores/graphStore.ts`
  - Pre-commit: `bun run build`

---

- [x] 6. Crystallization Flow — Suggest + Confirm + Save

  **What to do**:
  - This is the **core innovation**: connecting chat to graph. Implementation:
  - **AI Side** (in chat API route):
    - The `suggest_crystallization` tool is registered with the AI provider
    - When AI detects an insight (user demonstrates analytical/evaluative thinking), it calls the tool
    - Tool parameters: `{ title: string, definition: string, core_insight: string, bloom_level: string }`
    - AI generates these fields based on the conversation context
  - **UI Side** (in chat panel):
    - Tool call renders `CrystallizationSuggestion` component inline in the chat
    - Shows: title, definition preview (280 char max), bloom level badge
    - "Crystallize" button (primary, prominent) and "Dismiss" (secondary, subtle)
    - Only 1 suggestion visible at a time (dismiss previous if new one arrives)
  - **Save Flow** (when user clicks "Crystallize"):
    - Generate embedding for the crystal content (title + definition + core_insight) via AI embedding model
    - POST to `src/app/api/crystals/route.ts`:
      - Create crystal record in database with full schema
      - Store embedding in pgvector column
      - Link to source conversation + source messages
      - Set initial SM-2 values: stability=1, ease_factor=2.5, next_review_due=tomorrow
    - Update Zustand graph store: add new node
    - **Animation**: new node "flies" from chat panel to its position on the graph (Framer Motion shared layout animation)
    - React Flow re-layouts to accommodate new node (dagre)
  - **Dismiss Flow**: suggestion card fades out, no database action

  **Must NOT do**:
  - No editing of AI-generated crystal content (title, definition, etc.)
  - No manual crystal creation (only via crystallization from chat)
  - No batch crystallization (one at a time)
  - No crystallization from historical messages (only from current/recent conversation)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: This is the core feature connecting chat and graph. Requires careful integration of AI tool calls, database writes, state management, and animation. Needs deep understanding of the full system.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Crystallization animation, suggestion card design, visual feedback
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on both Task 4 and Task 5)
  - **Parallel Group**: Wave 4 (with Tasks 7, 8 — but 8 depends on 6)
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:82-90` — Crystallization Trigger algorithm: topic modeling, depth check, Bloom scoring, duplication check, ghost branching
  - `NeuroGraph/specifications.md:41-56` — KnowledgeNode schema: all fields the crystal should contain
  - Data model section in this plan — Crystal type definition (simplified for MVP)

  **API/Type References**:
  - Crystal type defined in this plan's Data Model section
  - CrystalEdge type defined in this plan's Data Model section

  **External References**:
  - Vercel AI SDK tool calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
  - Framer Motion shared layout: https://www.framer.com/motion/layout-animations/#shared-layout-animations
  - OpenAI embeddings API: https://platform.openai.com/docs/guides/embeddings

  **WHY Each Reference Matters**:
  - Spec's crystallization algorithm defines the AI's decision criteria (adapted: AI suggests, user confirms)
  - Tool calling docs show how to register the `suggest_crystallization` tool and handle its output
  - Shared layout animation docs enable the "fly from chat to graph" transition

  **Acceptance Criteria**:

  ```
  Scenario: Full crystallization flow — suggest, confirm, animate, persist
    Tool: Playwright (playwright skill)
    Preconditions: Auth active, chat and graph visible, no existing crystals
    Steps:
      1. Navigate to http://localhost:3000/
      2. Have a deep conversation (3-4 messages building analytical depth)
      3. Wait for .crystallization-suggestion visible (timeout: 60s)
      4. Assert: suggestion shows title, definition, bloom level
      5. Click "Crystallize" button
      6. Wait for new node to appear in .react-flow (timeout: 10s)
      7. Assert: graph now contains exactly 1 crystal node
      8. Assert: node title matches the suggestion title
      9. Screenshot: .sisyphus/evidence/task-6-crystallization-complete.png
    Expected Result: Crystal created, visible on graph
    Evidence: .sisyphus/evidence/task-6-crystallization-complete.png

  Scenario: Crystal persisted in database
    Tool: Bash (curl or psql)
    Steps:
      1. After crystallization (above scenario)
      2. Query: SELECT * FROM crystals WHERE user_id = '[test-user-id]'
      3. Assert: 1 row returned
      4. Assert: title, definition, core_insight are non-empty
      5. Assert: bloom_level is valid enum value
      6. Assert: embedding is not null (vector stored)
      7. Assert: stability = 1, ease_factor = 2.5
      8. Assert: next_review_due is approximately tomorrow
    Expected Result: Crystal fully persisted with all fields
    Evidence: Query output

  Scenario: Dismiss suggestion removes it from UI
    Tool: Playwright (playwright skill)
    Steps:
      1. Wait for .crystallization-suggestion visible
      2. Click "Dismiss" button
      3. Wait 2s
      4. Assert: .crystallization-suggestion is NOT visible
      5. Query crystals table: Assert 0 new rows created
    Expected Result: Suggestion dismissed, no database effect
    Evidence: UI assertion + query result

  Scenario: Crystal API rejects invalid data
    Tool: Bash (curl)
    Steps:
      1. POST /api/crystals with empty title: {"title":"","definition":"test"}
      2. Assert: HTTP 400
      3. POST /api/crystals with missing bloom_level
      4. Assert: HTTP 400
    Expected Result: Validation rejects malformed requests
    Evidence: Response status codes
  ```

  **Commit**: YES
  - Message: `feat(crystallize): add AI-suggested crystallization with confirm flow and graph animation`
  - Files: `src/app/api/crystals/`, `src/components/chat/CrystallizationSuggestion.tsx`, updated chat + graph components
  - Pre-commit: `bun run build`

---

- [x] 7. YouTube URL Transcript Extraction

  **What to do**:
  - Create YouTube utility in `src/lib/youtube/`:
    - Detect YouTube URLs in user messages (regex: youtube.com/watch, youtu.be/, youtube.com/shorts/)
    - Extract video ID from URL
    - Fetch transcript using `youtube-transcript` npm package (or `youtubei.js`)
    - Return transcript as plain text
  - Create API route at `src/app/api/youtube/transcript/route.ts`:
    - POST `{ url: string }` → returns `{ transcript: string, title: string }`
    - Error handling: no transcript available → return user-friendly error
  - Integrate with chat:
    - When user pastes a YouTube URL in chat input, auto-detect it
    - Show "Extracting transcript..." loading state
    - Inject transcript into the conversation context (as a system/context message)
    - AI can then answer questions about the video content
  - **Technical spike first**: Test with 20 diverse YouTube URLs:
    - English videos with manual captions
    - Videos with auto-generated captions
    - Long videos (>1 hour)
    - Non-English videos
    - Expected: ≥80% success rate. If not, mark YouTube as "beta" in UI.
  - For long transcripts (>8000 tokens): truncate or summarize before injecting into context

  **Must NOT do**:
  - No video embedding or playback in the app
  - No timestamp linking
  - No chapter extraction
  - No non-YouTube URL support
  - No audio transcription fallback (Whisper, etc.)
  - No playlist URL support (single video only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Self-contained utility: URL parsing, API call, text processing. Low coupling to other features.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Minimal UI (loading state only)
    - `playwright`: QA but not primary

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 6, 8)
  - **Blocks**: None (standalone utility)
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:118` — MVP priority: Chat functional (Vercel AI SDK) — YouTube extends chat

  **External References**:
  - youtube-transcript npm: https://www.npmjs.com/package/youtube-transcript
  - youtubei.js (alternative): https://github.com/LuanRT/YouTube.js

  **Acceptance Criteria**:

  ```
  Scenario: Transcript extracted from YouTube URL
    Tool: Bash (curl)
    Steps:
      1. POST http://localhost:3000/api/youtube/transcript
         -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
      2. Assert: HTTP 200
      3. Assert: response.transcript is non-empty string
      4. Assert: response.transcript length > 100 characters
    Expected Result: Transcript returned successfully
    Evidence: Response body

  Scenario: Invalid YouTube URL returns error
    Tool: Bash (curl)
    Steps:
      1. POST with non-YouTube URL: {"url":"https://example.com"}
      2. Assert: HTTP 400
      3. Assert: response.error contains "invalid YouTube URL" or similar
    Expected Result: Validation catches non-YouTube URLs
    Evidence: Error response

  Scenario: Video without transcript returns graceful error
    Tool: Bash (curl)
    Steps:
      1. POST with a known no-transcript video URL (or private video)
      2. Assert: HTTP 422 or 404
      3. Assert: response.error is user-friendly message
    Expected Result: Graceful error, not a crash
    Evidence: Error response

  Scenario: YouTube URL in chat triggers transcript injection
    Tool: Playwright (playwright skill)
    Steps:
      1. Paste a YouTube URL into chat input
      2. Send message
      3. Wait for "Extracting transcript" or similar loading indicator (timeout: 15s)
      4. Wait for AI response (timeout: 60s)
      5. Assert: AI response references video content (not a generic "I can't watch videos" response)
      6. Screenshot: .sisyphus/evidence/task-7-youtube-chat.png
    Expected Result: AI responds with knowledge of the video content
    Evidence: .sisyphus/evidence/task-7-youtube-chat.png
  ```

  **Commit**: YES
  - Message: `feat(youtube): add YouTube URL transcript extraction and chat integration`
  - Files: `src/lib/youtube/`, `src/app/api/youtube/`
  - Pre-commit: `bun run build`

---

- [ ] 8. Edge Creation — AI-Suggested + Vector Similarity

  **What to do**:
  - When a new crystal is created (Task 6), automatically find and suggest related crystals:
    - **Vector similarity**: Query pgvector for existing crystals with embedding distance < threshold (e.g., cosine distance < 0.3)
    - **AI suggestion**: Include in the crystallization tool call: `related_crystals: [{ id, title, relationship_type }]`
    - The AI sees the user's existing crystal titles (via system prompt) and suggests connections
  - Edge creation flow:
    - After crystal is created, show a brief "Connections found" notification
    - Auto-create edges for high-confidence relationships (vector distance < 0.2)
    - For medium-confidence (0.2-0.3): show suggestion to user, let them confirm/dismiss
    - Edge types: PREREQUISITE (directional — A is needed for B), RELATED (bidirectional), BUILDS_ON (directional — B extends A)
  - API route at `src/app/api/crystals/[id]/edges/route.ts`:
    - POST: create edge between two crystals
    - GET: get all edges for a crystal
    - DELETE: remove an edge
  - Update graph visualization:
    - New edges appear with animation when crystal is created
    - Edge styling by type: PREREQUISITE = solid arrow, RELATED = dashed line, BUILDS_ON = dotted arrow
  - Update Zustand store with edges

  **Must NOT do**:
  - No manual drag-to-connect in graph (edges are AI-suggested only)
  - No edge editing (change type, weight)
  - No edge labels or annotations
  - No complex graph algorithms to determine edge types

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Building on existing crystallization infrastructure. Vector queries + simple API endpoints.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Edge styling, connection notification UX
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 6)
  - **Parallel Group**: Wave 4 (after Task 6 completes)
  - **Blocks**: Task 9
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:57-62` — Relationship schema: source_id, target_id, type (HARD_PREREQUISITE, SOFT_ENABLER, RELATED_CONCEPT), weight
  - Data model section in this plan — CrystalEdge type

  **External References**:
  - pgvector similarity operators: https://github.com/pgvector/pgvector#querying
  - React Flow custom edges: https://reactflow.dev/learn/customization/custom-edges

  **Acceptance Criteria**:

  ```
  Scenario: Edges auto-created for related crystals
    Tool: Playwright (playwright skill)
    Preconditions: User has 2+ existing crystals on related topics
    Steps:
      1. Crystallize a new crystal related to existing ones
      2. Wait for graph to update (timeout: 10s)
      3. Assert: new edges visible between new crystal and existing ones
      4. Assert: edge count in graph > 0
      5. Screenshot: .sisyphus/evidence/task-8-edges-created.png
    Expected Result: Related crystals connected automatically
    Evidence: .sisyphus/evidence/task-8-edges-created.png

  Scenario: Edge API creates and retrieves edges
    Tool: Bash (curl)
    Steps:
      1. POST /api/crystals/[crystal-id]/edges with {"target_id":"[id]","type":"RELATED","weight":0.8}
      2. Assert: HTTP 201
      3. GET /api/crystals/[crystal-id]/edges
      4. Assert: response contains the created edge
    Expected Result: Edge CRUD works
    Evidence: API responses

  Scenario: Edges styled by type
    Tool: Playwright (playwright skill)
    Steps:
      1. With graph containing edges of different types
      2. Assert: PREREQUISITE edges have solid stroke style
      3. Assert: RELATED edges have dashed stroke style
    Expected Result: Visual differentiation of edge types
    Evidence: Screenshot of styled edges
  ```

  **Commit**: YES
  - Message: `feat(edges): add AI-suggested edge creation with vector similarity`
  - Files: `src/app/api/crystals/[id]/edges/`, updated graph components
  - Pre-commit: `bun run build`

---

- [ ] 9. Graph-Aware Chat Context — pgvector RAG

  **What to do**:
  - This makes the chat *aware* of the user's knowledge graph — the key differentiator from a generic chatbot.
  - **Context injection pipeline** (runs on every chat message):
    1. Generate embedding of the user's latest message
    2. Query pgvector: find top 5 most similar existing crystals
    3. Query PostgreSQL: find 1-hop neighbors of those crystals (for context)
    4. Format crystal summaries as context block
    5. Inject into system prompt: "The user has these existing crystals relevant to this conversation: [list with titles + definitions]"
  - **Benefits**:
    - AI knows what the user already understands → avoids re-explaining
    - AI can reference existing crystals: "This builds on your crystal about X"
    - Better crystallization suggestions: AI knows what's already crystallized
    - Smarter edge suggestions: AI can suggest connections to specific existing crystals
  - **Performance guard**: cache embeddings, limit to top-5 crystals, timeout at 500ms
  - Update system prompt template to include context injection slot
  - Handle cold start (0 crystals): skip RAG, use base system prompt

  **Must NOT do**:
  - No full graph traversal for context (only 1-hop neighbors of similar crystals)
  - No user-configurable context settings
  - No context debugging UI (no "show what the AI knows" panel)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding the full pipeline: embedding generation → vector search → graph query → prompt injection → AI response. Must handle performance and edge cases.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No frontend work
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 10, 11)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 6, 8

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:36-38` — Vector database purpose: de-duplication and semantic search
  - Data model section in this plan — Crystal type with embedding field

  **External References**:
  - Supabase vector similarity search: https://supabase.com/docs/guides/ai/vector-columns#query-your-data
  - Vercel AI SDK system prompt customization: https://ai-sdk.dev/docs/ai-sdk-core/prompts

  **WHY Each Reference Matters**:
  - pgvector query syntax needed for the similarity search
  - System prompt docs show how to dynamically inject crystal context per-request

  **Acceptance Criteria**:

  ```
  Scenario: AI references existing crystals in response
    Tool: Playwright (playwright skill)
    Preconditions: User has 3+ crystals including one about "supply and demand"
    Steps:
      1. Send message: "How does supply and demand relate to inflation?"
      2. Wait for AI response (timeout: 30s)
      3. Assert: AI response references or builds on the existing crystal (mentions it by concept or says "building on what you learned")
      4. Screenshot: .sisyphus/evidence/task-9-graph-aware-chat.png
    Expected Result: AI demonstrates awareness of user's existing knowledge
    Evidence: .sisyphus/evidence/task-9-graph-aware-chat.png

  Scenario: RAG pipeline returns relevant crystals
    Tool: Bash (curl)
    Steps:
      1. POST /api/chat with a message related to an existing crystal topic
      2. Inspect server logs or add debug header
      3. Assert: RAG pipeline found ≥1 relevant crystal
      4. Assert: pipeline completed within 500ms
    Expected Result: Relevant crystals retrieved efficiently
    Evidence: Server logs / timing output

  Scenario: Chat works with 0 crystals (cold start)
    Tool: Playwright (playwright skill)
    Preconditions: New user with 0 crystals
    Steps:
      1. Send a message
      2. Wait for AI response
      3. Assert: response is coherent (no errors from empty RAG results)
    Expected Result: Chat degrades gracefully when no crystals exist
    Evidence: Response content
  ```

  **Commit**: YES
  - Message: `feat(rag): add graph-aware chat context via pgvector similarity search`
  - Files: `src/lib/ai/rag.ts`, updated chat API route
  - Pre-commit: `bun run build`

---

- [ ] 10. Spaced Repetition Engine + Review Page

  **What to do**:
  - Implement SM-2 algorithm in `src/lib/srs/`:
    - `calculateNextReview(crystal, rating)`:
      - Rating: 0 (Again), 3 (Hard), 4 (Good), 5 (Easy)
      - Again: reset interval to 1 day, decrease ease_factor by 0.2 (min 1.3)
      - Hard: interval = current interval × 1.2, ease_factor -= 0.15
      - Good: interval = current interval × ease_factor
      - Easy: interval = current interval × ease_factor × 1.3, ease_factor += 0.15
    - Update: stability, ease_factor, last_review, next_review_due, consecutive_correct, review_count
    - Compute retrievability: `R = e^(-t/S)` where t = days since last review, S = stability
  - Build Review page at `src/app/(app)/review/page.tsx`:
    - Query: crystals where `next_review_due <= NOW()` for current user
    - Flashcard-style interface:
      - Show crystal title (front)
      - Click/tap to reveal: definition + core_insight (back)
      - Rating buttons: Again / Hard / Good / Easy
      - Next card automatically loads
    - Progress indicator: "3 of 12 crystals reviewed"
    - Empty state (no cards due): "All caught up! Your knowledge is fresh." with link back to chat
    - Session cap: maximum 20 cards per review session (show "continue later" for more)
  - API route at `src/app/api/review/route.ts`:
    - GET: fetch due crystals for current user
    - POST: submit review rating, update crystal SRS fields
  - Add "Review (N due)" indicator in the app header/nav, linking to review page

  **Must NOT do**:
  - No configurable SRS parameters (hardcode SM-2)
  - No streak tracking or daily goals
  - No analytics dashboard or retention graphs
  - No difficulty adjustment beyond SM-2
  - No review history log UI

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Algorithm implementation (SM-2) + full-page UI + API routes. Medium complexity but important for core loop.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Flashcard UI, transitions between cards, rating button design
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 9, 11)
  - **Blocks**: Task 11
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:92-97` — Decay & Review algorithm: SM-2 inspired, retrievability formula R = e^(-t/S), blocking threshold 0.85
  - `NeuroGraph/specifications.md:65-78` — UserNodeState schema: stability, retrievability, last_review, next_review_due, consecutive_correct_answers

  **External References**:
  - SM-2 algorithm reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-of-student-study
  - FSRS comparison (for context, not implementation): https://github.com/open-spaced-repetition/fsrs4anki

  **WHY Each Reference Matters**:
  - Spec's decay formula provides the exact retrievability calculation to implement
  - SM-2 reference is the authoritative source for interval calculation logic

  **Acceptance Criteria**:

  ```
  Scenario: Review page shows due crystals
    Tool: Playwright (playwright skill)
    Preconditions: User has 3 crystals with next_review_due in the past
    Steps:
      1. Navigate to http://localhost:3000/review
      2. Wait for .review-card visible (timeout: 5s)
      3. Assert: card shows crystal title
      4. Assert: progress indicator shows "1 of 3"
      5. Screenshot: .sisyphus/evidence/task-10-review-front.png
    Expected Result: Due crystals loaded as flashcards
    Evidence: .sisyphus/evidence/task-10-review-front.png

  Scenario: Flashcard reveals and rates
    Tool: Playwright (playwright skill)
    Steps:
      1. On review page with a due crystal
      2. Click card to reveal back (definition + core_insight)
      3. Assert: definition text is visible
      4. Assert: 4 rating buttons visible (Again, Hard, Good, Easy)
      5. Click "Good" button
      6. Assert: next card loads (or completion message if last card)
      7. Screenshot: .sisyphus/evidence/task-10-review-rated.png
    Expected Result: Flashcard flip + rating updates SRS
    Evidence: .sisyphus/evidence/task-10-review-rated.png

  Scenario: SM-2 calculation is correct
    Tool: Bash (curl or script)
    Steps:
      1. Create crystal with: stability=1, ease_factor=2.5, last_review=yesterday
      2. POST /api/review with rating=4 (Good)
      3. Query crystal: SELECT stability, ease_factor, next_review_due FROM crystals WHERE id=$1
      4. Assert: new stability = 1 × 2.5 = 2.5 days
      5. Assert: ease_factor unchanged at 2.5
      6. Assert: next_review_due ≈ NOW() + 2.5 days
    Expected Result: SM-2 interval calculated correctly
    Evidence: Database values

  Scenario: Empty review state
    Tool: Playwright (playwright skill)
    Preconditions: User has 0 crystals due for review
    Steps:
      1. Navigate to /review
      2. Assert: text "All caught up" or similar is visible
      3. Assert: link to chat/main page exists
      4. Screenshot: .sisyphus/evidence/task-10-review-empty.png
    Expected Result: Encouraging message, not error
    Evidence: .sisyphus/evidence/task-10-review-empty.png

  Scenario: Review count badge in navigation
    Tool: Playwright (playwright skill)
    Preconditions: User has 5 crystals due for review
    Steps:
      1. Navigate to http://localhost:3000/
      2. Assert: navigation contains "Review" link with badge showing "5"
    Expected Result: Badge shows count of due reviews
    Evidence: Badge presence assertion
  ```

  **Commit**: YES
  - Message: `feat(srs): add SM-2 spaced repetition engine with flashcard review page`
  - Files: `src/lib/srs/`, `src/app/(app)/review/`, `src/app/api/review/`
  - Pre-commit: `bun run build`

---

- [ ] 11. Decay Visualization on Graph Nodes

  **What to do**:
  - Update `CrystalNode.tsx` to visualize retrievability state:
    - Compute retrievability for each crystal: `R = e^(-t/S)` where t = days since last_review, S = stability
    - Visual states based on retrievability:
      - **Fresh** (R > 0.9): Bright cyan glow, fully opaque
      - **Stable** (R 0.7-0.9): Normal brightness, no glow
      - **Fading** (R 0.5-0.7): Slightly dimmed, amber tint
      - **Decaying** (R 0.3-0.5): Noticeably dim, amber/orange, subtle trembling animation (Framer Motion)
      - **Critical** (R < 0.3): Dark red tint, pulsing animation, "Review recommended" tooltip
    - Never locked, never hidden — always accessible (soft warning per design decision D2)
  - Update graph edges: edges connected to decaying crystals also fade proportionally
  - Add tooltip on hover: "Last reviewed: X days ago. Retrievability: Y%"
  - Real-time update: retrievability recalculated on page load and every 5 minutes (interval)
  - Add a visual legend (small, non-intrusive) explaining the color states

  **Must NOT do**:
  - No hard blocking of nodes based on decay
  - No notification system for decayed nodes (visual only)
  - No decay notification emails
  - No custom decay curves — use standard `e^(-t/S)` only

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Pure visual implementation — color gradients, animations, hover states, visual states
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Color design, animation timing, visual feedback design
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 9, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5, 10

  **References**:

  **Pattern References**:
  - `NeuroGraph/specifications.md:108-114` — Node visual states: Mastered (luminous, pulsing), Decay (trembling, red), Ghost (30% opacity, dashed border)
  - `NeuroGraph/specifications.md:94-97` — Retrievability formula: R = e^(-t/S), blocking threshold 0.85

  **External References**:
  - Framer Motion keyframe animations: https://www.framer.com/motion/animation/#keyframes
  - TailwindCSS animation utilities: https://tailwindcss.com/docs/animation

  **Acceptance Criteria**:

  ```
  Scenario: Fresh crystal glows bright cyan
    Tool: Playwright (playwright skill)
    Preconditions: Crystal reviewed today (retrievability ~1.0)
    Steps:
      1. Navigate to graph view
      2. Find the fresh crystal node
      3. Assert: node has cyan glow/border effect
      4. Assert: node is fully opaque
      5. Screenshot: .sisyphus/evidence/task-11-fresh-node.png
    Expected Result: Fresh crystals are visually prominent
    Evidence: .sisyphus/evidence/task-11-fresh-node.png

  Scenario: Decaying crystal shows amber/red visual
    Tool: Playwright (playwright skill)
    Preconditions: Crystal not reviewed for many days (retrievability ~0.4)
    Steps:
      1. Navigate to graph view
      2. Find the decaying crystal node
      3. Assert: node has amber/orange/red tint
      4. Assert: node is dimmer than fresh nodes
      5. Hover over node → Assert: tooltip shows "Retrievability: XX%"
      6. Screenshot: .sisyphus/evidence/task-11-decaying-node.png
    Expected Result: Decay state visually distinct from fresh
    Evidence: .sisyphus/evidence/task-11-decaying-node.png

  Scenario: Critical crystal shows pulsing animation
    Tool: Playwright (playwright skill)
    Preconditions: Crystal with retrievability < 0.3
    Steps:
      1. Find critical crystal node
      2. Assert: node has CSS animation (pulsing or opacity cycling)
      3. Assert: "Review recommended" visible on hover
      4. Screenshot: .sisyphus/evidence/task-11-critical-node.png
    Expected Result: Critical state demands attention visually
    Evidence: .sisyphus/evidence/task-11-critical-node.png
  ```

  **Commit**: YES
  - Message: `feat(decay): add visual decay indicators on graph nodes based on retrievability`
  - Files: `src/components/graph/CrystalNode.tsx`, updated styles
  - Pre-commit: `bun run build`

---

- [ ] 12. Test Infrastructure + Unit/Integration Tests

  **What to do**:
  - Set up Vitest: `bun add -d vitest @testing-library/react @testing-library/jest-dom`
  - Configure `vitest.config.ts` for Next.js compatibility
  - Set up Playwright: `bun add -d @playwright/test && bunx playwright install`
  - Configure `playwright.config.ts` for the project
  - Write tests for critical business logic:
    - `src/lib/srs/__tests__/sm2.test.ts`:
      - Test all 4 ratings (Again, Hard, Good, Easy) with known inputs → assert correct outputs
      - Test minimum ease_factor floor (1.3)
      - Test retrievability calculation at various time intervals
    - `src/lib/youtube/__tests__/youtube.test.ts`:
      - Test URL parsing (youtube.com, youtu.be, shorts, playlists → reject)
      - Test transcript extraction (mock API call)
    - `src/lib/ai/__tests__/prompts.test.ts`:
      - Test system prompt generation with 0, 1, and 5 crystal contexts
      - Test prompt doesn't exceed token limit
    - `src/lib/db/__tests__/queries.test.ts`:
      - Test crystal CRUD (with test database or mocks)
      - Test vector similarity query returns ordered results
      - Test neighborhood CTE query returns correct depth
  - Add test script to `package.json`: `"test": "vitest run"`, `"test:e2e": "playwright test"`

  **Must NOT do**:
  - No snapshot tests
  - No visual regression tests
  - No performance benchmarking suite
  - No test coverage threshold enforcement (yet)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Testing across multiple layers (algorithm, API, integration). Requires understanding entire codebase.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No design work
    - `playwright`: Used as a library, not as skill's browser interaction pattern

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all feature tasks)
  - **Parallel Group**: Final wave
  - **Blocks**: Task 13
  - **Blocked By**: All Tasks 1-11

  **References**:

  **External References**:
  - Vitest with Next.js: https://vitest.dev/guide/
  - Playwright with Next.js: https://nextjs.org/docs/app/building-your-application/testing/playwright

  **Acceptance Criteria**:

  ```
  Scenario: All unit tests pass
    Tool: Bash
    Steps:
      1. bun run test
      2. Assert: exit code 0
      3. Assert: output shows ≥10 tests passed, 0 failed
    Expected Result: All unit/integration tests green
    Evidence: Test runner output

  Scenario: SM-2 algorithm tests are comprehensive
    Tool: Bash
    Steps:
      1. bun run test src/lib/srs/
      2. Assert: tests cover all 4 ratings
      3. Assert: tests verify ease_factor floor
      4. Assert: tests verify retrievability formula
    Expected Result: SRS logic thoroughly tested
    Evidence: Test output with descriptions
  ```

  **Commit**: YES
  - Message: `test: add Vitest + Playwright infrastructure with unit tests for SRS, YouTube, and RAG`
  - Files: test configs, `**/__tests__/` directories
  - Pre-commit: `bun run test`

---

- [ ] 13. E2E Core Loop Verification

  **What to do**:
  - Write a comprehensive Playwright E2E test that exercises the ENTIRE core loop:
    1. Sign in using the test auth helper from Task 3 (Supabase Admin API `generateLink()` or Supabase local Inbucket at `localhost:54324` to intercept magic link emails programmatically — NO manual email clicking)
    2. Start a new conversation
    3. Have a multi-message exchange building insight depth
    4. Receive crystallization suggestion
    5. Click "Crystallize" → verify node appears on graph
    6. Continue chatting → crystallize 2 more nodes
    7. Verify edges form between related crystals
    8. Navigate to Review page → verify due crystals appear
    9. Complete a review (rate one crystal)
    10. Return to graph → verify visual state reflects review
  - This is the **acceptance test for the entire MVP**
  - Run on CI-ready config (can be added to GitHub Actions later)
  - Capture screenshots at each major step as evidence

  **Must NOT do**:
  - No load testing or stress testing
  - No cross-browser testing (Chromium only for MVP)
  - No accessibility testing (post-MVP)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding the complete system flow end-to-end. Must orchestrate a realistic user journey.
  - **Skills**: [`playwright`]
    - `playwright`: Core skill — this task IS a Playwright automation task
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No design work, pure testing

  **Parallelization**:
  - **Can Run In Parallel**: NO (final task)
  - **Parallel Group**: Final (after Task 12)
  - **Blocks**: None
  - **Blocked By**: Task 12

  **References**:

  **Pattern References**:
  - All previous task acceptance criteria — this test combines them all into one flow

  **Acceptance Criteria**:

  ```
  Scenario: Full core loop E2E test
    Tool: Playwright (playwright skill)
    Steps:
      1. Run: bunx playwright test e2e/core-loop.spec.ts
      2. Assert: test passes (exit code 0)
      3. Assert: screenshots captured at each step in .sisyphus/evidence/e2e/
    Expected Result: Full user journey works end-to-end
    Evidence: .sisyphus/evidence/e2e/ directory with screenshots

  Scenario: E2E covers all critical paths
    Tool: Bash
    Steps:
      1. grep -c "test\|expect\|assert" e2e/core-loop.spec.ts
      2. Assert: ≥20 assertions in the test
      3. grep "crystallize\|review\|graph\|chat\|edge" e2e/core-loop.spec.ts
      4. Assert: all 5 core features are referenced
    Expected Result: Test is comprehensive, not superficial
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `test(e2e): add full core loop Playwright test covering chat → crystallize → graph → review`
  - Files: `e2e/core-loop.spec.ts`
  - Pre-commit: `bunx playwright test`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(scaffold): initialize Next.js 15 project with core dependencies` | package.json, src/ structure | `bun run build` |
| 2 | `feat(db): add PostgreSQL schema with pgvector for crystals, edges, conversations` | migrations, src/lib/db/ | migration succeeds |
| 3 | `feat(auth): add Supabase email magic link authentication` | src/app/(auth)/, middleware | `bun run build` |
| 4 | `feat(chat): add AI chat with streaming, tool calls, and conversation persistence` | src/app/api/chat/, src/components/chat/ | `bun run build` |
| 5 | `feat(graph): add React Flow knowledge graph with split-view layout` | src/components/graph/, src/stores/ | `bun run build` |
| 6 | `feat(crystallize): add AI-suggested crystallization with confirm flow` | src/app/api/crystals/, components | `bun run build` |
| 7 | `feat(youtube): add YouTube URL transcript extraction and chat integration` | src/lib/youtube/, src/app/api/youtube/ | `bun run build` |
| 8 | `feat(edges): add AI-suggested edge creation with vector similarity` | src/app/api/crystals/[id]/edges/ | `bun run build` |
| 9 | `feat(rag): add graph-aware chat context via pgvector similarity search` | src/lib/ai/rag.ts | `bun run build` |
| 10 | `feat(srs): add SM-2 spaced repetition engine with flashcard review page` | src/lib/srs/, src/app/(app)/review/ | `bun run build` |
| 11 | `feat(decay): add visual decay indicators on graph nodes` | src/components/graph/CrystalNode.tsx | `bun run build` |
| 12 | `test: add Vitest + Playwright infrastructure with unit tests` | vitest.config.ts, **/__tests__/ | `bun run test` |
| 13 | `test(e2e): add full core loop Playwright test` | e2e/core-loop.spec.ts | `bunx playwright test` |

---

## Success Criteria

### Verification Commands
```bash
bun run build          # Expected: build succeeds, 0 errors
bun run test           # Expected: all unit tests pass
bunx playwright test   # Expected: E2E core loop test passes
```

### Final Checklist
- [ ] User can sign in via magic link email
- [ ] User can chat with AI (streaming responses)
- [ ] User can paste YouTube URL and AI contextualizes the content
- [ ] AI suggests crystallization for insightful conversation moments
- [ ] User can confirm crystallization → node appears on graph with animation
- [ ] Related crystals are auto-connected with edges
- [ ] AI chat is aware of user's existing crystals (RAG context)
- [ ] Crystals have decay visualization based on retrievability
- [ ] User can review due crystals on flashcard-style review page
- [ ] SM-2 algorithm correctly schedules next reviews
- [ ] No hard blocking — decay is visual warning only
- [ ] Desktop-only message on mobile viewports
- [ ] All "Must NOT Have" guardrails respected (no editing, no mobile, no OAuth, etc.)
