# Feature Specs

This folder contains implementation-oriented feature specifications used as the handoff between:

- Gemini "Advisor" -> feature brief
- Gemini "Spec Writer" -> full feature spec
- Aider (OpenRouter) -> code-aware planning + implementation

## Create a New Spec

1. Copy the template:

```bash
cp docs/specs/_template.md "docs/specs/<feature-slug>.md"
```

2. Fill every section.

3. Keep it concrete:
- Prefer verifiable acceptance criteria over ideas.
- If you must assume something, write it in `## Open Questions`.

## Naming Convention

- File: `docs/specs/<feature-slug>.md`
- Slug: lowercase, hyphen-separated (example: `neuron-as-page`)

## Handoff to Planning

When the spec is ready, use it as the input to Aider so planning has direct codebase access:

```bash
export OPENROUTER_API_KEY=<your_openrouter_key>

# Start in ask mode (no file edits) to refine scope and approach
aider --model openrouter/<provider>/<model> --chat-mode ask docs/specs/<feature-slug>.md
```

Recommended workflow inside Aider:

- Use `/ask` to agree on scope, approach, and acceptance criteria.
- Switch to `/code` (or rerun with `--chat-mode code`) only when ready to implement.

For broader project context, keep a single portable context file updated:

- `MASTER_SPECIFICATION.txt`

## Validation Checklist (Before Planning)

- [ ] `## Scope` contains both `IN` and `OUT`
- [ ] `## Technical Design` explains data/API/UI changes (or explicitly says "none")
- [ ] `## Acceptance Criteria` items are testable/verifiable
- [ ] `## Guardrails` contains at least 3 "do not" rules
- [ ] `## Open Questions` is empty OR explicitly lists blockers to resolve first
