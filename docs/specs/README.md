# Feature Specs

This folder contains implementation-oriented feature specifications used as the handoff between:

- Gemini "Advisor" -> feature brief
- Gemini "Spec Writer" -> full feature spec
- OpenCode/Prometheus -> execution plan (`/start-work`)

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
- Slug: lowercase, hyphen-separated (example: `crystal-as-page`)

## Handoff to Planning

When the spec is ready, use it as the input to Prometheus:

- Start a new planning session and paste the spec content.
- Or reference the file path: `docs/specs/<feature-slug>.md`

The output should be a work plan under `.sisyphus/plans/`.

## Validation Checklist (Before Planning)

- [ ] `## Scope` contains both `IN` and `OUT`
- [ ] `## Technical Design` explains data/API/UI changes (or explicitly says "none")
- [ ] `## Acceptance Criteria` items are testable/verifiable
- [ ] `## Guardrails` contains at least 3 "do not" rules
- [ ] `## Open Questions` is empty OR explicitly lists blockers to resolve first
