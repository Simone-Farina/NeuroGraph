---
phase: 09-ui-polish-design-system
plan: 01
subsystem: ui-shell
tags: [shell, motion, history, polish]
requires: []
provides: [shell-presets, fading-history]
affects: [AppSidebar, layout, graphStore]
tech-stack:
  added: []
  patterns: [named-shell-presets, semantic-fading]
key-files:
  created: []
  modified:
    - src/app/(app)/layout.tsx
    - src/components/layout/AppSidebar.tsx
    - src/stores/graphStore.ts
    - src/components/layout/__tests__/AppSidebar.queue.test.tsx
decisions:
  - "The shell uses named layout presets (standard, deep_read, graph_zenith) instead of drag resizing."
  - "Conversation history is grouped into Active/Recent and Fading, using reduced opacity and rust semantics for fading."
metrics:
  duration: 15m
  completed_date: "2026-03-22T23:18:30Z"
---

# Phase 9 Plan 01: Establish Shell & History Polish Summary

Structural polish foundation established with named shell presets and a curated conversation-history model.

## Execution Outcomes

- the shell no longer relies on one fixed 40/60 width pair
- preset state is stored centrally (`standard`, `deep_read`, `graph_zenith`)
- transitions between presets are animated using Framer Motion
- conversations are visually grouped into Active/Recent and Fading
- fading rows use restrained terracotta semantics and lower opacity
- queue nav and inbox badge still function correctly
- focused sidebar tests pass

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

- **Shell Layout**: Replaced ad-hoc sizing with explicitly named states (`standard`, `deep_read`, `graph_zenith`) coordinated via `graphStore`.
- **History Curation**: Replaced raw chronological lists with semantic groupings (Active/Recent vs. Fading) to gently communicate TTL decay without inducing anxiety.

## Checkpoint Resolution

- **Task 3 (Human Verify)**: User approved skipping local verification to proceed, noting verification will happen once deployed to develop and main.

## Next Steps

Proceeding to Plan 02 for editorial chat polish.

## Self-Check: PASSED
FOUND: .planning/phases/09-ui-polish-design-system/09-01-SUMMARY.md
FOUND: effc245
FOUND: 4c6c4a8

