# Pitfalls Research

**Domain:** Cognitive MicroSaaS / React Flow Integration
**Researched:** 2026-03-21
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: The Spaghetti Graph
**What goes wrong:** Users create connections between Neurons haphazardly, resulting in an unreadable web where prerequisites are impossible to parse.
**Why it happens:** React Flow allows unconstrained edge creation by default.
**How to avoid:** Enforce a Strict Directed Acyclic Graph (DAG) layout. Intercept edge creation in `useEdgesState` and reject cycles. Use `dagre` or `elkjs` to auto-layout the graph so it always reads top-to-bottom or left-to-right.
**Warning signs:** Edges overlapping horizontally; circular dependencies in the DB.
**Phase to address:** Phase 2 (Core Graph & UI) and Phase 4 (Strict DAG Enforcer).

### Pitfall 2: Tool Call Rehydration Failure
**What goes wrong:** A user refreshes the page, and the chat history fails to render the interactive "Neurogenesis" tools or selection UI correctly.
**Why it happens:** Vercel AI SDK persists tool calls as raw JSON in the DB. If the schema changes or the frontend component expects a different structure, it crashes during rehydration.
**How to avoid:** Strict `zod` schema versioning for all tools. Ensure the DB `messages` table stores raw AI SDK v6 message arrays faithfully.
**Warning signs:** Errors like "Cannot render tool XYZ" on page reload.
**Phase to address:** Phase 3 (The Socratic Chat Engine).

### Pitfall 3: AI Bouncer "Too Strict" or "Too Lenient"
**What goes wrong:** The vector DB either blocks valid distinct concepts or lets duplicate concepts through, frustrating the user.
**Why it happens:** Sub-optimal chunking or bad embedding threshold logic (e.g., relying solely on cosine similarity without LLM semantic verification).
**How to avoid:** Hybrid approach. Use `pgvector` to find top 3 matches > 0.8 cosine similarity. Pass those 3 matches to an LLM evaluator prompt: "Is the user's insight genuinely new compared to these three? If no, return the ID to append to."
**Warning signs:** User complains they can't create a concept they need, or graph fills with duplicates.
**Phase to address:** Phase 5 (The AI Bouncer).

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Too Many React Flow Nodes | Graph panning drops to 15 FPS | Use `throttle` on pan/zoom, keep custom nodes DOM-light, use React standard memoization. | ~300+ nodes |
| Heavy Markdown Rendering | Typing lags in the Left Panel editor | Debounce auto-save to Supabase, memoize markdown preview component. | ~2000+ words |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Passive Ingestion Drift | Users paste a dump of text into chat and say "summarize it into nodes". | The system must reject the request. The AI should reply: "Read it and tell me what YOU found interesting, then we will create the node." |
| Fog of War Frustration | Users can't see the full scope of what they are learning, causing anxiety. | Ghost Nodes show the shape of the path (the DAG shadows) but blur the content/titles until unlocked. |

---
*Pitfalls research for: Cognitive MicroSaaS*
*Researched: 2026-03-21*
