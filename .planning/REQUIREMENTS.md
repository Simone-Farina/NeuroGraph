# Requirements: NeuroGraph v1.3 QA Refinement

**Defined:** 2026-03-24
**Core Value:** The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## v1.3 Requirements

Bug fixes and UX frictions discovered during hands-on QA testing.

### Backend Bugs

- [x] **BUG-01**: Architect API `/api/architect` returns valid curriculum instead of schema error — `refusalReason` must be included in the OpenAI structured output `required` array or made truly optional in a way the provider accepts
- [x] **BUG-02**: Bloom-gated Neurogenesis is enforced at runtime — user cannot create a neuron from a shallow Remember/Understand conversation; the `suggest_neurogenesis` tool only fires at Analyze+ cognitive level
- [x] **BUG-03**: DAG agent (inferPrerequisites) creates prerequisite connections when appropriate — "Vector Databases" should link to "Relational Databases" or "NoSQL Databases" as prerequisites. Legacy nonsensical edges (e.g., "Relational Databases" → "Automated Red-Teaming") are cleaned up

### UI/Layout Bugs

- [x] **BUG-04**: Review panel width resets to standard layout when switching back to Chat mode — shell preset transitions work correctly in both directions
- [ ] **BUG-05**: "Set Learning Target" UI matches the app's editorial design language — no jarring white pill buttons or inconsistent border styles
- [x] **BUG-06**: Previously synthesized neurons show as resolved neuron cards in chat history, not stuck "Synthesizing new neuron..." indicators
- [x] **BUG-07**: No visible Handle dots on neuron nodes — graph is fully clean read-only topology

### Security/UX

- [ ] **BUG-08**: API key is masked in sidebar after initial one-time reveal — only shows on generation, not permanently

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | v1.3 is strictly bug-fix/refinement |
| LLM Bouncer production wiring | Deferred to v1.4+ |
| Canvas Mode | Deferred to v1.4+ |
| Downward FIRe cascading | Deferred to v1.4+ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 14 | Complete |
| BUG-02 | Phase 14 | Complete |
| BUG-03 | Phase 14 | Complete |
| BUG-04 | Phase 15 | Complete |
| BUG-05 | Phase 15 | Pending |
| BUG-06 | Phase 15 | Complete |
| BUG-07 | Phase 15 | Complete |
| BUG-08 | Phase 15 | Pending |

**Coverage:**
- v1.3 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 — traceability mapped to Phases 14-15*
