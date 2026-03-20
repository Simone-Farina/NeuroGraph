# Codebase Concerns

**Analysis Date:** 2026-03-20

## Missing Critical Features

**Persisted Tool Calls Reliability:**
- Problem: The application relies on parsing tool calls (e.g. `suggest_neurogenesis`) from message metadata stored in Supabase to rehydrate the UI properly.
- Current workaround: Assumption that AI SDK v6 formats match exactly.
- Impact: If the AI SDK format changes or if the saving mechanism fails to capture the exact JSON structure, the UI will fail to render the In-Place Extraction UI tools correctly on reload.
- Implementation complexity: High. Requires rigorous testing of the rehydration logic and potentially schema enforcement in Supabase for `toolName` and `args`.

## Tech Debt

**Global State Complexity:**
- Issue: `src/stores/graphStore.ts` manages both the visual node/edge graph state AND the UI application state (`leftPanelMode`).
- Impact: As `graphStore.ts` grows, it may become a bottleneck or source of complex re-render issues.
- Fix approach: Consider splitting the Zustand stores: one for React Flow specific state (nodes, edges) and another for Application UI state (left panel mode, selected text, etc.).

## Security Considerations

**AI Provider Key Exposure Risk:**
- Risk: Ensure that Next.js Server Actions and API Routes do not accidentally leak API keys (OpenAI, Anthropic, Google) to the client component tree.
- Current mitigation: Next.js environment variables (only `NEXT_PUBLIC_` are exposed).
- Recommendations: Strict auditing of `src/lib/ai/providers.ts` to ensure it only executes server-side.

---

*Concerns audit: 2026-03-20*
*Update as issues are fixed or new ones discovered*
