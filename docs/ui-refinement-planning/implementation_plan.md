# Massive UI Refinement: "Danish Computation"

The goal of this phase is to execute a massive UI refinement based on the `.impeccable.md` design contract, replacing the generic "AI Vibe" with a pristine, introspective, and highly tactile environment.

## Design Critique

### 1. AI Slop Detection
**Verdict: FAIL.** The current UI relies heavily on the "fingerprints of AI-generated work" from 2024-2025:
- **Neon Gradients:** `bg-gradient-to-r from-neural-cyan to-neural-purple` used on buttons.
- **Glowing Backgrounds:** Extensive use of `radial-gradient` backgrounds to create artificial cyan and purple light bloom behind panels.
- **Pulsing Shadows:** `shadow-lg shadow-neural-cyan/5` and `animate-pulse-cyan` used as decorative instead of semantic elements.

### 2. Typography
**Issue:** Uniform system sans-serif everywhere. It doesn't differentiate between structural UI components and the actual "Knowledge" content. It lacks the editorial, high-end "Danish Notebook" feel.

### 3. Color with Purpose
**Issue:** Color is used decoratively (cyan vs purple for User vs AI). It isn't hooked into the actual DAG functionality (Mastered, Decaying, Frontier). 

## Proposed Changes

We will execute the `frontend-design` and `bolder` principles across the UI.

### 1. Global Styles & Typography
- **Add Fonts:** Import `Geist` (Sans) and `Newsreader` (Serif) via `next/font/google` in `src/app/layout.tsx`.
- **Global CSS & Tailwind Config:**
  - Remove all `neural-cyan` and `neural-purple` gradients, glows, and box-shadows.
  - Set the application background to a muted Graphite/Charcoal (`#121212` or `zinc-950`).
  - Add the strict Semantic Color palette to Tailwind:
    - `sage-green`: `emerald-600` for mastered knowledge.
    - `terracotta`: `orange-500/rust` for decaying nodes.
    - `ghostly`: `zinc-400/opacity` for uncharted areas.
    - `bioluminescent`: `#ffffff` with subtle glowing filters for synaptic AI activity.

### 2. The Chat View (`MessageList`, `ChatPanel`, `ChatInput`)
- **Typography Swap:** Messages (both User and AI) will use the `Newsreader` serif font to feel like reading high-end editorial content. UI labels ("You", "NeuroGraph") will use geometric sans-serif or mono.
- **Message Bubbles:** Remove cyan/purple tinted borders. Use austere, high-contrast monochrome containers (`bg-white/5` with `border-white/10`).
- **Tactile Transitions:** Use `framer-motion` for elegant, eased appearances of new messages rather than hard snapping. Use soft glassmorphic blurs on the Chat Input toolbar.

### 3. Neurogenesis & Bouncer UI (`NeurogenesisSuggestion`, `BouncerCard`)
- **Generation Button:** Replace the cyan/purple gradient button with a sophisticated, stark monochrome button that pulses with "Bioluminescent White" only when generating.
- **Cards:** Remove glowing purple borders. Use sharp `border-white/10` containers. The "Core Insight" should feel like a highlighted excerpt in a notebook.

### 4. The Graph Canvas (`GraphPanel`, `AppSidebar`)
- **Canvas Background:** Replace the glowing radial gradients with a subtle, low-opacity dot-grid (`@xyflow/react` Background component configured to dot pattern).
- **Sidebar:** Increase the tactile feel with surgical 1px borders. Apply the new Sans font. Make the 14-day TTL markers stand out using the new semantic color logic (Terracotta for urgency).

### 5. Spatial Layout Refactor (Editor Sidebar UX)
**Current Issue:** Clicking a node changes `leftPanelMode` to 'neuron' in `layout.tsx`, replacing the Chat component with `NeuronDetailPanel`. This destroys conversation context.
**Competitor Insight:** Both Recall and Second Brain emphasize spatial canvas alongside context. They use side-drawers for deep editing rather than destroying the primary navigational plane.
**Proposed Architecture:**
- Allow `children` (the Chat) to remain persistently mounted in the 40vw left pane.
- Detach `NeuronDetailPanel` and mount it inside the 60vw right pane as an absolutely positioned, overlapping floating drawer anchoring to the right side of the window.
- Apply the "Danish Computation" visual rules (Graphite backgrounds, Newsreader serif, monochrome UI buttons) to `NeuronDetailPanel` to fix the current legacy aesthetic buttons ("Edit", "Preview", "Torna alla Chat").
- Harmonize translations: Change "Torna alla Chat" to English to maintain visual consistency.

---

# Phase 2: Advanced AI Markdown Editor

The goal of this phase is to replace the rigid, field-based `NeuronDetailPanel` with a powerful, AI-assisted WYSIWYG writing surface that feels like a quiet "Danish notebook" but possesses raw computational power.

## Architectural Decisions (GSD Handoff)

### 1. The Editor Paradigm: Live WYSIWYG (Block-based)
- **Framework:** Implement a block-based rich text editor (e.g., [Novel.sh](https://novel.sh/) / TipTap).
- **Aesthetic:** No raw markdown toggle. You type Markdown syntax (`#`, `*`), and it immediately renders in the curated `Newsreader` typography. 
- **Goal:** Create a frictionless, deeply tactile writing experience that matches the `.impeccable.md` mandate.

### 2. AI Integration Mechanics: Slash Commands + Highlight & Chat
- **Slash Commands (`/`):** A subtle, glassmorphic dropdown to invoke commands (e.g., `/summarize`, `/rewrite`, `/connect-neuron`).
- **Highlight & Chat (The Bouncer):** Selecting text reveals a floating "Ghostly Silver" toolbar. This allows the user to invoke the AI Bouncer to discuss, refine, or challenge specific concepts directly within the note, creating a frictionless cycle of exploration.

### 3. Data Structure: Liquid Document
- **The Shift:** Move away from hardcoded form fields (`Title`, `Definition`, `Core Insight`) to an infinite canvas.
- **AI Extraction:** The user writes freely under a primary Title. The AI automatically extracts the semantic metadata ("Definition", "Core Insight", graph relationships) in the background to feed the Neural Graph.
- **Distinctive Features Integration:** Retrievability/Spaced Repetition statuses, Bloom Levels, and "Meth Academy" paradigms will be subtly integrated as aesthetic tags or visual indicators (e.g., changing the glow of the document title or a small semantic badge) without cluttering the WYSIWYG canvas.

## Deferred Roadmap Items
- **The Playground Zone:** Not every thought belongs in the permanent graph. A future "Scratchpad" or "Playground" will be implemented so users can hold temporary conversations or draft concepts without committing them to the permanent conceptual network.

## Handoff Instructions
*This plan represents the finalized architectural blueprint. Implementation details (React components, TipTap extensions, and AI tooling) are to be executed by Claude Opus based on this foundation.*

## Verification Plan

### Manual Verification
1. Run `npm run dev` and open the application in the browser at `http://localhost:3000`.
2. Open the Neuron Editor drawer. Verify the strict form fields are replaced by a clean, infinite page.
3. Type raw markdown (`# Title`) and verify live rendering into `Newsreader` serif.
4. Type `/` and verify the AI slash menu appears.
5. Highlight text and verify the floating Bouncer chat toolbar appears.
