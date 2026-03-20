# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.9.x - All application code

**Secondary:**
- JavaScript - Build scripts, config files (e.g. next.config.js, postcss.config.js)

## Runtime

**Environment:**
- Node.js (version not explicitly pinned in package.json, but likely 18.x or 20.x based on Next.js 14)
- Browser runtime (React 18)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 14.2.x (App Router) - Full-stack React framework
- React 18.3.x - UI Library
- Tailwind CSS 3.4.x - Styling

**Testing:**
- Vitest 4.0.x - Unit tests
- Playwright 1.58.x - E2E tests

**Build/Dev:**
- Vite (via Next.js/Vitest) - Used by Vitest for fast transforms
- TypeScript compiler
- PostCSS/Autoprefixer - CSS processing

## Key Dependencies

**Critical:**
- `@xyflow/react` 12.10.x - React Flow, powers the visual 60vw right panel
- `zustand` 5.0.x - Global state management (leftPanelMode, etc.)
- `ai` (Vercel AI SDK) 6.0.x - AI Orchestration and Chat functionalities
- `react-markdown` 10.1.x - Rendering Neuron markdown content
- `@supabase/supabase-js` 2.95.x - Database and Auth client
- `ts-fsrs` 5.2.x - Spaced repetition algorithm

**Infrastructure:**
- `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google` - AI Providers
- `zod` 4.3.x - Schema validation

## Configuration

**Environment:**
- `.env.local` / `.env.example` - Environment variables (Supabase, AI keys)
- `.dev-environment.local` - Development environment configuration

**Build:**
- `tsconfig.json` - TypeScript compiler options
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind design tokens and configurations
- `vitest.config.ts`, `playwright.config.ts` - Test configurations

## Platform Requirements

**Development:**
- macOS/Linux/Windows with Node.js
- Local Supabase instance recommended (`supabase` directory present)

**Production:**
- Vercel (Next.js optimizations), via `deploy:vercel` script in package.json
- Supabase (PostgreSQL with `pgvector`) for backend

---

*Stack analysis: 2026-03-20*
*Update after major dependency changes*
