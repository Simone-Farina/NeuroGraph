# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Full-stack React Application with Serverless API (Next.js App Router)

**Key Characteristics:**
- React Server Components (RSC) and Client Components mixture
- Global state managed client-side via Zustand
- Relational + Vector database backend (Supabase PostgreSQL)
- Role-based dynamic AI model selection

## Layers

**UI Layer (Client):**
- Purpose: User interaction and visualization
- Contains: React components, hooks, Zustand stores, React Flow canvas
- Location: `src/components/`, `src/hooks/`, `src/stores/`
- Depends on: API Layer, AI SDK hooks (`useChat`, `useCompletion`)
- Used by: Next.js Pages

**Routing and Backend Logic (Server):**
- Purpose: Handle data requests, protect routes, perform AI operations requiring secrets
- Contains: Next.js API Routes, Server Actions
- Location: `src/app/api/`
- Depends on: `src/lib/` (DB, AI orchestration)
- Used by: UI Layer via fetch or Server Actions

**Business Logic & Integrations:**
- Purpose: Orchestrate external services and core domain logic
- Contains: DB clients, AI SDK setup, spaced repetition algorithm
- Location: `src/lib/`
- Depends on: External APIs (Supabase, OpenAI/Anthropic/Google)

## Data Flow

**Typical AI Chat Interaction:**
1. User types message in Chat Panel (Client)
2. `useChat` hook calls `/api/chat` (Server)
3. API route resolves appropriate model via `getModelForRole('AI_MODEL_CHAT')`
4. Server streams response back to Client using Vercel AI SDK
5. Client updates UI incrementally
6. Message saved to Supabase (either server-side or via webhook/sync)

**Neurogenesis (In-Place Extraction):**
1. User highlights text in chat -> Selection Toolbar appears
2. User selects "Create Neuron" or "Synthesize"
3. Action triggers state update in `graphStore.ts`
4. API call made to execute `AI_MODEL_NEUROGENESIS_HEAVY` or `AI_MODEL_SYNTHESIS_FAST`
5. New Neuron saved to DB (with embeddings via `pgvector`) and React Flow canvas updates

## Key Abstractions

**AI Model Router:**
- Purpose: Prevent hardcoding of models, route by task capability
- Examples: `getModelForRole(role)` where role is `AI_MODEL_CHAT`, `AI_MODEL_SYNTHESIS_FAST`, etc.
- Pattern: Strategy Provider

**Graph Store:**
- Purpose: Manage the complex state of the visual Neural Network and interface mode
- Examples: `useGraphStore` with `leftPanelMode: 'chat'|'neuron'|'review'`
- Pattern: Zustand Global Store

**Dual-Panel UI:**
- Purpose: The fundamental UX paradigm ("40/60 Split")
- Pattern: Layout with conditional rendering on the left (controlled by `leftPanelMode`), persistent React Flow on the right

## Entry Points

**Web Interface:**
- Location: `src/app/page.tsx` / `src/app/(app)/app/page.tsx`
- Triggers: User visits URL
- Responsibilities: Render initial UI, fetch initial graph state

**API Endpoints:**
- Location: `src/app/api/*/route.ts`
- Triggers: Client fetch requests, AI SDK hooks
- Responsibilities: Server-side logic, AI streaming, DB operations

## Error Handling

**Strategy:** Error boundaries for UI, Try/Catch API responses
**Patterns:** Next.js `error.tsx` for route segments

## Cross-Cutting Concerns

**Authentication:** 
- Handled by Supabase Auth, session tokens in cookies.

**AI Tool Persistence:**
- Tool calls (e.g., `suggest_neurogenesis`) persisted in AI SDK v6 format within message metadata in Supabase to allow safe UI rehydration.

---

*Architecture analysis: 2026-03-20*
*Update when major patterns change*
