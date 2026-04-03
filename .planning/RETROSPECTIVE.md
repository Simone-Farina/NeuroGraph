# NeuroGraph Retrospective

Living document capturing lessons, trends, and execution metrics across milestones.

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tasks | Models Used | Days |
|-----------|--------|-------|-------|-------------|------|
| v1.0      | 4      | 5     | 0     | GPT-4o, Cl. | < 5  |
| v1.1      | 5      | 15    | 24    | Claude       | ~2   |
| v1.2      | 5      | 13    | 35    | Claude       | ~1   |
| v2.2      | 2      | 4     | 10    | Claude       | 1    |

---

## Milestone: v2.2 — QA Refinement III

**Shipped:** 2026-04-03
**Phases:** 2 | **Plans:** 4

### What Was Built
- Sentinel scroll pattern replacing broken CSS scroll-smooth queuing for jank-free AI streaming
- CHAT_SYSTEM_PROMPT rewritten for varied 1-2 paragraph responses with flexible closings
- Phase 21 client-side Bloom heuristic fully removed; sole source is POST /api/bloom-evaluate LLM evaluator
- ChatNeurogenesisPrompt inline card replaces static GenerateNeuronButton
- Polling guards on GraphPanel and QueueBootstrap suppress unnecessary API calls during chat
- Jargon purge across 8 files — zero user-facing "crystallize"/"neuron"/"Bloom" remaining

### What Worked
- **Audit-driven gap closure**: First audit found 3 gaps (jargon miss, stale test, mock value); all resolved in one commit before re-audit passed
- **leftPanelMode guard pattern**: Using Zustand selector in useEffect dep arrays ensures clean React cleanup + re-run on panel switch — intervals resume immediately
- **Sentinel scroll**: Replacing scrollTop manipulation with scrollIntoView + debounce eliminated the scroll-smooth animation queue buildup entirely
- **Rapid turnaround**: Entire milestone (6 regressions) completed in a single day

### What Was Inefficient
- **SUMMARY frontmatter gaps**: 27-02-SUMMARY.md missing `requirements_completed` for PERF-01 and UI-01 — caught only by 3-source cross-reference during audit
- **First audit missed a jargon instance**: MessageList.tsx empty-state "crystallize" was not in the initial purge table — needed a second pass

### Patterns Established
- **3-source requirement verification**: VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md traceability cross-reference catches documentation gaps
- **Contextual UI triggers**: In-chat suggestion cards (ChatNeurogenesisPrompt) over static buttons — appears only when relevant state is met
- **Panel-mode polling guards**: leftPanelMode === 'chat' early-return in useEffect intervals is the standard pattern for suppressing background work

### Key Lessons
- Jargon purges need codebase-wide grep verification, not just the 8 files in the plan — empty states in unrelated components can slip through
- The sentinel scroll pattern (scrollIntoView on a zero-height div) is simpler and more reliable than scrollTop manipulation for streaming content

---

## Milestone: v1.2 — Agent Intelligence

**Shipped:** 2026-03-24
**Phases:** 5 | **Plans:** 13

### What Was Built
- promptfoo evaluation harness with per-agent golden suites (31 total cases)
- DAG Manager (Architect) prompt contract with strict cycle refusal and 8-case eval suite
- Horizon UI wiring: ephemeral `/api/architect` route, ghost node rendering, briefing panel, chat seed handoff
- Bouncer dual-purpose contract: duplicate rejection + definition/insight extraction, 13-case suite
- Socratic Chat Engine: anti-answer-giving directives, Bloom-gated Neurogenesis (Analyze+ only), 10 multi-turn cases
- Replaced vector-similarity RELATED wiring with LLM Epistemological Inquisitor (PREREQUISITE-only graph edges)

### What Worked
- **Eval-Driven Development**: Writing promptfoo golden cases before prompt changes caught contract issues early
- **Phase 11/12/13 pattern replication**: Each agent followed the same proven template (prompt → schema → provider → golden cases)
- **Heuristic fallback providers**: Offline/CI runs pass 100% without API keys — critical for fast iteration
- **Assumption-mode discussions**: Codebase analysis before user Q&A reduced discussion interactions to ~2 corrections

### What Was Inefficient
- **REQUIREMENTS.md traceability tracking fell behind**: Phase 12 and 13 requirements weren't marked complete in the traceability table during execution
- **Phase parser can't detect phases 8+**: Known `gsd-tools init phase-op` bug forced manual directory creation for phases 8, 9, 12, 13
- **Wave 1 worktree merge conflicts**: STATE.md conflicts on every worktree merge due to parallel state updates

### Patterns Established
- **Golden casuistry**: Hand-curated 8-12 cases per agent, not broad synthetic coverage
- **Dual-mode eval**: Heuristic fallback for CI, LLM-as-judge for live validation
- **Bloom-gated Neurogenesis**: AI proposes node creation only at Analyze/Evaluate/Create cognitive level
- **Epistemological Inquisitor**: LLM-based prerequisite detection replaces vector-proximity wiring

### Key Lessons
- Prompt/schema length mismatches (280 vs 500 chars) are easy to miss — the eval passes but the prompt lies to the model
- Multi-turn eval requires YAML not CSV — message arrays break CSV quoting
- The heuristic question-mark exemption matters: "Why does X?" is Understand, not Analyze

---

## Milestone: v1.1 — Staging Area

**Shipped:** 2026-03-23
**Phases:** 5 | **Plans:** 15

### What Was Built
- Secure data foundation with knowledge_queue and user_api_keys tables, RLS, SHA-256 hashing, and structural AI isolation
- iOS Shortcuts capture endpoint with bearer auth, rate limiting, SSRF-safe metadata extraction, and duplicate URL detection
- Editorial Queue Triage UI at /app/queue with optimistic mutations, state grouping, rust aging indicators, and sidebar badge
- Full Crystallize Flow: URL extraction → AI summary → seeded Socratic chat → auto-mastered queue item on Neurogenesis
- UI Polish pass: editorial prose chat, dynamic panel layout, motion language, monochrome review buttons, empty states

### What Worked
- **Test-first approach (Wave 0)**: Writing RED-state test scaffolds before production code caught contract mismatches early (e.g., Supabase count query mock shape, token length)
- **Structural AI isolation**: Enforcing module-boundary separation between queue and neuron code paths prevented accidental data leakage
- **Forward-only state machine**: Zod-level validation of allowed transitions eliminated impossible state bugs
- **Service-role client for capture**: Bypassing RLS for INSERT operations simplified the auth model without sacrificing security

### What Was Inefficient
- **Requirements tracking fell behind**: Traceability table wasn't updated as phases 7-9 shipped, creating false "Pending" status at milestone completion
- **Rebase conflicts**: Multiple parallel feature branches (graph pedagogy, retention, staging area) created complex merge conflicts requiring manual resolution

### Patterns Established
- **Queue routing as App Router page**: Queue renders at `/app/queue` as a dedicated page, not as a leftPanelMode value — prevents Zustand mode explosion
- **Capture auth in route handler**: Never in middleware (CVE-2025-29927 mitigation)
- **Separate Zustand stores per domain**: queueStore owns queue state, graphStore owns panel mode — single coupling point via openQueue()

### Key Lessons
- CHECK constraints over PostgreSQL ENUMs for state fields — simpler schema evolution
- Service-role Supabase clients can be module-level singletons when credentials are env vars
- Optimistic UI with server-side rollback is the right pattern for state transitions in Zustand

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-22
**Phases:** 4 | **Plans:** 5

### What Was Built
- AI Bouncer for active duplicate prevention.
- 14-day Ephemeral Discovery Engine (auto-wiping chat history).
- Strict Left-to-Right DAG layout to solve "spaghetti graphs".
- FSRS-6 spaced repetition engine with Upward FIRe healing and UI visual decay.
- Fluid TipTap-based Advanced AI Markdown Editor with liquid background metadata extraction.

### What Worked
- **Visual Decay (Soft-FIRe)**: Changing border styles instead of locking users out was vastly superior for user motivation.
- **TipTap v3 Root Control**: Directly wrapping TipTap instead of using high-level wrappers like Novel.sh avoided React dependency lag and gave total control over ProseMirror plugins.
- **Background Extraction**: Extracting 'Definition' and 'Core Insight' asynchronously removed UI friction while enforcing the active learning pedagogy.

### What Was Inefficient
- **Vercel AI SDK v5 -> v6 Changes**: Wasted some time debugging removed APIs (`toDataStreamResponse` vs `toTextStreamResponse`).

### Patterns Established
- **Active Extraction over Passive Ingestion**: Future features must force the user to synthesize knowledge, never auto-generating nodes for them.
- **"The Bouncer"**: AI as a strict mediator ensuring graph quality, not a submissive text-completion bot.

### Key Lessons
- Direct implementation of ProseMirror plugins is the only reliable way to handle complex WYSIWYG interactions (like Slash commands) without triggering React cyclic re-render crashes.
