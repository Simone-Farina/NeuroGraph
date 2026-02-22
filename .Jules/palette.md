## 2024-05-23 - Accessibility Gaps in Interactive Components
**Learning:** High prevalence of icon-only buttons (e.g., in ChatInput, ChatPanel) missing `aria-label` or accessible names, relying solely on `title`.
**Action:** Always check for `aria-label` on icon buttons and ensure focus visible states are clear, as these are frequently missed in this codebase.

## 2024-05-24 - Loading States and Focus Visibility
**Learning:** Icon-only buttons (like Send) often lack immediate feedback for the "sending" state before streaming begins. Using the disabled state to show a loading spinner provides crucial feedback. Also, default focus rings are often invisible on dark backgrounds.
**Action:** Implement `focus-visible` styles explicitly (e.g., `ring-2 ring-offset-2`) and use conditional rendering for loading spinners within existing button structures.
