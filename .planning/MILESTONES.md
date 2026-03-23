# Milestones

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
