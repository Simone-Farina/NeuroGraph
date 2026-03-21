# Phase 4 Context: Advanced AI Markdown Editor

This document captures the implementation decisions formulated during the GSD Discussion phase based on the user's explicit preferences and the `.impeccable.md` design contract.

## 1. The Editor Paradigm: Live WYSIWYG
- **Decision:** The editor will use a block-based, Notion-style WYSIWYG approach rather than a raw markdown toggle (like Obsidian).
- **Library Selection:** Implementation should rely on `TipTap` (or Novel.sh which wraps TipTap).
- **Aesthetic Enforcement:** Typing markdown syntax (e.g., `#`, `*`) instantly renders into the `Newsreader` serif typography to preserve the quiet, high-end "Danish Notebook" feel.

## 2. AI Integration Mechanics: Command & Conquer
- **Decision:** The user requested a hybrid of "Slash Commands" (Actionable) and "Highlight & Chat" (Conversational).
- **Slash Menu (`/`):** Typing `/` opens a glassmorphic menu for explicit AI functions (`/summarize`, `/rewrite`, `/connect-neuron`).
- **The Bouncer (Inline):** Selecting text will spawn a floating "Ghostly Silver" toolbar. This allows the user to invoke the AI Bouncer to debate, refine, or challenge specific concepts directly inline, enabling frictionless exploration.

## 3. Data Structure: The Liquid Document
- **Decision:** Move away from rigid, disjointed input fields (`Title`, `Definition`, `Core Insight`) to a fluid infinite canvas.
- **AI Extraction Engine:** The user simply creates a document with a Title and writes freely. The AI operates in the background, inferring and extracting the semantic required metadata ("Definition", "Core Insight", graph edges) to populate the actual knowledge graph underlying the UI.
- **Distinctive Functionalities:** Core features (FSRS-6 retrievability, bloom levels, "Meth Academy" pedagogy) must be preserved but shown as subtle visual indicators (e.g., aesthetic tags or semantic glows) to avoid cluttering the serene writing experience.

---
*Note for implementation: The user also requested a future "Playground Zone" where not every casual concept is aggressively committed to the permanent memory graph. This has been noted in the roadmap but deferred for a subsequent phase.*
