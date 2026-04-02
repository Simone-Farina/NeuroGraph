---
phase: 26
slug: chat-quality-bloom-unification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | promptfoo (conversationalist eval suite) |
| **Config file** | `prompt-eval/conversationalist/promptfooconfig.yaml` |
| **Quick run command** | `npm run eval:conversationalist` |
| **Full suite command** | `npm run eval:all` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `grep -r "classifyBloomLevel\|BLOOM_ANALYZE_SIGNALS\|BloomDepthMeter" src/` (expects empty output)
- **After every plan wave:** Run `npm run eval:conversationalist`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | CHAT-01 | manual visual + code review | — (scroll behavior) | N/A | ⬜ pending |
| 26-01-02 | 01 | 1 | CHAT-01 | code grep | `grep "scroll-smooth" src/components/chat/ChatPanel.tsx` (expects empty) | ✅ | ⬜ pending |
| 26-02-01 | 02 | 1 | CHAT-02 | promptfoo assertion | `npm run eval:conversationalist` | ❌ W0 | ⬜ pending |
| 26-02-02 | 02 | 1 | CHAT-02 | code review | — (prompt text review) | N/A | ⬜ pending |
| 26-03-01 | 03 | 1 | BLOOM-01 | shell grep | `grep -r "classifyBloomLevel\|BLOOM_ANALYZE_SIGNALS\|BloomDepthMeter" src/` (expects empty) | ✅ | ⬜ pending |
| 26-03-02 | 03 | 1 | BLOOM-01 | shell command | `git worktree list` (expects no Phase 21 worktree) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New promptfoo case in `prompt-eval/conversationalist/cases.yaml` — paragraph-count assertion for CHAT-02 (write before implementing prompt change to capture baseline)

*Existing infrastructure covers CHAT-01 (manual visual) and BLOOM-01 (shell grep).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Smooth auto-scroll during streaming | CHAT-01 | Browser scroll behavior cannot be automated in promptfoo | 1. Open chat, send message 2. Watch scroll during AI streaming — no stutters or jumps 3. Scroll up during streaming — auto-scroll pauses 4. Scroll back down — auto-scroll resumes |
| Jump-to-latest button | CHAT-01 | Visual UI element | 1. Scroll up during streaming 2. Verify "Jump to latest" button appears 3. Click it — scrolls to bottom instantly 4. Verify button disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
