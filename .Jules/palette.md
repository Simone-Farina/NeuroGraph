## 2024-05-23 - Accessibility Gaps in Interactive Components
**Learning:** High prevalence of icon-only buttons (e.g., in ChatInput, ChatPanel) missing `aria-label` or accessible names, relying solely on `title`.
**Action:** Always check for `aria-label` on icon buttons and ensure focus visible states are clear, as these are frequently missed in this codebase.

## 2024-05-24 - Implicit Loading States in Chat Inputs
**Learning:** Chat inputs often have an implicit "submitting" state between user click and streaming start (disabled but not streaming). This gap can feel unresponsive without feedback.
**Action:** Implement an explicit loading spinner during this specific state (disabled && !isStreaming) to bridge the feedback gap.
