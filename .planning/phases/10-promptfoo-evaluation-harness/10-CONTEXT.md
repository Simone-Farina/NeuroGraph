# Phase 10: Promptfoo Evaluation Harness - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform prompt work from ad hoc prompt-writing into a first-class evaluation discipline. This phase establishes the local `promptfoo` harness, the canonical `prompt-eval/` directory structure, reusable fixtures/helpers, and the first Golden evaluation suite for the Bouncer.

This phase does not yet finalize the production prompts for all agents, build runtime orchestration for multi-agent flows, or replace the existing chat routing logic. It creates the evaluation substrate and proves the pattern on the Bouncer first.

</domain>

<decisions>
## Implementation Decisions

### Infrastructure constraint
- `promptfoo` must be installed strictly as a local dev dependency in `package.json`.
- No global installation is allowed.
- Everything must run inside the project Node environment and remain compatible with the existing app/dev-container workflow.

### Evaluation suite structure
- The canonical evaluation root is `prompt-eval/`.
- Phase 10 should establish these subdirectories immediately:
  - `prompt-eval/bouncer/`
  - `prompt-eval/architect/`
  - `prompt-eval/conversationalist/`
- Runtime prompts stay in `src/lib/ai/`. Heavy configs, fixtures, golden cases, and eval-specific helpers live under `prompt-eval/`.

### Runner ergonomics
- `package.json` must expose one canonical top-level command:
  - `eval:all`
- It must also expose targeted commands for fast iteration:
  - `eval:bouncer`
  - `eval:architect`
  - `eval:conversationalist`
- The command shape should stay obvious and boring: no custom wrapper CLI unless it is required to normalize provider/env behavior.

### Evaluation style
- NeuroGraph uses a hybrid evaluation model:
  - hard pass/fail for structural integrity
  - scored thresholds for softer pedagogical or tonal behavior
- For Phase 10, the first concrete implementation target is the Bouncer:
  - deterministic rejection/acceptance checks are mandatory
  - the suite should be scaffolded so later LLM-as-judge scoring can slot in cleanly
- Architecture planning should preserve room for:
  - cycle refusal and JSON-schema checks for the Architect
  - Socratic Index scoring for the Conversationalist with threshold `> 0.8`

### Baseline dataset philosophy
- Use hand-curated golden casuistry, not broad synthetic corpora.
- Bouncer fixtures should start with five high-signal edge cases:
  - exact duplicate
  - near-synonym
  - multilingual duplicate
  - same concept with different phrasing
  - clearly unrelated concept
- Architect and Conversationalist directories should be scaffolded now, but their rich golden datasets land in later phases.

### Phase 10 delivery target
- Phase 10 must end with a working local harness plus the first Golden Bouncer suite.
- The Bouncer is the proving ground because duplicate rejection is already a core NeuroGraph invariant and has clear hard-fail behavior.

### Claude's Discretion
- Exact promptfoo config split between root/shared config and per-agent config files
- Exact fixture file format (`yaml` vs `csv`) per suite
- Exact helper script boundaries for deterministic assertions
- Exact provider abstraction for local eval runs, as long as it does not force global tooling or pollute runtime code

</decisions>

<specifics>
## Specific Ideas

- “Prompt-Driven Development ends here; Eval-Driven Development begins.”
- “Install `promptfoo` strictly as a dev dependency.”
- “Keep runtime code in `src/lib/ai/`, but keep heavy eval configurations, fixtures, and golden datasets isolated.”
- “The Bouncer should get five brutal edge cases first.”
- “If the Architect generates a cyclical DAG or the Bouncer allows a duplicate, the eval must fail immediately.”

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and milestone constraints
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

### Prompt and AI runtime entry points
- `package.json`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/providers.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/neurons/route.ts`
- `src/lib/crystallize/seed.ts`

### Prompt-intelligence intent
- `.planning/todos/pending/001-start-crafting-the-agents.md`
- `.impeccable.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ai/prompts.ts` already centralizes prompt text and is the correct runtime home for production prompt contracts.
- `src/lib/ai/providers.ts` already centralizes provider selection and is the likely seam for future eval provider normalization.
- `src/lib/ai/__tests__/` already proves the repo accepts isolated AI-related test artifacts.
- `package.json` currently has no `promptfoo` dependency and no eval scripts, so Phase 10 must establish that baseline from zero.

### Established Patterns
- The repo favors explicit scripts in `package.json` rather than hidden local wrappers.
- Tests and verification are expected to be locally runnable via one canonical command plus focused commands.
- Planning already distinguishes structural hard constraints from softer UX or language judgments; the prompt-eval model should mirror that.

### Integration Points
- `package.json` needs dev dependency and scripts.
- `prompt-eval/` will hold promptfoo configs, fixtures, assertions, and any suite-specific helpers.
- Runtime prompt text remains in `src/lib/ai/`, but eval suites should be able to import shared prompt builders if useful.
- Future phases 11-13 should be able to drop richer suites into the directories created here without restructuring the root.

</code_context>

<deferred>
## Deferred Ideas

- Final production-grade Architect prompt contract
- Final production-grade Conversationalist/Socratic prompt contract
- Multi-agent orchestration runtime
- CI/cloud prompt-eval gating
- Large synthetic datasets or benchmark expansion beyond the hand-curated golden cases

</deferred>

---

*Phase: 10-promptfoo-evaluation-harness*
*Context gathered: 2026-03-23*
