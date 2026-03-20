# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- `PascalCase.tsx`: React components (e.g., `ChatPanel.tsx`, `NeuronDetailPanel.tsx`)
- `camelCase.ts`: Utilities, hooks, and stores (e.g., `useTextSelection.ts`, `graphStore.ts`)
- Next.js conventions: `page.tsx`, `layout.tsx`, `route.ts`
- Test files: `*.test.ts`, `*.spec.ts` (Vitest), `*.e2e.test.ts` (Playwright convention assumed)

**Variables & Functions:**
- `camelCase` for functions and variables
- React Components use `PascalCase` bindings

## Code Style

**Formatting & Linting:**
- Next.js ESLint configuration (`eslint-config-next`)
- Prettier (typically paired with Next.js, though no strict rc file was observed, standard Next.js styling applies)
- Tailwind CSS class sorting (assumed standard via Prettier plugin if present)
- TypeScript Strict mode (standard for Next.js App Router)

## Import Organization

**Path Aliases:**
- `tsconfig-paths` is used in Vite, implying path aliases like `@/` are likely used, mapping to `src/`.

## Error Handling

**Patterns:**
- Next.js `error.tsx` boundaries for UI error catching.
- API route try/catch blocks returning JSON error responses.

## UI Components & Styling

**Frameworks:**
- shadcn/ui components (implied by typical Next.js + Tailwind stacks, mentioned in project context).
- Tailwind CSS for utility-first styling.
- Lucide React for icons (standard with shadcn).

---

*Convention analysis: 2026-03-20*
*Update when patterns change*
