# Phase 20: Editor Reliability - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Fix the TipTap content sync race on neuron switch and standardize all editor serialization to getJSON(). The editor must display correct content on every navigation event regardless of focus state.

</domain>

<decisions>
## Implementation Decisions

### Content Sync Race (EDITOR-01)
- Fix LiquidDocumentEditor.tsx: call `editor.commands.setContent` when `neuron.id` changes, not just when state vars reset
- The race happens because the `neuron.id` useEffect resets state vars but does NOT update the ProseMirror editor content directly
- Use `editor.commands.setContent(content, false)` — the `false` prevents emitting an `update` event on programmatic set

### Serialization Standardization (EDITOR-02)
- Standardize to `getJSON()` across all editor components
- LiquidDocumentEditor currently uses `getHTML()`, NeuronTipTapEditor uses `getText()`
- New content saves use `getJSON()`, existing HTML content still loads (backward compatible)

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Files to modify
- `src/components/editor/LiquidDocumentEditor.tsx` — content sync + getHTML → getJSON
- `src/components/editor/NeuronTipTapEditor.tsx` — getText → getJSON

### Research references
- `.planning/research/STACK.md` — TipTap v3 serialization section
- `.planning/research/ARCHITECTURE.md` — Editor content sync race analysis

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

- TipTap JSON migration for existing HTML content in database (deferred to v2.1)
- enableContentCheck for schema drift detection

</deferred>

---

*Phase: 20-editor-reliability*
*Context gathered: 2026-03-24*
