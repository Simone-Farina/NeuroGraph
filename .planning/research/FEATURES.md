# Feature Research

**Domain:** Cognitive MicroSaaS / Active Generative Mastery
**Researched:** 2026-03-21
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 40/60 Split UI | Core spatial paradigm | MEDIUM | Requires careful CSS grid/flex and global state bridging. |
| Pan & Zoom Graph | Basic map navigation | LOW | Built-in with React Flow, but requires custom controls. |
| Markdown Notes | Users must be able to edit Neurons | MEDIUM | Needs a block editor or rich markdown editor (e.g., standard textarea + rendering or ProseMirror). |
| Auth & DB Persistence | Cloud saving | MEDIUM | Supabase handles this cleanly. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Socratic AI Bouncer | Prevents junk nodes. Forces user to append to existing Neurons rather than duplicate. | HIGH | Requires background `pgvector` similarity search on every "Create" intent. |
| High-Friction Neurogenesis | Deep Insights are extracted directly from chat via a floating selection toolbar to become Neurons. | HIGH | Dual-action extraction; Vercel AI SDK tool rendering. |
| 14-day Chat TTL | Forces active extraction before the "Ephemeral Discovery Engine" wipes the discussion. | LOW | Simple DB cron/query, but massive psychological impact. |
| Ghost Nodes & Fog of War | User sets a target (e.g. "Learn X"). AI generates a DAG of locked prerequisites. | HIGH | AI must generate a structured DAG schema and enforce prerequisites. |
| Soft-FIRe Visual Decay | If a foundation rusts (via FSRS-6), dependent nodes visually flag decay (orange/red tint). | HIGH | Requires traversing the DAG and applying FSRS-6 state calculations recursively. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Upload PDF & Auto-Summarize Graph | "I want to learn this document instantly." | Violates the core thesis. Creates an "Illusion of Competence" and a graveyard of nodes the user never reads. | Only allow text uploads into the Chat context, forcing Socratic conversation to extract insights manually. |
| Free-form mind mapping | Users want to drag nodes anywhere. | Breaks the strict pedagogical DAG. Learning is a dependency tree, not a messy web. | Enforce Directed Acyclic Graph (DAG) layouts (e.g., Dagre.js integration with React Flow). |

## Feature Dependencies

```
[Basic Auth & DB]
    └──requires──> [40/60 UI Split]
                       └──requires──> [React Flow Canvas] & [Chat Engine]
                                          └──requires──> [Neurogenesis Flow (Extraction)]
                                                             └──requires──> [AI Bouncer (pgvector)]

[FSRS-6 Retention Engine] ──enhances──> [React Flow Canvas (Soft-FIRe Visuals)]
[Ghost Nodes] ──requires──> [Strict DAG Layout System]
```

## MVP Definition

### Launch With (v1)
- [x] Basic Auth & Supabase DB Setup
- [x] 40/60 Split UI (Left Chat, Right Graph)
- [x] Functional Socratic Chat (Vercel AI SDK)
- [x] Basic Neurogenesis (Extract chat to new Neuron)
- [x] Bidirectional Sync (Click node to open note, update note syncs to node)

### Add After Validation (v1.x)
- [ ] AI Bouncer (Duplicate prevention via vector search)
- [ ] 14-day TTL implementation on chats
- [ ] FSRS-6 Spaced Repetition engine and Review UI

### Future Consideration (v2+)
- [ ] Ghost Nodes & Fog of War (AI-generated curriculum roadmaps)
- [ ] Soft-FIRe cascading visual decay

---
*Feature research for: Cognitive MicroSaaS*
*Researched: 2026-03-21*
