# Research: FSRS-6 Spaced Repetition Engine

*Extracted from legacy specifications to inform Phase 3 (Rigorous Retention).*

## Overview
FSRS (Free Spaced Repetition Scheduler) is the successor to SM-2, based on the DSR model (Difficulty, Stability, Retrievability) with neuroscience foundations.
- **Reference Implementation:** `ts-fsrs` (MIT) — https://github.com/open-spaced-repetition/ts-fsrs
- **Algorithm Spec:** https://expertium.github.io/Algorithm.html

## The DSR Memory Model
1. **Difficulty (D ∈ [1, 10]):** Resistance to consolidation.
2. **Stability (S):** Memory storage strength. The time in days needed for retrievability to drop from 100% to 90%.
3. **Retrievability (R ∈ [0, 1]):** Current probability of recall. Calculated via the power-law forgetting curve (FSRS-6):
   `R(t, S) = (1 + factor * (t / S))^(-0.1542)`
   where `factor = 0.9^(-1/0.1542) - 1`.

## Integration with Neuron Entity
The following FSRS parameters must be added to the Neuron schema during Phase 3:
```typescript
type NeuronFSRSFields = {
  difficulty: number;        // D ∈ [1, 10]
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  reps: number;              // Consecutive successful reviews
  lapses: number;            // Total lapses (Again votes)
  elapsed_days: number;      // Days since last review
  scheduled_days: number;    // Planned days for next review
};
```

## Decay Visualization (Soft-FIRe)
The Retrievability `R` directly drives the Node's visual state on the React Flow canvas:
- **Fresh (R > 0.9):** High opacity, no alerts.
- **Stable (R 0.7–0.9):** Normal brightness.
- **Fading (R 0.5–0.7):** Subtle amber tint.
- **Decaying (R 0.3–0.5):** Amber/orange with subtle flicker.
- **Critical (R < 0.3):** Red, pulsing animation, soft-locking dependent nodes.

## Blocking Mechanic (Prerequisite DAG)
If a prerequisite Node falls to a Critical state (`R < 0.85`), all descendant child nodes in the React Flow DAG become visually locked or greyed-out until the foundation is reviewed and repaired.
