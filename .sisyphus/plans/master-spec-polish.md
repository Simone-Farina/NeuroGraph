# Polish MASTER_SPECIFICATION.txt — Enrich Curated Sections, Trim Appendices

## TL;DR

> **Quick Summary**: Restructure `MASTER_SPECIFICATION.txt` from a 7,575-line file (97% appendix bloat) into a focused ~1,000-line portable context document. Enrich curated sections §1-5 with translated Italian spec vision, real feature inventory, roadmap, and bugs acknowledgment. Trim appendices from 37 files to ~9 (living docs + condensed history).
> 
> **Deliverables**:
> - Polished `MASTER_SPECIFICATION.txt` (~1,000-1,200 lines, self-sufficient curated sections)
> - Committed alongside already-modified `README.md` and `docs/specs/README.md`
> 
> **Estimated Effort**: Short (2-3 hours agent time)
> **Parallel Execution**: YES — 3 waves + final
> **Critical Path**: Task 1/2/3 (parallel drafts) → Task 4 (rewrite) → Task 5 (validate + commit)

---

## Context

### Original Request
Polish the `MASTER_SPECIFICATION.txt` portable context file. The curated sections (§0-5) are too thin (165 lines) to serve as standalone context. The appendices (7,410 lines) are bloated with completed Sisyphus execution artifacts. The Italian product spec (`specifications.md`) needs to be translated and reconciled into §1.

### Interview Summary
**Key Decisions**:
- Enrich curated §1-5 to be self-sufficient standalone context (target: 300-500 lines)
- Trim appendices aggressively: keep living docs + one condensed historical summary (target: ~600 lines)
- Translate Italian `specifications.md` concepts into English §1, noting where actual implementation diverges from original vision
- Add feature roadmap (Crystal-as-page → AI quality → Ghost Nodes → FIRe) and general known-bugs acknowledgment to §2
- Total file target: <1,200 lines (down from 7,575)

**Research Findings**:
- Italian spec claims Neo4j, Pinecone, Next.js 15 — actual stack is Supabase/pgvector, Next.js 14.2
- Framer Motion IS present (v12.34.0) despite initial assumption it wasn't
- 8 fully working features, 3 partial, several unimplemented (Ghost Nodes, FIRe, Generative UI)
- 101 tests passing (Vitest + Playwright infrastructure)
- FSRS-6 via ts-fsrs (upgraded from SM-2 in original spec)

### Metis Review
**Key Risks / Guardrails**:
- Do not let §1 (vision) turn into a translated technical spec (no TypeScript types, no SQL, no FSRS formulas)
- Enforce hard size caps (curated 300-500 lines; total <1,200 lines) so the appendices do not re-bloat
- Condensed history must be <= 100 lines (decisions/learnings only; no task-by-task execution detail)
- §2 must be a feature inventory + roadmap (not a commit log)
- Roadmap must include only user-stated priorities (Crystal-as-page, AI quality, Ghost Nodes, FIRe)
- Known bugs section must be non-specific (acknowledgment only)

---

## Work Objectives

### Core Objective
Transform MASTER_SPECIFICATION.txt from a bloated archive dump into a focused, self-sufficient portable context document that any LLM can read and immediately understand the project.

### Concrete Deliverables
- `MASTER_SPECIFICATION.txt` — rewritten (~1,000-1,200 lines)
- Git commit including `MASTER_SPECIFICATION.txt`, `README.md`, `docs/specs/README.md`

### Definition of Done
- [ ] Curated sections §0-5: 300-500 lines, self-sufficient context
- [ ] Total file: <1,200 lines
- [ ] Appendices: 8 BEGIN FILE blocks (living docs) + 1 condensed history subsection
- [ ] §1 contains Gas-to-Crystal, pedagogical principles, stack divergence notes — in English
- [ ] §2 contains feature inventory by status, roadmap, bugs acknowledgment
- [ ] Zero Sisyphus plan/evidence/notepad files in appendices
- [ ] All grep validation checks pass (see Verification Strategy)
- [ ] Clean git commit with exactly 3 files

### Must Have
- §1 rich enough that an LLM reading ONLY §0-2 understands what NeuroGraph is, what it does, and what state it's in
- Feature inventory with clear status markers (working / partial / planned / not started)
- Roadmap in user's exact priority order: Crystal-as-page, AI quality, Ghost Nodes, FIRe
- Condensed history that preserves key architectural decisions from Sisyphus plans

### Must NOT Have (Guardrails)
- TypeScript type definitions or SQL schemas in §1 (vision level only — implementation details go in §3 or appendices)
- FSRS formulas or algorithm parameters in curated sections (ts-fsrs handles this; concept-level only)
- Any edits to living doc file contents — they are included verbatim as they exist on disk
- Commit log / commit hashes in §2 (feature inventory, not changelog)
- New curated sections beyond §0-5 (no §6, §7, etc.)
- Specific bug descriptions — general acknowledgment only ("MVP with known rough edges" level)
- Features in roadmap that user didn't mention (no adding "Generative UI" or "Prerequisite blocking UI")
- Any secrets, API keys, or .env.local contents
- Changes to files beyond the 3 stated files in the commit

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: N/A (documentation task)
- **Automated tests**: None — grep-based content validation instead
- **Framework**: Bash (grep, wc, git)

### QA Policy
Every task includes agent-executed QA scenarios using Bash grep/wc checks.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

### Validation Commands (used across tasks)

**Content Presence (positive checks):**
```bash
# §1 vision concepts
grep -c "Gas-to-Crystal\|Gas.to.Crystal" MASTER_SPECIFICATION.txt    # >= 1
grep -c "pedagogical\|Bloom\|atomicit" MASTER_SPECIFICATION.txt       # >= 1
grep -c "diverge\|differs from\|original vision" MASTER_SPECIFICATION.txt  # >= 1
grep -c "FSRS\|spaced repetition" MASTER_SPECIFICATION.txt            # >= 1

# §2 feature status + roadmap
grep -c "Crystal-as-page\|crystal.as.page" MASTER_SPECIFICATION.txt   # >= 1
grep -c "Ghost.Node" MASTER_SPECIFICATION.txt                          # >= 1
grep -c "FIRe" MASTER_SPECIFICATION.txt                                # >= 1
grep -c "known.*bug\|known.*limitation\|rough.edge" MASTER_SPECIFICATION.txt  # >= 1
```

**Content Absence (negative checks):**
```bash
# No individual Sisyphus artifacts
grep -c "BEGIN FILE: .sisyphus/plans/" MASTER_SPECIFICATION.txt       # == 0
grep -c "BEGIN FILE: .sisyphus/evidence/" MASTER_SPECIFICATION.txt    # == 0
grep -c "BEGIN FILE: .sisyphus/notepads/" MASTER_SPECIFICATION.txt    # == 0
grep -c "BEGIN FILE: .sisyphus/drafts/" MASTER_SPECIFICATION.txt      # == 0

# No redundant files
grep -c "BEGIN FILE: README.md" MASTER_SPECIFICATION.txt              # == 0
grep -c "BEGIN FILE: specifications.md" MASTER_SPECIFICATION.txt      # == 0
grep -c "BEGIN FILE: package.json" MASTER_SPECIFICATION.txt           # == 0
grep -c "BEGIN FILE: next.config.js" MASTER_SPECIFICATION.txt         # == 0
```

**Size checks:**
```bash
wc -l MASTER_SPECIFICATION.txt                                        # < 1200
grep -c "BEGIN FILE:" MASTER_SPECIFICATION.txt                        # == 8

# Curated section size (start of file through APPENDICES header)
sed -n '1,/^APPENDICES/p' MASTER_SPECIFICATION.txt | wc -l              # 300-500
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — parallel drafts):
├── Task 1: Distill condensed historical summary (<= 100 lines) [deep]
├── Task 2: Translate & reconcile Italian product vision into English [writing]
└── Task 3: Draft project state snapshot + roadmap + bugs note [writing]

Wave 2 (After Wave 1 — full assembly):
└── Task 4: Rewrite MASTER_SPECIFICATION.txt (curated sections + slim appendices) [writing]

Wave 3 (After Wave 2 — validation + commit):
└── Task 5: Validate with grep/wc + commit (3 files only) [quick]

Wave FINAL (After ALL tasks — independent review):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real QA — content verification [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1/2/3 → Task 4 → Task 5 → F1-F4
Parallel Speedup: ~35% (Wave 1 parallelism)
Max Concurrent: 3 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 4 |
| 2 | — | 4 |
| 3 | — | 4 |
| 4 | 1, 2, 3 | 5 |
| 5 | 4 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `deep`, T2 → `writing`, T3 → `writing`
- **Wave 2**: **1** — T4 → `writing`
- **Wave 3**: **1** — T5 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs


- [ ] 1. Distill Condensed Historical Summary (<= 100 lines)

  **What to do**:
  - Read the 4 Sisyphus plan files and the notepads they produced.
  - Produce a <= 100-line factual summary (decisions + learnings only):
    - ~20-25 lines per plan (MVP, Bugs & Gaps, Polish Sprint, Dev Process)
    - 3-5 cross-cutting insights spanning multiple plans
  - Write the summary to `.sisyphus/drafts/condensed-history.md`.

  **Must NOT do**:
  - Do not include task-by-task execution detail ("Task 3 did X")
  - Do not include QA scenario/evidence log content
  - Do not use Sisyphus/OpenCode internal jargon (waves, boulders, agents)

  **Recommended Agent Profile**:
  - **Category**: `deep` (large input synthesis)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1 with Tasks 2-3)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `.sisyphus/plans/neurograph-mvp.md` — MVP scope + outcomes
  - `.sisyphus/plans/neurograph-bugs-and-gaps.md` — bug-fix decisions
  - `.sisyphus/plans/neurograph-polish-sprint.md` — UI/UX + stability polish
  - `.sisyphus/plans/neurograph-dev-process.md` — process decisions (Aider/Gemini/spec templates)
  - `.sisyphus/notepads/neurograph-mvp/` — decisions/issues/learnings/problems
  - `.sisyphus/notepads/neurograph-dev-process/` — decisions/issues/learnings/problems

  **Acceptance Criteria**:
  - [ ] `.sisyphus/drafts/condensed-history.md` exists
  - [ ] `wc -l .sisyphus/drafts/condensed-history.md` → <= 100
  - [ ] Contains 4 plan sections + 1 cross-cutting section

  **QA Scenarios**:
  ```
  Scenario: Condensed history stays within size cap
    Tool: Bash
    Steps:
      1. Run: wc -l .sisyphus/drafts/condensed-history.md
      2. Assert: line count <= 100
    Evidence: .sisyphus/evidence/task-1-condensed-history-wc.txt

  Scenario: Condensed history excludes execution noise
    Tool: Bash
    Steps:
      1. Run: grep -ciE 'task [0-9]+|wave [0-9]+|boulder|agent|qa scenario|evidence' .sisyphus/drafts/condensed-history.md
      2. Assert: output = 0
    Evidence: .sisyphus/evidence/task-1-condensed-history-noise-grep.txt
  ```

  **Commit**: NO

- [ ] 2. Translate & Reconcile Italian Product Vision (specifications.md)

  **What to do**:
  - Read `specifications.md` (Italian) and extract the durable product concepts:
    - Gas-to-Crystal loop
    - Pedagogical principles (Atomicity, DAG/prereqs, Non-Interference, FIRe)
    - Concept-level data model (what a node/edge/state represent)
  - Write clear English prose + a short divergence note (original vision vs current implementation) to `.sisyphus/drafts/vision-english.md`.
  - Target: 120-200 lines (vision-level, not a translation dump).

  **Must NOT do**:
  - Do not include TypeScript types, SQL schemas, or formulas
  - Do not translate line-by-line; restructure for clarity

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1 with Tasks 1, 3)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `specifications.md` — source vision document
  - `package.json` — ground truth for current stack versions

  **Acceptance Criteria**:
  - [ ] `.sisyphus/drafts/vision-english.md` exists
  - [ ] Contains: Gas-to-Crystal + FIRe + divergence note
  - [ ] Contains no `type Foo =` or LaTeX formulas

  **QA Scenarios**:
  ```
  Scenario: Vision draft includes required concepts
    Tool: Bash
    Steps:
      1. Run: grep -ciE 'gas-to-crystal|gas to crystal' .sisyphus/drafts/vision-english.md
      2. Assert: >= 1
      3. Run: grep -ciE 'atomicit|prereq|dag|fire' .sisyphus/drafts/vision-english.md
      4. Assert: >= 2
      5. Run: grep -ciE 'diverge|differs|original vision|actual implementation' .sisyphus/drafts/vision-english.md
      6. Assert: >= 1
    Evidence: .sisyphus/evidence/task-2-vision-concepts-grep.txt

  Scenario: Vision draft excludes implementation noise
    Tool: Bash
    Steps:
      1. Run: grep -cE '^type\s+|^interface\s+|\\\\frac|\\\\rightarrow|e\^\{' .sisyphus/drafts/vision-english.md
      2. Assert: output = 0
    Evidence: .sisyphus/evidence/task-2-vision-noise-grep.txt
  ```

  **Commit**: NO

- [ ] 3. Draft Project State Snapshot + Roadmap + Bugs Acknowledgment

  **What to do**:
  - Write a concise state snapshot to `.sisyphus/drafts/state-snapshot.md`:
    - Feature inventory grouped by status (Working / Partial / Planned)
    - Roadmap in priority order: Crystal-as-page, AI quality, Ghost Nodes, FIRe
    - A short, non-specific bugs note ("MVP with known rough edges; will address incrementally")
  - Keep it factual and implementation-oriented (no commit hashes).

  **Must NOT do**:
  - Do not list specific bugs
  - Do not include commit log entries
  - Do not add roadmap items beyond the 4 stated

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1 with Tasks 1-2)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - Current `MASTER_SPECIFICATION.txt` §2 — replace commit-log style
  - `package.json` scripts — confirm commands/test infra
  - `docs/specs/crystal-as-page.md` — roadmap anchor feature

  **Acceptance Criteria**:
  - [ ] `.sisyphus/drafts/state-snapshot.md` exists
  - [ ] Contains all 4 roadmap items
  - [ ] Contains the phrase "known" + "bug" or "rough edge" (acknowledgment)

  **QA Scenarios**:
  ```
  Scenario: Roadmap draft contains exactly the 4 priority items
    Tool: Bash
    Steps:
      1. Run: grep -ciE 'crystal-as-page|ai quality|ghost node|fire' .sisyphus/drafts/state-snapshot.md
      2. Assert: >= 4
      3. Run: grep -ciE '^[0-9a-f]{7,}\s' .sisyphus/drafts/state-snapshot.md
      4. Assert: 0 (no commit hashes)
    Evidence: .sisyphus/evidence/task-3-roadmap-grep.txt
  ```

  **Commit**: NO

- [ ] 4. Rewrite MASTER_SPECIFICATION.txt (Enriched Curated + Slim Appendices)

  **What to do**:
  - Rewrite curated sections §0-5 so they are self-sufficient:
    - §1: Replace the thin vision with the English vision draft (Task 2) + divergence notes
    - §2: Replace commit log with state snapshot (Task 3): feature inventory + roadmap + bugs note
    - §3: Keep conventions accurate (stack, migrations, commands, env var policy)
    - §4: Keep Aider-first, code-aware planning guidance (stable, non-stale)
    - §5: Keep model selection rubric; keep table template empty/minimal to avoid staleness
  - Replace appendices with:
    - A short "Condensed History" subsection (from Task 1)
    - Verbatim `BEGIN FILE` blocks for these living docs only:
      - `.env.example`
      - `scripts/deploy-preflight.mjs`
      - `src/lib/db/README.md`
      - `docs/prompts/gemini-advisor.md`
      - `docs/prompts/gemini-specwriter.md`
      - `docs/specs/_template.md`
      - `docs/specs/README.md`
      - `docs/specs/crystal-as-page.md`
  - Ensure excluded from appendices: `README.md`, `package.json`, `next.config.js`, `specifications.md`, `.sisyphus/**`.

  **Must NOT do**:
  - Do not add new curated sections beyond §0-5
  - Do not re-introduce `.sisyphus/*` appendices
  - Do not include secrets

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1-3)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1-3

  **References**:
  - `.sisyphus/drafts/condensed-history.md` — source for condensed history subsection
  - `.sisyphus/drafts/vision-english.md` — source for §1
  - `.sisyphus/drafts/state-snapshot.md` — source for §2
  - Existing `MASTER_SPECIFICATION.txt` divider style (`============================================================================================`)

  **Acceptance Criteria**:
  - [ ] `wc -l MASTER_SPECIFICATION.txt` → < 1200
  - [ ] Curated sections (start to APPENDICES) are 300-500 lines
  - [ ] `grep -c "BEGIN FILE:" MASTER_SPECIFICATION.txt` → 8
  - [ ] All negative checks in Verification Strategy pass

  **QA Scenarios**:
  ```
  Scenario: MASTER_SPECIFICATION.txt meets size + appendix constraints
    Tool: Bash
    Steps:
      1. Run: wc -l MASTER_SPECIFICATION.txt
      2. Assert: < 1200
      3. Run: grep -c "BEGIN FILE:" MASTER_SPECIFICATION.txt
      4. Assert: = 8
    Evidence: .sisyphus/evidence/task-4-master-size-check.txt

  Scenario: Forbidden appendices are absent
    Tool: Bash
    Steps:
      1. Run: grep -c "BEGIN FILE: .sisyphus/" MASTER_SPECIFICATION.txt
      2. Assert: 0
      3. Run: grep -c "BEGIN FILE: specifications.md" MASTER_SPECIFICATION.txt
      4. Assert: 0
    Evidence: .sisyphus/evidence/task-4-master-negative-check.txt
  ```

  **Commit**: NO

- [ ] 5. Validate + Commit (3 files only)

  **What to do**:
  - Run all validation commands from Verification Strategy.
  - Confirm `git status` shows only:
    - `MASTER_SPECIFICATION.txt`
    - `README.md`
    - `docs/specs/README.md`
  - Stage and commit with message:
    - `docs: polish MASTER_SPECIFICATION.txt — enrich curated sections, trim appendices`

  **Must NOT do**:
  - Do not commit `.env.local` or any secrets
  - Do not commit any `.sisyphus/evidence/*` outputs

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 4

  **References**:
  - `README.md` — already modified to reference the master spec
  - `docs/specs/README.md` — already modified to reference Aider workflow + master spec

  **Acceptance Criteria**:
  - [ ] `git diff --stat HEAD` shows exactly 3 files
  - [ ] `git status` is clean after commit

  **QA Scenarios**:
  ```
  Scenario: Commit scope is exactly 3 files
    Tool: Bash
    Steps:
      1. Run: git diff --name-only HEAD
      2. Assert: lists only MASTER_SPECIFICATION.txt, README.md, docs/specs/README.md
    Evidence: .sisyphus/evidence/task-5-commit-scope.txt
  ```

  **Commit**: YES

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify content exists in MASTER_SPECIFICATION.txt (grep). For each "Must NOT Have": search for forbidden patterns — reject with line number if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run ALL validation commands from Verification Strategy section. Check for: broken section dividers, inconsistent formatting, accidental secret leaks (grep for sk-, api_key=, password=), UTF-8 encoding issues. Verify git status shows exactly 3 files changed.
  Output: `Positive Checks [N/N] | Negative Checks [N/N] | Secrets [CLEAN] | Format [CLEAN] | VERDICT`

- [ ] F3. **Real QA — Content Verification** — `unspecified-high`
  Read the full MASTER_SPECIFICATION.txt. Verify: §1 is coherent English product vision (not machine-translated garbage), §2 feature statuses match actual codebase, §3 conventions match package.json/project structure, appendix files are verbatim copies of their source files (diff check: `diff <(sed -n '/BEGIN FILE: .env.example/,/END FILE: .env.example/p' MASTER_SPECIFICATION.txt | tail -n +2 | head -n -1) .env.example`). Check condensed history is factually accurate by spot-checking 3 claims against source plans.
  Output: `Coherence [PASS/FAIL] | Accuracy [N/N checked] | Verbatim [N/N match] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual changes (git diff). Verify 1:1 — everything in spec was done, nothing beyond spec was added. Check: no files outside MASTER_SPECIFICATION.txt/README.md/docs/specs/README.md were modified. No living doc content was edited. No new curated sections (§6+) were added. Condensed history is under 100 lines. Roadmap items match user's exact list.
  Output: `Tasks [N/N compliant] | Scope [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Single commit** after Task 5 validation passes:
  - Message: `docs: polish MASTER_SPECIFICATION.txt — enrich curated sections, trim appendices`
  - Files: `MASTER_SPECIFICATION.txt`, `README.md`, `docs/specs/README.md`
  - Pre-commit: All grep validation checks pass

---

## Success Criteria

### Verification Commands
```bash
wc -l MASTER_SPECIFICATION.txt                    # Expected: < 1200
grep -c "BEGIN FILE:" MASTER_SPECIFICATION.txt    # Expected: 8
grep -c "Gas-to-Crystal" MASTER_SPECIFICATION.txt # Expected: >= 1
grep -c "Crystal-as-page" MASTER_SPECIFICATION.txt # Expected: >= 1
grep -c "BEGIN FILE: .sisyphus/plans/" MASTER_SPECIFICATION.txt  # Expected: 0
grep -c "BEGIN FILE: .sisyphus/evidence/" MASTER_SPECIFICATION.txt # Expected: 0
git diff --stat HEAD                               # Expected: 3 files changed
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] File is under 1,200 lines
- [ ] Curated sections §0-5 are self-sufficient (300-500 lines)
- [ ] All living doc appendices are verbatim
- [ ] Condensed history is under 100 lines
- [ ] Clean commit with correct message
