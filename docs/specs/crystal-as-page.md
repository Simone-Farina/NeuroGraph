# Feature: Crystal-as-Page

## Problem
Crystals need to become durable knowledge artifacts, not just brief summaries. Users need a page-like surface to expand a crystal with examples, personal notes, and links. Without this, long-term use becomes fragmented (notes live elsewhere) and the graph loses value as the primary interface.

## User Story
As a learner, I want each crystal to be a rich markdown page so that I can grow my understanding over time and navigate knowledge through the graph.

## Scope

### IN (must deliver)
- [ ] Crystal detail panel supports editing markdown content (edit mode)
- [ ] Crystal detail panel supports rendering markdown content (preview mode)
- [ ] Markdown is persisted to the existing crystal content field and reloads on refresh
- [ ] Wiki-link style references (`[[Crystal Title]]`) are detected and displayed as outbound links
- [ ] Backlinks list exists (crystals that reference the current crystal)
- [ ] Basic crystal search/filtering exists to jump between pages

### OUT (explicitly excluded)
- [ ] Offline-first sync and conflict resolution
- [ ] Real-time collaboration
- [ ] Full Obsidian plugin ecosystem
- [ ] Multi-pane workspace layout
- [ ] WYSIWYG editor (rich toolbar, complex formatting UI)

## Technical Design

### Data Model Changes
- No new required fields if `crystals.content` already exists.
- Backlinks can be computed dynamically by parsing content, or stored in a dedicated table later if performance requires it.
- If title-based wiki-links are insufficient, add an ID-based reference format in a follow-up (OUT of scope for this spec).

### API Changes
- Ensure there is a supported update path for crystal content (example: `PATCH /api/crystals/[id]` to update `content`).
- If API already exists, extend validation so `content` accepts markdown text.
- Add (or extend) an endpoint to query backlinks efficiently if the UI requires it.

### UI Changes
- Replace the plain content textarea in the crystal detail panel with:
  - Edit mode: markdown editor surface
  - Preview mode: markdown renderer with GFM (tables, lists, code blocks)
- Add links section:
  - Outbound links: parsed `[[...]]` references
  - Backlinks: other crystals referencing current one
- Add a simple search/filter input to jump between crystals/pages.

## Acceptance Criteria
- [ ] Editing a crystal's markdown persists and reloads correctly (no data loss)
- [ ] Markdown renders with GFM features (lists, tables, fenced code blocks)
- [ ] Rendering does not allow unsafe HTML/XSS by default
- [ ] Outbound wiki-links are detected and shown as clickable items
- [ ] Backlinks list updates after saving content in another crystal
- [ ] Search/filter lets me navigate to a crystal page in under 3 interactions

## Guardrails
- Do NOT refactor chat/crystallization flow as part of this feature
- Do NOT add a complex editor framework unless strictly necessary
- Do NOT render raw HTML from markdown without sanitization
- Do NOT introduce background jobs or new infra for backlinks in this iteration

## Open Questions
- Should backlinks create real graph edges or remain a separate "page links" layer?
- How should wiki-links behave on crystal rename (title collisions, broken links)?
- Minimum acceptable editor UX: tabbed edit/preview vs split view?
