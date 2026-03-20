# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
NeuroGraph/
├── src/                # All application source code
│   ├── app/            # Next.js App Router pages and API routes
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities, AI orchestration, DB clients
│   ├── stores/         # Zustand state stores
│   └── types/          # TypeScript definitions
├── supabase/           # Supabase local environment config/migrations
├── tests/              # E2E test files
└── docs/               # Documentation
```

## Directory Purposes

**src/app/**
- Purpose: Application routing and API endpoints (Next.js App Router)
- Contains: `page.tsx`, `layout.tsx`, `api/` directories
- Key files: `api/neurons/[id]/route.ts` (API route), `(app)/app/page.tsx` (Main interface)
- Subdirectories: `(auth)` (authentication routes), `(app)` (authenticated app routes), `api` (backend endpoints)

**src/components/**
- Purpose: Reusable UI elements
- Contains: React components categorized by feature
- Key directories: `chat/` (Left panel chat), `graph/` (Right panel neural network), `review/` (Spaced repetition UI), `ui/` (shadcn base components)

**src/lib/**
- Purpose: Core business logic and integrations
- Contains: External service clients, AI orchestration
- Subdirectories: `ai/` (Vercel SDK and providers setup), `db/` (Supabase queries), `srs/` (Spaced Repetition implementation, ts-fsrs), `youtube/` (Transcript fetching)

**src/stores/**
- Purpose: Global state management
- Contains: Zustand stores
- Key files: `graphStore.ts` (Manages React Flow state and 'chat'|'neuron'|'review' modes)

**src/hooks/**
- Purpose: Custom React hooks for shared logic
- Contains: `useTextSelection.ts` (Dual-action extraction logic), etc.

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Landing page
- `src/app/(app)/app/page.tsx`: Main application interface (40/60 split)

**Configuration:**
- `package.json`: Dependencies and scripts
- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind styles and plugins

**Core Logic:**
- `src/lib/ai/providers.ts`: AI Model routing based on roles
- `src/stores/graphStore.ts`: Global state

## Naming Conventions

**Files:**
- `PascalCase.tsx`: React components
- `camelCase.ts`: Utility functions, hooks, and stores
- `route.ts`, `page.tsx`, `layout.tsx`: Next.js App Router conventions

**Directories:**
- `kebab-case` for most directories

## Where to Add New Code

**New UI Component:**
- Implementation: `src/components/[feature-domain]/[ComponentName].tsx`

**New API Route:**
- Implementation: `src/app/api/[route-path]/route.ts`

**New AI Logic/Provider:**
- Implementation: `src/lib/ai/`

**New State Management:**
- Implementation: Add to existing `src/stores/graphStore.ts` or create new store in `src/stores/`

---

*Structure analysis: 2026-03-20*
*Update when directory structure changes*
