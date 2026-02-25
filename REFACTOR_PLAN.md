# Refactoring Plan: Neuron/Synapse Domain Alignment

This document tracks the domain normalization to Neuron/Synapse naming across database, API, types, UI, and tooling.

## Status

- Domain naming is aligned to `neurons` and `synapses` in active runtime code.
- API routes are aligned under `src/app/api/neurons`.
- UI and React Flow integration now use Neuron/Synapse terminology.
- Test and e2e suites are aligned to Neurogenesis and Synapse naming.

## Remaining Historical Footprint

- Legacy wording remains only in historical migration files kept for repository provenance.
- Migration history is intentionally preserved and should not be rewritten retroactively.

## Canonical Naming

- Node entity: `Neuron`
- Edge entity: `Synapse`
- Creation flow: `Neurogenesis`
- Graph surface: `Neural Network`

## Validation Checklist

- [x] Type system and response contracts use Neuron/Synapse naming
- [x] API routes, handlers, and tool calls use Neurogenesis naming
- [x] Graph rendering uses Neuron node and Synapse edge types
- [x] Test suite and e2e selectors are updated
- [x] Build, tests, and typecheck pass after migration
