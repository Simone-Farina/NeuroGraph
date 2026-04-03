# Requirements: NeuroGraph v2.2

**Defined:** 2026-04-03
**Core Value:** The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## v2.2 Requirements

Requirements for QA Refinement III. Bug fixes and regressions found during v2.1 manual testing.

### Neurogenesis UX

- [x] **NGEN-01**: Neurogenesis trigger appears as an in-chat contextual suggestion (not a static button) when Bloom evaluator detects Analyze+ depth

### Chat Quality

- [x] **CHAT-01**: Chat streaming auto-scrolls smoothly without scrollbar jank or UI blocking
- [x] **CHAT-02**: Conversationalist sometimes responds with 1-2 paragraphs instead of always 3 — sharper, more varied turns

### UI Consistency

- [x] **UI-01**: Graph empty state and all static UI copy contain zero platform jargon ("crystallize", "neuron", "Bloom")

### Performance

- [x] **PERF-01**: No unnecessary API calls (/api/queue, /api/review, /api/neurons) fire during active chat sessions

### Bloom System

- [x] **BLOOM-01**: Single Bloom classification source — Phase 24 LLM evaluator only. Phase 21 client-side heuristic removed or replaced.

## Future Requirements

Deferred to future milestones.

### Backlog

- **999.1**: Bloom keyword highlighting animation (UI/UX ideation needed)
- **999.2**: Evaluate Pretext (chenglou) integration

### Deferred from Previous Milestones

- **CANVAS-01**: Implement Canvas Mode for freeform dragging and media organization
- **FIRE-01**: Implement Downward FIRe cascading logic
- **FIRE-02**: Connect robust AI auto-healing recommendations for FSRS decay
- **BOUNCER-01**: Wire LLM Bouncer into production neuron creation (currently eval-only)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | This is a pure bug fix milestone |
| Bloom keyword animation | Deferred to backlog 999.1 |
| Pretext integration | Deferred to backlog 999.2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAT-01 | Phase 26 | Complete |
| CHAT-02 | Phase 26 | Complete |
| BLOOM-01 | Phase 26 | Complete |
| NGEN-01 | Phase 27 | Complete |
| UI-01 | Phase 27 | Complete |
| PERF-01 | Phase 27 | Complete |

**Coverage:**
- v2.2 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation — all 6 requirements mapped*
