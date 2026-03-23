# Phase 10: Promptfoo Evaluation Harness - Research

**Researched:** 2026-03-23
**Domain:** Local prompt-evaluation infrastructure, golden fixtures, deterministic assertion strategy
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- `promptfoo` must be installed as a local dev dependency only.
- The canonical eval root is `prompt-eval/`, with immediate subdirectories for:
  - `bouncer`
  - `architect`
  - `conversationalist`
- `package.json` must expose one canonical full-suite command plus per-agent commands.
- NeuroGraph uses a hybrid evaluation model:
  - hard structural assertions
  - softer scored thresholds for pedagogical quality
- The first real suite in Phase 10 is the Golden Bouncer evaluation, based on a small hand-curated set of brutal edge cases.

### Claude's Discretion

- Exact promptfoo config layout
- Exact fixture-file format for each suite
- Exact assertion helper boundaries
- Exact env/provider guidance for local execution

### Deferred Ideas (OUT OF SCOPE)

- Final Architect prompt contract
- Final Conversationalist scoring prompt and judge flow
- Full agent runtime/orchestrator implementation

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | `promptfoo` installed and configured as a project dependency | Add local `promptfoo` dev dependency, root/shared config, and documented env expectations |
| TEST-02 | Dedicated evaluation structure at `prompt-eval/` | Create top-level agent directories plus shared helpers/fixtures so eval artifacts stay out of runtime code |
| TEST-03 | At least one baseline local command runs the evaluation suite end-to-end | Add `eval:all` plus focused scripts and prove the Bouncer suite can run independently |
</phase_requirements>

---

## Summary

Phase 10 should be executed in three waves:

1. Install and normalize the infrastructure: local `promptfoo` dependency, `package.json` scripts, root `prompt-eval/` structure, and shared helper conventions.
2. Build the first Golden Bouncer suite: a small hand-curated fixture file, deterministic pass/fail assertions, and a promptfoo config that exercises the Bouncer contract cleanly.
3. Finish with documentation and verification: make local usage obvious, stub the future `architect` and `conversationalist` directories, and confirm the harness is ready for Phase 11 onward.

The architecture should stay intentionally boring. The biggest risk is overengineering the harness before the first suite proves itself. The right move is to scaffold only enough shared structure to support the Bouncer cleanly, while leaving clear seams for harder Architect assertions and softer Conversationalist scoring later.

**Primary recommendation:** create a root `prompt-eval/` folder with one small shared layer and per-agent configs, then make `eval:bouncer` the first authoritative suite. Keep hard assertions deterministic through local scripts or promptfoo assertions, and only scaffold the score-based judge pattern for later phases.

---

## Current Codebase Findings

### 1. Prompt-eval infrastructure does not exist yet

- `package.json` currently has no `promptfoo` dependency.
- There are no `eval:*` scripts.
- There is no `prompt-eval/` directory.

This means TEST-01 through TEST-03 all start from zero.

### 2. Runtime prompt seams already exist

- `src/lib/ai/prompts.ts` is the natural runtime home for agent prompt text.
- `src/lib/ai/providers.ts` already centralizes model/provider logic.
- Existing AI routes and seed flows already consume those layers.

This is good because Phase 10 can keep runtime prompt code where it belongs and avoid eval-specific sprawl in `src/`.

### 3. Bouncer is the strongest first target

- Duplicate prevention is already a defining NeuroGraph principle.
- The acceptance/rejection surface is more deterministic than Socratic pedagogy.
- A small golden set can cover the highest-value edge cases quickly.

This makes the Bouncer the best first suite to validate the harness architecture itself.

### 4. Future suites need two different assertion models

- Architect requires hard structural checks:
  - valid JSON
  - schema compliance
  - cycle refusal
- Conversationalist requires softer quality checks:
  - questioning posture
  - not giving away the answer too soon
  - eventual readiness for Neurogenesis

Therefore the shared harness should not overfit to purely deterministic assertions or purely LLM-judge assertions.

---

## Recommended Architecture Patterns

### Pattern 1: Root eval workspace with per-agent ownership

Recommended structure:

```text
prompt-eval/
  shared/
  bouncer/
  architect/
  conversationalist/
```

Why:
- keeps eval assets away from runtime code
- gives each future agent suite a clear ownership boundary
- allows shared helper code without flattening all suites into one config blob

### Pattern 2: Canonical package scripts

Recommended scripts:

```json
{
  "eval:all": "promptfoo eval",
  "eval:bouncer": "promptfoo eval -c prompt-eval/bouncer/promptfooconfig.yaml",
  "eval:architect": "promptfoo eval -c prompt-eval/architect/promptfooconfig.yaml",
  "eval:conversationalist": "promptfoo eval -c prompt-eval/conversationalist/promptfooconfig.yaml"
}
```

Why:
- matches the user’s explicit contract
- keeps local execution obvious
- supports both full and focused iteration loops

### Pattern 3: Golden casuistry files over synthetic breadth

Recommended starting point:
- one hand-curated fixture file per suite
- Bouncer starts with exactly five edge cases

Why:
- easier to reason about failures
- better signal-to-noise while the harness itself is still being stabilized
- aligns with NeuroGraph’s exact product invariants instead of generic LLM benchmarks

### Pattern 4: Deterministic assertion helpers for hard failures

Recommended approach:
- represent Bouncer outputs in a predictable JSON contract
- validate them using promptfoo assertions and/or local JS helpers
- fail immediately on duplicate leakage or malformed action suggestions

Why:
- these are structural integrity checks, not style preferences
- deterministic checks are cheaper, faster, and less noisy than LLM-as-judge for this class of behavior

### Pattern 5: Judge-scoring seam reserved for later

Recommended approach:
- scaffold a shared place for judge prompts or score helpers
- do not make the first Bouncer suite depend on LLM-as-judge unless needed

Why:
- keeps Phase 10 stable and locally practical
- still prepares for the Conversationalist’s future `Socratic Index > 0.8` contract

---

## Risks And Mitigations

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Overbuilding the harness before one suite works | Could create abstraction debt and delay actual eval value | Start with one shared layer and one authoritative Bouncer suite |
| Promptfoo config becomes coupled to runtime code structure | Makes later prompt refactors brittle | Keep runtime prompts in `src/lib/ai/` and eval configs/fixtures in `prompt-eval/` |
| Hard assertions rely on vague natural-language output | Makes failures noisy and non-actionable | Require a stable JSON-shaped Bouncer response for the eval suite |
| Later judge-based suites become awkward to add | Purely deterministic harness design would not scale to Socratic quality scoring | Reserve a shared scoring seam now, but defer implementation complexity |
| Local setup becomes fragile | Developers may avoid running evals if the command story is messy | Keep one canonical command and explicit per-agent scripts in `package.json` |

---

## Verification Recommendation

Before closing Phase 10, verify these five points:

1. `npm install -D promptfoo` has been performed locally and recorded in `package.json`.
2. `prompt-eval/` exists with `bouncer`, `architect`, and `conversationalist` directories.
3. `npm run eval:all` resolves through promptfoo from the project-local dependency.
4. `npm run eval:bouncer` runs the first Golden Bouncer suite with five curated cases.
5. At least one failing duplicate edge case can be demonstrated by intentionally weakening the assertion and seeing the suite catch it.

---

*Phase: 10-promptfoo-evaluation-harness*
*Research completed: 2026-03-23*
