# Stack Research

**Domain:** Cognitive MicroSaaS / Graph-based Knowledge Management
**Researched:** 2026-03-21
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js App Router | 14.2.x | Full-stack React framework | Server components excel for data-heavy dashboard layouts, and App Router API routes perfectly host AI streams. |
| Supabase | Latest | Auth & PostgreSQL DB | Native pgvector support is critical for the "AI Bouncer" background vector search to prevent duplicate Neurons. |
| React Flow (`@xyflow/react`) | Latest | Graph Visualization | Industry standard for node-based UIs with physics, interactive panning, and deep React component integration for Neurons. |
| Vercel AI SDK | 3.x+ | AI Orchestration & UI | `useChat` and `streamUI` allow seamless tool-calling and generative UI required for the Socratic engine and In-Place Extraction. |
| Zustand | 4.x+ | Global State | Necessary to bridge the 40/60 split; React Flow state needs to be accessible by the Left Panel chat components. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ts-fsrs` | Latest | Spaced Repetition | The core engine for Rigorous Retention and calculating the "rusting" of Neurons over time. |
| `zod` | Latest | Schema Validation | Absolutely required to enforce AI output structure for Neurogenesis and tool calls. |
| `lucide-react` | Latest | Iconography | Standardized semantic icons for UI toolbars and DAG node statuses (locked, rusted, active). |
| `framer-motion` | 11.x | Fluid Animations | Smooth transition for the "Fog of War" clearing, and when nodes spawn from Neurogenesis. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain | Overly abstracted and heavy for a Next.js edge environment. Hard to debug tool outputs. | Vercel AI SDK Core with direct provider logic |
| React Context for Graph State | Re-render hell across a 100-node graph when a single chat message streams in. | Zustand with scoped selectors |
| LocalStorage for Graph Persistence | Exceeds quota quickly and breaks cross-device syncing. | Supabase with optimistic UI updates |

---
*Stack research for: Cognitive MicroSaaS*
*Researched: 2026-03-21*
