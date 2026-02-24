# NeuroGraph Development Process Setup

## TL;DR

> **Quick Summary**: Establish a structured multi-tool development workflow for NeuroGraph post-MVP, clean up repository housekeeping debt, and define the feature roadmap. The process uses a cost-efficiency funnel: free tools (Gemini AI Studio) for ideation and specs, moderate-cost tools (OpenCode/Claude) for complex work, and cheap tools (OpenRouter) for simple execution.
>
> **Deliverables**:
> - Development process framework document with tool-role mapping
> - Gemini AI Studio system prompt for the "Advisor" and "Spec Writer" roles
> - Repository cleanup (stale branches, boulder.json, completed plan archival)
> - Vercel deployment investigation and fix
> - Feature roadmap (4 phases)
>
> **Estimated Effort**: Short (5-8 hours across 1-2 sessions)
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 -> Task 4 -> Task 6 -> Task 7

---

## Context

### Original Request
Set up a structured development process for NeuroGraph post-MVP that maps different AI tools to different development roles (advisor, spec writer, senior dev, junior dev, UX designer), clean up the project state, and plan the next feature phases.

### Interview Summary
**Key Discussions**:
- **Project Nature**: Between passion project and potential product. Learning AI-assisted development workflow is a career goal. Competitor Recall (getrecall.ai) validates the market — NeuroGraph differentiates with graph-as-primary-interface vs Recall's collection-first approach.
- **Tools**: Gemini AI Studio (free, unlimited), OpenRouter (EUR 20/month), Anthropic/OpenAI/Google Team plans (20-30% work spillover). Total personal budget is very constrained.
- **Dev Environment**: OpenCode only (no IDE AI). Finds OpenCode token-expensive, prefers manual prompt crafting for efficiency.
- **Time**: 5-10 hours/week. Process setup must be lean — max 1-2 sessions before feature work resumes.
- **Deployment**: On Vercel but currently broken.
- **Feature Priorities**: Crystal-as-page > AI quality > Ghost Nodes/FIRe > Stabilize.

### Metis Review
**Identified Gaps** (addressed):
- G1: Handoff format between tools undefined -> Resolved: explicit spec template and file locations defined
- G2: System prompt deliverable unbounded -> Resolved: capped scope with evaluation criteria
- G3: Multi-tool adoption risk (user may default to OpenCode-only) -> Resolved: process designed for gradual adoption, Gemini as natural starting point
- G4: Process setup cost vs feature development -> Resolved: kept lean, max 5-8 hours total
- G5: Vercel failure root cause unknown -> Resolved: investigation task before fix task

---

## Work Objectives

### Core Objective
Create a sustainable, cost-efficient development workflow that maximizes free tools for ideation/planning and reserves expensive tools for implementation, enabling 5-10 hours/week of meaningful progress on NeuroGraph.

### Concrete Deliverables
- `.sisyphus/plans/neurograph-dev-process.md` (this document) — process framework
- `docs/prompts/gemini-advisor.md` — system prompt for Gemini AI Studio "Advisor" role
- `docs/prompts/gemini-specwriter.md` — system prompt for Gemini AI Studio "Spec Writer" role
- `docs/specs/_template.md` — reusable template for feature specifications
- `docs/specs/README.md` — how to use the spec template in the workflow
- Clean repository state (branches, boulder, stale artifacts)
- Working Vercel deployment

### Definition of Done
- [ ] Process framework is documented and actionable
- [ ] Gemini system prompts are ready to paste into AI Studio
- [ ] Feature spec template exists for handoff between Gemini -> OpenCode
- [ ] Repository has no stale branches, boulder.json is reset
- [ ] Vercel deployment is investigated and either fixed or blocker documented
- [ ] Feature roadmap with 4 phases is defined

### Must Have
- Clear tool-role mapping with cost justification
- Explicit handoff format between tools (what goes in, what comes out)
- Gemini AI Studio system prompts (advisor + spec writer)
- Feature spec template that bridges Gemini output -> OpenCode input
- Repo cleanup (branches, boulder)

### Must NOT Have (Guardrails)
- **No feature implementation** — this plan sets up the PROCESS, not the features
- **No elaborate multi-page process documents** — keep it practical, one-page-per-concept
- **No tool purchases or subscription changes** — work within existing budgets
- **No premature optimization** — process can be refined after 2-3 feature cycles
- **No rigid process** — guidelines, not rules. The human decides when to deviate.

---

## The Development Process Framework

### The Token Cost Funnel

The core principle: move ideas through progressively more expensive tools, doing most work for free.

```
STAGE 1: IDEATION (Gemini AI Studio — FREE, unlimited)
  Input:  Vague idea, curiosity, competitor analysis
  Output: Feature Brief (1-2 pages, .md file)
  Cost:   $0
  Time:   30-60 min conversation

STAGE 2: SPECIFICATION (Gemini AI Studio — FREE, unlimited)
  Input:  Feature Brief + project context
  Output: Feature Specification (.md file following template)
  Cost:   $0
  Time:   30-60 min conversation

STAGE 3: DESIGN (GPT-4o / v0.dev / Gemini — light work quota)
  Input:  Feature Spec + current screenshots
  Output: Wireframes, component sketches, UX flows
  Cost:   Minimal (work quota, optional stage)
  Time:   15-30 min

STAGE 4: PLANNING (OpenCode/Prometheus — moderate quota)
  Input:  Feature Spec + Design artifacts
  Output: Sisyphus work plan (.sisyphus/plans/)
  Cost:   Moderate (Anthropic quota)
  Time:   30-60 min per feature

STAGE 5: EXECUTION (OpenCode/Sisyphus + OpenRouter — mixed)
  Input:  Work plan with task breakdown
  Output: Working code, committed to git
  Cost:   Anthropic (complex) + OpenRouter EUR 20 (simple)
  Time:   Bulk of development hours

STAGE 6: REVIEW (OpenCode or Gemini — light)
  Input:  Implemented feature
  Output: Verified, tested, deployed feature
  Cost:   Light
  Time:   15-30 min
```

**Expected cost distribution per feature:**
- 60-70% of effort (Stages 1-2) = FREE
- 15-20% (Stages 3-4) = Light work quota
- 15-20% (Stages 5-6) = OpenRouter + moderate work quota

### Tool-Role Mapping

| Role | Primary Tool | Backup Tool | How to Use | Cost |
|------|-------------|-------------|------------|------|
| **Advisor** | Gemini AI Studio (3.1 Pro) | — | Persistent project chat with system prompt. Brainstorm features, analyze competitors, explore ideas. Long rambling conversations welcome. | FREE |
| **Spec Writer** | Gemini AI Studio (3.1 Pro) | Claude (Anthropic Team) | Separate project chat with spec-writer system prompt. Turn feature briefs into structured specs using the template. | FREE |
| **Senior Dev** | OpenCode (Claude Opus/Sonnet) | — | Prometheus for planning, Sisyphus for execution. Reserve for complex multi-file tasks, architecture decisions, debugging. Craft prompts carefully to minimize token use. | Anthropic quota |
| **Junior Dev** | OpenRouter API | Gemini Flash | Well-specified simple tasks: single-file components, boilerplate, documentation. Use structured prompts with clear input/output. | EUR 20/month |
| **UX Designer** | GPT-4o (OpenAI Team) | v0.dev / Gemini | Screenshot analysis, wireframe feedback, component generation. Share current UI screenshots and get improvement suggestions. | OpenAI quota |

### Handoff Formats (Critical)

**Gemini Advisor -> Spec Writer:**
- Output: Feature Brief (free-form markdown, 1-2 pages)
- Contains: problem statement, user story, rough scope, open questions
- Location: Paste into Spec Writer chat as starting context

**Spec Writer -> OpenCode/Prometheus:**
- Output: Feature Specification (structured markdown following template)
- Contains: objectives, data model changes, API changes, UI changes, acceptance criteria, guardrails
- Location: Save as `docs/specs/{feature-name}.md` in the repo
- The spec file IS the input to Prometheus — paste it or reference it when starting `/start-work`

**UX Designer -> Senior Dev:**
- Output: Wireframes, component descriptions, design tokens
- Contains: layout sketches (text descriptions or screenshots), specific component requirements
- Location: Reference in the feature spec, paste screenshots into OpenCode if needed

**Senior Dev -> Junior Dev:**
- Output: Specific task with exact instructions
- Contains: file to create/modify, exact changes needed, test to run, commit message
- Location: Structured prompt sent to OpenRouter

### Feature Spec Template

Every feature specification follows this structure (used in Gemini Spec Writer):

```markdown
# Feature: {Name}

## Problem
What user problem does this solve? Why now?

## User Story
As a [user], I want to [action] so that [benefit].

## Scope
### IN (must deliver)
- [specific deliverable]

### OUT (explicitly excluded)
- [what we're NOT building]

## Technical Design
### Data Model Changes
- [new columns, tables, types]

### API Changes
- [new/modified endpoints with request/response shapes]

### UI Changes
- [new components, modified views, interactions]

## Acceptance Criteria
- [ ] [verifiable condition]

## Guardrails
- [what to avoid, common mistakes, AI slop patterns]

## Open Questions
- [anything unresolved — resolve before implementation]
```

### Feature Roadmap

**Phase 1: Stabilize & Ship (1-2 weeks)**
- Fix Vercel deployment
- Fix known remaining bugs
- Repo cleanup (branches, boulder)
- Get the app usable for daily personal use

**Phase 2: Crystal-as-Page (2-3 weeks)**
- Rich markdown content per crystal (existing `content` field)
- Markdown editor in detail panel (replace plain textarea)
- Backlinks between crystals (wiki-link style)
- Crystal search / filtering in sidebar
- Graph -> crystal page navigation

**Phase 3: AI Quality (2-3 weeks)**
- Improve crystallization prompts (less false positives)
- Smarter edge suggestions (scoped, not cross-topic by default)
- Better RAG context injection (relevant crystals in chat)
- Conversation summaries for context management

**Phase 4: Ghost Nodes & FIRe (3-4 weeks)**
- Ghost Node generation (AI-predicted future learning nodes)
- Ghost Nodes appear as translucent nodes on graph
- FIRe (Fractional Implicit Repetition) — reviewing complex nodes refreshes prerequisites
- Desired retention per-node customization

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** for code tasks. Process/documentation tasks verified by file existence.

### Test Decision
- **Infrastructure exists**: YES (Vitest + Playwright)
- **For code tasks**: Agent-executed QA
- **For doc tasks**: File existence + content verification

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Immediate — independent cleanup + investigation):
├── Task 1: Repository cleanup (branches, boulder, stale artifacts) [quick]
├── Task 2: Investigate Vercel deployment failure [quick]
└── Task 3: Create feature spec template [writing]

Wave 2 (After Wave 1 — process artifacts):
├── Task 4: Craft Gemini AI Studio "Advisor" system prompt [writing]
├── Task 5: Craft Gemini AI Studio "Spec Writer" system prompt [writing]
└── Task 6: Fix Vercel deployment (based on Task 2 findings) [unspecified-high]

Wave 3 (After Wave 2 — validation):
└── Task 7: Validate process with a dry-run (Crystal-as-Page feature brief) [writing]

Critical Path: Task 1 -> Task 4 -> Task 7
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5 | 2, 3 |
| 2 | None | 6 | 1, 3 |
| 3 | None | 7 | 1, 2 |
| 4 | 1 | 7 | 5, 6 |
| 5 | 1 | 7 | 4, 6 |
| 6 | 2 | 7 | 4, 5 |
| 7 | 3, 4, 5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Categories |
|------|-------|----------------------|
| 1 | 1, 2, 3 | quick, quick, writing (parallel) |
| 2 | 4, 5, 6 | writing, writing, unspecified-high (parallel) |
| 3 | 7 | writing (solo, validation) |

---

## TODOs

- [x] 1. Clean Repository State (Branches, Boulder, Sisyphus Artifacts)

  **What to do**:
  - Create a baseline inventory before cleanup: current branch, remote branch count, active boulder plan, and existing plan files.
  - Remove stale remote branches created by old automation sessions (Sisyphus/Jules style branches) only after verifying they are merged or obsolete.
  - Remove stale local branches not needed anymore, while preserving active development branches.
  - Reset `.sisyphus/boulder.json` so it no longer points to the completed MVP plan.
  - Produce a cleanup report in `.sisyphus/evidence/task-1-repo-cleanup.md` with deleted branches and preserved branches.

  **Must NOT do**:
  - Do NOT delete `main`, the current checked-out branch, or any branch with unmerged unique commits.
  - Do NOT rewrite history (`reset --hard`, force-push, rebase shared branches).
  - Do NOT delete or rewrite active plans under `.sisyphus/plans/`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mostly deterministic git hygiene and one JSON reset.
  - **Skills**: [`git-master`]
    - `git-master`: Needed for safe branch cleanup strategy, merge checks, and non-destructive git operations.
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction required.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5 (clean baseline before process artifacts)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `.sisyphus/boulder.json` - Current active plan points to completed MVP; this is the exact state to reset.
  - `.sisyphus/plans/neurograph-mvp.md` - Marked complete; use as evidence that boulder target is stale.
  - `.sisyphus/plans/neurograph-bugs-and-gaps.md` - Completed follow-up plan; confirms repo has moved beyond MVP.
  - `.sisyphus/plans/neurograph-polish-sprint.md` - Completed polish plan; confirms lifecycle state.
  - `.gitignore` - Defines what Sisyphus state is versioned vs ignored.

  **API/Type References** (contracts to implement against):
  - `.sisyphus/boulder.json` JSON shape: `active_plan`, `started_at`, `session_ids`, `plan_name`.

  **Test References** (testing patterns to follow):
  - `README.md` project plan section - Confirms plans are versioned while runtime state is local.

  **External References**:
  - Git branch safety workflow: `https://git-scm.com/docs/git-branch`

  **WHY Each Reference Matters**:
  - `boulder.json`: Prevents stale plan continuation and wrong `/start-work` context.
  - Completed plan files: Confirm that cleanup is safe and expected at this stage.
  - `.gitignore`: Avoids accidental commits of local runtime state while cleaning.

  **Acceptance Criteria**:
  - [ ] Remote branch list is pruned and stale automation branches are removed.
  - [ ] Active branch and protected branches remain untouched.
  - [ ] `.sisyphus/boulder.json` no longer points to `neurograph-mvp.md`.
  - [ ] Cleanup report exists at `.sisyphus/evidence/task-1-repo-cleanup.md`.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Safe branch cleanup and boulder reset
    Tool: Bash
    Preconditions: Git remote reachable, repository clean enough to run branch queries
    Steps:
      1. Run `git branch -r` and save output to `.sisyphus/evidence/task-1-remote-before.txt`.
      2. Run stale-branch cleanup using merge-safe criteria (merged + automation naming pattern).
      3. Run `git branch -r` again and save to `.sisyphus/evidence/task-1-remote-after.txt`.
      4. Update `.sisyphus/boulder.json` so `active_plan` and `plan_name` are null and `session_ids` is empty.
      5. Verify new boulder state by reading `.sisyphus/boulder.json`.
    Expected Result: Remote branch count decreases, protected branches remain, boulder no longer references MVP plan.
    Failure Indicators: Active branch missing, unmerged branch deleted, or boulder still references old plan.
    Evidence: .sisyphus/evidence/task-1-repo-cleanup.md

  Scenario: Protected branch safety check
    Tool: Bash
    Preconditions: Cleanup already performed
    Steps:
      1. Assert `git rev-parse --verify main` succeeds.
      2. Assert `git rev-parse --abbrev-ref HEAD` still returns the original working branch.
      3. Compare `.sisyphus/evidence/task-1-remote-before.txt` and `...after.txt` to ensure only targeted stale branches were removed.
    Expected Result: Protected branches still exist; only stale branches removed.
    Failure Indicators: `main` missing, current branch changed unexpectedly, or non-target branches removed.
    Evidence: .sisyphus/evidence/task-1-protected-branches.txt
  ```

  **Commit**: YES
  - Message: `chore(repo): clean stale branches and reset boulder`
  - Files: `.sisyphus/boulder.json`
  - Pre-commit: `git branch -r`

---

- [x] 2. Investigate Vercel Deployment Failure (No Fix Yet)

  **What to do**:
  - Reproduce deployment-related checks locally with production-like settings.
  - Run `npm run deploy:preflight` and `npm run build`, capturing full stdout/stderr to evidence files.
  - Validate environment variable expectations against `.env.example` and `scripts/deploy-preflight.mjs`.
  - If Vercel CLI access is available, collect deployment/build logs; if not, document blocker and required access.
  - Produce root-cause report in `.sisyphus/drafts/vercel-investigation.md` with: symptoms, reproduction steps, likely cause category, and proposed minimal fix.

  **Must NOT do**:
  - Do NOT apply code or config fixes in this task.
  - Do NOT change deployment provider or architecture.
  - Do NOT introduce new infra dependencies.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused diagnostic pass with reproducible commands and report output.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: Browser E2E is not needed for root-cause triage.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 6 (deployment fix)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `scripts/deploy-preflight.mjs` - Canonical definition of required deploy-time environment checks.
  - `README.md` deploy section - Expected deployment flow and required environment variables.
  - `package.json` scripts `deploy:preflight` and `deploy:vercel` - Existing deploy command chain.
  - `.env.example` - Baseline env contract for local and deploy parity.

  **API/Type References** (contracts to implement against):
  - `AI_PROVIDER` valid values in `scripts/deploy-preflight.mjs`: `openai`, `anthropic`, `google`, `mock`.

  **Test References** (testing patterns to follow):
  - `playwright.config.ts` (`AI_PROVIDER: 'mock'` in webServer env) - Reference for controlled provider setup in automated checks.

  **External References**:
  - Vercel build debugging guide: `https://vercel.com/docs/deployments/troubleshoot-a-build`

  **WHY Each Reference Matters**:
  - Preflight script defines pass/fail truth; investigation must align with it.
  - README deploy steps provide expected baseline sequence to compare against observed failures.
  - `.env.example` prevents guessing missing variables.

  **Acceptance Criteria**:
  - [ ] Reproduction commands and outputs captured in evidence files.
  - [ ] Root-cause report created at `.sisyphus/drafts/vercel-investigation.md`.
  - [ ] Report includes one primary cause hypothesis and one fallback hypothesis.
  - [ ] Report specifies exact files/variables that Task 6 must change.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Collect deploy diagnostics and classify failure
    Tool: Bash
    Preconditions: Dependencies installed; `.env.local` present or CI env loaded
    Steps:
      1. Run `npm run deploy:preflight` and save output to `.sisyphus/evidence/task-2-preflight.txt`.
      2. Run `npm run build` and save output to `.sisyphus/evidence/task-2-build.txt`.
      3. Summarize both outputs into `.sisyphus/drafts/vercel-investigation.md` with issue category tags (`env`, `config`, `runtime`, `access`).
    Expected Result: Investigation report states reproducible failure mode and proposed fix path.
    Failure Indicators: No reproducible output, no primary hypothesis, or missing remediation path.
    Evidence: .sisyphus/evidence/task-2-summary.txt

  Scenario: Negative env check catches missing required variable
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run preflight with `OPENAI_API_KEY` intentionally unset in subprocess env.
      2. Assert command exits non-zero.
      3. Assert output explicitly lists `OPENAI_API_KEY` as missing.
    Expected Result: Preflight fails fast with explicit missing-key message.
    Failure Indicators: Exit code 0 or missing-key message absent.
    Evidence: .sisyphus/evidence/task-2-preflight-negative.txt
  ```

  **Commit**: NO
  - Message: n/a (investigation only)
  - Files: `.sisyphus/drafts/vercel-investigation.md`, `.sisyphus/evidence/task-2-*`

---

- [x] 3. Create Canonical Feature Spec Template (`docs/specs/`)

  **What to do**:
  - Create `docs/specs/_template.md` using the exact structure in this plan's "Feature Spec Template" section.
  - Create `docs/specs/README.md` with usage instructions: when to use template, naming convention, and handoff to Prometheus.
  - Include a compact validation checklist in `docs/specs/README.md` so any generated spec can be verified quickly.
  - Keep template concise and implementation-oriented; avoid long theory sections.

  **Must NOT do**:
  - Do NOT add feature-specific content into `_template.md`.
  - Do NOT create multiple competing templates.
  - Do NOT duplicate full process guide text from this plan.

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation artifact creation with structural precision.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI implementation needed.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 7 (dry-run requires template)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `.sisyphus/plans/neurograph-dev-process.md` section "Feature Spec Template" - Canonical section list and expected headings.
  - `docs/DEVELOPMENT_ENVIRONMENTS.md` - Existing docs style: concise structure and command-oriented instructions.

  **API/Type References** (contracts to implement against):
  - Template headings required: `Problem`, `User Story`, `Scope (IN/OUT)`, `Technical Design`, `Acceptance Criteria`, `Guardrails`, `Open Questions`.

  **Test References** (testing patterns to follow):
  - `src/app/api/crystals/route.test.ts` - Example of concrete acceptance checks style that specs should enable.

  **External References**:
  - Markdown style guide reference: `https://www.markdownguide.org/basic-syntax/`

  **WHY Each Reference Matters**:
  - Plan template section is the source of truth; avoid drift between plan and docs.
  - Existing docs file shows the repo's concise documentation voice.

  **Acceptance Criteria**:
  - [ ] `docs/specs/_template.md` exists with all required top-level headings.
  - [ ] `docs/specs/README.md` exists with usage steps and validation checklist.
  - [ ] Template explicitly requires IN/OUT scope and guardrails.
  - [ ] Files are plain markdown and free of feature-specific placeholders that leak implementation details.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Template and README contain required structure
    Tool: Bash
    Preconditions: Files created
    Steps:
      1. Assert `docs/specs/_template.md` exists.
      2. Assert `docs/specs/README.md` exists.
      3. Verify `_template.md` contains headings: `## Problem`, `## User Story`, `## Scope`, `## Technical Design`, `## Acceptance Criteria`, `## Guardrails`, `## Open Questions`.
      4. Verify `README.md` includes workflow handoff from spec -> planning.
    Expected Result: Both files exist and include all mandatory sections.
    Failure Indicators: Any heading missing or README lacks handoff instructions.
    Evidence: .sisyphus/evidence/task-3-template-validation.txt

  Scenario: Negative check fails on incomplete spec draft
    Tool: Bash
    Preconditions: Validation script/commands available
    Steps:
      1. Create a temporary markdown file missing `## Scope` and `## Guardrails`.
      2. Run the same checklist commands against the temp file.
      3. Assert validation fails and flags missing sections.
    Expected Result: Validation catches incomplete spec structure.
    Failure Indicators: Validation passes despite missing required sections.
    Evidence: .sisyphus/evidence/task-3-template-negative.txt
  ```

  **Commit**: NO (group with Tasks 4-5)
  - Message: n/a in this task (commit grouped later)
  - Files: `docs/specs/_template.md`, `docs/specs/README.md`

---

- [x] 4. Craft Gemini AI Studio "Advisor" System Prompt

  **What to do**:
  - Create `docs/prompts/gemini-advisor.md` as a ready-to-paste system prompt.
  - Encode the project-specific context: NeuroGraph differentiation (graph-first), current stage (post-MVP), budget constraints, and weekly time limit.
  - Define output contract for the Advisor: a concise Feature Brief with problem framing, opportunity, scope sketch, assumptions, and open questions.
  - Include anti-bloat instructions: avoid implementation details, keep focus on ideation and prioritization.

  **Must NOT do**:
  - Do NOT let the Advisor produce pseudo-code or implementation plans.
  - Do NOT make the prompt generic; it must include NeuroGraph context.
  - Do NOT exceed practical length (target: 1-2 screens in AI Studio).

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Prompt engineering artifact with structured behavior constraints.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `oracle`: Not required for this bounded prompt-writing task.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 7 (dry-run uses this prompt)
  - **Blocked By**: Task 1 (cleanup baseline complete)

  **References**:

  **Pattern References** (existing code to follow):
  - `.sisyphus/plans/neurograph-dev-process.md` sections "Context" and "Work Objectives" - Confirmed user constraints and role definitions.
  - `.sisyphus/plans/neurograph-dev-process.md` section "Tool-Role Mapping" - Canonical Advisor role boundaries.
  - `specifications.md` - Product vision language and terminology to preserve.

  **API/Type References** (contracts to implement against):
  - Advisor output schema in prompt: `Problem`, `Why now`, `Potential scope (IN/OUT draft)`, `Risks`, `Questions`.

  **Test References** (testing patterns to follow):
  - `docs/specs/_template.md` - Advisor output should pre-align with spec template fields.

  **External References**:
  - Gemini system instruction best practices: `https://ai.google.dev/gemini-api/docs/system-instructions`

  **WHY Each Reference Matters**:
  - Draft file captures exact user priorities and cost constraints.
  - Tool-role mapping prevents overlap with Spec Writer responsibilities.
  - Spec template alignment reduces translation loss between stages.

  **Acceptance Criteria**:
  - [ ] `docs/prompts/gemini-advisor.md` exists and is copy-paste ready.
  - [ ] Prompt includes explicit output format for Feature Brief.
  - [ ] Prompt includes NeuroGraph-specific context and budget constraints.
  - [ ] Prompt contains anti-scope-creep and anti-implementation guardrails.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Advisor prompt completeness validation
    Tool: Bash
    Preconditions: Prompt file created
    Steps:
      1. Verify file exists: `docs/prompts/gemini-advisor.md`.
      2. Assert prompt contains required sections: role, context, output format, guardrails.
      3. Assert text includes NeuroGraph-specific keywords (`graph-first`, `5-10 hours/week`, `cost constraints`).
    Expected Result: Prompt is specific, constrained, and structurally complete.
    Failure Indicators: Missing output contract, missing project context, or generic wording only.
    Evidence: .sisyphus/evidence/task-4-advisor-validation.txt

  Scenario: Negative check catches generic prompt drift
    Tool: Bash
    Preconditions: Validation command/checklist available
    Steps:
      1. Create temporary generic prompt variant without project-specific context.
      2. Run validation checklist against temporary file.
      3. Assert checklist fails due to missing mandatory NeuroGraph constraints.
    Expected Result: Generic prompt is rejected by validation.
    Failure Indicators: Checklist passes despite missing project-specific constraints.
    Evidence: .sisyphus/evidence/task-4-advisor-negative.txt
  ```

  **Commit**: NO (group with Tasks 3 and 5)
  - Message: n/a in this task (commit grouped later)
  - Files: `docs/prompts/gemini-advisor.md`

---

- [x] 5. Craft Gemini AI Studio "Spec Writer" System Prompt

  **What to do**:
  - Create `docs/prompts/gemini-specwriter.md` as a ready-to-paste system prompt.
  - Define strict transformation behavior: input Feature Brief -> output full spec following `docs/specs/_template.md`.
  - Enforce scope discipline: must fill IN/OUT, guardrails, and unresolved questions.
  - Require concrete acceptance criteria that are testable and implementation-ready.

  **Must NOT do**:
  - Do NOT allow skipping sections in generated specs.
  - Do NOT let the model invent hidden requirements without flagging assumptions.
  - Do NOT include implementation code in the prompt output contract.

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Structured prompt design for deterministic output shape.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operation complexity here.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7 (dry-run requires this prompt)
  - **Blocked By**: Task 1 (cleanup baseline complete)

  **References**:

  **Pattern References** (existing code to follow):
  - `docs/specs/_template.md` - Exact output schema the prompt must enforce.
  - `.sisyphus/plans/neurograph-dev-process.md` section "Handoff Formats" - Source and destination contract for spec generation.
  - `.sisyphus/plans/neurograph-dev-process.md` sections "Context" and "Must NOT Have" - User's tolerance for process overhead and preference for practical outputs.

  **API/Type References** (contracts to implement against):
  - Mandatory output blocks: `IN`, `OUT`, `Technical Design`, `Acceptance Criteria`, `Guardrails`, `Open Questions`.

  **Test References** (testing patterns to follow):
  - `src/app/api/chat/route.test.ts` - Example of concrete, verifiable criteria style to emulate when instructing acceptance criteria generation.

  **External References**:
  - Prompt design for structured outputs: `https://platform.openai.com/docs/guides/text?api-mode=responses`

  **WHY Each Reference Matters**:
  - Template contract is the non-negotiable structure.
  - Handoff formats prevent mismatch between Advisor brief and implementation planning.
  - Existing test style grounds acceptance criteria in executable outcomes.

  **Acceptance Criteria**:
  - [ ] `docs/prompts/gemini-specwriter.md` exists and is copy-paste ready.
  - [ ] Prompt enforces full template compliance with no skipped sections.
  - [ ] Prompt requires explicit assumptions and open questions.
  - [ ] Prompt enforces measurable acceptance criteria wording.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Spec Writer prompt contract validation
    Tool: Bash
    Preconditions: Prompt file created
    Steps:
      1. Verify file exists: `docs/prompts/gemini-specwriter.md`.
      2. Assert prompt text includes every required template section name.
      3. Assert prompt text includes explicit instruction to separate IN vs OUT scope.
      4. Assert prompt requires assumptions/open questions disclosure.
    Expected Result: Prompt contract guarantees structured, implementation-ready specs.
    Failure Indicators: Any required section omitted or no IN/OUT enforcement.
    Evidence: .sisyphus/evidence/task-5-specwriter-validation.txt

  Scenario: Negative check catches missing scope section
    Tool: Bash
    Preconditions: Validation checklist available
    Steps:
      1. Create temporary malformed prompt without OUT scope requirements.
      2. Run validation checklist against malformed file.
      3. Assert checklist fails and reports missing OUT constraints.
    Expected Result: Missing scope guardrails are detected.
    Failure Indicators: Checklist passes malformed prompt.
    Evidence: .sisyphus/evidence/task-5-specwriter-negative.txt
  ```

  **Commit**: YES (grouped with Tasks 3-5)
  - Message: `docs(process): add Gemini system prompts and feature spec template`
  - Files: `docs/specs/_template.md`, `docs/specs/README.md`, `docs/prompts/gemini-advisor.md`, `docs/prompts/gemini-specwriter.md`
  - Pre-commit: file existence + heading checks

---

- [x] 6. Fix Vercel Deployment (Based on Investigation Findings)

  **What to do**:
  - Read `.sisyphus/drafts/vercel-investigation.md` and implement only the minimal fixes required by the identified root cause.
  - Apply changes in the smallest possible surface area (env expectations, docs, config, or runtime-safe guards).
  - Re-run deploy preflight and production build locally after each change set.
  - If root cause is external (account/config access), produce a blocker handoff doc with exact required action and owner.

  **Must NOT do**:
  - Do NOT make speculative unrelated refactors.
  - Do NOT alter core feature behavior while fixing deployment.
  - Do NOT merge workaround code that hides real env/config failures.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Potentially cross-cutting deploy/runtime issue requiring careful, minimal remediation.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Deployment/runtime fix does not need UI redesign.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7 (dry-run should assume stable deployment baseline)
  - **Blocked By**: Task 2 (investigation report)

  **References**:

  **Pattern References** (existing code to follow):
  - `.sisyphus/drafts/vercel-investigation.md` - Root-cause source of truth.
  - `scripts/deploy-preflight.mjs` - Env validation logic to satisfy.
  - `README.md` deploy section - User-facing deploy steps to keep accurate.
  - `.env.example` - Required variable contract for runtime parity.
  - `package.json` deploy scripts - Existing command flow that must pass.

  **API/Type References** (contracts to implement against):
  - Required env constraints in preflight script, including provider-specific key requirements.

  **Test References** (testing patterns to follow):
  - `playwright.config.ts` provider override pattern (`AI_PROVIDER: 'mock'`) to avoid accidental provider drift in test flows.

  **External References**:
  - Next.js deployment troubleshooting: `https://nextjs.org/docs/app/building-your-application/deploying`

  **WHY Each Reference Matters**:
  - Investigation doc prevents random fixes and locks to evidence-based remediation.
  - Preflight script + env example define objective pass/fail conditions.
  - README keeps operational instructions synced with actual fix.

  **Acceptance Criteria**:
  - [ ] Root-cause fix applied with minimal file changes.
  - [ ] `npm run deploy:preflight` passes with valid environment.
  - [ ] `npm run build` passes after fixes.
  - [ ] If deployment remains blocked externally, blocker doc is explicit and actionable.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Deployment checks pass after fix
    Tool: Bash
    Preconditions: Fixes applied, required env variables loaded
    Steps:
      1. Run `npm run deploy:preflight` and save output to `.sisyphus/evidence/task-6-preflight-pass.txt`.
      2. Run `npm run build` and save output to `.sisyphus/evidence/task-6-build-pass.txt`.
      3. If Vercel CLI access exists, run deployment command in dry-run/inspect mode and capture output.
    Expected Result: Preflight and build both pass; deployment path is clear.
    Failure Indicators: Preflight fails, build fails, or unresolved blocker not documented.
    Evidence: .sisyphus/evidence/task-6-summary.md

  Scenario: Negative guard verifies failures are explicit
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run preflight with intentionally invalid `AI_PROVIDER=invalid`.
      2. Assert non-zero exit and explicit valid-provider guidance in output.
      3. Run preflight with provider-specific key missing (e.g., `AI_PROVIDER=anthropic` without `ANTHROPIC_API_KEY`).
      4. Assert error output names the missing key.
    Expected Result: Validation fails loudly and points to exact missing/invalid config.
    Failure Indicators: Silent pass or generic/non-actionable error messages.
    Evidence: .sisyphus/evidence/task-6-negative-preflight.txt
  ```

  **Commit**: YES
  - Message: `fix(deploy): resolve Vercel deployment issues`
  - Files: only files changed by root-cause remediation
  - Pre-commit: `npm run deploy:preflight && npm run build`

---

- [x] 7. Validate the Process with a Crystal-as-Page Dry Run

  **What to do**:
  - Run a full documentation-only dry run across the new process stages (no code changes).
  - Primary path: generate artifacts in Gemini AI Studio using the two system prompts.
  - Fallback path (if Gemini access is unavailable in-session): run the same prompts through OpenCode, and mark the run as `fallback-simulation` in evidence.
  - Using `docs/prompts/gemini-advisor.md`, generate `docs/specs/crystal-as-page-brief.md` (Feature Brief).
  - Using `docs/prompts/gemini-specwriter.md` + brief, generate `docs/specs/crystal-as-page.md` (full feature spec).
  - Validate `docs/specs/crystal-as-page.md` against `docs/specs/_template.md` and produce compliance report.
  - Produce final process validation note in `.sisyphus/evidence/task-7-process-dry-run.md` with time spent per stage and friction notes.

  **Must NOT do**:
  - Do NOT implement Crystal-as-page code in this plan.
  - Do NOT skip any stage in the funnel during validation.
  - Do NOT accept a spec with unresolved critical open questions.

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: End-to-end workflow validation through artifacts and structured review.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No runtime UI test required for process-only dry run.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final validation)
  - **Blocks**: Final verification wave
  - **Blocked By**: Tasks 3, 4, 5, and 6

  **References**:

  **Pattern References** (existing code to follow):
  - `.sisyphus/plans/neurograph-dev-process.md` section "The Token Cost Funnel" - Stage-by-stage process to validate.
  - `.sisyphus/plans/neurograph-dev-process.md` section "Feature Roadmap" (Phase 2) - Crystal-as-page scope anchor.
  - `docs/specs/_template.md` - Spec compliance contract.
  - `docs/prompts/gemini-advisor.md` and `docs/prompts/gemini-specwriter.md` - Prompt artifacts under validation.

  **API/Type References** (contracts to implement against):
  - Required output files: `docs/specs/crystal-as-page-brief.md` and `docs/specs/crystal-as-page.md`.

  **Test References** (testing patterns to follow):
  - `src/components/chat/ChatPanel.test.tsx` - Reminder that acceptance criteria should be translatable into concrete tests later.

  **External References**:
  - None required (internal process validation only).

  **WHY Each Reference Matters**:
  - Roadmap anchors the dry run to the top-priority feature.
  - Template and prompts must prove they work together as a handoff chain.
  - Process evidence ensures adoption friction is visible before real feature work.

  **Acceptance Criteria**:
  - [ ] Feature brief file exists and reflects Advisor prompt contract.
  - [ ] Crystal-as-page spec file exists and fully matches template sections.
  - [ ] Evidence clearly records whether run mode was `gemini-primary` or `fallback-simulation`.
  - [ ] Compliance report lists any missing/weak sections and final pass status.
  - [ ] Dry-run evidence includes stage timing and improvement notes.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: End-to-end process dry run produces complete artifacts
    Tool: Bash
    Preconditions: Tasks 3, 4, 5 completed
    Steps:
      1. Verify existence of advisor and spec-writer prompt files.
      2. Verify existence of generated files: `docs/specs/crystal-as-page-brief.md` and `docs/specs/crystal-as-page.md`.
      3. Run heading checklist against `docs/specs/crystal-as-page.md` using template requirements.
      4. Save compliance + timing summary to `.sisyphus/evidence/task-7-process-dry-run.md`.
    Expected Result: Full artifact chain exists and passes template compliance.
    Failure Indicators: Missing artifact, missing required headings, or missing timing/failure notes.
    Evidence: .sisyphus/evidence/task-7-process-dry-run.md

  Scenario: Negative check rejects incomplete generated spec
    Tool: Bash
    Preconditions: Checklist command available
    Steps:
      1. Run checklist against a temporary truncated copy of `crystal-as-page.md` missing `## OUT` and `## Guardrails`.
      2. Assert checklist fails and reports missing sections.
      3. Record output in evidence.
    Expected Result: Incomplete spec is rejected.
    Failure Indicators: Checklist passes incomplete spec.
    Evidence: .sisyphus/evidence/task-7-process-negative.txt
  ```

  **Commit**: NO
  - Message: n/a (validation artifact)
  - Files: `docs/specs/crystal-as-page-brief.md`, `docs/specs/crystal-as-page.md`, `.sisyphus/evidence/task-7-process-dry-run.md`

---

## Final Verification Wave

> Run 4 independent reviews in parallel after Tasks 1-7 complete. Any rejection -> fix -> rerun the specific review.

- [x] F1. **Plan Compliance Audit** - `oracle`
  - Verify each plan deliverable exists in expected path.
  - Check that "Must Have" items are all satisfied and "Must NOT Have" rules are respected.
  - Confirm all task evidence files exist in `.sisyphus/evidence/`.
  - Output format: `Must Have [N/N] | Must NOT Have [N/N] | Evidence [N/N] | VERDICT`

- [x] F2. **Code/Docs Quality Review** - `unspecified-high`
  - Run markdown and command sanity checks for all new docs (`docs/specs/*`, `docs/prompts/*`).
  - Validate command examples are executable and consistent with `package.json` scripts.
  - Flag vague language or placeholders that reduce operational clarity.
  - Output format: `Docs [PASS/FAIL] | Commands [PASS/FAIL] | Clarity [PASS/FAIL] | VERDICT`

- [x] F3. **Execution Reality Check** - `unspecified-high`
  - Execute the dry-run validation checklist exactly as written in Task 7.
  - Confirm process can be followed without hidden assumptions.
  - Validate deployment checks (`deploy:preflight`, `build`) from Task 6 are reproducible.
  - Output format: `Dry Run [PASS/FAIL] | Deploy Checks [PASS/FAIL] | Friction Notes [N] | VERDICT`

- [x] F4. **Scope Fidelity Check** - `deep`
  - Compare changed files to scope: process setup, prompt docs, spec template, repo hygiene, deploy stabilization.
  - Ensure no feature implementation code for Crystal-as-page was introduced.
  - Detect any unplanned changes and classify as keep/revert/defer.
  - Output format: `Scope Match [N/N] | Scope Creep [0/N] | Unplanned Files [0/N] | VERDICT`

---

## Commit Strategy

| After Task Group | Message | Verification |
|------------------|---------|--------------|
| 1 | `chore(repo): clean stale branches and reset boulder` | `git branch -a`, boulder.json |
| 2 | no commit (investigation only) | — |
| 3-5 | `docs(process): add Gemini system prompts and feature spec template` | file existence |
| 6 | `fix(deploy): resolve Vercel deployment issues` | `npm run build` |
| 7 | no commit (dry-run validation) | — |

---

## Success Criteria

### Verification Commands
```bash
git branch -r | wc -l      # Expected: significantly fewer than current ~35
cat .sisyphus/boulder.json  # Expected: no active plan (or reset)
npm run build               # Expected: passes
ls docs/specs/              # Expected: template exists
ls docs/prompts/              # Expected: Gemini prompt files exist
```

### Final Checklist
- [ ] Repository cleaned (stale branches removed, boulder reset)
- [ ] Gemini Advisor system prompt in `docs/prompts/gemini-advisor.md`
- [ ] Gemini Spec Writer system prompt in `docs/prompts/gemini-specwriter.md`
- [ ] Feature spec template exists in `docs/specs/`
- [ ] Vercel deployment is working OR blocker is documented
- [ ] Process dry-run completed with Crystal-as-Page feature brief
- [ ] Feature roadmap (4 phases) is documented in this plan
