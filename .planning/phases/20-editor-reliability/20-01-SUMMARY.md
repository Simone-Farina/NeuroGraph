---
phase: 20-editor-reliability
plan: 01
subsystem: ui
tags: [tiptap, editor, react, serialization, content-sync]

# Dependency graph
requires:
  - phase: 04-advanced-ai-editor
    provides: LiquidDocumentEditor and NeuronTipTapEditor base implementations
provides:
  - Race-free neuron content sync on editor focus switch (single neuron.id-keyed useEffect)
  - Consistent JSON serialization for all editor save paths via getJSON()
  - Semantic HTML sent to extraction API for better Bloom classification
affects:
  - NeuronDetailPanel (receives JSON string from handleSave)
  - /api/neurons/[id] PATCH (stores JSON string in content field)
  - /api/neurons/extract (receives HTML for semantic signal)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TipTap setContent options object { emitUpdate: false } to prevent false dirty triggers"
    - "Single useEffect keyed on neuron.id for content sync — never guard by isFocused when ID changes"
    - "JSON.stringify(editor.getJSON()) as canonical content serialization for lossless round-trips"
    - "editor.getText() for length checks only; editor.getHTML() for semantic AI signal"

key-files:
  created: []
  modified:
    - src/components/editor/LiquidDocumentEditor.tsx
    - src/components/editor/NeuronTipTapEditor.tsx

key-decisions:
  - "20-01-single-effect-neuron-id: Replace dual content sync effects with one effect keyed on [neuron.id, editor] — ID change always means different neuron, focus guard was incorrect"
  - "20-01-emit-update-false: Use { emitUpdate: false } on programmatic setContent to avoid triggering 2.5s extraction debounce on neuron switch"
  - "20-01-getjson-canonical: JSON.stringify(getJSON()) is canonical save format — HTML introduces XSS surface and cannot round-trip reliably when extensions change"
  - "20-01-gethtml-extraction: getHTML() sent to extraction API for semantic headings/bullets signal; getText() only for minimum length check"
  - "20-01-tiptap-v3-options: TipTap v3 setContent second arg is SetContentOptions object not boolean — { emitUpdate: false } not false"

patterns-established:
  - "Content sync: always key on entity ID, never on content value, never guard by focus when ID changes"
  - "Serialization: getJSON() for persistence, getHTML() for AI semantic analysis, getText() for length/presence checks only"

requirements-completed: [EDITOR-01, EDITOR-02]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 20 Plan 01: Editor Reliability Summary

**Race-free TipTap neuron content sync via single neuron.id-keyed effect, and lossless JSON serialization replacing HTML in all save paths**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T21:44:55Z
- **Completed:** 2026-03-24T21:52:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Eliminated content sync race condition: switching neurons while editor is focused now always displays the new neuron's content immediately
- Replaced dual useEffects (title sync + content sync with isFocused guard) with a single effect keyed on [neuron.id, editor]
- Programmatic setContent now uses `{ emitUpdate: false }` to suppress the onUpdate event — prevents false `isDirty` and the 2.5s extraction debounce on every neuron switch
- handleSave serializes via `JSON.stringify(editor.getJSON())` not `editor.getHTML()` — lossless, XSS-free, extension-safe
- triggerExtraction now sends `editor.getHTML()` to the extraction API for semantic signal (headings, bullets, emphasis) while retaining `getText()` for the minimum-length guard
- NeuronTipTapEditor onChange now emits `JSON.stringify(editor.getJSON())` instead of `editor.getText()`
- NeuronTipTapEditor content sync useEffect now compares JSON serializations, preventing spurious setContent calls when content string was unchanged but was being compared against getText()

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix content sync race and standardize LiquidDocumentEditor serialization** - `3a47026` (fix)
2. **Task 2: Standardize NeuronTipTapEditor serialization to getJSON** - `52a27b2` (fix)

**Plan metadata:** (see final commit)

## Files Created/Modified
- `src/components/editor/LiquidDocumentEditor.tsx` - Single neuron.id-keyed sync effect, getJSON() save, getHTML() extraction
- `src/components/editor/NeuronTipTapEditor.tsx` - getJSON() onChange, JSON comparison in sync effect

## Decisions Made
- TipTap v3 `setContent` second argument is `SetContentOptions` object, not a boolean — discovered during TypeScript compilation; used `{ emitUpdate: false }` instead of the plan's `false` literal
- Both `{ emitUpdate: false }` calls confirmed via TipTap v3 type declarations before applying

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TipTap v3 setContent API incompatibility**
- **Found during:** Task 1 and Task 2 (TypeScript compilation)
- **Issue:** Plan specified `setContent(content, false)` as second argument to suppress update emission. TipTap v3 changed the API: second arg is `SetContentOptions` object, not boolean. `false` caused TS2559 error.
- **Fix:** Used `{ emitUpdate: false }` options object in both files
- **Files modified:** src/components/editor/LiquidDocumentEditor.tsx, src/components/editor/NeuronTipTapEditor.tsx
- **Verification:** TypeScript compiles cleanly for both editor files after fix
- **Committed in:** 3a47026 (Task 1), 52a27b2 (Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 1 - API incompatibility)
**Impact on plan:** Required fix — same semantic intent as plan, different TipTap v3 syntax. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `src/lib/ai/__tests__/architect.test.ts` and `src/lib/ai/__tests__/inferPrerequisites.test.ts` (TS2339 on JSONSchema7 | PromiseLike type) — unrelated to editor changes, not introduced by this plan, not fixed (out of scope).

## Known Stubs
None - all changes wire to live editor and save paths.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Editor content sync and serialization are now correct and consistent
- Any future plan reading neuron `content` from the database should expect JSON strings starting with `{"type":"doc"...}` for neurons saved after this plan
- Legacy HTML content in the database loads correctly — TipTap's setContent accepts both formats
- Pre-existing test file TypeScript errors should be addressed in a future plan

---
*Phase: 20-editor-reliability*
*Completed: 2026-03-24*
