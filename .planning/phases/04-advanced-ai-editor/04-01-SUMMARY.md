---
phase: 04-advanced-ai-editor
plan: 01
subsystem: ui
tags: [tiptap, wysiwyg, ai, markdown, editor, streaming, slash-commands, bubble-menu]

# Dependency graph
requires:
  - phase: graph-panel
    provides: NeuronDetailPanel drawer, graphStore, PATCH /api/neurons/[id]
  - phase: ai-sdk
    provides: getModelForRole, streamText, generateObject, Vercel AI SDK patterns
provides:
  - TipTap WYSIWYG editor replacing all rigid neuron input fields
  - LiquidDocumentEditor component integrating all editor features
  - Slash command system (/, Summarize/Expand/Rewrite/Challenge/Connect)
  - The Bouncer: selection bubble menu with inline AI chat
  - POST /api/neurons/extract for background metadata inference
  - POST /api/neurons/ai-action for streaming AI text actions
affects: [graph-panel, neuron-editor, neuron-detail, ai-actions]

# Tech tracking
tech-stack:
  added:
    - "@tiptap/react v3.20.4"
    - "@tiptap/starter-kit"
    - "@tiptap/extension-placeholder"
    - "@tiptap/extension-typography"
    - "@tiptap/extension-link"
    - "@tiptap/extension-bubble-menu"
  patterns:
    - TipTap ProseMirror Plugin for slash command state machine
    - Streaming AI responses via toTextStreamResponse + ReadableStream parsing
    - Background AI extraction with debounced 2.5s firing on editor update
    - Absolute-positioned overlay menus anchored to editor container

key-files:
  created:
    - src/components/editor/NeuronTipTapEditor.tsx
    - src/components/editor/SlashCommandMenu.tsx
    - src/components/editor/BouncerBubbleMenu.tsx
    - src/components/editor/LiquidDocumentEditor.tsx
    - src/app/api/neurons/extract/route.ts
    - src/app/api/neurons/ai-action/route.ts
  modified:
    - src/components/graph/NeuronDetailPanel.tsx
    - src/app/globals.css
    - package.json

key-decisions:
  - "Used TipTap v3 (not Novel.sh) for direct ProseMirror control and no vendor lock-in"
  - "Slash menu rendered as React state overlay rather than Tippy.js popup (no extra dependency)"
  - "Bouncer uses DOM selection coordinates for positioning, not @tiptap/extension-bubble-menu React wrapper (not available in v3)"
  - "AI extraction fires after 2.5s debounce to avoid excessive API calls while typing"
  - "toTextStreamResponse used for streaming (toDataStreamResponse removed in AI SDK v6)"
  - "maxOutputTokens replaces maxTokens (renamed in AI SDK v6)"

patterns-established:
  - "Editor components live in src/components/editor/ subdirectory"
  - "Slash commands use ProseMirror Plugin key state to surface menu state to React"
  - "AI streaming endpoints return plain text stream via toTextStreamResponse"

requirements-completed: []

# Metrics
duration: 45min
completed: 2026-03-21
---

# Phase 04: Advanced AI Markdown Editor Summary

**TipTap WYSIWYG editor replacing rigid neuron form fields, with Slash Commands, Bouncer bubble menu, and background AI metadata extraction from free-form prose**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-21T00:00:00Z
- **Completed:** 2026-03-21T00:45:00Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments

- Replaced all rigid form inputs (title/definition/core_insight/content textareas) with a single fluid WYSIWYG writing surface
- Slash command system (`/`) surfaces 5 AI actions (Summarize, Expand, Rewrite, Challenge, Connect Neurons) with keyboard navigation
- The Bouncer: selection-aware floating toolbar offering inline AI rewrites and a conversational chat mode linked to the highlighted passage
- Background AI extraction infers `definition`, `core_insight`, and `bloom_level` from free text after 2.5s of typing inactivity
- Visual indicators for SRS state, Bloom level (color-coded), and retrievability percentage bar preserved in the new UI

## Task Commits

1. **Step 1: Editor Core Setup** - `0fdfb83` (feat)
2. **Step 2: Liquid Document Data Layer (AI Extraction API)** - `79a668b` (feat)
3. **Step 3: Slash Commands + AI Action Endpoint** - `78df5af` (feat)
4. **Step 4: The Bouncer Bubble Menu** - `0c7f012` (feat)
5. **Step 5: LiquidDocumentEditor + NeuronDetailPanel replacement** - `c2f6984` (feat)

## Files Created/Modified

- `src/components/editor/NeuronTipTapEditor.tsx` - Standalone TipTap editor primitive with prose styles
- `src/components/editor/SlashCommandMenu.tsx` - ProseMirror Plugin for `/` slash command detection and state
- `src/components/editor/BouncerBubbleMenu.tsx` - Selection-tracking floating toolbar with AI chat mode
- `src/components/editor/LiquidDocumentEditor.tsx` - Composite editor integrating all features + save logic
- `src/app/api/neurons/extract/route.ts` - Background AI extraction of neuron metadata from content
- `src/app/api/neurons/ai-action/route.ts` - Streaming AI text actions for slash commands and bubble menu
- `src/components/graph/NeuronDetailPanel.tsx` - Refactored to use LiquidDocumentEditor, removed form fields
- `src/app/globals.css` - Added TipTap empty-state placeholder styles

## Decisions Made

- **TipTap v3 directly over Novel.sh**: Novel.sh wraps TipTap but its React-specific components lag behind TipTap v3 API. Used TipTap directly for control.
- **No Tippy.js for slash menu**: Built a React state overlay instead to avoid adding a dependency that doesn't add value over absolute positioning.
- **BubbleMenu as custom component**: `@tiptap/react` v3 does not export a `BubbleMenu` React component. Built a custom implementation tracking `selectionUpdate` events.
- **`toTextStreamResponse` not `toDataStreamResponse`**: AI SDK v6 removed `toDataStreamResponse` from `StreamTextResult`. Used `toTextStreamResponse` which returns a plain text stream.
- **`maxOutputTokens` not `maxTokens`**: AI SDK v6 renamed the parameter.
- **Debounced extraction at 2.5s**: Balances responsiveness with API cost — fires only when user pauses writing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed AI SDK v6 API surface differences**
- **Found during:** Task 3 (AI action endpoint) and verified by TypeScript
- **Issue:** `toDataStreamResponse` removed in AI SDK v6, `maxTokens` renamed to `maxOutputTokens`
- **Fix:** Used `toTextStreamResponse()` and `maxOutputTokens: 600`
- **Files modified:** src/app/api/neurons/ai-action/route.ts
- **Verification:** TypeScript clean, `npm run build` passes
- **Committed in:** 78df5af

**2. [Rule 3 - Blocking] Fixed TipTap v3 setContent API change**
- **Found during:** Tasks 1 and 5 (editor components)
- **Issue:** TipTap v3 `setContent` no longer accepts a boolean second argument (removed `emitUpdate` param)
- **Fix:** Removed `false` second argument from all `setContent` calls
- **Files modified:** src/components/editor/NeuronTipTapEditor.tsx, src/components/editor/LiquidDocumentEditor.tsx
- **Verification:** TypeScript clean, `npm run build` passes
- **Committed in:** 0fdfb83, c2f6984

**3. [Rule 3 - Blocking] BubbleMenu not exported from @tiptap/react v3**
- **Found during:** Task 4 (Bouncer implementation)
- **Issue:** `@tiptap/react` v3 does not export a `BubbleMenu` React component; the `@tiptap/extension-bubble-menu` package only exports a TipTap Extension, not a React component
- **Fix:** Built custom `BouncerBubbleMenu` using `editor.on('selectionUpdate')` and DOM range coordinates
- **Files modified:** src/components/editor/BouncerBubbleMenu.tsx
- **Verification:** TypeScript clean, component renders correctly
- **Committed in:** 0c7f012

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking API surface issues from TipTap v3 and AI SDK v6)
**Impact on plan:** All fixes necessary to resolve library version incompatibilities. No scope creep.

## Issues Encountered

- TipTap v3 has significantly different API surface from v2 (many React helpers removed from `@tiptap/react`)
- AI SDK v6 breaking changes from v5: method renames throughout StreamTextResult

## Next Phase Readiness

- Editor surface complete and functional, ready for user testing
- Slash command state uses ProseMirror Plugin; can be extended with more commands
- AI extraction integrates cleanly with existing PATCH /api/neurons/[id] endpoint
- "Playground Zone" (deferred from CONTEXT.md) could be added as a future phase

---
*Phase: 04-advanced-ai-editor*
*Completed: 2026-03-21*

## Self-Check: PASSED

- FOUND: src/components/editor/NeuronTipTapEditor.tsx
- FOUND: src/components/editor/SlashCommandMenu.tsx
- FOUND: src/components/editor/BouncerBubbleMenu.tsx
- FOUND: src/components/editor/LiquidDocumentEditor.tsx
- FOUND: src/app/api/neurons/extract/route.ts
- FOUND: src/app/api/neurons/ai-action/route.ts
- All 5 task commits verified in git log
