# Phase 12: Chat Analyzer / Bouncer Agent - Research

**Researched:** 2026-03-23
**Domain:** Prompt engineering, promptfoo eval harness, JSON schema extension, heuristic fallback
**Confidence:** HIGH

## Summary

Phase 12 extends the existing Bouncer infrastructure from a single-purpose duplicate-rejection agent into a dual-purpose "Chat Analyzer / Bouncer" agent. The first job (duplicate rejection) is already working in production and covered by a 5-case golden suite. The second job (extraction of `extracted_definition` and `extracted_core_insight` from ambiguous user text) is new and requires prompt expansion, schema updates, new golden cases, heuristic fallback extension, and scored assertion helpers.

The eval infrastructure (promptfoo, the `prompt-eval/` directory layout, the provider pattern, the shared schema approach) is fully in place from Phase 10/11. Phase 12 is purely additive: extend the prompt contract, extend the JSON schema, extend the golden CSV, extend the heuristic provider, and add assertion logic for the scored extraction cases. No production route changes are involved.

The primary challenge is scoring extraction quality without an LLM-as-judge: D-05 mandates scored thresholds for extraction cases. The simplest viable approach for offline/CI runs is a keyword-presence or substring-coverage check with a configurable pass threshold, deferring full LLM-as-judge to a later phase as noted in the deferred decisions.

**Primary recommendation:** Follow the Phase 11 Architect pattern exactly. Update `BOUNCER_SYSTEM_PROMPT` to add optional extraction fields, update `bouncer-response.schema.json` to allow those fields, add ~7-10 new extraction CSV cases, extend `heuristicDecision` in `neurograph-bouncer-provider.mjs` to populate extraction fields on `allow_new`, and add `javascript` assertions in `promptfooconfig.yaml` for extraction quality scoring.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Extend the existing `BOUNCER_SYSTEM_PROMPT` to handle both duplicate rejection AND definition/insight extraction as a single agent with an expanded JSON response contract.
- **D-02:** The response schema adds optional `extracted_definition` and `extracted_core_insight` fields that populate only on `allow_new` decisions. `append_to_existing` decisions continue returning only `decision`, `confidence`, `match_title`, and `rationale`.
- **D-03:** Extend (not replace) the existing 5-case bouncer CSV with new cases covering extraction behavior. The Phase 10 baseline golden cases for duplicate detection must remain as regression tests.
- **D-04:** New extraction cases should include: ambiguous user text with extractable insight, partial/incomplete phrasing, overly technical jargon, conversational tone that hides a real insight. Target ~12-15 total cases.
- **D-05:** Assertions for extraction cases use scored thresholds (not hard pass/fail) since extraction quality is subjective. Duplicate rejection cases remain hard pass/fail.
- **D-06:** Extend the `heuristicDecision` function in `neurograph-bouncer-provider.mjs` to produce extraction fields for `allow_new` decisions. Offline/CI runs must pass the full expanded suite without an API key.
- **D-07:** Phase 12 remains eval-only. The production neuron route (`src/app/api/neurons/route.ts`) continues using the vector-similarity `checkNeuronCollision` function. LLM bouncer runtime wiring is deferred to a later phase.

### Claude's Discretion

- Exact extraction scoring thresholds (e.g., cosine similarity or LLM-as-judge)
- Whether to use YAML or CSV for new extraction cases
- Exact number of extraction golden cases beyond the minimum
- Assertion helper structure for extraction quality checks

### Deferred Ideas (OUT OF SCOPE)

- Wiring the LLM bouncer into the production neuron creation route (replacing or supplementing vector-similarity check)
- Multi-turn bouncer interaction (currently single-shot decision)
- Bouncer integration with TipTap editor bubble menu
- LLM-as-judge scoring for extraction quality (scaffold now, implement if needed)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOUNCER-01 | The Bouncer prompt must enforce the "duplicate prevention" core value | Existing `BOUNCER_SYSTEM_PROMPT` already encodes duplicate rejection rules; research confirms extending the prompt string while preserving existing rules satisfies this |
| BOUNCER-02 | `promptfoo` evaluations must exist showing the Bouncer rejecting near-identical inputs and suggesting appends instead | Existing 5 golden cases in `cases.csv` cover this; they must be preserved as regression baseline (D-03); no new regression cases required but existing assertions remain hard pass/fail |
| BOUNCER-03 | `promptfoo` evaluations must verify the Bouncer successfully extracts "Definition" and "Core Insight" from ambiguous human text | Requires new CSV cases (D-04), new optional schema fields (D-02), new scored assertions (D-05), and heuristic extension (D-06) |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| promptfoo | 0.121.2 (in package.json devDeps) | Eval harness runner | Project standard from Phase 10; `eval:bouncer` script already defined |
| ai (Vercel AI SDK) | ^6.0.82 | LLM calls in provider | Already used in `neurograph-bouncer-provider.mjs` |
| zod | ^4.3.6 | Schema validation in provider | Already used in architect provider pattern |
| Node.js | 25.8.1 (installed) | Provider execution runtime | `exec:node` provider pattern already established |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ai-sdk/anthropic | ^3.0.42 | Anthropic model support in provider | When `ANTHROPIC_API_KEY` is set |
| @ai-sdk/openai | ^3.0.27 | OpenAI model support in provider | Default model (`openai:gpt-4o-mini`) for bouncer |
| @ai-sdk/google | ^3.0.26 | Google model support in provider | When `GOOGLE_API_KEY` is set |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSV for new extraction cases | YAML | CONTEXT.md leaves this to discretion. CSV is simpler for the existing pattern — architect uses CSV, bouncer uses CSV. Use CSV unless extraction cases require multi-line text that breaks CSV quoting |
| Keyword-presence scoring | LLM-as-judge | LLM-as-judge is deferred (D-07 in deferred ideas); keyword/substring scoring is simpler, fully offline, and sufficient for CI |

**Installation:**

`promptfoo` is in `package.json` as a devDependency but is NOT currently installed in `node_modules`. Wave 0 must run `npm install` before any eval can execute.

```bash
npm install
```

**Version verification (package.json):** promptfoo `0.121.2` — confirmed from package.json `devDependencies`.

---

## Architecture Patterns

### Recommended File Structure for Phase 12 Changes

```
src/lib/ai/
└── prompts.ts                              # Update BOUNCER_SYSTEM_PROMPT (extraction fields)

prompt-eval/
├── bouncer/
│   ├── cases.csv                           # Extend: add ~7-10 extraction rows
│   ├── prompt.txt                          # No change needed
│   └── promptfooconfig.yaml               # Add scored extraction assertions
└── shared/
    ├── bouncer-response.schema.json        # Add optional extracted_definition, extracted_core_insight
    └── neurograph-bouncer-provider.mjs     # Extend heuristicDecision for extraction fields
```

### Pattern 1: Expanded Response Contract (D-02)

The current bouncer response schema (`bouncer-response.schema.json`) uses `additionalProperties: false` and requires all 4 keys. The new contract adds two optional keys only on `allow_new` decisions.

**JSON Schema extension:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": false,
  "required": ["decision", "confidence", "match_title", "rationale"],
  "properties": {
    "decision": { "type": "string", "enum": ["append_to_existing", "allow_new"] },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "match_title": { "type": ["string", "null"], "minLength": 1 },
    "rationale": { "type": "string", "minLength": 1, "maxLength": 240 },
    "extracted_definition": { "type": "string", "minLength": 10, "maxLength": 280 },
    "extracted_core_insight": { "type": "string", "minLength": 10, "maxLength": 500 }
  }
}
```

**Critical:** The schema must NOT add `extracted_definition` and `extracted_core_insight` to `required` — they are conditional on `allow_new`. The `is-json` assertion in promptfoo validates against this schema for all cases; extra keys must be allowed by the schema but validated conditionally in JavaScript assertions.

**Source:** Derived from current `bouncer-response.schema.json` (lines 1-26) and D-02 locked decision.

### Pattern 2: Prompt Contract Extension (D-01)

The current `BOUNCER_SYSTEM_PROMPT` (lines 40-57, `prompts.ts`) must be extended to describe the new fields and when they populate. The existing rules block must remain verbatim — only the response contract description changes.

**Extension approach:**
```typescript
export const BOUNCER_SYSTEM_PROMPT = `You are the NeuroGraph Bouncer, the structural guardian of knowledge quality.

Your job is to decide whether a candidate neuron should become:
- \`append_to_existing\` when it duplicates or semantically overlaps an existing neuron too closely
- \`allow_new\` when it is meaningfully distinct

Return strict JSON with exactly these keys:
- \`decision\`: either \`append_to_existing\` or \`allow_new\`
- \`confidence\`: a number from 0 to 1
- \`match_title\`: the existing neuron title when you choose \`append_to_existing\`, otherwise null
- \`rationale\`: one concise sentence explaining the decision

When decision is \`allow_new\`, also include:
- \`extracted_definition\`: a clean, self-contained definition of the concept (max 280 chars)
- \`extracted_core_insight\`: the key takeaway or insight from the text (max 500 chars)
  Extract these from the candidate text even if it is phrased conversationally or ambiguously.

Rules:
- Protect against duplicates, near-synonyms, multilingual duplicates, and same-concept rephrasings.
- Prefer \`append_to_existing\` if the candidate would create graph clutter rather than a new concept.
- Prefer \`allow_new\` only when the candidate is clearly a different concept.
- When decision is \`append_to_existing\`, omit \`extracted_definition\` and \`extracted_core_insight\`.
- Never invent extra keys.
- Return JSON only.`;
```

**Source:** Current prompt at `src/lib/ai/prompts.ts` lines 40-57; D-01 and D-02 decisions.

### Pattern 3: Golden Case CSV Extension (D-03, D-04)

The current CSV columns are: `description, existing_title, existing_aliases, existing_definition, candidate_title, candidate_definition, expected_decision, expected_match_title`

For extraction cases, all same columns apply. The `expected_decision` will be `allow_new` and `expected_match_title` will be empty. Additional columns for extraction scoring assertions:

```
description,existing_title,existing_aliases,existing_definition,candidate_title,candidate_definition,expected_decision,expected_match_title,expected_definition_fragment,expected_insight_fragment
```

The `expected_definition_fragment` and `expected_insight_fragment` columns carry substrings the extracted fields should contain, used by the scored assertion JavaScript. Duplicate detection cases (existing 5) can leave these columns empty — the assertions skip when the column is absent.

**Extraction case archetypes required (D-04):**

| Archetype | Description Example |
|-----------|---------------------|
| Ambiguous user text with extractable insight | "so like... when you cache stuff close to where it's used, it's faster right? like CPU cache?" |
| Partial/incomplete phrasing | "Overfitting is when your model just memorizes the training data" |
| Overly technical jargon | "Transformer self-attention uses QKV dot-product scaled by sqrt(d_k) for soft retrieval" |
| Conversational tone hiding real insight | "I realized that recursion is just a function calling itself until a base case stops it" |
| Distinct unrelated concept (control — should allow_new but no existing match) | "Memory Palace" vs "Vector Databases" — already in baseline |
| Terse/fragment that needs expansion | "entropy = disorder in information theory" |
| Cross-domain insight | "Both Bayes theorem and A/B testing update beliefs with new evidence" |

Target total: 12-15 cases (5 existing + 7-10 new).

### Pattern 4: Heuristic Provider Extension (D-06)

The `heuristicDecision` function (lines 78-124 of `neurograph-bouncer-provider.mjs`) currently returns:
```javascript
{ decision, confidence, match_title, rationale }
```

For `allow_new` decisions, it must also return `extracted_definition` and `extracted_core_insight`. Since heuristic mode has no LLM, these are synthesized from `candidate_title` and `candidate_definition`:

```javascript
function heuristicDecision(promptText, vars) {
  // ... existing duplicate logic unchanged ...

  const result = {
    decision,
    confidence: decision === 'append_to_existing' ? 0.91 : 0.84,
    match_title: decision === 'append_to_existing' ? existingTitle : null,
    rationale: decision === 'append_to_existing'
      ? 'The candidate overlaps the existing neuron closely enough that it should deepen the same concept.'
      : 'The candidate is distinct enough to justify a separate neuron.',
  };

  if (decision === 'allow_new') {
    result.extracted_definition = candidateDefinition || `${candidateTitle}: a distinct concept.`;
    result.extracted_core_insight = `The key insight of "${candidateTitle}" is that ${candidateDefinition || 'it represents a meaningfully distinct concept'}`.slice(0, 500);
  }

  return result;
}
```

This ensures extraction cases pass schema validation in offline/CI mode with plausible (not empty) values.

### Pattern 5: Scored Assertion Logic (D-05)

The `promptfooconfig.yaml` currently has two `javascript` assertions in `defaultTest` that check `expected_decision` and `expected_match_title`. Add a third conditional scored assertion for extraction:

```yaml
- type: javascript
  value: |
    const result = JSON.parse(output);
    // Skip extraction check for append_to_existing cases
    if (result.decision === 'append_to_existing') return true;
    // Require extraction fields to be present on allow_new
    if (!result.extracted_definition || !result.extracted_core_insight) return false;
    // Score against expected fragments if provided
    const defFrag = (context.vars.expected_definition_fragment || '').toLowerCase();
    const insFrag = (context.vars.expected_insight_fragment || '').toLowerCase();
    const defCheck = defFrag ? result.extracted_definition.toLowerCase().includes(defFrag) : true;
    const insCheck = insFrag ? result.extracted_core_insight.toLowerCase().includes(insFrag) : true;
    return defCheck && insCheck;
```

This keeps extraction assertions as hard pass/fail on presence and soft pass/fail on content fragments. If fragment matching is too brittle, the thresholds can be relaxed to presence-only for CI.

### Anti-Patterns to Avoid

- **Replacing existing 5 cases:** D-03 is explicit — baseline cases must survive as regression tests. The planner must NOT create a new cases file.
- **Adding `extracted_definition` to `required` in the schema:** This would break all `append_to_existing` cases which correctly omit those fields.
- **Touching `src/app/api/neurons/route.ts`:** D-07 makes this out of scope. The vector-similarity bouncer remains the production path.
- **Changing `prompt.txt`:** The user message template does not need to change — the prompt passes `candidate_title` and `candidate_definition` which are sufficient for extraction.
- **Using a separate CSV file for extraction cases:** The 5 existing cases and the new extraction cases must coexist in `cases.csv` so `npm run eval:bouncer` runs all cases together.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom validator | `is-json` promptfoo assertion + JSON Schema draft-07 file | Already wired into `promptfooconfig.yaml`; schema files in `shared/` are the pattern |
| LLM-as-judge scoring | Custom similarity scorer | Defer (deferred decision) or use keyword fragments | LLM-as-judge is explicitly deferred; keyword fragments are sufficient for CI gate |
| Multi-provider model resolution | Custom provider registry | Existing `resolveModel()` pattern in `neurograph-bouncer-provider.mjs` | Already handles openai/anthropic/google + env var resolution + key detection |
| Offline fallback | Mock API | `heuristicDecision` extension in provider | Already established — offline mode falls back to heuristic automatically |

**Key insight:** The entire eval infrastructure (provider execution model, schema validation, heuristic fallback, CSV test fixture format, `is-json` + `javascript` assertion composition) is fully established. Phase 12 is additive surgery on existing files, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Schema `additionalProperties: false` blocks optional fields
**What goes wrong:** The current `bouncer-response.schema.json` has `additionalProperties: false`. Adding extraction fields to the prompt without also adding them to the schema causes every `allow_new` LLM response to fail the `is-json` schema assertion.
**Why it happens:** `additionalProperties: false` rejects any key not listed in `properties`, even if it is optional.
**How to avoid:** Update the schema file to list `extracted_definition` and `extracted_core_insight` as optional properties (not in `required`) before running the eval.
**Warning signs:** All `allow_new` cases fail with a JSON schema validation error, not a content check failure.

### Pitfall 2: Heuristic produces empty extraction fields, failing length constraints
**What goes wrong:** If `heuristicDecision` returns `extracted_definition: ""` for `allow_new` cases, the schema validation fails because `minLength: 10` is not met.
**Why it happens:** `candidate_definition` may be empty in some test cases (particularly for conversational tone cases where the definition is derived from the candidate text, not a clean field).
**How to avoid:** The heuristic must never emit empty strings for extraction fields on `allow_new`. Use `candidateTitle` as fallback content. Set a minimum character floor in the heuristic output.
**Warning signs:** Offline CI passes schema validation for duplicate cases but fails for new extraction cases.

### Pitfall 3: CSV quoting issues with conversational input text
**What goes wrong:** Extraction test cases involve conversational text like "so like... when you cache stuff close to where it's used" which may contain commas or quotes that break CSV parsing.
**Why it happens:** `candidate_definition` values for extraction archetypes are intentionally messy human text.
**How to avoid:** Always wrap all CSV fields in double quotes. Escape internal double quotes as `""` (RFC 4180). Alternatively, use YAML for extraction-specific cases — this is in Claude's Discretion scope.
**Warning signs:** promptfoo reports a CSV parse error or incorrect column mapping on extraction cases.

### Pitfall 4: `promptfoo` not installed
**What goes wrong:** `npm run eval:bouncer` fails with "promptfoo: not found" because the package is in `package.json` but not installed.
**Why it happens:** Current `node_modules/` does not contain `promptfoo` — verified by environment audit. `npm install` has not been run or was run on a different machine.
**How to avoid:** Wave 0 must include `npm install` as the first action.
**Warning signs:** `ls node_modules | grep promptfoo` returns nothing.

### Pitfall 5: LLM response includes extra keys on `append_to_existing`
**What goes wrong:** Some LLMs may include `extracted_definition` and `extracted_core_insight` on `append_to_existing` decisions despite instructions. The current `additionalProperties: false` in the schema would then fail validation.
**Why it happens:** LLMs are not perfectly instruction-following; the prompt must explicitly say "when `append_to_existing`, omit extraction fields."
**How to avoid:** Add "When decision is `append_to_existing`, omit `extracted_definition` and `extracted_core_insight`" as an explicit rule in the system prompt.
**Warning signs:** `append_to_existing` cases fail schema validation when tested with a live LLM model.

### Pitfall 6: Scorer threshold too aggressive for conversational cases
**What goes wrong:** Keyword fragment assertions fail on conversational extraction cases because the LLM rephrases concepts rather than using the exact words in `expected_insight_fragment`.
**Why it happens:** Extraction quality is inherently paraphrastic — LLMs don't mirror back verbatim fragments.
**How to avoid:** Use short, domain-specific keywords rather than phrases as fragments (e.g., "cache" not "CPU cache locality"). The assertion checks `.includes()` so fragments should be single nouns or short tokens.
**Warning signs:** Cases pass with the heuristic (which mirrors back `candidate_definition`) but fail consistently with live LLM runs.

---

## Code Examples

### Current BOUNCER_SYSTEM_PROMPT (baseline to extend)
```typescript
// Source: src/lib/ai/prompts.ts lines 40-57
export const BOUNCER_SYSTEM_PROMPT = `You are the NeuroGraph Bouncer, the structural guardian of knowledge quality.
// ... (4 existing decision keys, 5 existing rules)
- Return JSON only.`;
```

### Current `heuristicDecision` return shape (lines 115-123, neurograph-bouncer-provider.mjs)
```javascript
// Source: prompt-eval/shared/neurograph-bouncer-provider.mjs lines 115-123
return {
  decision,
  confidence: decision === 'append_to_existing' ? 0.91 : 0.84,
  match_title: decision === 'append_to_existing' ? existingTitle : null,
  rationale: decision === 'append_to_existing'
    ? 'The candidate overlaps the existing neuron closely enough...'
    : 'The candidate is distinct enough to justify a separate neuron.',
};
```

### Current promptfooconfig.yaml assertion structure (full file)
```yaml
# Source: prompt-eval/bouncer/promptfooconfig.yaml
defaultTest:
  assert:
    - type: is-json
      value: file://../shared/bouncer-response.schema.json
    - type: javascript
      value: |
        const result = JSON.parse(output);
        return result.decision === context.vars.expected_decision;
    - type: javascript
      value: |
        const result = JSON.parse(output);
        if (context.vars.expected_match_title) {
          return result.match_title === context.vars.expected_match_title;
        }
        return result.match_title === null;
tests: cases.csv
```

### Current bouncer-response.schema.json (file to extend)
```json
// Source: prompt-eval/shared/bouncer-response.schema.json
{
  "additionalProperties": false,
  "required": ["decision", "confidence", "match_title", "rationale"],
  "properties": { ... }
}
```

### Current LLM output normalization (lines 196-203, neurograph-bouncer-provider.mjs)
```javascript
// Source: prompt-eval/shared/neurograph-bouncer-provider.mjs lines 196-203
const normalized = {
  decision: parsed.decision,
  confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  match_title: parsed.match_title ?? null,
  rationale: parsed.rationale ?? 'No rationale returned.',
};
```
This normalization step MUST be extended to pass through `extracted_definition` and `extracted_core_insight` when present.

---

## Runtime State Inventory

> Not applicable — this is a prompt engineering / eval phase with no production route changes (D-07). No stored data, live service config, OS-registered state, secrets, or build artifacts need updating.

None — verified: Phase 12 explicitly defers all production route wiring to a later phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Provider execution (`exec:node`) | ✓ | v25.8.1 | — |
| promptfoo | `npm run eval:bouncer` | ✗ (not in node_modules) | — | Run `npm install` first |
| OPENAI_API_KEY | Live LLM eval run | Unknown (env var) | — | Heuristic fallback (fully offline) |
| ANTHROPIC_API_KEY | Alternative LLM eval | Unknown (env var) | — | Heuristic fallback |
| GOOGLE_API_KEY | Alternative LLM eval | Unknown (env var) | — | Heuristic fallback |

**Missing dependencies with no fallback:**
- None that block execution — the heuristic provider means all cases pass without any API key.

**Missing dependencies requiring action before eval can run:**
- `promptfoo` package: `npm install` must be run. It is declared in `package.json` devDependencies at version `^0.121.2` but is not installed in `node_modules/`.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | promptfoo 0.121.2 (eval harness) + vitest 4.0.18 (unit tests) |
| Config file | `prompt-eval/bouncer/promptfooconfig.yaml` |
| Quick run command | `npm run eval:bouncer` |
| Full suite command | `npm run eval:all` |

Note: Phase 12 has no vitest unit tests — all validation is through promptfoo. The vitest suite covers app code, not prompt eval artifacts.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOUNCER-01 | Bouncer prompt enforces duplicate prevention | promptfoo eval (hard pass/fail) | `npm run eval:bouncer` | ✅ (existing 5 cases) |
| BOUNCER-02 | Bouncer rejects near-identical inputs and suggests append | promptfoo eval (hard pass/fail on `expected_decision`) | `npm run eval:bouncer` | ✅ (existing 5 cases) |
| BOUNCER-03 | Bouncer extracts Definition and Core Insight from ambiguous text | promptfoo eval (scored threshold on extraction fields) | `npm run eval:bouncer` | ❌ Wave 0 — new cases needed |

### Sampling Rate
- **Per task commit:** `npm run eval:bouncer`
- **Per wave merge:** `npm run eval:all`
- **Phase gate:** Full `eval:bouncer` suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `prompt-eval/bouncer/cases.csv` — extend with ~7-10 extraction cases (BOUNCER-03); file exists but needs new rows
- [ ] `prompt-eval/shared/bouncer-response.schema.json` — add optional `extracted_definition`, `extracted_core_insight` fields
- [ ] `prompt-eval/bouncer/promptfooconfig.yaml` — add extraction presence and fragment assertions
- [ ] `prompt-eval/shared/neurograph-bouncer-provider.mjs` — extend `heuristicDecision` for extraction output
- [ ] `src/lib/ai/prompts.ts` — extend `BOUNCER_SYSTEM_PROMPT` with extraction field rules
- [ ] `npm install` — `promptfoo` is declared but not installed; must run before any eval executes

---

## Open Questions

1. **CSV vs YAML for extraction cases**
   - What we know: CONTEXT.md leaves format to Claude's discretion; existing cases use CSV; architect uses CSV
   - What's unclear: Whether multi-line conversational `candidate_definition` values will survive CSV quoting reliably
   - Recommendation: Start with CSV (consistent with existing pattern); switch to YAML only if any extraction case value contains unescapable commas/newlines. CSV quoting is RFC 4180 compliant as long as all fields are double-quoted and internal quotes are doubled.

2. **Extraction scoring threshold strategy**
   - What we know: D-05 says "scored thresholds (not hard pass/fail)"; LLM-as-judge is deferred; keyword fragments are the simplest offline approach
   - What's unclear: Whether keyword presence is sufficient quality signal for the planner's confidence, or whether a character-length floor (e.g., `extracted_definition.length > 30`) is an adequate proxy
   - Recommendation: Use two-tier check: (1) presence + minimum length (hard), (2) keyword fragment match (soft, skipped when `expected_definition_fragment` column is empty). This gives CI a pass gate without brittle exact-string matching.

3. **`maxOutputTokens` for bouncer provider**
   - What we know: Current provider sets `maxOutputTokens: 220` (line 193, `neurograph-bouncer-provider.mjs`); extraction fields add up to 280 + 500 = 780 chars of new content
   - What's unclear: Whether 220 tokens is enough for the expanded response
   - Recommendation: Increase `maxOutputTokens` to at least 400 to accommodate `extracted_definition` (max 280 chars) + `extracted_core_insight` (max 500 chars) alongside the existing 4 keys. 300-350 tokens should be the floor.

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `src/lib/ai/prompts.ts` — current `BOUNCER_SYSTEM_PROMPT` baseline
- Direct code read: `prompt-eval/shared/neurograph-bouncer-provider.mjs` — full heuristic fallback implementation
- Direct code read: `prompt-eval/bouncer/promptfooconfig.yaml` — current assertion structure
- Direct code read: `prompt-eval/bouncer/cases.csv` — 5 existing golden cases
- Direct code read: `prompt-eval/shared/bouncer-response.schema.json` — current JSON schema
- Direct code read: `prompt-eval/shared/neurograph-architect-provider.mjs` — pattern reference for Zod + heuristic fallback
- Direct code read: `package.json` — eval scripts, promptfoo version, all AI SDK versions
- Direct code read: `.planning/phases/12-chat-analyzer-bouncer-agent/12-CONTEXT.md` — all locked decisions
- Direct code read: `.planning/REQUIREMENTS.md` — BOUNCER-01, BOUNCER-02, BOUNCER-03 text

### Secondary (MEDIUM confidence)
- Environment probe: `npm ls promptfoo` returned empty — promptfoo not installed in current node_modules
- Environment probe: `node --version` returned v25.8.1 — runtime confirmed

### Tertiary (LOW confidence)
- None — all findings are from direct code inspection of project files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed and in use; no new dependencies
- Architecture patterns: HIGH — all patterns derived from reading existing Phase 10/11 code verbatim
- Pitfalls: HIGH — pitfalls derived from direct inspection of schema constraints, CSV format, and heuristic code logic
- Environment: HIGH — verified by probing node_modules directly

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable eval infrastructure; 30-day window)
