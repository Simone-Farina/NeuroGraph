# Requirements: NeuroGraph v2.1

**Defined:** 2026-03-25
**Core Value:** The system enforces "Active Extraction" and rigorous retention over passive reading; users only create nodes when they reach a "Deep Insight," and the AI acts as a bouncer to prevent hallucinated or disconnected knowledge graphs.

## v2.1 Requirements

Requirements for Core Flow Stability, Multi-Agent Architecture & Observability. Each maps to roadmap phases.

### Observability

- [ ] **OBS-01**: All AI call sites (streamText, generateObject) emit OpenTelemetry traces to Langfuse Cloud
- [ ] **OBS-02**: Each agent (Conversationalist, Bloom Evaluator, Synthesizer, Inquisitor) produces a named span in Langfuse
- [ ] **OBS-03**: Traces are correlated by conversation session ID and authenticated user ID
- [ ] **OBS-04**: RAG context (retrieved neurons/vectors) is logged as span metadata so debugging can confirm what the LLM actually saw
- [ ] **OBS-05**: Langfuse Cloud integration with proper environment variables (no self-hosting)

### Multi-Agent Architecture

- [ ] **AGENT-01**: `/api/chat` stream has zero tool-calling capabilities — pure natural Socratic tutor
- [ ] **AGENT-02**: Chat system prompt never mentions "Neurons", "Crystallization", or "Bloom's Taxonomy" — converses and challenges naturally
- [ ] **AGENT-03**: Async Bloom Evaluator runs a cheap LLM (Gemini Flash) on the last 3 messages after each user turn, non-blocking
- [ ] **AGENT-04**: Bloom evaluation result updates Zustand state with `{ bloomLevel, confidence }` without interrupting chat
- [ ] **AGENT-05**: "Generate Neuron" button illuminates when `bloomLevel >= Analyze` with Danish Computation aesthetic (muted to solid transition, no gamification)
- [ ] **AGENT-06**: Supabase migration transforms persisted tool-call messages so existing conversations rehydrate correctly

### Architect Pipeline

- [ ] **ARCH-01**: User-triggered `POST /api/architect` runs a 3-step sequential pipeline: Synthesizer, RAG, Epistemological Inquisitor
- [ ] **ARCH-02**: Synthesizer agent distills conversation history into canonical `title`, `definition`, and `core_insight`
- [ ] **ARCH-03**: Each pipeline step (Synthesizer, RAG retrieval, Inquisitor) gets its own Langfuse span
- [ ] **ARCH-04**: Architect response updates React Flow graph without freezing the chat UI

### Eval Suite

- [ ] **EVAL-01**: Conversationalist eval suite updated with golden cases proving no direct answers, no bullet points, no NeuroGraph jargon
- [ ] **EVAL-02**: Bloom Evaluator eval suite with golden cases distinguishing Understand vs Analyze/Evaluate/Create accurately
- [ ] **EVAL-03**: Eval suites pass before any production code ships (eval-driven development)

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Deferred from Previous Milestones

- **CANVAS-01**: Implement Canvas Mode for freeform dragging and media organization
- **FIRE-01**: Implement Downward FIRe cascading logic
- **FIRE-02**: Connect robust AI auto-healing recommendations for FSRS decay
- **BOUNCER-01**: Wire LLM Bouncer into production neuron creation (currently eval-only)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Self-hosted Langfuse | Cloud-first decision; self-hosting adds infrastructure burden for a solo MicroSaaS |
| Next.js 15 upgrade | Not required — `immediateExport: true` handles serverless flush on Next.js 14 |
| New product features | This milestone is architectural refactoring only — no new user-facing capabilities |
| Real-time streaming Bloom eval | Evaluator runs after user turn completes, not mid-stream — simpler, cheaper |
| Multi-agent framework (LangChain/CrewAI) | Direct function calls with explicit contracts; frameworks add complexity without value here |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OBS-01 | — | Pending |
| OBS-02 | — | Pending |
| OBS-03 | — | Pending |
| OBS-04 | — | Pending |
| OBS-05 | — | Pending |
| AGENT-01 | — | Pending |
| AGENT-02 | — | Pending |
| AGENT-03 | — | Pending |
| AGENT-04 | — | Pending |
| AGENT-05 | — | Pending |
| AGENT-06 | — | Pending |
| ARCH-01 | — | Pending |
| ARCH-02 | — | Pending |
| ARCH-03 | — | Pending |
| ARCH-04 | — | Pending |
| EVAL-01 | — | Pending |
| EVAL-02 | — | Pending |
| EVAL-03 | — | Pending |

**Coverage:**
- v2.1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
