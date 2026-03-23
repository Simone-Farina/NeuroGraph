# Phase 11: DAG Manager Agent - Research

## Findings

### Prompt and schema seam
- `src/lib/ai/prompts.ts` already centralizes production prompts and is the right place to add the Architect contract text.
- A dedicated `src/lib/ai/architect.ts` module can own both the Zod schema and the deterministic DAG invariant checks needed to harden model output locally.

### Evaluation seam
- Phase 10 already created the reusable `prompt-eval/` structure and local command surface.
- `prompt-eval/architect/` is the correct place for the Golden dataset and provider wrapper.
- A shared JSON schema artifact under `prompt-eval/shared/` lets promptfoo assertions and local TypeScript logic point at the same output shape.

### Product boundary
- The right move is to stop before runtime integration.
- The Architect can be proven in isolation first, then wired into the product later as a separate phase.

## Research Conclusion

Phase 11 should split cleanly into three execution slices:
1. Prompt contract plus strict response schema
2. Golden Architect eval suite
3. Validation, docs, and runtime-light handoff

That keeps the milestone honest: the DAG logic becomes trustworthy before any UI or API surface consumes it.
