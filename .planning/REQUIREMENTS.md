# Requirements: NeuroGraph v2.0 MVP Core Stability

**Defined:** 2026-03-24
**Core Value:** The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## v2.0 Requirements

Production hardening of all core features. No new features — make existing ones bulletproof.

### AI Reliability

- [x] **AI-01**: All `streamText` calls have an `onError` callback that logs and surfaces errors instead of silently swallowing them
- [x] **AI-02**: All `generateObject` calls (Architect, inferPrerequisites, Bouncer) have `maxRetries: 2`, `AbortSignal.timeout(25000)`, and typed error handling using `NoObjectGeneratedError` and `APICallError`
- [x] **AI-03**: The neurons POST route does not return 500 after a successful neuron insert — post-insert operations (vector search, inferPrerequisites, ghost projection) are non-fatal and return partial success

### Enterprise Prompt Engineering

- [ ] **PROMPT-01**: CHAT_SYSTEM_PROMPT includes Khanmigo-inspired patterns: calibrated difficulty (assume confusion is unknown), mistake handling (ask how they got there), Goldilocks edge tracking (simplify/escalate based on engagement), and meta-questioning (surface assumptions)
- [ ] **PROMPT-02**: inferPrerequisites prompt uses the "comprehension test" heuristic ("If removing A makes B incomprehensible, A is a prerequisite") with 4 boundary examples covering PREREQUISITE, BUILDS_ON, RELATED, and no-connection scenarios
- [ ] **PROMPT-03**: Server-side Kahn's algorithm cycle validation runs after LLM DAG output — structural safety net independent of prompt compliance
- [ ] **PROMPT-04**: promptfoo eval suite expanded with behavioral assertions: mistake handling, calibrated difficulty, meta-questioning, multi-turn neurogenesis priming. Suite grows from 34 to 42+ cases

### Editor Reliability

- [ ] **EDITOR-01**: TipTap content sync race on neuron switch is fixed — `editor.commands.setContent` is called when `neuron.id` changes, not just when state vars reset
- [ ] **EDITOR-02**: TipTap serialization standardized to `getJSON()` across all editor components — no mixed HTML/text formats

### Graph Performance

- [ ] **GRAPH-01**: NeuronNode and GhostNeuronNode wrapped in `React.memo` — graph does not re-render all nodes when one node's retrievability updates
- [ ] **GRAPH-02**: ReactFlow configured with `onlyRenderVisibleElements` — off-screen nodes are not in the DOM

### Bloom UI

- [ ] **BLOOM-01**: Chat interface shows a real-time cognitive depth indicator (6-segment meter) reflecting the user's approximate Bloom level based on client-side keyword analysis of their messages

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | v2.0 is strictly production hardening |
| TipTap JSON migration (existing data) | Deferred to v2.1 — new content uses getJSON, existing HTML content still loads |
| Full LLM-as-judge eval | Heuristic + behavioral assertions are sufficient for MVP |
| Supabase connection pooling/timeouts | Lower priority than AI reliability; deferred |
| Layout worker wiring | Performance optimization beyond React.memo; deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AI-01 | Phase 18 | Complete |
| AI-02 | Phase 18 | Complete |
| AI-03 | Phase 18 | Complete |
| PROMPT-01 | Phase 19 | Pending |
| PROMPT-02 | Phase 19 | Pending |
| PROMPT-03 | Phase 19 | Pending |
| PROMPT-04 | Phase 19 | Pending |
| EDITOR-01 | Phase 20 | Pending |
| EDITOR-02 | Phase 20 | Pending |
| GRAPH-01 | Phase 21 | Pending |
| GRAPH-02 | Phase 21 | Pending |
| BLOOM-01 | Phase 21 | Pending |

**Coverage:**
- v2.0 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation — all 12 requirements mapped to Phases 18-21*
