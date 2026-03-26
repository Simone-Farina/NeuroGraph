---
phase: quick
plan: 260326-kz1
subsystem: ai-providers
tags: [ai, providers, openrouter, multi-agent, config, refactor]
dependency_graph:
  requires: []
  provides: [unified-agent-config, openrouter-support]
  affects: [chat, bloom-evaluate, architect, neurons/extract, neurons/ai-action, neurons/curriculum, neurons/synthesize, synthesizer, inferPrerequisites, crystallize-seed]
tech_stack:
  added: ["@openrouter/ai-sdk-provider"]
  patterns: [role-registry, env-var-provider-switching, single-source-of-truth-config]
key_files:
  created:
    - src/lib/ai/config.ts
  modified:
    - src/lib/ai/providers.ts
    - src/app/api/chat/route.ts
    - src/app/api/bloom-evaluate/route.ts
    - src/app/api/architect/route.ts
    - src/app/api/neurons/extract/route.ts
    - src/app/api/neurons/ai-action/route.ts
    - src/app/api/neurons/curriculum/route.ts
    - src/app/api/neurons/[id]/synthesize/route.ts
    - src/lib/ai/synthesizer.ts
    - src/lib/ai/inferPrerequisites.ts
    - src/lib/crystallize/seed.ts
    - src/app/api/architect/__tests__/route.test.ts
    - .env.example
    - package.json
decisions:
  - "AI_MODEL_CHAT env var retained for backward compat with existing .env.local files — conversationalist role maps to same var"
  - "Pre-existing TS errors in src/lib/ai/__tests__/ (JSONSchema7 PromiseLike) deferred — confirmed present before this task"
metrics:
  duration: "~5 min"
  completed_date: "2026-03-26"
---

# Quick Task 260326-kz1: Unified Multi-Agent AI Config with OpenRouter

Single-source-of-truth agent role config with OpenRouter, Google, and OpenAI provider switching via environment variables alone.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install OpenRouter SDK, create config.ts, refactor providers.ts | 18ff17a | config.ts (new), providers.ts, .env.example, package.json |
| 2 | Migrate all consumers to new AgentRole names | 58c2cc2 | 10 consumer files + architect test |

## What Was Built

### `src/lib/ai/config.ts` — New file
Single source of truth for all AI agent configuration:

```typescript
export const AI_AGENTS = {
  conversationalist: { env: 'AI_MODEL_CHAT',         default: 'openai:gpt-4o' },
  bloomEvaluator:    { env: 'AI_MODEL_EVALUATOR',    default: 'google:gemini-2.5-flash' },
  synthesizer:       { env: 'AI_MODEL_SYNTHESIZER',  default: 'openai:gpt-4o-mini' },
  inquisitor:        { env: 'AI_MODEL_INQUISITOR',   default: 'openrouter:anthropic/claude-3.5-sonnet' },
} as const;

export type AgentRole = keyof typeof AI_AGENTS;
```

### `src/lib/ai/providers.ts` — Refactored
- Removed old `ModelRole`, `ROLE_ENV`, `ROLE_DEFAULT` constants
- Imports `AI_AGENTS` from `./config`
- Added `openrouter` case in `resolveFromString` using `createOpenRouter`
- Added `console.log` at resolution time: `[ai] <role> → <model-string>`
- Re-exports `AgentRole` type for backward compatibility
- `getEmbeddingModel` and mock guard unchanged

### Consumer Role Name Mapping

| Consumer | Old Role | New Role |
|----------|----------|----------|
| chat/route.ts | `'chat'` | `'conversationalist'` |
| bloom-evaluate/route.ts | `'evaluator'` | `'bloomEvaluator'` |
| architect/route.ts | `'neurogenesis_heavy'` | `'inquisitor'` |
| neurons/extract/route.ts | `'synthesis_fast'` | `'synthesizer'` |
| neurons/ai-action/route.ts | `'synthesis_fast'` | `'synthesizer'` |
| neurons/curriculum/route.ts | `'neurogenesis_heavy'` | `'inquisitor'` |
| neurons/[id]/synthesize/route.ts | `'synthesis_fast'` | `'synthesizer'` |
| lib/ai/synthesizer.ts | `'evaluator'` | `'bloomEvaluator'` |
| lib/ai/inferPrerequisites.ts | `'neurogenesis_heavy'` | `'inquisitor'` |
| lib/crystallize/seed.ts | `'synthesis_fast'` | `'synthesizer'` |

## Verification Results

- `node -e "require('@openrouter/ai-sdk-provider')"` — OK
- `grep -r "getModelForRole.*'chat'" src/` — zero matches
- `grep -r "getModelForRole.*'synthesis_fast'" src/` — zero matches
- `grep -r "getModelForRole.*'neurogenesis_heavy'" src/` — zero matches
- `grep -r "getModelForRole.*'evaluator'" src/` — zero matches
- All 4 new role names confirmed present in correct files
- `npx tsc --noEmit` — zero errors introduced by this task (2 pre-existing errors in unrelated `src/lib/ai/__tests__/` files confirmed pre-existing before task start)

## Deviations from Plan

### Deferred Issues (out of scope)

**Pre-existing TypeScript errors in `src/lib/ai/__tests__/`**

- `src/lib/ai/__tests__/architect.test.ts(152)` — `Property 'required' does not exist on type 'JSONSchema7 | PromiseLike<JSONSchema7>'`
- `src/lib/ai/__tests__/inferPrerequisites.test.ts(47)` — same error

These errors were confirmed present before Task 1 was applied (verified via `git stash` test). They are NOT caused by this task and are out of scope per the scope boundary rule. Logged here for visibility.

## Self-Check: PASSED

- `src/lib/ai/config.ts` — FOUND
- `src/lib/ai/providers.ts` — FOUND (modified)
- Commit 18ff17a — FOUND
- Commit 58c2cc2 — FOUND
- Zero old role name references in getModelForRole calls — VERIFIED
