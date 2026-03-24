# Feature Landscape: Production-Grade AI Tutoring Agents

**Domain:** Enterprise AI tutoring — Socratic coaching, Bloom cognition detection, DAG prerequisite reasoning
**Researched:** 2026-03-24
**Milestone scope:** v2.0 MVP Core Stability — making existing features production-grade (no new features)

---

## Research Context: What Already Exists in NeuroGraph

Before mapping table stakes vs. differentiators, the existing code was audited directly.

**`src/lib/ai/prompts.ts` — CHAT_SYSTEM_PROMPT (current state):**
- Three-step structure: Acknowledge → Enrich → Question — correct
- Neurogenesis gating: calls `suggest_neurogenesis` tool at Analyze/Evaluate/Create — correct
- Bloom-level behavioral signals documented in the prompt — present but improvable
- Anti-answer-giving directive present but not strongly specified for edge cases

**`src/lib/ai/inferPrerequisites.ts` — DAG Agent (current state):**
- Uses `generateObject` with a Zod schema
- Pedagogically grounded system prompt with prerequisite vs. related distinction
- No timeout or retry handling — bare `await generateObject(...)` call
- Confidence threshold filter at 0.6 before synapse creation

**`src/lib/ai/architect.ts` — Architect/DAG Planner (current state):**
- Server-side cycle detection via DFS (correct and thorough)
- Three synapse types: PREREQUISITE, RELATED, BUILDS_ON with clear semantics
- No fallback if LLM returns invalid JSON — schema parse failure surfaces as uncaught exception

**`src/lib/ai/tools.ts` — Neurogenesis tool:**
- bloom_level enum correctly restricted to Analyze/Evaluate/Create only

**Gap summary:** The prompts are structurally sound but lack: (a) calibrated difficulty and mistake-handling rules from Khanmigo's proven playbook, (b) Bloom-level detection as a real-time visual signal in the UI, (c) structured output resilience across all three LLM call sites, (d) DAG prompt hardening for common failure modes that trip LLMs on prerequisite inference.

---

## 1. Socratic Chat Agent — Table Stakes vs. Differentiators

### Table Stakes

Features the Socratic chat agent MUST have to work correctly. Missing = broken tutoring loop.

| Feature | Why Expected | Complexity | Existing State |
|---------|--------------|------------|----------------|
| Never-give-answers enforcement | Core Socratic contract; users will exploit loopholes without explicit rules | Low (prompt) | Partially there — improvable |
| One-question-at-a-time discipline | Multiple questions paralyze learners; single question per turn is proven practice | Low (prompt) | Present but not strictly enforced |
| Acknowledge → Enrich → Question structure | Prevents lectures; forces agent to add new value before asking | Low (prompt) | Present and working |
| Calibrated question difficulty | Khanmigo's core: break down to the right level, assume difficulty unknown | Medium (prompt) | Missing — prompt doesn't calibrate to confusion signals |
| Anti-loop variation | LLMs default to the same question type across turns; explicit variation instruction needed | Low (prompt) | Missing |
| Mistake-handling without correction | "Ask how they got there, not what the answer is" — the corrector pattern breaks Socratic flow | Low (prompt) | Missing explicit handling |

### Differentiators

Features that make NeuroGraph's agent distinct from Khanmigo and Duolingo.

| Feature | Value Proposition | Complexity | Existing State |
|---------|-------------------|------------|----------------|
| Knowledge-graph-aware enrichment | "You already have a neuron on X — how does that apply here?" creates genuinely personalized dialogue | Low (RAG context already injected) | Present in context injection, not explicitly instructed in prompt |
| Bloom-level-aware question escalation | Agent detects user is at "Understand" and asks an "Analyze" question to escalate depth | Medium (requires inline signal) | Absent |
| Neurogenesis priming | Agent signals approaching threshold: "That's an insight worth preserving — want to extract it?" | Low (prompt) | Absent |
| Cross-domain connection surfacing | Agent bridges user's concept to an adjacent field (physics ↔ economics, biology ↔ software architecture) | Low (prompt instruction) | Present in Enrich step — needs explicit reinforcement |
| 14-day TTL urgency framing | Agent can surface the conversation expiry as gentle productive pressure | Low (date injection + prompt) | Absent |
| Meta-question technique | Occasionally go one level up: "What assumption are you making when you say X?" | Low (prompt) | Absent |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Summarize this conversation | Creates passive-ingestion shortcut; defeats extraction | "What's the most important thing you discovered? That's your summary." |
| Just give me the answer | Destroys cognitive depth signal before neurogenesis gate | Lean into Socratic refusal: "What part feels blocked? Let's go there." |
| Rate my understanding | LLM self-assessments of mastery are unreliable | Use neurogenesis suggestion as the implicit mastery signal |
| Multi-question turns | More than one question overwhelms; reduces engagement quality | Strict one-question rule even when agent has multiple things to ask |

### Proven Prompt Patterns from Khanmigo

Source: publicly disclosed Khanmigo Lite system prompt (GitHub, multiple corroborating references) — HIGH confidence.

**Pattern 1: Calibrated Difficulty with Unknown Baseline**

> "Always tune your question to the knowledge of the student, breaking down the problem into simpler parts until it's at just the right level for them, but always assume they're having difficulties and you don't know where yet."

Implication for NeuroGraph: Add to CHAT_SYSTEM_PROMPT — "Assume the user is stuck even if their message seems confident. Your question should probe the assumption beneath what they said."

**Pattern 2: Mistake Handling Without Correction**

> "If they make a mistake, do not tell them the answer, just ask them how they figured out that step and help them realize their mistake on their own."

Implication for NeuroGraph: Add an explicit mistake-response rule: "If the user states something factually incorrect, do NOT correct it directly. Ask: 'How did you arrive at that?' and guide from there."

**Pattern 3: Socratic Funnel (meta-questioning)**

From independent research (Towards AI, corroborated by multiple practitioner sources): "Question → questions about the question → questions about the assumptions → questions about the evidence." The stance is "don't answer me yet, ask me what I mean."

Implication for NeuroGraph: CHAT_SYSTEM_PROMPT currently stops at question. Add periodic meta-question instruction: "Occasionally ask about the user's reasoning process itself, not just the content: 'What made you think that?' or 'What assumption is underneath that claim?'"

**Pattern 4: Goldilocks Edge**

> "Keep students at their Goldilocks learning edge — pushing students at any level to clear up misconceptions and engage in active learning."

Implication for NeuroGraph: Add: "Monitor the user's engagement trajectory. If their answers are getting shorter or more vague, simplify your question. If they're elaborating confidently and analytically, escalate the cognitive demand."

**Duolingo's Conversation Memory Pattern (MEDIUM confidence — Duolingo engineering blog):**

After each conversation, Duolingo's AI (Lily) analyzes the transcript to extract facts about the user and injects them into subsequent sessions as a "List of Facts." This creates continuity across sessions.

Implication for NeuroGraph: The existing RAG context injection (relevant neurons + existing catalog) already performs this function. The gap is that the prompt doesn't explicitly instruct the agent to reference this context in the Enrich step by name.

---

## 2. Bloom's Taxonomy Cognitive Load Detection

### Table Stakes

| Feature | Why Expected | Complexity | Existing State |
|---------|--------------|------------|----------------|
| Bloom level assignment at neurogenesis | Required for the Analyze+ gating mechanism | Low (tool schema) | Present — tool enforces Analyze/Evaluate/Create only |
| Behavioral signals for Bloom detection in chat prompt | Agent needs specific language, not just category names | Low (prompt) | Present but under-specified |
| Remember/Understand vs. Analyze+ binary gate | Core neurogenesis gating logic | Low | Present and working |

### Differentiators

| Feature | Value Proposition | Complexity | Existing State |
|---------|-------------------|------------|----------------|
| Real-time Bloom depth indicator in UI | Learner sees current cognitive engagement level during the conversation | Medium (client-side signal + UI component) | Absent |
| Bloom escalation prompting | Agent actively attempts to pull user from Understand to Analyze through question design | Low (prompt only) | Absent |

### How to Detect Bloom Level — Research Findings

**Approach A: Heuristic keyword signals — LOW accuracy (25–75%)**

Academic research (EDM 2022, automatic Bloom classification paper) built keyword dictionaries mapped to each level. Performance: ~75% at Remember level, 25–59% at higher levels. Adequate only as a pre-filter or UI approximation, not as a gate.

Keyword anchors (use these for the real-time UI indicator):
- Remember: "what is", "define", "list", "name", "who", "when"
- Understand: "explain", "describe", "summarize", "give an example", "what does"
- Apply: "how would you", "use", "demonstrate", "solve", "calculate"
- Analyze: "why", "compare", "contrast", "what causes", "break down", "distinguish", "because"
- Evaluate: "judge", "argue", "which is better", "critique", "justify", "is it valid", "I think"
- Create: "design", "propose", "combine", "I realized", "what if we", "novel approach", "I wonder"

**Approach B: LLM inline classification — MEDIUM-HIGH accuracy, adds latency**

From the MDPI paper on Socratic chatbot dialogue classification (2024): fine-tuned GPT-4o-mini achieved micro-F1 of 0.814 for Bloom-level classification on real chatbot utterances. Calibrated classical models (SentenceTransformer embeddings) showed stronger balance across levels.

Practical conclusion: A separate LLM classification call per user message would add 300–800ms latency. This is too expensive for real-time chat. Reserve LLM-based Bloom classification for the neurogenesis gate (already done).

**Recommended production approach for NeuroGraph (combining both):**
1. Client-side keyword scan of the last 2–3 user messages drives the UI indicator. Approximate, fast, zero latency.
2. The `suggest_neurogenesis` tool call result (when it fires) gives a ground-truth Bloom level. Use this to update the UI indicator state with high confidence.
3. Do not add a parallel LLM Bloom classification call. The existing gating is sufficient for the neurogenesis contract.

### Visual Cognitive Load Indicator — Design Pattern

Research on edtech UI did not find a standardized real-time Bloom depth widget in any production platform. Existing platforms use:
- Duolingo: XP + streak (effort proxy, not cognitive depth)
- Khan Academy: exercise mastery levels (mastery proxy, not real-time depth)
- Academic research dashboards: post-hoc Bloom annotation in analytics views

NeuroGraph's opportunity is novel — there is no established pattern to copy. The design must avoid performance anxiety and gaming behavior.

**Recommended pattern (original design based on research):**

A subtle 6-step depth indicator in the chat interface — six small dots or segments, one per Bloom level, with the current level softly highlighted. Color progression communicates elevation, not evaluation:
- grey: no activity yet
- cool blue: Remember
- teal: Understand
- green: Apply
- amber: Analyze (neurogenesis threshold begins here)
- orange: Evaluate
- gold: Create

The indicator pulses briefly when it advances. It does NOT show a label by default (tooltip on hover only). It advances via keyword scan; it advances with high confidence when the neurogenesis tool fires.

Critical constraint: The indicator is informational, not evaluative. It communicates "you are thinking deeply" not "you scored X." Never show it as a score or grade.

---

## 3. DAG Prerequisite Reasoning — Production Hardening

### Table Stakes

| Feature | Why Expected | Complexity | Existing State |
|---------|--------------|------------|----------------|
| Strict prerequisite vs. related discrimination | The entire graph degrades if the LLM conflates them | Medium (prompt) | Present but can be sharpened |
| Cycle detection with refusal | LLMs introduce cycles; must be caught before DB write | Low | Present — DFS cycle detection in architect.ts |
| Confidence threshold filtering | Low-confidence suggestions degrade graph quality | Low | Present — 0.6 threshold in inferPrerequisites |
| Self-referential synapse prevention | LLM occasionally generates A→A edges | Low | Present — Zod schema validates sourceTitle != targetTitle |
| Duplicate synapse deduplication | LLM may propose the same edge twice | Low | Present — Zod schema dedup key |

### Differentiators (Production-Grade Improvements)

| Feature | Value Proposition | Complexity | Existing State |
|---------|-------------------|------------|----------------|
| The "comprehension test" formulation | More reliable than semantic judgment; explicit test to apply per candidate | Low (prompt) | Absent |
| Boundary example set in the system prompt | LLMs generalize better with 4 worked examples covering all three relation types | Low (prompt) | Only 1 example currently (linear algebra → neural networks) |
| Pedagogical irreversibility constraint | "Prerequisite is directional AND irreversible — if removing source makes target incomprehensible, it's a prerequisite" | Low (prompt) | Absent |
| Domain-aware confidence calibration | Technical domains have strict prerequisites; humanistic domains have contextual ones | Low (prompt) | Absent |
| Topological self-check instruction | Ask the LLM to verify its own output with a mental topological sort before finalizing | Low (prompt) | Absent |

### Proven Prompt Patterns for DAG Reasoning

**Pattern 1: The Comprehension Test (most important addition)**

Replace the current subjective prerequisite definition with this testable formulation:

> "A prerequisite has ONE test: if a learner has NEVER encountered concept A, can they still meaningfully understand concept B? If no — A is a PREREQUISITE. If yes — A is merely RELATED. Apply this test to every candidate before deciding."

This is more reliable than semantic importance judgments because it has a clear binary outcome.

**Pattern 2: Boundary Examples for All Three Relation Types**

The current prompt has one example. Add a complete example set covering all three types and common failure modes:

```
PREREQUISITE (correct):
  "TCP/IP" → "HTTP" (HTTP cannot function without TCP/IP — learner blocked without it)
  "Derivatives" → "Integrals" (integration requires understanding what differentiation is)

RELATED not PREREQUISITE (common wrong call):
  "Python" is NOT a prerequisite for "JavaScript" — they are parallel alternatives
  "Renaissance Art" is NOT a prerequisite for "Baroque Art" — historical context, not logical dependency

BUILDS_ON (correct):
  "Advanced Calculus" builds on "Calculus" — extends the foundation, does not gate entry-level use
  "Design Patterns" builds on "Object-Oriented Programming" — enriches but OOP works without patterns

RELATED (lateral bridge, no direction):
  "TCP/IP" is related to "UDP" — both transport protocols, neither depends on the other
```

**Pattern 3: Topological Self-Check**

Add as a final instruction in the inferPrerequisites system prompt:

> "Before returning your response, mentally trace a topological sort: can every concept in your response be learned by traversing PREREQUISITE edges from source to target in sequence? If any cycle exists, refuse the entire response rather than silently removing edges."

This mirrors research from DAG-Math (ICLR 2025) showing that structuring LLM reasoning as explicit topological traversal reduces graph errors significantly.

**Pattern 4: Domain Calibration**

> "Technical domains (mathematics, computer science, physics, programming) tend to have strict, verifiable prerequisites where comprehension is genuinely blocked without the foundation. Humanistic domains (philosophy, literature, history, management) tend to have contextual or optional dependencies. Calibrate prerequisite confidence accordingly: prefer RELATED over PREREQUISITE in humanistic domains unless the dependency is unambiguous."

---

## 4. Structured Output Reliability — generateObject Production Patterns

### Table Stakes

| Feature | Why Expected | Complexity | Existing State |
|---------|--------------|------------|----------------|
| Zod schema validation on all output | LLMs produce malformed JSON regularly; schema is the only reliable gate | Low | Present on all three call sites |
| NoObjectGeneratedError handling | SDK v6 throws this when schema parsing fails; must be caught at each call site | Low | Absent — bare calls will surface as 500s |
| maxRetries configuration | Default is 2; explicit config signals production intent | Low | Absent — SDK default only |
| Graceful degradation on failure | User must not see a 500 on AI failures | Medium | Absent |

### Differentiators

| Feature | Value Proposition | Complexity | Existing State |
|---------|-------------------|------------|----------------|
| Timeout via AbortSignal | Prevents Next.js route handlers from hanging past Vercel function limits | Low | Absent |
| Request signal propagation | Pass `request.signal` so client navigation cancels in-flight LLM calls | Low | Absent |
| Retry with schema clarification | On first failure, retry once with: "Your previous response could not be parsed. Return ONLY valid JSON." | Medium | Absent |
| Partial result salvage | NoObjectGeneratedError exposes `.text` — attempt JSON.parse on partial output before giving up | Medium | Absent |

### Recommended Resilience Wrapper

Based on Vercel AI SDK v6 official documentation (HIGH confidence):

Three active call sites that need this wrapper:
1. `src/lib/ai/inferPrerequisites.ts` — `generateObject` call, no error handling
2. Any future API route calling the Architect (currently eval-only)
3. Future Bouncer migration from raw JSON to `generateObject`

The `AbortSignal.timeout()` approach is documented in AI SDK Core Settings. For Next.js App Router routes: `AbortSignal.any([request.signal, AbortSignal.timeout(25_000)])` cancels on either client disconnect or 25-second wall-clock timeout.

The `NoObjectGeneratedError` in AI SDK v6 exposes `.text` (raw LLM output) and `.response` (metadata). On validation failure, attempt `JSON.parse(error.text)` as a salvage step before returning the fallback.

### Timeout Guidance for Vercel + Next.js

- Vercel hobby tier: 10s function limit — set AbortSignal to 8s
- Vercel pro tier: 60s function limit — set AbortSignal to 25s (LLM calls should complete in under 10s; 25s gives headroom for retries)
- Always set timeout to ~80% of the route limit to allow the handler to return a clean error response

---

## 5. Feature Dependencies

```
Bloom real-time UI indicator
  → needs: client-side keyword classifier (new, ~50 lines)
  → OR uses: last neurogenesis tool call result (already in React state)
  → zero new API calls required

Bloom escalation prompting
  → needs: CHAT_SYSTEM_PROMPT update only
  → no new API calls

Structured output retry wrapper
  → needs: one shared helper function
  → update 3 call sites (inferPrerequisites, future architect route, future bouncer)

DAG prompt hardening
  → needs: ARCHITECT_SYSTEM_PROMPT update + inferPrerequisites system prompt update
  → depends on: existing Zod schema and cycle detection (already present, no changes)

Chat prompt hardening (Khanmigo patterns)
  → needs: CHAT_SYSTEM_PROMPT update only
  → testable immediately with existing promptfoo golden suite (10 conversationalist cases)
  → promptfoo suite must be extended with new cases for mistake-handling and calibration

Neurogenesis priming language
  → needs: CHAT_SYSTEM_PROMPT update only
```

---

## 6. MVP Recommendation for v2.0 Core Stability

**Prioritize — high value, low complexity, directly in scope:**

1. **CHAT_SYSTEM_PROMPT hardening** — Add: calibrated difficulty, mistake handling without correction, anti-loop variation, meta-question technique, Khanmigo Goldilocks pattern, neurogenesis priming. Pure prompt change, testable with existing promptfoo suite.

2. **Structured output resilience** — Wrap all `generateObject` calls with timeout + NoObjectGeneratedError handler + maxRetries. Prevents silent production 500s. Only 3 call sites.

3. **DAG prompt hardening** — Add: comprehension test definition, 4 worked boundary examples, topological self-check, domain calibration. Pure prompt changes to ARCHITECT_SYSTEM_PROMPT and inferPrerequisites system prompt.

4. **Bloom real-time UI indicator** — Lightweight client-side keyword scan + last neurogenesis tool-call bloom_level as signal source → 6-step depth indicator. Zero additional API calls. Subtle visual design to avoid gamification.

**Defer — valuable but outside v2.0 scope:**

- Per-session Bloom trajectory log: requires new data model and schema migration
- Multi-model fallback (ai-fallback npm package): adds dependency, unclear need without production failure data
- Fine-tuned Bloom classifier: requires curated training data pipeline
- Duolingo-style persistent "List of Facts" across sessions: significant architecture change, current RAG context covers the core need

---

## Sources

- [Khan Academy's 7-Step Approach to Prompt Engineering for Khanmigo](https://blog.khanacademy.org/khan-academys-7-step-approach-to-prompt-engineering-for-khanmigo/) — MEDIUM confidence (official blog, not primary source document)
- [The system prompt for Khanmigo Lite — GitHub Gist](https://gist.github.com/25yeht/c940f47e8658912fc185595c8903d1ec) — HIGH confidence (publicly disclosed system prompt, corroborated by multiple GitHub repositories)
- [Learning Analytics with Scalable Bloom's Taxonomy Labeling of Socratic Chatbot Dialogues — MDPI Computers](https://www.mdpi.com/2073-431X/14/12/555) — HIGH confidence (peer-reviewed, 2024)
- [LLMs meet Bloom's Taxonomy: A Cognitive View on LLM Evaluations — ACL 2025](https://aclanthology.org/2025.coling-main.350/) — HIGH confidence (peer-reviewed)
- [Mechanistic Interpretability of Cognitive Complexity in LLMs via Linear Probing — arXiv 2025](https://arxiv.org/html/2602.17229) — HIGH confidence (preprint, corroborates classification approach)
- [DAG-Math: Graph-Guided Mathematical Reasoning in LLMs — ICLR 2025 Workshop](https://arxiv.org/html/2510.19842v1) — HIGH confidence (peer-reviewed)
- [Graph of Verification: Structured Verification of LLM Reasoning with DAGs — arXiv 2025](https://arxiv.org/html/2506.12509v3) — HIGH confidence (preprint)
- [In-Context Learning with Topological Information for LLM KG Completion](https://arxiv.org/html/2412.08742) — HIGH confidence (peer-reviewed)
- [LLM-Powered Construction of Course Knowledge-Competency Graphs — ACM ETAI 2025](https://dl.acm.org/doi/10.1145/3766557.3766569) — HIGH confidence (peer-reviewed)
- [AI SDK Core: generateObject — Official Vercel AI Docs](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) — HIGH confidence (official)
- [AI SDK Errors: AI_NoObjectGeneratedError — Official Vercel AI Docs](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-object-generated-error) — HIGH confidence (official)
- [AI SDK 6 Release Notes — Vercel Blog](https://vercel.com/blog/ai-sdk-6) — HIGH confidence (official)
- [AI SDK Core: Settings (timeout, abortSignal) — Official Vercel AI Docs](https://ai-sdk.dev/docs/ai-sdk-core/settings) — HIGH confidence (official)
- [How Duolingo uses AI to Create Speaking Practice (Lily AI tutor)](https://blog.duolingo.com/ai-and-video-call/) — MEDIUM confidence (vendor engineering blog)
- [Add timeout option to generateObject — Vercel AI GitHub Issue #3169](https://github.com/vercel/ai/issues/3169) — MEDIUM confidence (community issue, confirmed pattern by official docs)
- [The Socratic Prompt — Towards AI](https://pub.towardsai.net/the-socratic-prompt-how-to-make-a-language-model-stop-guessing-and-start-thinking-07279858abad) — LOW confidence (single practitioner article)
- [AI tutoring exploratory RCT in UK classrooms — arXiv 2024](https://arxiv.org/html/2512.23633v1) — HIGH confidence (academic study)

---
*Feature research for: v2.0 MVP Core Stability — Enterprise AI Tutoring Agents (NeuroGraph)*
*Researched: 2026-03-24*
