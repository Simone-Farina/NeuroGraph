## 2024-05-23 - Accessibility Gaps in Interactive Components
**Learning:** High prevalence of icon-only buttons (e.g., in ChatInput, ChatPanel) missing `aria-label` or accessible names, relying solely on `title`.
**Action:** Always check for `aria-label` on icon buttons and ensure focus visible states are clear, as these are frequently missed in this codebase.
