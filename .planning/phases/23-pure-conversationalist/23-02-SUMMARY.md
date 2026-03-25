---
phase: 23-pure-conversationalist
plan: "02"
subsystem: chat
tags: [prompt-engineering, tool-removal, ui-cleanup, socratic-tutor]
dependency_graph:
  requires: [23-01]
  provides: [pure-text-chat-endpoint, natural-socratic-prompt, clean-chat-ui]
  affects: [src/lib/ai/prompts.ts, src/app/api/chat/route.ts, src/components/chat/ChatPanel.tsx, src/components/chat/MessageList.tsx]
tech_stack:
  added: []
  patterns: [prose-form-prompt, tool-free-streamText, simplified-loadMessages]
key_files:
  created: []
  modified:
    - src/lib/ai/prompts.ts
    - src/app/api/chat/route.ts
    - src/components/chat/ChatPanel.tsx
    - src/components/chat/MessageList.tsx
decisions:
  - "Depth Encouragement wording: relentless but warm push to analyze tradeoffs, question assumptions, generalize — without naming the framework or cognitive levels"
  - "Reference Catalog label replaces Existing Neuron Catalog with neutral language stripped of architecture jargon"
  - "loadMessages simplified to text-only: removed tool part rehydration entirely since migration truncated legacy data"
  - "Pre-existing TS errors in test files (JSONSchema7 PromiseLike) are unrelated to this plan — left untouched"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_modified: 4
---

# Phase 23 Plan 02: Pure Conversationalist Production Code Summary

Rewrote CHAT_SYSTEM_PROMPT as a natural prose-form Socratic tutor with Depth Encouragement, stripped all tool-calling from /api/chat, and removed the neurogenesis tool invocation UI from ChatPanel and MessageList — completing the Pure Conversationalist transformation.

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Rewrite CHAT_SYSTEM_PROMPT and strip tools from chat route | 031a88c | src/lib/ai/prompts.ts, src/app/api/chat/route.ts |
| 2 | Remove tool invocation handling from ChatPanel and MessageList | 963cbe2 | src/components/chat/ChatPanel.tsx, src/components/chat/MessageList.tsx |

## What Was Built

### Task 1: Prompt Rewrite + Route Cleanup

**CHAT_SYSTEM_PROMPT** was completely replaced. The old prompt had:
- Rigid acknowledge/enrich/question 3-step structure (caused robotic tone)
- Neurogenesis Policy section with `suggest_neurogenesis` tool instructions
- References to Bloom's Taxonomy, Neurogenesis, platform jargon

The new prompt has:
- Natural prose-form dialogue identity: "You are NeuroGraph, a rigorous Socratic thinking companion"
- "Your Approach" section: flowing prose, no unsolicited lists, varied openings, one closing question per turn
- "Depth Encouragement" directive: relentlessly push users to analyze mechanisms, edge cases, tradeoffs, generalizations — warmly, without naming the cognitive framework
- All 4 Khanmigo Pedagogical Calibration patterns preserved: Calibrated Difficulty, Mistake Handling, Goldilocks Edge Tracking, Meta-questioning
- Reference to `## Relevant Knowledge Context` and `## Reference Catalog` sections when present

**route.ts** changes:
- Removed `import { suggestNeurogenesisTool }`
- Removed `tools: { suggest_neurogenesis: suggestNeurogenesisTool }` from `streamText` call
- Simplified `onFinish`: pure text persistence with `metadata: null`, no tool call serialization
- Updated system prompt construction: "Existing Neuron Catalog" → "Reference Catalog" with neutral language

### Task 2: UI Cleanup

**ChatPanel.tsx** — removed ~550 lines of tool invocation handling:
- All neurogenesis-related callbacks: `handleNeurogenesis`, `handleDismiss`, `handleAddToolOutput`, `handleConfirmEdgeSuggestion`, `handleDismissEdgeSuggestion`
- All related state: `processingToolCalls`, `processingToolCallsRef`, `edgeSuggestions`, `connectionNotice`
- All related helpers: `isToolPartWithId`, `upsertEdgeInStore`, `markerForEdge`, `toGraphEdge`, `edgeSuggestionKey`
- Removed types: `SuggestionInput`, `SuggestionToolPart`, `RelationshipType`, `CreatedNeuronResponse`, `SynapseUpsertResponse`
- Removed imports: `Edge`, `MarkerType` from `@xyflow/react`
- Removed `addToolOutput` from `useChat` destructuring
- Removed edge suggestions and connection notice UI blocks
- Simplified `loadMessages`: text-only parts (`[{ type: 'text', text: msg.content }]`), no metadata parsing
- Simplified `MessageList` props: now only `messages` and `isLoading`

**Preserved intact:** Crystallize flow (`CrystallizeBootstrap`, `CrystallizePasteComposer`, `activeCrystallizeSession`, `isCrystallizing`), Horizon seed flow (`pendingHorizonSeed`, `clearHorizonLearningIntent`), YouTube transcript handling, `SelectionToolbar`, `ChatInput`.

**MessageList.tsx** — simplified to pure text rendering:
- Removed `NeurogenesisSuggestion` import
- Removed props: `processingToolCalls`, `onNeurogenesis`, `onDismiss`, `addToolResult`
- Removed entire `tool-` part rendering block
- `MessageListProps` now: `{ messages: UIMessage[]; isLoading?: boolean }`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all production paths are fully wired. The chat endpoint is a pure text streamer.

## Verification Results

All acceptance criteria passed:

- `suggestNeurogenesisTool` in route.ts: 0 matches
- `tools:` in route.ts: 0 matches
- `suggest_neurogenesis` in route.ts: 0 matches
- `handleNeurogenesis` in ChatPanel.tsx: 0 matches
- `processingToolCalls` in ChatPanel.tsx: 0 matches
- `edgeSuggestions` in ChatPanel.tsx: 0 matches
- `NeurogenesisSuggestion` in ChatPanel.tsx: 0 matches
- `NeurogenesisSuggestion` in MessageList.tsx: 0 matches
- `onNeurogenesis` in MessageList.tsx: 0 matches
- Crystallize flow (`CrystallizeBootstrap|CrystallizePasteComposer|activeCrystallizeSession`): 7 matches (preserved)
- `pendingHorizonSeed`: 5 matches (Horizon seed flow preserved)
- TypeScript: 0 new errors (2 pre-existing errors in test files, unrelated to this plan)

## Self-Check: PASSED
