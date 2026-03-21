# Plan: Advanced AI Markdown Editor

## Objective
Replace the current rigid, field-based Neuron editor with a beautiful, AI-assisted WYSIWYG writing surface that conforms strictly to the "Danish Computation" aesthetic (`.impeccable.md`).

## Reference Context
Review `.planning/phases/04-advanced-ai-editor/CONTEXT.md` before starting to understand the architectural paradigms (TipTap WYSIWYG, Slash Commands, Liquid Document extraction).

## Implementation Steps

### Step 1: Editor Core Setup (TipTap/Novel)
- Initialize the generic Rich Text Editor component (using TipTap or Novel.sh).
- Implement markdown shortcut parsing so raw markdown syntax instantly formats.
- Hook up styling to exclusively utilize the `Newsreader` font and the `Graphite/Charcoal` color scales from tailwind config.

### Step 2: The "Liquid Document" Data Layer
- Transition the existing data hooks where users input `definition` and `core_insight` manually.
- Build an AI background extraction pipeline: as the user types, the LLM infers the "Core Insight" and "Definition" properties.
- Map the extracted metadata seamlessly to the existing DB models so that Graph Nodes continue functioning.

### Step 3: AI Slash Commands (`/`)
- Implement the Floating Menu extension for TipTap.
- When `/` is typed, trigger a context overlay menu.
- Wire specific commands (e.g. `Summarize`, `Expand`, `Rewrite`) to the Vercel AI SDK to stream text modifications directly into the editor.

### Step 4: The Bouncer (Highlight & Chat)
- Implement a text-selection (Bubble) menu extension.
- Clicking the "Chat" action spawns a conversational interface linked explicitly to the selected text snippet.
- Allow the Bouncer to propose changes that the user can accept to replace the highlighted text.

### Step 5: Visual Polish & "Distinctive Features" Integration
- Ensure the editor integrates the distinct NeuroGraph states (Retrievability, Bloom Levels, Ghost Nodes) via subtle visual queues (tags, background glows).
- Finalize the layout so it meshes perfectly with the existing right-hand sliding Drawer established in previous phases.

## Verification
- Run `npm run dev` and navigate to the editor by clicking a Neuron on the canvas.
- Ensure all legacy input fields are gone, replaced by a single minimalist page.
- Test Markdown shortcut rendering.
- Test Slash commands and text highlighting interfaces to guarantee the AI Bouncer responds.
