# Phase 16: Socratic Agent Redesign - Research

**Researched:** 2026-03-24
**Domain:** LLM prompt engineering, heuristic eval scoring, promptfoo golden suite
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Prompt Redesign**
- D-01: Replace the absolute "NEVER give direct answers" directive with a structured "teach-then-ask" pattern. The agent must share at least one piece of new information (context, counterexample, analogy, historical background, related concept) before posing its closing Socratic question.
- D-02: The prompt must explicitly instruct the agent to: (a) acknowledge the user's answer, (b) enrich with new knowledge the user hasn't stated, (c) connect to broader context or related concepts, (d) close with a focused question that deepens further.
- D-03: The Bloom-gated Neurogenesis Policy (Analyze+ threshold) remains unchanged. Teaching does NOT collapse into answer-giving — the agent shares knowledge strategically to deepen the user's understanding, not to replace their thinking.
- D-04: Add a directive to reference RAG-supplied context (existing neurons, neighbors) when available, connecting new discussion to the user's existing knowledge graph.

**Eval Heuristic Redesign**
- D-05: Update `scoreSocraticTone` in the conversationalist provider to reward teaching content (factual statements, context-setting, analogies) in addition to questions. The scoring should reward the "teach + question" pattern, not penalize information-sharing.
- D-06: Remove or reduce the penalty for "here is" / "the answer is" type phrases — these are legitimate when followed by a deepening question. The anti-pattern is answer-ONLY responses with no follow-up question.
- D-07: Add new golden cases that test the teach-then-ask pattern: cases where the user provides a shallow answer and the correct response includes contextual enrichment before the next question.

**Eval Suite Integrity**
- D-08: The full 31-case promptfoo suite (bouncer 13 + architect 8 + conversationalist 10) must continue passing at 100% after changes. Existing conversationalist cases may need assertion threshold adjustments to accommodate the new scoring model.

### Claude's Discretion
- Exact wording of the prompt's teach-then-ask instruction
- Exact scoring weights for teaching vs questioning in the heuristic
- Whether to add example response patterns in the prompt (few-shot style)
- How many new golden cases to add (minimum 3)

### Deferred Ideas (OUT OF SCOPE)
- Few-shot example responses embedded in the prompt (may help but adds token cost)
- Model-specific prompt tuning (OpenAI vs Anthropic vs Google)
- Advanced RAG context integration (fetching related neurons proactively)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGENT-01 | The Socratic agent must actually teach — share knowledge, provide context, offer new perspectives, challenge with counterexamples — while maintaining its questioning stance. Not a question-parrot. | D-01/D-02 prompt rewrite; `scoreSocraticTone` teaching dimension (D-05/D-06) |
| AGENT-02 | The Socratic agent must build on the user's answers with new information before asking the next question — each response deepens understanding, not just redirects. | Structural "acknowledge + teach + question" rule from CONTEXT.md specifics; golden cases covering shallow-answer enrichment (D-07) |
</phase_requirements>

---

## Summary

Phase 16 is a pure prompt-and-eval change with no runtime route modifications. Three files are touched: `src/lib/ai/prompts.ts` (the `CHAT_SYSTEM_PROMPT` template literal), `prompt-eval/shared/neurograph-conversationalist-provider.mjs` (the `scoreSocraticTone` function), and `prompt-eval/conversationalist/cases.yaml` (the golden suite). Nothing about the HTTP layer, tool schemas, or database changes.

The core problem is structural: the current `CHAT_SYSTEM_PROMPT` instructs the agent to "NEVER give direct answers" and "always lead with a question" (lines 10-11). This produces question-parrot behavior — a loop of redirections with zero knowledge transfer. The fix is a "teach-then-ask" structure: every response must (a) acknowledge, (b) add new knowledge/context/analogy not yet stated by the user, then (c) close with one focused deepening question.

The heuristic scoring model in `scoreSocraticTone` currently penalizes phrases like "here is" and "here's how" at -0.4 each (lines 155-166). This directly contradicts the new goal: a response like "Here is the historical context: ... What does this suggest to you?" is ideal teach-then-ask but would lose 0.4 points. The scoring must be restructured to reward the combined "teaching content present AND question present" pattern, not penalize information density. The existing 10 golden cases use a `score >= 0.8` threshold; several may need adjustments because the new heuristic rewards a different signal distribution.

**Primary recommendation:** Rewrite the `## Goals` and `## Behavior` sections of `CHAT_SYSTEM_PROMPT` using the explicit three-step structure (acknowledge / enrich / question), update `scoreSocraticTone` to add a teaching-content dimension and soften the direct-answer penalty, then add at minimum 3 new golden cases that exercise the teach-then-ask pattern. The regex extractor in the provider (`/export const CHAT_SYSTEM_PROMPT = \`([\s\S]*?)\`;/`) will continue working without modification as long as the prompt stays a single backtick-delimited template literal ending with `` `; ``.

---

## Standard Stack

No new libraries are required. This phase is entirely within existing infrastructure.

### Core (existing, no changes needed)

| Component | Version | Purpose | Status |
|-----------|---------|---------|--------|
| `promptfoo` | ^0.121.2 (package.json) | Golden eval runner | Existing — `npm run eval:conversationalist` |
| `vitest` | ^4.0.18 (package.json) | Unit tests including `prompts.test.ts` | Existing — `npm test` |
| AI SDK (`ai`) | ^6.0.82 | LLM call in provider | Existing, no change |

**Installation:** None required.

---

## Architecture Patterns

### File Map for This Phase

```
src/lib/ai/
└── prompts.ts                          # CHAT_SYSTEM_PROMPT rewrite (lines 1-38)

prompt-eval/shared/
└── neurograph-conversationalist-provider.mjs
    ├── scoreSocraticTone()             # Heuristic scoring update (lines 129-169)
    └── heuristicConversationalist()    # Minor update — response template quality

prompt-eval/conversationalist/
├── cases.yaml                          # Add 3+ new golden cases
└── promptfooconfig.yaml               # Threshold adjustment if needed (currently 0.8)
```

### Pattern 1: Three-Step Teach-Then-Ask Structure

The new prompt `## Behavior` section must encode a three-part structural rule:

```
Step 1 — Acknowledge:  Briefly recognize what the user just said (1 sentence).
Step 2 — Enrich:       Share at least one piece of knowledge the user has NOT yet stated:
                       a context fact, a counterexample, an analogy, historical background,
                       or a related concept. This is mandatory, not optional.
Step 3 — Question:     Close with exactly ONE focused question that builds on step 2
                       to deepen understanding further.
```

The canonical exemplar (from CONTEXT.md specifics):

- BAD (question-parrot): "What do you think motivated Siddhartha to leave Gotama?"
- GOOD (teach-then-ask): "Interesting — Siddhartha's departure from Gotama echoes a central tension in Buddhist philosophy: can enlightenment be transmitted through doctrine, or must it be experienced directly? Hesse was deeply influenced by his own journey through Eastern philosophy in the 1920s. What do you think this suggests about the difference between intellectual understanding and lived wisdom?"

The difference is not length — it is knowledge density before the question.

### Pattern 2: Updated `scoreSocraticTone` Scoring Model

**Current model (lines 129-169):**
- Questions: +0.25 per `?`, capped at 0.5
- Coaching phrases: +0.15 per hit, capped at 0.3
- Direct answer patterns: -0.4 per hit

**Problem:** A well-formed teach-then-ask response containing "Here is the context: ... What do you think?" scores: +0.25 (one `?`) + 0.15 (one coaching phrase) - 0.4 ("here is") = 0.0. It fails the `>= 0.8` threshold despite being the ideal response.

**New model design (Claude's discretion on exact weights, but direction is locked by D-05/D-06):**

```javascript
function scoreSocraticTone(text) {
  const normalized = text.toLowerCase();
  let score = 0;

  // 1. Teaching content present (NEW dimension — D-05)
  //    Declarative sentences with subject-verb-object structure,
  //    named entities, "because", "for example", "in fact", "historically"
  const teachingSignals = [
    /\bfor example\b/i,
    /\bin fact\b/i,
    /\bhistorically\b/i,
    /\bthe key (insight|concept|idea|tension|principle)\b/i,
    /\bthis (is|was|means|reflects|echoes)\b/i,
    /\bknown as\b/i,
    /\boriginates? (from|in)\b/i,
    /\bconsider that\b/i,
    /\binterestingly\b/i,
    /\bone (way|reason|implication)\b/i,
  ];
  const teachingHits = teachingSignals.filter(p => p.test(text)).length;
  score += Math.min(teachingHits * 0.2, 0.4);   // max 0.4 contribution

  // 2. Question present (retained — questions are still required)
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(questionCount * 0.25, 0.5);  // max 0.5 contribution

  // 3. Coaching phrases (retained, slightly reduced max)
  const coachingPhrases = [ /* existing list */ ];
  const coachingHits = coachingPhrases.filter(p => normalized.includes(p)).length;
  score += Math.min(coachingHits * 0.15, 0.2);   // reduced cap: 0.3 → 0.2

  // 4. Answer-ONLY pattern penalty (D-06: soften — only penalize when NO question follows)
  //    Anti-pattern is answer with no deepening question, not information-sharing per se.
  const directAnswerPatterns = [ /* reduced list — remove "here is", "here's how" */ ];
  const directAnswerHits = directAnswerPatterns.filter(p => normalized.includes(p)).length;
  const hasQuestion = questionCount > 0;
  score -= hasQuestion ? directAnswerHits * 0.1 : directAnswerHits * 0.4;  // conditional penalty

  return Math.max(0, Math.min(1, score));
}
```

The exact implementation is Claude's discretion (D-05/D-06) — the above sketch shows direction, not final code.

**Key invariants:**
- A response with teaching content + one question MUST score >= 0.8
- A response with questions only (question-parrot) SHOULD score < 0.8 if it contains zero teaching signals
- A response with direct answers and NO follow-up question MUST score low

### Pattern 3: Prompt `## Goals` Section Rewrite

Current Goals block (line 4): "Guide users to arrive at understanding through questions and challenges, not direct answers."

Needs to become: add "through guided discovery enriched with context and new perspectives" to signal that teaching is required, not forbidden.

### Pattern 4: Prompt `## Behavior` Section Rewrite

Current Behavior block (lines 10-11):
```
- NEVER give direct answers to conceptual questions unprompted. Always lead with a question or challenge.
```

New behavior must encode the three-step rule. The absolute NEVER is replaced by a structural obligation. Critical: the new wording must make clear that enrichment is mandatory, not optional.

### Pattern 5: RAG Context Reference Directive (D-04)

The current prompt has no instruction to use RAG context. At runtime (route.ts line 187), the system prompt is constructed as:
```
CHAT_SYSTEM_PROMPT + ragContext + "\n\n## Existing Neuron Catalog\n" + ragCatalog
```

The `ragContext` block looks like:
```
## Relevant Knowledge Context
You have previously generated these neurons which are semantically relevant to the current conversation:
- Neuron [Title]: [definition] (Neighbors: [neighbors])
```

D-04 requires adding an instruction to reference this context. The directive should appear in the Behavior section, and it must refer to the `## Relevant Knowledge Context` and `## Existing Neuron Catalog` sections by their exact headings so the model knows what to look for.

### Anti-Patterns to Avoid

- **Removing the question requirement entirely:** The new model rewards teaching content AND questions — not teaching as a replacement for questions. Every response must still close with exactly one focused question.
- **Over-specifying teaching content in the prompt:** The prompt instructs the agent to share context/analogies/background — it does not enumerate all valid forms. Over-specification risks constraining the model unnecessarily.
- **Threshold over-tightening for existing cases:** The existing 10 cases were designed for the old scoring model. Some may score differently under the new model. Check each before assuming they pass at 0.8. The cases themselves (conversation scripts + expected_neurogenesis) remain valid — only assertion thresholds may need adjustment.
- **Merging the heuristicConversationalist fallback template:** The hardcoded offline response template at lines 216-220 also generates a question-only pattern. After the heuristic update, this template should be updated to include at least one teaching phrase so offline CI scores work consistently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prompt extraction in provider | New file reader / import chain | Existing regex pattern line 52: `/export const CHAT_SYSTEM_PROMPT = \`([\s\S]*?)\`;/` | Already battle-tested; the regex works as long as prompt stays a single template literal |
| Eval runner | Custom test harness | `npm run eval:conversationalist` / `npm run eval:all` | Promptfoo already wired, 31-case suite already structured |
| Teaching signal detection | NLP library | Simple regex patterns in `scoreSocraticTone` | Consistent with existing pattern; NLP library adds dependency for marginal gain |
| Golden case format | Different schema | Extend existing `cases.yaml` YAML format with same `messages` / `final_user_message` / `expected_neurogenesis` keys | Format is proven, provider already parses it |

**Key insight:** This phase is 100% content changes inside existing infrastructure. The eval architecture, provider pattern, YAML case format, and runtime injection chain are all unchanged.

---

## Common Pitfalls

### Pitfall 1: Regex Extraction Breaks After Prompt Rewrite

**What goes wrong:** The provider extracts `CHAT_SYSTEM_PROMPT` via `/export const CHAT_SYSTEM_PROMPT = \`([\s\S]*?)\`;/` (line 52). If the rewritten prompt contains a backtick character (e.g., in a markdown code example embedded in the prompt), the regex will terminate early at that backtick.

**Why it happens:** The regex uses a lazy `[\s\S]*?` bounded by a literal backtick-semicolon terminator (`` `; ``). Any raw backtick inside the template literal will trigger a false termination.

**How to avoid:** Never embed raw backtick characters in the `CHAT_SYSTEM_PROMPT` text. Escaped backticks (\`) inside the JS string are fine — the comment at line 41 already warns about this: "uses backtick+semicolon terminator to avoid early match on escaped backticks". Verify after rewrite by running `npm run eval:conversationalist` and confirming no "Unable to locate CHAT_SYSTEM_PROMPT" error.

**Warning signs:** Provider throws `Error: Unable to locate CHAT_SYSTEM_PROMPT in src/lib/ai/prompts.ts`. The test immediately fails with this message.

### Pitfall 2: Existing Cases Fail the New Threshold

**What goes wrong:** The 10 existing golden cases (Socratic Tone cases 1-4 in particular) were designed to score >= 0.8 under the old heuristic. Cases 1-4 are question-only patterns (cases 1, 2, 4 contain no teaching content). Under a new model that rewards teaching content, a response to these cases that is still question-only will score lower.

**Why it happens:** The heuristic scores the actual model response. If the model now generates teaching-enriched responses to cases 1-4, those cases will score higher (good). But if in heuristic/offline mode the model response template is still question-only, it may score lower.

**How to avoid:** After updating `scoreSocraticTone`, score the existing 10 heuristic responses manually against the new formula before running the full suite. Adjust the threshold in `promptfooconfig.yaml` downward (e.g., to >= 0.7) if existing cases produce lower scores in heuristic mode, OR update the `heuristicConversationalist` template to include a teaching phrase.

**Warning signs:** `eval:conversationalist` shows red on cases 1-4 (Socratic Tone) despite the prompt change being correct.

### Pitfall 3: Teaching Content Signals Are Too Narrow / Too Broad

**What goes wrong:** Teaching signal regexes either miss valid teaching patterns (too narrow — new score doesn't reward good responses) or fire on non-teaching content (too broad — question-parrot responses score high because they accidentally trigger a signal).

**Why it happens:** Natural language patterns overlap. "This is interesting" would incorrectly trigger `/\bthis (is|was|means)\b/i`. "What does this mean?" is a question but also triggers `/\bthis (is|was|means)\b/i`.

**How to avoid:** Validate each candidate teaching signal against both a known-good teach-then-ask response and a known-bad question-only response. A good teaching signal must fire for the former and not fire for the latter. Run the full signal list through the QA failure example in CONTEXT.md specifics (the Siddhartha example) as a positive control.

**Warning signs:** A question-only response scores >= 0.8 under the new heuristic (false positive). Or the Siddhartha ideal response example does not score >= 0.85 (false negative).

### Pitfall 4: New Golden Cases Accidentally Test Neurogenesis

**What goes wrong:** New teach-then-ask cases include final user messages that demonstrate Bloom Analyze+ level reasoning, causing `expected_neurogenesis: true` to be required. The test then creates a case that is testing two things at once.

**Why it happens:** Teaching behavior cases naturally involve multi-turn exchanges, and multi-turn exchanges can reach Analyze level.

**How to avoid:** Keep new golden cases focused on the teach-then-ask pattern with shallow user answers (Remember/Understand level final messages) to ensure `expected_neurogenesis: false`. If a case naturally reaches Analyze level, make it an explicit neurogenesis trigger case and document it as such in the case distribution comment.

### Pitfall 5: Prompt Wording Collapses Teaching into Answer-Giving

**What goes wrong:** The new behavior directive says something like "explain relevant concepts" and the model starts delivering complete lecture-style explanations without ever asking a question. Teaching collapses the Socratic stance entirely.

**Why it happens:** LLMs are trained to maximize helpfulness, which defaults to comprehensive explanation. Without the structural three-step constraint, "teach" gets interpreted as "explain everything."

**How to avoid:** The behavior directive must explicitly preserve the question requirement as mandatory. Phrase the enrichment requirement as bounded: "at least one piece of new information before your closing question" — not "explain the concept." The question is always the final element and is non-optional. D-03 is locked: teaching is enrichment on the path to deepening understanding, not a replacement for guided discovery.

---

## Code Examples

### Current `CHAT_SYSTEM_PROMPT` — Sections That Change

```typescript
// Source: src/lib/ai/prompts.ts lines 1-14 (current)

export const CHAT_SYSTEM_PROMPT = `You are NeuroGraph, a Socratic learning companion...

## Goals
- Guide users to arrive at understanding through questions and challenges, not direct answers.
  ^^^ needs: "through guided discovery enriched with context and new perspectives"
...

## Behavior
- NEVER give direct answers to conceptual questions unprompted. Always lead with a question
  ^^^ needs: replaced with three-step acknowledge/enrich/question structural rule
- Ask one focused follow-up question at a time.    ← KEEP
- Build on prior messages to deepen understanding. ← KEEP (strengthen: "bring new information")
- Be practical, precise, and encouraging.          ← KEEP
```

### Current `scoreSocraticTone` — Lines That Change

```javascript
// Source: prompt-eval/shared/neurograph-conversationalist-provider.mjs lines 129-169

// CHANGE: Add teaching signals dimension (D-05)
// CHANGE: Reduce/conditionalize direct answer penalty (D-06)
// KEEP:   Question marks positive signal
// KEEP:   Coaching phrases positive signal
// KEEP:   return Math.max(0, Math.min(1, score)) bounds

// Direct answer patterns to REMOVE from penalty list (D-06):
//   'here is how'    — legitimate in "Here is the context: ..."
//   "here's how"     — legitimate in same pattern
// Patterns to KEEP in penalty list:
//   'the answer is'           — only legitimate if followed by question
//   'to answer your question' — same
//   'the solution is'         — same
//   'the correct approach is' — same
```

### Regex Extractor — No Change Required

```javascript
// Source: prompt-eval/shared/neurograph-conversationalist-provider.mjs line 52
const match = source.match(/export const CHAT_SYSTEM_PROMPT = `([\s\S]*?)`;/);
// This works as-is. Do NOT change.
// Constraint: CHAT_SYSTEM_PROMPT must remain a single backtick-delimited template literal
//             ending with `; (backtick + semicolon)
```

### Runtime Injection — No Change Required

```typescript
// Source: src/app/api/chat/route.ts line 187
const systemPrompt = `${CHAT_SYSTEM_PROMPT}${ragContext}\n\n## Existing Neuron Catalog\n...`;
// RAG context appended after the prompt.
// D-04 is implemented in the PROMPT TEXT by adding a directive to reference
// "## Relevant Knowledge Context" and "## Existing Neuron Catalog" sections.
// The route itself does not change.
```

### New Golden Case Shape (teach-then-ask pattern)

```yaml
# To add to prompt-eval/conversationalist/cases.yaml

- description: "Teach-then-ask on shallow answer — historical domain"
  vars:
    messages:
      - role: user
        content: "I'm exploring Buddhist philosophy."
      - role: assistant
        content: "Great area. What draws you to it — the metaphysics, the ethical framework, or the meditative practice?"
      - role: user
        content: "I guess all of it. I read Siddhartha by Hesse."
    final_user_message: "I think Siddhartha left Gotama because he wanted to find his own path."
    expected_neurogenesis: false
  # Correct response MUST contain enrichment (e.g., Buddhist doctrine on transmitted vs experienced
  # enlightenment) AND close with one deepening question. Score >= 0.8 under new heuristic.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Liberal neurogenesis ("fire at least once per conversation") | Bloom-gated neurogenesis (Analyze+ only) | Phase 13 | Already in production — preserved by Phase 16 |
| Pure question-steering ("NEVER give direct answers") | Teach-then-ask (enrich + question) | This phase | The behavioral change this phase delivers |
| Penalty for all "here is" patterns | Conditional penalty (only when no question follows) | This phase | Unblocks valid teach-then-ask phrasing |

**Deprecated/outdated:**
- "NEVER give direct answers unprompted" — replaced by three-step structural rule; the anti-pattern becomes "answer with no follow-up question", not "share any information."
- `scoreSocraticTone` direct-answer penalty list entries `'here is how'` and `"here's how"` — these legitimately appear in enrichment sentences and should be removed or conditionalized.

---

## Open Questions

1. **Should the Socratic tone threshold in `promptfooconfig.yaml` be adjusted?**
   - What we know: Current threshold is `score >= 0.8`. The existing 10 cases pass under the old heuristic.
   - What's unclear: Whether offline/heuristic responses to the existing 4 Socratic Tone cases will score >= 0.8 under the new formula, since the heuristic template is currently question-only and might not earn the new teaching-content bonus.
   - Recommendation: After implementing the new `scoreSocraticTone`, dry-run each existing case score manually before adjusting the threshold. Update the `heuristicConversationalist` template to include a teaching phrase, which will simultaneously raise heuristic scores and demonstrate the new behavior pattern.

2. **How many teaching signal regexes produce a reliable >= 0.8 score?**
   - What we know: With a max teaching contribution of ~0.4, a response needs teaching hits + question marks to break 0.8. A single teaching hit (0.2) + two question marks (0.5) = 0.7 — just under. Two teaching hits (0.4) + one question mark (0.25) = 0.65.
   - What's unclear: The exact weights must be calibrated so a canonical teach-then-ask response scores >= 0.85 and a question-only response scores around 0.5-0.6.
   - Recommendation: Use the Siddhartha ideal response from CONTEXT.md specifics as the positive calibration target and manually score it against the proposed formula before committing.

3. **Does the `heuristicConversationalist` fallback template need updating?**
   - What we know: The current offline template (lines 216-220) generates three question-only sentences. Under a new scoring model that rewards teaching, this template will score low.
   - What's unclear: Whether online eval (with live model) masks this — CI/offline behavior might diverge.
   - Recommendation: Update the template to include one teaching-signal phrase (e.g., starting with "Interestingly,...") before the questions. This keeps online/offline behavior aligned.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this phase touches only TypeScript source, a `.mjs` eval provider, and YAML case files within the existing project).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 (unit) + promptfoo ^0.121.2 (eval) |
| Config file | `vitest.config.ts` (unit), `prompt-eval/conversationalist/promptfooconfig.yaml` (eval) |
| Quick run command | `npm test -- src/lib/ai/__tests__/prompts.test.ts` |
| Full suite command | `npm test && npm run eval:all` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGENT-01 | Prompt contains teach-then-ask structure keywords | unit | `npm test -- src/lib/ai/__tests__/prompts.test.ts` | Yes — needs new assertions |
| AGENT-01 | `scoreSocraticTone` rewards teaching content | unit | `npm test -- src/lib/ai/__tests__/prompts.test.ts` (or new file) | Partial — prompts.test.ts exists, needs new test |
| AGENT-02 | Agent enriches answer before questioning (golden suite) | eval (promptfoo) | `npm run eval:conversationalist` | Yes — cases.yaml exists |
| AGENT-01+02 | Full 31-case suite still passes at 100% | eval (promptfoo) | `npm run eval:all` | Yes |

### Sampling Rate

- **Per task commit:** `npm test -- src/lib/ai/__tests__/prompts.test.ts`
- **Per wave merge:** `npm test && npm run eval:conversationalist`
- **Phase gate:** `npm test && npm run eval:all` — full 31-case suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/ai/__tests__/prompts.test.ts` — existing file needs new assertions for: (1) prompt contains teach-then-ask structural keywords, (2) `scoreSocraticTone` scores a canonical teach-then-ask response >= 0.85. Note: `scoreSocraticTone` is in a `.mjs` eval file, not importable from TypeScript directly — the unit test strategy is either: (a) test the prompt string only in prompts.test.ts, or (b) create a companion test file for the heuristic logic extracted into a shared module.
- [ ] Consider whether `scoreSocraticTone` logic should be extracted to a separately-testable module — currently it lives in `neurograph-conversationalist-provider.mjs` and is not covered by the vitest suite. If it stays in `.mjs`, promptfoo eval is the only automated coverage. If the heuristic is critical enough to test in isolation, extracting it to a shared `.mjs` file with a corresponding vitest test is worth the refactor.

---

## Sources

### Primary (HIGH confidence)

All findings derived from direct code reading of the canonical files listed in CONTEXT.md. No external sources required — this is a self-contained code change with no new library dependencies.

- `src/lib/ai/prompts.ts` — full content read, lines 1-38 analyzed
- `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — full content read, `scoreSocraticTone` lines 129-169 analyzed in detail
- `prompt-eval/conversationalist/cases.yaml` — all 10 cases read and categorized
- `prompt-eval/conversationalist/promptfooconfig.yaml` — assertion config and threshold documented
- `src/app/api/chat/route.ts` lines 185-187 — runtime prompt injection pattern documented
- `src/lib/ai/rag.ts` lines 49-63 — RAG context format documented
- `.planning/phases/16-socratic-agent-redesign/16-CONTEXT.md` — all decisions, canonical refs, specifics
- `.planning/phases/13-socratic-chat-engine/13-CONTEXT.md` — Phase 13 origin decisions, D-01 (anti-answer), D-03 (Bloom gate)
- `package.json` — eval scripts and tool versions verified
- `vitest.config.ts` — test framework configuration verified
- `src/lib/ai/__tests__/prompts.test.ts` — existing unit test assertions audited

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, existing infrastructure fully read
- Architecture patterns: HIGH — derived directly from source code, not from training assumptions
- Pitfalls: HIGH — derived from direct code analysis of regex patterns, scoring formula, and existing case structure
- Heuristic scoring design: MEDIUM — exact weights are Claude's discretion; the direction is HIGH confidence but calibration requires manual dry-run

**Research date:** 2026-03-24
**Valid until:** 2026-05-01 (stable infrastructure; only stale if promptfoo eval format changes)
