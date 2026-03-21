# NeuroGraph Retrospective

Living document capturing lessons, trends, and execution metrics across milestones.

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tasks | Models Used | Days |
|-----------|--------|-------|-------|-------------|------|
| v1.0      | 4      | 5     | 0     | GPT-4o, Cl. | < 5  |

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-22
**Phases:** 4 | **Plans:** 5

### What Was Built
- AI Bouncer for active duplicate prevention.
- 14-day Ephemeral Discovery Engine (auto-wiping chat history).
- Strict Left-to-Right DAG layout to solve "spaghetti graphs".
- FSRS-6 spaced repetition engine with Upward FIRe healing and UI visual decay.
- Fluid TipTap-based Advanced AI Markdown Editor with liquid background metadata extraction.

### What Worked
- **Visual Decay (Soft-FIRe)**: Changing border styles instead of locking users out was vastly superior for user motivation.
- **TipTap v3 Root Control**: Directly wrapping TipTap instead of using high-level wrappers like Novel.sh avoided React dependency lag and gave total control over ProseMirror plugins.
- **Background Extraction**: Extracting 'Definition' and 'Core Insight' asynchronously removed UI friction while enforcing the active learning pedagogy.

### What Was Inefficient
- **Vercel AI SDK v5 -> v6 Changes**: Wasted some time debugging removed APIs (`toDataStreamResponse` vs `toTextStreamResponse`).

### Patterns Established
- **Active Extraction over Passive Ingestion**: Future features must force the user to synthesize knowledge, never auto-generating nodes for them.
- **"The Bouncer"**: AI as a strict mediator ensuring graph quality, not a submissive text-completion bot.

### Key Lessons
- Direct implementation of ProseMirror plugins is the only reliable way to handle complex WYSIWYG interactions (like Slash commands) without triggering React cyclic re-render crashes.
