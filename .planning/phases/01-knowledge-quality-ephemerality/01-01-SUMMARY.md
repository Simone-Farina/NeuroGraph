---
phase: "01"
plan: "01-01"
subsystem: "Backend & UI"
tags: ["ttl", "cron", "sidebar"]
requires: []
provides: ["14-day automated expiration of chats", "Sidebar proactive countdown"]
affects: ["supabase/migrations", "src/components/layout/AppSidebar.tsx", "src/app/api/chat/route.ts"]
tech-stack.added: ["pg_cron"]
key-files.modified: ["src/components/layout/AppSidebar.tsx", "src/types/chat.ts", "src/app/api/chat/route.ts"]
key-files.created: ["supabase/migrations/20260321000000_ttl_cron.sql"]
key-decisions:
  - "Decided to implement TTL strictly via a pg_cron daily job that cascades deletions from conversations"
  - "Added created_at to the ConversationSummary shape from the API to calculate accurate expiration times without an extra DB column"
requirements-completed: []
completed: "2026-03-21T00:18:00Z"
duration: "5 min"
---

# Phase 01 Plan 01: Ephemeral TTL Engine (Backend & UI) Summary

Implemented a 14-day automatic expiration cron job and a proactive UI countdown in the sidebar.

## Execution Details
- **Duration:** 5 min
- **Start Time:** 2026-03-21T00:15:00Z
- **End Time:** 2026-03-21T00:18:00Z
- **Tasks Executed:** 2
- **Files Modified/Created:** 4

## What was built
1. Addressed the backend requirement by writing `supabase/migrations/20260321000000_ttl_cron.sql` to execute a daily `pg_cron` wipe of older conversations.
2. Updated `AppSidebar.tsx` to read `created_at` or `updated_at`, subtracting from today to show exact days left. Added a red text warning when under 24 hours.

## Deviations from Plan
- **[Rule 1 - Bug] missing created_at in API.** The `GET /api/chat` route was only providing the `updated_at` field, making strict 14-day TTL calculation inaccurate for old chats that received new messages. The API response and TypeScript types were updated to pull `created_at` from the DB as well.

## Authentication Gates
None.

## Ready for 01-02-PLAN.md
