# Phase 26: Chat Quality & Bloom Unification - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix chat streaming auto-scroll jank, calibrate AI response length for sharper and varied turns, and verify that the single authoritative Bloom classification source (Phase 24 LLM evaluator) is the only one in the codebase. Clean up stale worktree artifacts from the never-merged Phase 21 heuristic.

</domain>

<decisions>
## Implementation Decisions

### Streaming Auto-Scroll (CHAT-01)
- **D-01:** Replace current `useEffect([messages])` + `scrollTop = scrollHeight` with a sentinel element approach — invisible div at bottom of message list, `scrollIntoView()` called per streaming chunk
- **D-02:** Stick-to-bottom behavior: auto-scroll keeps viewport pinned during streaming. If user scrolls up manually, auto-scroll pauses until they scroll back down
- **D-03:** Show a subtle "jump to latest" button when user scrolls up and new messages arrive. Fades when at bottom
- **D-04:** Remove the `scroll-smooth` CSS class from the scroll container — it causes queued animations that stutter during rapid streaming. The sentinel's `scrollIntoView` handles smoothness itself
- **D-05:** Add 15-20ms debounce on scroll-to-bottom calls during streaming to prevent stutter from rapid chunk updates. Instant scroll (no debounce) on conversation load/switch
- **D-06:** On conversation switch (loading persisted messages), always scroll to bottom — most recent message first

### AI Response Length Calibration (CHAT-02)
- **D-07:** Prompt rewrite only — no `maxTokens` cap or code changes to the chat route. Adjust `CHAT_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`
- **D-08:** Default density is balanced: 1-2 paragraphs per turn. 3 paragraphs only when the topic genuinely demands elaboration. Replace "One to three paragraphs per turn" with explicit shorter-default instruction
- **D-09:** Strengthen opening variety: add explicit anti-pattern instruction — "Never start two consecutive replies the same way. Vary between building on the user's point, introducing a new angle, or asking directly."
- **D-10:** Loosen the mandatory question constraint: "Usually close with a question, but occasionally a brief observation or reframe is enough." Replace the rigid "Always close with exactly one focused follow-up question" rule
- **D-11:** Add a promptfoo eval assertion checking paragraph count. FAIL if response always has 3+ paragraphs across all test cases. Ensures the prompt change actually works

### Bloom Unification (BLOOM-01)
- **D-12:** BLOOM-01 is already satisfied — the Phase 21 client-side heuristic (`classifyBloomLevel.ts`, `BloomDepthMeter.tsx`) was never merged to develop/main. The sole Bloom classification source is the Phase 24 LLM evaluator at `POST /api/bloom-evaluate`
- **D-13:** Verify: grep the codebase to confirm no heuristic references (`classifyBloomLevel`, `BLOOM_ANALYZE_SIGNALS`, `BloomDepthMeter`) exist in main source. Document the verification
- **D-14:** Clean up stale worktree branches that contain the never-merged Phase 21 heuristic code (e.g., `worktree-agent-ac5685ca`)
- **D-15:** The existing inline Bloom status badge in `GenerateNeuronButton` (showing level + confidence %) is sufficient Bloom UI — no separate `BloomDepthMeter` component needed

### Claude's Discretion
- Exact debounce timing within the 15-20ms range
- Exact wording of the strengthened prompt instructions (D-08 through D-10)
- Scroll behavior during crystallize state
- Jump-to-bottom button visual design (position, opacity, animation)
- Which specific eval cases to add or modify for the length assertion
- How to structure the worktree cleanup (manual `git worktree remove` or scripted)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chat streaming & scroll
- `src/components/chat/ChatPanel.tsx` — Current scroll implementation (lines 89, 268-272, 391), useChat integration, bloom eval trigger
- `src/components/chat/MessageList.tsx` — Message rendering component, sentinel element target
- `src/components/chat/GenerateNeuronButton.tsx` — Bloom status badge, Zustand bloomLevel consumer

### AI prompt & eval
- `src/lib/ai/prompts.ts` — CHAT_SYSTEM_PROMPT (lines 1-33), target for length calibration rewrite
- `prompt-eval/conversationalist/cases.yaml` — Existing eval cases, add length assertions here
- `prompt-eval/conversationalist/promptfooconfig.yaml` — Eval config

### Bloom evaluator (verification targets)
- `src/app/api/bloom-evaluate/route.ts` — Phase 24 LLM evaluator (sole classification source)
- `src/stores/graphStore.ts` — Zustand bloomLevel/bloomConfidence state (lines 34-40)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useChat` from `@ai-sdk/react` with `status` field — can gate scroll behavior on `'streaming'` vs `'ready'`
- `useGraphStore` Zustand store — already has `bloomLevel`, `bloomConfidence`, `isBloomPending` state
- `GenerateNeuronButton` — already has inline Bloom status badge with color-coded level display
- promptfoo eval harness with JavaScript assertion blocks — add paragraph count check

### Established Patterns
- `useCallback` + `useRef` for debounced operations (see `triggerBloomEval` pattern in ChatPanel.tsx:104-136)
- Vercel AI SDK `useChat` with `DefaultChatTransport`, `onFinish`, `status` fields
- Tailwind utility classes for transitions and opacity
- promptfoo golden cases in YAML with JS assertion blocks

### Integration Points
- `ChatPanel.tsx` lines 268-272 — replace scroll useEffect with sentinel approach
- `ChatPanel.tsx` line 391 — scroll container div, remove `scroll-smooth` class
- `src/lib/ai/prompts.ts` lines 1-33 — CHAT_SYSTEM_PROMPT rewrite
- `prompt-eval/conversationalist/` — eval suite length assertions

</code_context>

<specifics>
## Specific Ideas

- Research confirms: sentinel + scrollIntoView with 15-20ms debounce is the standard pattern for AI chat streaming (Vercel's own AI Elements uses this approach)
- Research confirms: paragraph-count prompt constraints are the right granularity for LLM response length control (ICLR 2026 paper validates paragraph-level targets)
- The conversational tone should feel like "a brilliant, curious friend" (carried from Phase 23) — shorter responses reinforce this vs. the current lecture-length defaults
- Jump-to-bottom button should match the Danish Computation aesthetic — subtle, no gamification

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-chat-quality-bloom-unification*
*Context gathered: 2026-04-03*
