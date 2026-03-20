# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- **Unit/Integration:** Vitest 4.0.x
  - Config: `vitest.config.ts` in project root
  - Environment: `jsdom` for React component testing
- **End-to-End (E2E):** Playwright 1.58.x
  - Config: `playwright.config.ts` in project root

**Run Commands:**
```bash
npm run test           # Run Vitest unit tests
npm run test:watch     # Run Vitest in watch mode
npm run test:coverage  # Run Vitest with coverage report
npm run test:e2e       # Run Playwright E2E tests
```

## Test File Organization

**Location:**
- Unit/Integration: `src/**/*.{test,spec}.{ts,tsx}` (alongside source files or in `__tests__` directories)
- E2E Tests: `e2e/` directory

**Structure:**
```
NeuroGraph/
├── src/
│   ├── components/
│   │   └── chat/
│   │       ├── ChatPanel.tsx
│   │       └── __tests__/
│   └── lib/
│       ├── ai/
│       │   └── __tests__/
├── e2e/
│   └── (Playwright tests)
```

## Coverage

**Configuration:**
- Vitest coverage enabled via command (`npm run test:coverage`)
- Target: Used for awareness, no strict thresholds defined in base config.

## Test Types

**Unit Tests (Vitest):**
- Focused on individual utilities, Zustand stores (`graphStore.ts`), and isolated React components.
- Uses `@testing-library/react` and `jsdom`.

**E2E Tests (Playwright):**
- Tests full user flows (Dual-action extraction, Neurogenesis creation).
- Runs against a local dev server (`npm run dev`).
- Uses a mock AI provider for predictable testing (`AI_PROVIDER: 'mock'` in webServer setup).

---

*Testing analysis: 2026-03-20*
*Update when test patterns change*
