---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: QA Refinement III
status: Milestone complete
stopped_at: Completed 999.2-01-PLAN.md
last_updated: "2026-04-03T16:29:48.385Z"
progress:
  total_phases: 13
  completed_phases: 12
  total_plans: 22
  completed_plans: 22
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value**: The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.
**Current focus**: Phase 26 — Chat Quality & Bloom Unification

## Current Position

Phase: 999.2
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 26-chat-quality-bloom-unification P01 | 2min | 2 tasks | 2 files |
| Phase 26-chat-quality-bloom-unification P02 | 2min | 3 tasks | 2 files |
| Phase 999.1-bloom-keyword-highlighting-animation P01 | 8min | 2 tasks | 5 files |
| Phase 27-neurogenesis-ux-operational-polish P01 | 2min | 2 tasks | 3 files |
| Phase 27-neurogenesis-ux-operational-polish P02 | 12min | 3 tasks | 11 files |
| Phase 999.2-evaluate-pretext-integration P01 | 1min | 1 tasks | 1 files |

## Accumulated Context

### Decisions

- [v2.2]: Pure bug fix milestone — no new features
- [v2.2]: OpenRouter is the provider gateway (configured in v2.1 post-milestone)
- [v2.2]: Phase 21 client-side Bloom heuristic to be removed; Phase 24 LLM evaluator is the sole classification source
- [v2.2]: Neurogenesis trigger moves from static GenerateNeuronButton to contextual in-chat suggestion
- [Phase 26-chat-quality-bloom-unification]: 26-01-sentinel-pattern: Replace scrollTop=scrollHeight with sentinel div + scrollIntoView — eliminates scroll-smooth animation queue buildup during rapid streaming
- [Phase 26-chat-quality-bloom-unification]: 26-01-16ms-debounce: 16ms setTimeout debounce on smooth scroll prevents per-chunk stutter while staying responsive
- [Phase 26-chat-quality-bloom-unification]: 26-01-instant-on-switch: Conversation switch scrolls instantly via requestAnimationFrame after loadMessages resolves
- [Phase 26-chat-quality-bloom-unification]: 26-01-80px-threshold: isAtBottom detection uses 80px slack threshold — handles minor rubber-band scroll offsets without false positives
- [Phase 26-chat-quality-bloom-unification]: 26-02-shorter-default: CHAT_SYSTEM_PROMPT rewritten to default 1-2 paragraphs; 'One tight paragraph is often enough' as primary guidance (D-08)
- [Phase 26-chat-quality-bloom-unification]: 26-02-flexible-closing: Replaced mandatory question with 'Usually close with a question, but occasionally a brief observation or reframe' (D-10)
- [Phase 26-chat-quality-bloom-unification]: 26-02-bloom-verified: BLOOM-01 confirmed satisfied by grep audit — classifyBloomLevel/BLOOM_ANALYZE_SIGNALS/BloomDepthMeter all absent from src/
- [Phase 999.1-bloom-keyword-highlighting-animation]: 999.1-01-key-phrases-verbatim: Prompt instructs LLM to return verbatim substrings from user messages for exact text matching in highlight rendering
- [Phase 999.1-bloom-keyword-highlighting-animation]: 999.1-01-safelist-opacity: /10 opacity for cool-toned Bloom levels (Remember/Understand/Apply), /15 for warm-toned (Analyze/Evaluate/Create) per UI-SPEC color table
- [Phase 999.1-bloom-keyword-highlighting-animation]: 999.1-01-safe-defaults: setBloomEval optional params ([], null) preserve backward compatibility with all existing callers
- [Phase 27-neurogenesis-ux-operational-polish]: 27-01-props-based-card: ChatNeurogenesisPrompt takes conversationId as prop from ChatPanel — keeps component pure and testable
- [Phase 27-neurogenesis-ux-operational-polish]: 27-01-auto-dismiss-on-send: resetBloomEval() at start of handleSend auto-dismisses suggestion card when user sends next message
- [Phase 27-neurogenesis-ux-operational-polish]: 27-01-isBloomPending-guard: isNeurogenesisReady includes !isBloomPending to prevent card flash during mid-evaluation state transitions
- [Phase 27]: 27-02-polling-guard: leftPanelMode in useEffect dep arrays causes React to cleanup+re-run on panel switch — interval resumes immediately on chat→graph transition
- [Phase 27]: 27-02-jargon-scope: Only user-facing string literals replaced; prop names, variable names, API routes, imports unchanged
- [Phase 27]: 27-02-test-regex: QueueItemCard date-relative assertion changed to regex — hardcoded '10 days ago' was date-sensitive and broke at today's date
- [Phase 999.2]: 999.2-no-go: Pretext is a text measurement library — orthogonal to NeuroGraph's markdown rendering, AI streaming, and chat UI needs
- [Phase 999.2]: 999.2-reconsider-conditions: revisit only if NeuroGraph adds virtualized message list + canvas/WebGL rendering + Pretext reaches v1.0.0

### Pending Todos

None yet.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-03T16:29:10.146Z
Stopped at: Completed 999.2-01-PLAN.md
Resume file: None
