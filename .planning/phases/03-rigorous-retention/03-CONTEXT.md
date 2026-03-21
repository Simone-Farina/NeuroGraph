# Phase 3: Rigorous Retention (Context & Decisions)

This document captures the architectural decisions and constraints for Phase 3 of NeuroGraph 2.0. It defines the spaced repetition mechanics, combining strict `ts-fsrs` algorithms with organic graph maintenance.

## 1. Active Recall UX (A + C Hybrid)
The Review mechanics prioritize minimum friction while preserving deep learning, with an escape hatch built-in for deep evaluation.

**Mechanics (Left Panel `ReviewMode`):**
- **Step 1 (Speed):** The panel displays the Neuron's Title with the Core Insight hidden/blurred. A "Reveal" button allows the user to self-grade.
- **Step 2 (Honesty):** Four standard FSRS buttons (Again, Hard, Good, Easy) appear. Clicking one updates the `ts-fsrs` state instantly via API.
- **Step 3 (AI Escape Hatch):** A "Discuss with AI" button is available instead of self-grading. Clicking it launches an ephemeral, targeted chat where the `AI_MODEL_EVALUATOR` quizzes the user. The AI handles the grading based on the conversation, effectively completing the review.

## 2. Soft-FIRe Propagation Depth (Visual Stability)
A "rusting" concept acts as a localized visual warning, rather than turning the whole downstream DAG red, which user testing showed was demoralizing.

**Mechanics:**
- **Root Decay:** The decayed root Neuron (`retrievability < 85%`) turns solid "Burnt Terracotta/Rust".
- **Descendant Warnings:** Downstream dependent Neurons retain their healthy "Mastered" colors (e.g., Muted Sage Green) but gain a *subtle* visual warning—a thin rust-colored dashed border or a tiny warning icon indicating "Your foundation is crumbling."

## 3. Review Session Flow (Gardener Default)
NeuroGraph rejects the rigid "daily flashcard inbox" in favor of spatial, organic maintenance.

**Mechanics:**
- **The Graph as Inbox (Primary):** The 60vw Knowledge Graph is the main interface. The user hunts for "Rusting" nodes. Clicking one opens it in the Left Panel with an immediate "Review Now" CTA.
- **Sequential Queue (Fallback):** For disciplined users, a Sidebar badge (e.g., "Review (12)") launches a sequential review queue in the Left Panel, cycling through due items automatically.

## 4. Upward FIRe Healing (Fractional Implicit Repetition)
This mechanism prevents review fatigue by assuming foundational knowledge is refreshed when advanced concepts are successfully applied.

**Mechanics:**
- **Trigger:** If a user scores "Good" or "Easy" on an advanced Neuron.
- **Recursive Pass:** The backend recursively traverses *UP* the DAG to its immediate prerequisites (and their prerequisites).
- **Shadow Review:** Upstream prerequisite Neurons receive an automatic "shadow" FSRS review (e.g., synthetic "Good" grade) in the database, resetting their `next_review_due` timers and healing their visual rust.
- *Rationale:* Proving mastery of Tensor Calculus implicitly proves retention of Matrix Multiplication.
