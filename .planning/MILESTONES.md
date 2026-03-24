# Milestones

## v2.0 MVP Core Stability (Shipped: 2026-03-24)

**Phases completed:** 4 phases, 7 plans, 15 tasks

**Key accomplishments:**

- onError callbacks and AbortSignal timeouts added to both streamText call sites, eliminating silent mid-stream provider failures in /api/chat (60s) and /api/neurons/ai-action (30s)
- Khanmigo-proven calibration patterns added to CHAT_SYSTEM_PROMPT, comprehension-test heuristic with 4 boundary examples in inferPrerequisites, and Kahn's topological sort cycle detection added to architect.ts superRefine
- Expanded promptfoo eval suite from 34 to 42 cases with behavioral assertions for all 4 Khanmigo patterns and judge model pinned to gpt-4o-2024-08-06 across all three configs
- Race-free TipTap neuron content sync via single neuron.id-keyed effect, and lossless JSON serialization replacing HTML in all save paths
- React.memo applied to NeuronNode, GhostNeuronNode, and SynapseEdge, plus onlyRenderVisibleElements enabled on ReactFlow to prevent cascading re-renders and cull off-screen DOM nodes at scale.
- Real-time 6-segment Bloom cognitive depth meter added to chat interface using client-side keyword analysis of user messages — zero API calls, ambient editorial aesthetic

---

## v1.4 QA Refinement II (Shipped: 2026-03-24)

**Phases completed:** 2 phases, 4 plans, 4 tasks

**Key accomplishments:**

- CHAT_SYSTEM_PROMPT rewritten with mandatory acknowledge/enrich/question contract; scoreSocraticTone gains teaching-content dimension calibrated so canonical teach-then-ask scores 1.0 and question-parrot scores 0.40
- 3 teach-then-ask golden cases added (historical, science, programming domains); full 34-case cross-agent promptfoo suite passes at 100% with no threshold changes needed
- Crystallize paste banner no longer leaks across conversations; HorizonControls collapses to a compact pill; TARGET label removed from below the controls.

---

## v1.3 QA Refinement (Shipped: 2026-03-24)

**Phases completed:** 2 phases, 4 plans, 6 tasks

**Key accomplishments:**

- 1. [Rule 1 - Bug] UUID test fixture was not RFC-compliant
- Server-side Bloom gate (422 for shallow non-ghost neurons) + restricted tool enum + widened vector search params (0.15/10) + legacy RELATED edge cleanup migration
- Three surgical UI fixes: review layout reset on unmount, rehydrated neurogenesis spinner resolution, and React Flow Handle visibility override via inline style
- Editorial redesign of Set Learning Target HUD to dark rectangular card language (BUG-05), plus ng_

---

## v1.2 Agent Intelligence (Shipped: 2026-03-24)

**Phases completed:** 14 phases, 33 plans, 35 tasks

**Key accomplishments:**

- One-Liner:
- One-Liner:
- TipTap WYSIWYG editor replacing rigid neuron form fields, with Slash Commands, Bouncer bubble menu, and background AI metadata extraction from free-form prose
- One-Liner:
- Two Supabase SQL migrations and TypeScript Database type extensions providing the knowledge_queue (4-state CHECK constraint + RLS + partial index) and user_api_keys (SHA-256 hash storage + narrow SELECT/DELETE RLS + one-active-key-per-user partial unique index) foundation for the Staging Area feature.
- SHA-256 API key generation/hashing with timing-safe verification and Zod schemas for the 4-state queue funnel and ng_ bearer token format
- Typed Supabase query objects for knowledge_queue and user_api_keys with forward-only state machine enforcement and structural AI isolation guarantee
- RED-state vitest scaffolds for bearer-auth capture endpoint, key management CRUD, and SSRF-safe metadata extraction — all test contracts defined before production code exists
- iOS Shortcuts capture endpoint with service-role bearer auth, 60/hr rate limiting, SSRF-safe metadata extraction, and duplicate URL detection via 5 structured JSON response paths
- Queue API routes and a dedicated zustand store now provide optimistic queue mutations with rollback and Inbox-only derived state
- An editorial `/app/queue` page now renders Inbox, Passive Debt, and Resources with subtle inline actions and low-anxiety rust aging
- Queue is now native to the authenticated shell, with an Inbox-only sidebar badge, shared hydration, and an approved low-anxiety interaction model
- Backend crystallize orchestration now creates seeded conversations, classifies extraction failures, and preserves queue provenance in message metadata
- The chat surface now consumes queue-side crystallize intent, loads seeded conversations automatically, and renders an embedded manual-paste path when extraction fails
- Crystallize-linked Neurogenesis now closes the queue loop by resolving provenance from chat metadata, advancing the originating item to mastered through allowed transitions, and refreshing queue state in the client
- One-liner:
- 13-case golden Bouncer suite with fragment-based scored extraction assertions, replacing boolean has/hasn't columns with keyword substring checks — all 13 cases pass in offline/CI mode at 100%.
- One-liner:
- One-liner:

---

## v1.1 Staging Area (Shipped: 2026-03-23)

**Phases completed:** 5 phases, 15 plans, 24 tasks

**Key accomplishments:**

- Two Supabase SQL migrations and TypeScript Database type extensions providing the knowledge_queue (4-state CHECK constraint + RLS + partial index) and user_api_keys (SHA-256 hash storage + narrow SELECT/DELETE RLS + one-active-key-per-user partial unique index) foundation for the Staging Area feature.
- SHA-256 API key generation/hashing with timing-safe verification and Zod schemas for the 4-state queue funnel and ng_ bearer token format
- Typed Supabase query objects for knowledge_queue and user_api_keys with forward-only state machine enforcement and structural AI isolation guarantee
- RED-state vitest scaffolds for bearer-auth capture endpoint, key management CRUD, and SSRF-safe metadata extraction — all test contracts defined before production code exists
- iOS Shortcuts capture endpoint with service-role bearer auth, 60/hr rate limiting, SSRF-safe metadata extraction, and duplicate URL detection via 5 structured JSON response paths
- Queue API routes and a dedicated zustand store now provide optimistic queue mutations with rollback and Inbox-only derived state
- An editorial `/app/queue` page now renders Inbox, Passive Debt, and Resources with subtle inline actions and low-anxiety rust aging
- Queue is now native to the authenticated shell, with an Inbox-only sidebar badge, shared hydration, and an approved low-anxiety interaction model
- Backend crystallize orchestration now creates seeded conversations, classifies extraction failures, and preserves queue provenance in message metadata
- The chat surface now consumes queue-side crystallize intent, loads seeded conversations automatically, and renders an embedded manual-paste path when extraction fails
- Crystallize-linked Neurogenesis now closes the queue loop by resolving provenance from chat metadata, advancing the originating item to mastered through allowed transitions, and refreshing queue state in the client

---

## v1.0 MVP (Shipped: 2026-03-22)

**Phases completed:** 4 phases, 5 plans, 0 tasks

**Key accomplishments:**

- Implemented AI Bouncer for active duplicate prevention.
- Built 14-day Ephemeral Discovery Engine.
- Added strict Left-to-Right DAG layout to solve spaghetti graphs.
- Integrated ts-fsrs Engine with Upward FIRe healing and Soft-FIRe decay UI.
- Replaced textarea fields with a fully fluid TipTap Advanced AI Editor featuring "The Bouncer" bubble menu and slash commands.
- Added background AI semantic extraction for dynamic definition and core insight generation.

---
