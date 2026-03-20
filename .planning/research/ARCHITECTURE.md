# Architecture Research

**Domain:** Cognitive MicroSaaS / Node-Based Interfaces
**Researched:** 2026-03-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js Client                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │  Chat   │  │ Editor  │  │  Graph  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                Zustand (Global State & UI Mode)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                Next.js API Routes (Server)           │    │
│  │   [AI Streamer]     [DB Actions]     [Vector Query]  │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Supabase│  │ pgvector │  │ LLM APIs │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Implications

### Dual-State Synchronization
- Problem: The Graph (Right Panel) and the Active Context (Left Panel) must stay perfectly in sync. 
- Solution: `graphStore.ts` must act as the single source of truth for the *active* Neuron. The Left panel sub-scribes to `activeNeuronId` and fetches the markdown, while React Flow highlights the corresponding node.

### Vercel AI SDK Integration
- Problem: Streaming chat while executing complex background logic (Vector search, Neurogenesis).
- Solution: Use `streamText` and `streamUI` from the AI SDK v6. The `tools` configuration will include an `executeNeurogenesis` tool that acts as the Bouncer, performs the vector search, and either creates the node or streams back a rejection to the chat.

## Data Flow

### Neurogenesis (The Core Loop)
```
[User Highlights Chat Text] -> [Clicks "Crystallize"]
    ↓
[Frontend calls API with Text + Context]
    ↓
[Next.js Server: AI Bouncer Agent assesses Text]
    ↓
[Vector Search (pgvector) for similarity > 0.85]
    ↓
IF Duplicate -> [Return "Suggest Append" Tool response to Chat]
IF Unique -> [AI synthesizes Node Title/Summary] -> [Insert exactly 1 Neuron in Supabase]
    ↓
[Frontend Zustand catches realtime Supabase insert] -> [React Flow renders new Node]
```

## Anti-Patterns

### Anti-Pattern 1: Heavy React Nodes
**What people do:** Put complex markdown editors and massive state inside the React Flow custom node components.
**Why it's wrong:** React Flow renders nodes heavily. Complex components inside 100+ nodes will crush browser FPS.
**Do this instead:** Nodes should be dumb visual indicators (Title, Status Icon, Rusted state). All heavy editing happens in the Left Panel (40vw split).

### Anti-Pattern 2: Client-side Vector Search
**What people do:** Download embeddings to the client and search locally to save API calls.
**Why it's wrong:** Memory intensive, security risk for full graph exposure, slow on mobile.
**Do this instead:** Always use Supabase `pgvector` via standard RPC calls in the Next.js backend.

---
*Architecture research for: Cognitive MicroSaaS*
*Researched: 2026-03-21*
