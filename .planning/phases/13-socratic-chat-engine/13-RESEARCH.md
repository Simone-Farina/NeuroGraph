# Phase 13: Socratic Chat Engine - Research

**Researched:** 2026-03-24
**Domain:** Prompt engineering, multi-turn promptfoo evaluation, Bloom's Taxonomy heuristics
**Confidence:** HIGH

## Summary

Phase 13 delivers three tightly scoped changes: a rewritten `CHAT_SYSTEM_PROMPT` that enforces Socratic coaching discipline, a working `neurograph-conversationalist-provider.mjs` that replaces the Phase 10 echo placeholder, and a hand-curated golden evaluation suite of 8-12 multi-turn conversation cases. The existing bouncer and architect providers are direct code templates — the conversationalist provider will follow the same extract-from-prompts.ts, resolve-model, heuristic-fallback structure, adapted for chat-style inference rather than JSON generation.

The most important technical discovery is how promptfoo handles multi-turn conversations. The correct approach for this project is a JSON prompt file containing a message array with `{{messages | dump}}` template expansion, combined with YAML test cases where each case defines a `messages` variable holding the scripted conversation turns. CSV is inappropriate for message arrays (the newlines and quoting make it unworkable). All prior conversation turns — including prior assistant responses — are expressed as static fixtures inside the YAML `messages` variable; the provider appends the final user message and elicits one final assistant response for assertion.

The current `CHAT_SYSTEM_PROMPT` has an explicitly liberal Neurogenesis Policy ("DO NOT wait for a perfect insight", "call the tool at least once per conversation") that contradicts the project's core "demonstrated conceptual depth" requirement. Tightening it means replacing those five trigger conditions and the "at least once" mandate with a single Bloom-gated rule: propose Neurogenesis only when the user's message demonstrates Analyze, Evaluate, or Create level reasoning.

**Primary recommendation:** Use YAML test cases with `messages` variable arrays; JSON prompt file with template expansion; heuristic provider that scores Socratic tone by question-mark presence, coaching-indicator keywords, and absence of direct-answer patterns; hard pass/fail for Neurogenesis trigger/no-trigger correctness.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Prompt Contract Modification**
- D-01: Modify `CHAT_SYSTEM_PROMPT` to add explicit anti-answer-giving directives: the AI must never give direct answers unprompted, must always lead with a question or challenge, and must guide the user to arrive at understanding themselves.
- D-02: Tighten the Neurogenesis Policy from "fire liberally" to "fire only on genuine deep insights." The current liberal policy ("DO NOT wait for a perfect insight", "call the tool at least once per conversation") violates the core spec that node creation must "follow demonstrated conceptual depth" and be "selective to avoid noise." Replace with Bloom's Taxonomy depth gating.
- D-03: Use Bloom's Taxonomy to evaluate Deep Insight readiness. The AI should propose Neurogenesis only when the user demonstrates cognitive engagement at the Analyze level or higher (Analyze, Evaluate, Create). Remember/Understand level exchanges are too shallow for node creation.

**Multi-Turn Eval Strategy**
- D-04: The conversationalist eval suite must use multi-turn conversation format (message arrays), not single-shot prompts, since SOCRATES-02 requires testing across multiple simulated chat turns.
- D-05: Use pre-scripted conversation scripts (hand-written user messages with simulated context). Assertions check the final assistant reply. This matches the golden casuistry philosophy — hand-curated, deterministic, not synthetic multi-step loops.

**Custom Provider Architecture**
- D-06: Create `neurograph-conversationalist-provider.mjs` in `prompt-eval/shared/` following the established bouncer/architect pattern: extract prompt from `prompts.ts`, resolve model, heuristic fallback for offline/CI runs.

**Assertion Strategy**
- D-07: Socratic tone evaluation uses scored assertions with threshold > 0.8, not hard pass/fail. Coaching tone is inherently subjective.
- D-08: Dual-mode assertion: custom heuristic (checks for question marks in response, absence of direct "The answer is..." patterns) as offline fallback, with LLM-as-judge rubric for live mode. Matches the established dual-mode pattern.
- D-09: Neurogenesis proposal assertions are hard pass/fail: the model must call the suggest_neurogenesis tool in the correct golden case (deep insight present) and must NOT call it in shallow exchanges.

### Claude's Discretion
- Exact heuristic scoring algorithm for offline Socratic tone assessment
- Exact number of golden cases (target 8-12 covering: coaching tone, answer-giving refusal, multi-turn consistency, Bloom-gated neurogenesis trigger, shallow exchange rejection)
- Whether to use YAML or CSV for multi-turn cases (CSV may struggle with message arrays)
- Exact Bloom level keywords/patterns for the heuristic fallback

### Deferred Ideas (OUT OF SCOPE)
- Wiring the tightened Socratic prompt into production (already the active prompt — changes are immediate)
- Full LLM-as-judge scoring infrastructure (Phase 13 uses heuristic fallback; real rubric is a future enhancement)
- Multi-step generative eval loops (scripted conversations only for now)
- Adjusting the `suggest_neurogenesis` tool schema to carry Bloom level metadata
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SOCRATES-01 | The Socratic Chat prompt must explicitly forbid the agent from just "giving the answer" and mandate a guiding, questioning tone. | D-01 dictates exact prompt changes; current `CHAT_SYSTEM_PROMPT` located at `prompts.ts` lines 1-37; rewrite plan documented in Architecture Patterns section. |
| SOCRATES-02 | `promptfoo` evaluations must exist testing the Socratic engine against multiple simulated user chat turns to ensure it maintains the coaching persona. | Multi-turn YAML message-array syntax confirmed from official promptfoo docs; `neurograph-conversationalist-provider.mjs` pattern documented; `eval:conversationalist` script already wired in `package.json`. |
| SOCRATES-03 | The Socratic Engine must recognize when the user has reached a "Deep Insight" and successfully propose Neurogenesis. | Bloom's Taxonomy threshold (Analyze+) documented; `suggestNeurogenesisTool` schema in `tools.ts` confirmed; hard pass/fail Neurogenesis assertion pattern documented. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| promptfoo | 0.121.2 (installed) | Eval harness runner | Already the project standard; `eval:conversationalist` script is pre-wired |
| ai (Vercel AI SDK) | installed | generateText + tool call simulation in provider | Same SDK used by all existing providers |
| @ai-sdk/anthropic / openai / google | installed | Model resolution in provider | Identical pattern to bouncer/architect providers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs + node:path | built-in | Prompt extraction from prompts.ts | Same as bouncer/architect — extract with regex |
| zod | installed | (Optional) Response validation in live mode | Only if the provider needs schema-gated output |

**No new npm dependencies required.** This phase is entirely file and configuration work using the existing installed stack.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML test cases with `messages` variable | CSV | CSV cannot represent multi-line message arrays without breaking quoting — YAML is the correct choice (confirmed by D-05) |
| Static scripted conversation fixtures | `storeOutputAs` + dynamic multi-turn | Dynamic approach is non-deterministic and harder to reason about; scripted fixtures match the golden casuistry philosophy |
| Heuristic Socratic tone scoring | LLM-as-judge rubric | LLM-as-judge deferred to future phase per CONTEXT.md |

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
prompt-eval/
├── conversationalist/
│   ├── promptfooconfig.yaml       # Replace Phase 10 echo placeholder
│   ├── cases.yaml                 # Multi-turn golden cases (YAML, not CSV)
│   └── prompt.json                # Message array prompt file
└── shared/
    └── neurograph-conversationalist-provider.mjs   # New provider (D-06)

src/lib/ai/
└── prompts.ts                     # Modify CHAT_SYSTEM_PROMPT (SOCRATES-01, D-01/02/03)
```

### Pattern 1: Multi-Turn Conversation Test in promptfoo YAML

**What:** Each test case defines a `messages` variable containing the full prior conversation as role/content objects. The prompt file expands them into the model's input. The provider returns the final assistant reply, which assertions then check.

**When to use:** Whenever you need to test behavior that depends on conversational context (maintaining persona across turns, detecting accumulated insight).

**Example (cases.yaml):**
```yaml
# Source: https://www.promptfoo.dev/docs/configuration/chat/
- description: "Coaching tone maintained after 3 turns"
  vars:
    messages:
      - role: user
        content: "What is gradient descent?"
      - role: assistant
        content: "What do you think happens when an algorithm needs to find the lowest point of a curve?"
      - role: user
        content: "It keeps adjusting until it finds the minimum?"
      - role: assistant
        content: "Exactly — and what would you need to measure to know which direction to adjust?"
      - role: user
        content: "The slope of the curve at that point?"
    final_user_message: "So the gradient is the slope?"
  assert:
    - type: javascript
      value: |
        // Scored Socratic tone — threshold > 0.8
        const score = scoresSocraticTone(output);
        return { pass: score > 0.8, score, reason: 'coaching tone' };
```

**Example (prompt.json):**
```json
[
  {
    "role": "system",
    "content": "{{system_prompt}}"
  },
  {% for msg in messages %}
  {
    "role": "{{ msg.role }}",
    "content": {{ msg.content | dump }}
  },
  {% endfor %}
  {
    "role": "user",
    "content": {{ final_user_message | dump }}
  }
]
```

**Key insight:** The `messages` variable carries the prior conversation context as a static fixture. The final user utterance is a separate variable so assertions target the AI's response to that specific prompt.

### Pattern 2: Dual-Mode Provider (heuristic fallback)

The existing bouncer/architect providers establish the exact pattern to follow:

1. `extractChatPrompt()` — regex extract `CHAT_SYSTEM_PROMPT` from `prompts.ts`
2. `resolveModel()` — check `PROMPTFOO_CONVERSATIONALIST_MODEL` env var; fall back to `openai:gpt-4o-mini`; return null if no key or `AI_PROVIDER=mock`
3. If `model === null` → call `heuristicConversationalist(vars)`, write JSON to stdout, exit
4. If model available → call `generateText({ system, messages, tools })`, handle tool call detection, write result to stdout

**Critical difference from bouncer/architect:** The conversationalist provider needs to pass the message array as `messages:` (not just `prompt:`), and needs to include the `suggest_neurogenesis` tool schema in the `generateText` call so that live-mode runs can test actual tool invocation.

**Heuristic output for Socratic tone (offline mode):**
```javascript
// Source: established pattern from neurograph-bouncer-provider.mjs
function heuristicConversationalist(vars) {
  const finalMessage = vars.final_user_message || '';
  const messages = vars.messages || [];
  const allAssistantReplies = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content || '');

  return {
    socratic_score: scoresSocraticTone(allAssistantReplies.join(' ')),
    neurogenesis_triggered: false,  // heuristic never triggers tool calls
    response: buildHeuristicCoachingReply(finalMessage),
  };
}
```

### Pattern 3: Bloom's Taxonomy Keyword Heuristic

**What:** For offline CI mode, detect whether a user message demonstrates Analyze/Evaluate/Create level thinking using keyword patterns. Used to validate that the live-mode prompt tightening correctly gates Neurogenesis.

**Bloom level keyword patterns (HIGH confidence — standard educational taxonomy):**

| Level | Keywords/Patterns |
|-------|-------------------|
| Remember | "what is", "define", "list", "name", "recall", "identify" |
| Understand | "explain", "describe", "summarize", "paraphrase", "what does X mean" |
| Apply | "how do I", "use X to", "implement", "calculate", "solve" |
| Analyze | "why does", "compare", "contrast", "break down", "what's the difference", "which is better", "because" + reasoning, "I think X because" |
| Evaluate | "should I", "is X better than Y", "judge", "argue", "justify", "the reason is", "I believe X because" |
| Create | "I designed", "my solution", "I realized that", "I built", "how about", "what if we" + novel proposal |

**Neurogenesis gate rule:** User message text OR the cumulative conversation context contains ≥ 1 Analyze/Evaluate/Create indicator. Remember/Understand exchanges fail the gate.

**Heuristic scoring algorithm for Socratic tone (D-07, D-08):**
```javascript
function scoreSocraticTone(text) {
  const normalized = text.toLowerCase();
  let score = 0;

  // Positive signals (question marks, coaching verbs)
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(questionCount * 0.25, 0.5);   // max 0.5 from questions

  const coachingPhrases = [
    'what do you think', 'how would you', 'can you explain',
    'what happens when', 'why might', 'what if', 'consider',
    'think about', 'reflect on', 'explore', 'what would',
  ];
  const coachingHits = coachingPhrases.filter(p => normalized.includes(p)).length;
  score += Math.min(coachingHits * 0.15, 0.3);  // max 0.3 from coaching phrases

  // Negative signals (direct answer patterns)
  const directAnswerPatterns = [
    'the answer is', 'the solution is', 'to answer your question',
    'here is how', 'here\'s how', 'the way to do this is',
    'you should do', 'the correct approach is',
  ];
  const directAnswerHits = directAnswerPatterns.filter(p => normalized.includes(p)).length;
  score -= directAnswerHits * 0.4;

  return Math.max(0, Math.min(1, score));
}
```

### Pattern 4: CHAT_SYSTEM_PROMPT Rewrite Structure

The current prompt has a "Neurogenesis Policy - IMPORTANT" section that is explicitly wrong per D-02. The replacement structure:

**Current (to remove):**
```
You MUST call it proactively.
CALL the tool when ANY of these apply: [5 liberal triggers]
DO NOT wait for a perfect insight.
In every conversation of 3+ messages, you should call the tool at least once.
```

**Replacement (D-01, D-02, D-03):**
```
## Behavior
- NEVER give direct answers to conceptual questions unprompted. Always lead with a question or
  challenge that guides the user to discover the answer themselves.
- Ask one focused follow-up question at a time.
- Build on prior messages to deepen understanding.
- Be practical, precise, and encouraging.

## Neurogenesis Policy
You have a `suggest_neurogenesis` tool. Call it ONLY when the user demonstrates genuine
analytical depth — Bloom's Analyze, Evaluate, or Create level reasoning.

Signs of Analyze/Evaluate/Create level engagement:
- User compares or contrasts concepts ("X is better than Y because...")
- User explains WHY something works, not just WHAT it is
- User proposes a novel connection, design, or solution
- User critiques or judges a trade-off
- User articulates a personal insight ("I realized that...")

Do NOT call the tool when:
- User is only asking what something is (Remember/Understand)
- User is asking how to do something they haven't yet tried (Apply before practice)
- The conversation has fewer than 2 substantive exchanges

When you call the tool:
- title: concise concept label (textbook heading style)
- definition: max 280 chars, self-contained
- core_insight: the specific realization the user articulated
- bloom_level: the level the user demonstrated (Analyze/Evaluate/Create for genuine insights)
- Do NOT suggest related_neurons (graph topology is handled by the Epistemological Inquisitor)
- Continue your response naturally after calling the tool
```

### Anti-Patterns to Avoid

- **Putting multi-turn cases in CSV:** CSV cannot represent YAML message arrays cleanly. Use `cases.yaml` for the conversationalist suite.
- **Making the system prompt a variable in test vars:** The system prompt should come from `prompts.ts` via the provider (same as bouncer/architect). It is not a per-test variable.
- **Using `_conversation` with `storeOutputAs` for golden cases:** That creates a generative loop; scripted static fixtures are required (D-05).
- **Testing Neurogenesis trigger in live mode only:** The heuristic provider cannot simulate actual tool calls. Live-mode Neurogenesis assertions should use `AI_PROVIDER` with real model keys. Offline mode asserts Socratic tone only.
- **Single-shot prompts for persona consistency:** A single exchange cannot test "maintains coaching persona across multiple turns" — each case needs at least 3 prior turns to be meaningful.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-turn message formatting | Custom serializer | promptfoo message array YAML vars + JSON prompt template | Official promptfoo multi-turn pattern handles Nunjucks expansion |
| Bloom level classification | ML classifier | Keyword heuristic patterns | Sufficient accuracy for offline CI; consistent with project's "heuristic fallback" philosophy |
| Socratic quality scoring | Separate LLM service | In-promptfooconfig JavaScript assertion | Already established pattern (bouncer fragment assertions); deferred to future phase for real LLM-judge |
| Prompt extraction | New module in src/ | Regex extract from prompts.ts (same as bouncer/architect) | Single source of truth; both runtime and eval read the same string |

**Key insight:** Every "don't hand-roll" item already has a working pattern in the codebase from Phase 12. The conversationalist provider is a targeted adaptation, not a new invention.

---

## Common Pitfalls

### Pitfall 1: CSV for Message Arrays
**What goes wrong:** Writing a `cases.csv` file and trying to embed JSON message arrays in a column. The newlines and quote escaping break CSV parsing. promptfoo silently misparses the case.
**Why it happens:** The bouncer suite uses CSV successfully because its variables are flat strings. Message arrays are structured data.
**How to avoid:** Use `cases.yaml` exclusively for the conversationalist suite.
**Warning signs:** Provider receives `messages` as a string `"[object Object]"` instead of an array.

### Pitfall 2: Asserting Neurogenesis in Offline (Heuristic) Mode
**What goes wrong:** Heuristic provider never calls `suggest_neurogenesis` (it has no model). Assertions that check for tool call detection always fail in CI.
**Why it happens:** The provider outputs JSON text, not actual model tool calls. The `suggest_neurogenesis` detection only works in live mode.
**How to avoid:** Neurogenesis trigger/no-trigger assertions (D-09) must be clearly annotated as "live mode only." Offline CI assertions check Socratic tone score only. Either skip Neurogenesis assertions when `AI_PROVIDER=mock`, or provide a separate heuristic output field `neurogenesis_would_trigger: boolean` based on Bloom level detection that the assertion checks instead.
**Warning signs:** All Neurogenesis cases fail in CI while passing locally with a real API key.

### Pitfall 3: Prompt Regex Mismatch After CHAT_SYSTEM_PROMPT Rewrite
**What goes wrong:** The provider uses `source.match(/export const CHAT_SYSTEM_PROMPT = \`([\s\S]*?)\`;/)` — if the prompt rewrite introduces a backtick inside the template literal (e.g., `\`suggest_neurogenesis\``), it terminates the regex early.
**Why it happens:** The bouncer prompt uses backslash-escaped backticks (`\``) inside the template literal; the existing providers' regex handles this correctly in the current prompts. New prompt content must maintain the same escaping.
**How to avoid:** Use `\'` quoting or avoid backticks inside the prompt string. Verify the regex match after rewriting the prompt by running `node -e "const s = require('fs').readFileSync('src/lib/ai/prompts.ts','utf8'); console.log(s.match(/CHAT_SYSTEM_PROMPT = \`([\s\S]*?)\`/)?.[1]?.slice(0,100))"`.
**Warning signs:** Provider throws "Unable to locate CHAT_SYSTEM_PROMPT" even though the file exists.

### Pitfall 4: System Prompt Not Reaching the Model in Multi-Turn Mode
**What goes wrong:** The `generateText` call in live mode passes `system:` but the prompt.json also contains a `{"role":"system",...}` message — some providers treat these as duplicate system messages.
**Why it happens:** The conversationalist prompt is structured differently from bouncer/architect. For chat, the system message should come either from the `system:` param OR from the messages array, not both.
**How to avoid:** In the provider's live-mode `generateText` call, pass `system: systemPrompt` and do NOT include a `{"role":"system"}` in the messages array. In the prompt.json, do not include a system role entry — the provider injects it directly.
**Warning signs:** First assistant response ignores the Socratic coaching persona entirely.

### Pitfall 5: Bloom-Level Keyword Overlap (Analyze vs Understand)
**What goes wrong:** A user asking "Can you explain WHY gradient descent converges?" uses the word "why" but is really requesting an explanation (Understand level), not performing analysis themselves.
**Why it happens:** "why" appears in both Understand-level queries (asking why) and Analyze-level statements (explaining why).
**How to avoid:** Bloom heuristic must check whether the user is *asking a question* (Understand) vs *providing a reasoned statement* (Analyze). Heuristic rule: if the message ends with "?" and contains "why/how/what", it is Understand-level regardless of other signals. If it contains a causal clause ("X because Y", "X since Y", "I think X because") without trailing question mark, it is Analyze-level.
**Warning signs:** Shallow FAQ exchanges falsely trigger Neurogenesis in heuristic eval.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Multi-Turn Case in YAML (promptfoo)
```yaml
# Source: https://www.promptfoo.dev/docs/configuration/chat/
- description: "Bloom Analyze level triggers Neurogenesis"
  vars:
    messages:
      - role: user
        content: "What is recursion?"
      - role: assistant
        content: "What do you think a function might need to do if it wanted to solve a problem by breaking it into smaller versions of itself?"
      - role: user
        content: "Call itself?"
      - role: assistant
        content: "Exactly. And what stops it from calling itself forever?"
      - role: user
        content: "A base case — it's basically like induction in math, the base case is the stopping condition and each recursive call reduces the problem size."
    final_user_message: "So recursion is just computational induction?"
  assert:
    - type: javascript
      value: |
        // Hard pass/fail: neurogenesis must trigger on this Analyze-level insight
        const result = JSON.parse(output);
        return result.neurogenesis_triggered === true;
```

### Prompt File with Message Array Expansion
```json
[
  {%- for msg in messages %}
  {
    "role": "{{ msg.role }}",
    "content": {{ msg.content | dump }}
  },
  {%- endfor %}
  {
    "role": "user",
    "content": {{ final_user_message | dump }}
  }
]
```

### Provider Extract Pattern (from existing codebase)
```javascript
// Source: prompt-eval/shared/neurograph-bouncer-provider.mjs (lines 11-21)
function extractChatPrompt() {
  const promptsPath = path.resolve(process.cwd(), 'src/lib/ai/prompts.ts');
  const source = fs.readFileSync(promptsPath, 'utf8');
  const match = source.match(/export const CHAT_SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!match) {
    throw new Error('Unable to locate CHAT_SYSTEM_PROMPT in src/lib/ai/prompts.ts');
  }
  return match[1];
}
```

### Live-Mode generateText with Tools for Conversationalist
```javascript
// Adapted from bouncer/architect pattern; conversationalist needs messages array + tools
const { text, toolCalls } = await generateText({
  model,
  system: systemPrompt,
  messages: buildMessages(vars),   // map roles from YAML vars
  tools: {
    suggest_neurogenesis: {
      description: 'Suggest generating a durable neuron from the conversation.',
      parameters: neurogenesisSchema,  // same Zod schema from tools.ts
    },
  },
  temperature: 0,
  maxOutputTokens: 600,
});

const neurogenesisTriggered = toolCalls.some(tc => tc.toolName === 'suggest_neurogenesis');
process.stdout.write(JSON.stringify({
  response: text,
  neurogenesis_triggered: neurogenesisTriggered,
  socratic_score: scoreSocraticTone(text),
}));
```

### Bloom Level Detection Heuristic
```javascript
const BLOOM_ANALYZE_SIGNALS = [
  /\bbecause\b.{5,}/i,          // "X because Y" — causal reasoning
  /\bsince\b.{5,}/i,            // "X since Y"
  /\bcompared? to\b/i,          // comparison
  /\bbetter than\b/i,           // evaluation
  /\bi think.{5,}because\b/i,   // opinionated reasoning
  /\bi realized\b/i,            // personal insight
  /\bthe (key|main|real) (difference|reason|point)\b/i,
  /\bthis (means|implies|shows)\b/i,
];

const BLOOM_QUESTION_EXEMPTION = /\?[\s]*$/;  // ends with question mark = not Analyze

function detectsAnalyzeLevel(text) {
  if (BLOOM_QUESTION_EXEMPTION.test(text.trim())) return false;
  return BLOOM_ANALYZE_SIGNALS.some(pattern => pattern.test(text));
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Liberal neurogenesis ("fire at least once per conversation") | Bloom-gated neurogenesis (Analyze+ only) | Phase 13 | Noise reduction; graph quality improvement |
| Echo placeholder in conversationalist | Real multi-turn golden suite | Phase 13 | SOCRATES-02 satisfied |
| Single-shot prompts for chat eval | Message array fixtures | Phase 13 | Tests multi-turn persona consistency |

**Deprecated/outdated (in current codebase):**
- `CHAT_SYSTEM_PROMPT` lines 16-28: The five liberal trigger conditions and "at least once" mandate — these are the target of D-02 and will be replaced.
- `prompt-eval/conversationalist/promptfooconfig.yaml`: The echo placeholder — to be replaced entirely.

---

## Open Questions

1. **Neurogenesis assertion in offline mode**
   - What we know: Heuristic provider cannot call `suggest_neurogenesis` tool; D-09 requires hard pass/fail Neurogenesis assertions.
   - What's unclear: Should Neurogenesis cases be skipped in CI (guarded by env check) or should the heuristic output a synthetic `neurogenesis_triggered` boolean based on Bloom detection?
   - Recommendation: Have the heuristic provider output `{ response, socratic_score, neurogenesis_triggered: detectsAnalyzeLevel(finalMessage) }`. Assertion checks `result.neurogenesis_triggered`. In live mode, `neurogenesis_triggered` reflects actual tool call detection. This makes offline/live behavior consistent at the assertion level.

2. **Number of golden cases**
   - What we know: D-05 targets 8-12 cases; bouncer settled at 13 cases.
   - What's unclear: Exact split between tone/Neurogenesis/refusal cases.
   - Recommendation: 10 cases: 4 Socratic tone (coaching multi-turn, answer-giving refusal, persona maintained after 3 turns, tone under pressure), 4 Neurogenesis (Analyze trigger, Evaluate trigger, Remember no-trigger, Understand no-trigger), 2 edge cases (empty prior context, topic pivot mid-conversation).

3. **Tool schema import in provider**
   - What we know: `neurogenesisSchema` is exported from `src/lib/ai/tools.ts` as a Zod schema, but the provider is `.mjs` and cannot import TypeScript directly.
   - What's unclear: Should the provider duplicate the schema parameters inline, or call `tools.ts` via a build step?
   - Recommendation: Duplicate the JSON Schema inline (no Zod) in the provider, matching the existing pattern — bouncer and architect providers do not import from `src/` at all.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| promptfoo | eval:conversationalist | Yes | 0.121.2 | — |
| node (ESM .mjs) | provider execution | Yes | runtime | — |
| ANTHROPIC_API_KEY / OPENAI_API_KEY | Live-mode eval | Not checked (env-specific) | — | Heuristic fallback (offline mode) |

**Missing dependencies with no fallback:** None — offline heuristic mode covers CI without API keys.

**Missing dependencies with fallback:** All live-mode model providers fall back to heuristic mode automatically when keys are absent (same pattern as bouncer/architect providers).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | promptfoo 0.121.2 |
| Config file | `prompt-eval/conversationalist/promptfooconfig.yaml` (to be replaced) |
| Quick run command | `npm run eval:conversationalist` |
| Full suite command | `npm run eval:all` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SOCRATES-01 | AI never gives direct answers; always coaches | promptfoo scored assertion (> 0.8 Socratic score) | `npm run eval:conversationalist` | No — Wave 0 |
| SOCRATES-02 | Coaching persona maintained across multiple turns | promptfoo multi-turn message array cases | `npm run eval:conversationalist` | No — Wave 0 |
| SOCRATES-03 | Neurogenesis triggered on Analyze+ insight, not on shallow exchanges | promptfoo hard pass/fail assertion on `neurogenesis_triggered` | `npm run eval:conversationalist` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run eval:conversationalist`
- **Per wave merge:** `npm run eval:all`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `prompt-eval/conversationalist/promptfooconfig.yaml` — replace echo placeholder with real config
- [ ] `prompt-eval/conversationalist/cases.yaml` — golden multi-turn cases (does not exist yet)
- [ ] `prompt-eval/conversationalist/prompt.json` — message array prompt template (does not exist yet)
- [ ] `prompt-eval/shared/neurograph-conversationalist-provider.mjs` — new provider (does not exist yet)

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` file exists in the working directory. No project-specific directives to carry forward. Standard project patterns apply as documented in STATE.md and observed in existing eval infrastructure:

- promptfoo must remain a local dev dependency (not global install) — `10-local-install-only`
- Eval configs live in `prompt-eval/` with per-agent directories — `10-prompt-eval-root`
- Hybrid eval model: structural hard pass/fail + behavioral scored thresholds — `10-hybrid-eval-model`
- Hand-curated golden casuistry (8-12 cases) — `10-golden-casuistry`
- Runtime prompts in `src/lib/ai/`, eval configs in `prompt-eval/` — separation is inviolable

---

## Sources

### Primary (HIGH confidence)
- promptfoo v0.121.2 (installed) — version confirmed via `node_modules/.bin/promptfoo --version`
- https://www.promptfoo.dev/docs/configuration/chat/ — multi-turn conversation syntax, `messages` variable arrays, `storeOutputAs` pattern, Nunjucks template expansion
- `prompt-eval/shared/neurograph-bouncer-provider.mjs` — provider pattern (extract, resolve, heuristic, live) — direct code read
- `prompt-eval/shared/neurograph-architect-provider.mjs` — provider pattern variant — direct code read
- `prompt-eval/bouncer/promptfooconfig.yaml` — assertion pattern reference — direct code read
- `src/lib/ai/prompts.ts` — current `CHAT_SYSTEM_PROMPT` (lines 1-37) — direct code read
- `src/lib/ai/tools.ts` — `suggestNeurogenesisTool` and `neurogenesisSchema` — direct code read
- `src/app/api/chat/route.ts` — how system prompt + tools are consumed at runtime — direct code read
- `.planning/phases/13-socratic-chat-engine/13-CONTEXT.md` — all locked decisions — direct read

### Secondary (MEDIUM confidence)
- https://www.promptfoo.dev/docs/configuration/prompts/ — prompt file formats, variable substitution behavior
- Bloom's Taxonomy keyword patterns — well-established educational framework; keyword lists are conventional, not novel

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed versions confirmed; no new dependencies
- Architecture: HIGH — multi-turn YAML pattern confirmed from official docs; provider pattern confirmed from existing code; prompt rewrite content derived from locked decisions
- Pitfalls: HIGH — Pitfall 1 (CSV limitation) confirmed from official docs; Pitfalls 2-5 derived from close reading of existing provider code
- Bloom's keyword heuristic: MEDIUM — keyword patterns are conventional and well-established, but exact thresholds are Claude's Discretion per CONTEXT.md

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (promptfoo stable; Bloom taxonomy timeless; prompt content decisions locked)
