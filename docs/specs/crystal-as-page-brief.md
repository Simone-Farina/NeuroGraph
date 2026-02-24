# Feature Brief: Crystal-as-Page

## One-liner
Turn each crystal into an Obsidian-like page: rich markdown notes, fast navigation, and backlinks that strengthen the graph.

## Problem
Crystals currently behave like small, static objects (title/definition + simple content). Users need a place to grow a crystal over time: add context, examples, proofs, links, and personal notes. Without a page-like surface, crystals cannot become the user's daily knowledge workspace.

## User Story
As a learner, I want each crystal to be a real page I can expand with markdown notes so that my knowledge graph becomes a durable personal library.

## Proposed Approach (Conceptual)
- Use markdown as the canonical content format for each crystal.
- Replace the plain textarea in the crystal detail panel with a markdown editor experience (edit + preview).
- Support lightweight backlinks using wiki-link style syntax (`[[Crystal Title]]`) so pages can reference each other.
- Make navigation fast: graph -> page, and page -> referenced crystals.

## Scope

### IN
- Markdown editor in the crystal detail panel
- Persist markdown into the existing crystal content field
- Render markdown consistently (GFM features like lists, tables, code blocks)
- Backlink discovery from wiki-links (at least: show referenced crystals and backlinks list)
- Quick crystal search/filtering to jump between pages

### OUT
- Full Obsidian parity (plugins, panes, graph view inside the editor)
- Offline-first and sync conflict resolution
- Real-time collaboration
- Rich WYSIWYG editor with complex formatting UI

## Success Signals
- I can use NeuroGraph daily without feeling blocked by the current "small crystal" surface.
- Creating and editing notes feels fast; the graph remains the primary navigation surface.
- Backlinks make it easy to traverse related concepts without relying on chat history.

## Risks / Tradeoffs
- Security/XSS risk when rendering markdown (must avoid rendering unsafe HTML)
- Backlink parsing ambiguity (title collisions, renames)
- Performance if rendering large markdown or computing backlinks on every keystroke

## Open Questions
- Should wiki-links be title-based only, or support an ID format to survive renames?
- Do backlinks create actual graph edges, or remain a separate "page link" layer?
- What is the minimum acceptable editor UX (tabs vs split view)?

## Assumptions
- A `content` field already exists on crystals and can store markdown.
- Markdown rendering already exists in the stack (or can be added with minimal dependency risk).
