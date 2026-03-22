# Phase 7: Queue Triage UI - Research

**Researched:** 2026-03-22
**Domain:** Next.js App Router queue triage UI inside the existing left-panel shell
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Queue Page Composition
- **STACKED EDITORIAL SECTIONS**: The queue lives on one elegant, scrollable `/app/queue` page in the existing left panel.
- Sections appear in this fixed order: **Inbox** (urgent/new), **Passive Debt** (lingering), **Resources** (archived).
- Section headers should feel like a curated index rather than a dashboard: minimal typography, muted serif or crisp mono treatment, quiet spacing, and no loud KPI framing.

### Triage Action Surface
- **INLINE ACTIONS ONLY**: No detail pane, nested modal, or secondary preview surface in Phase 7.
- Queue actions live directly on each item row/card: archive as resource, mark read to passive debt, crystallize entry point, and delete where appropriate.
- Actions must stay extremely subtle: muted icons or small monochrome text buttons, with hover emphasis only. No bright CTA buttons, no chunky control bars, no colorful status pills.

### Auto-Advance Trigger
- **INBOX MEANS UNSEEN** and **PASSIVE DEBT MEANS CONSUMED BUT UNSYNTHESIZED**.
- The only automatic transition from `inbox` to `passive_debt` happens when the user explicitly clicks the external URL to actually read or watch the source content.
- Merely rendering the item, scrolling past it, or opening queue view itself does not count as consumption.

### Sidebar Badge Semantics
- **INBOX ONLY**: The sidebar queue badge counts only items in the `inbox` state.
- Passive Debt and Resources do not contribute to the badge count.
- The badge should feel like an unread inbox indicator that can return to zero, not a permanent backlog alarm.

### Passive Debt Pressure
- **HUMAN AGING + SEMANTIC RUST**: Passive Debt items display a small human-readable age label such as `3 days ago`.
- After a configurable aging threshold during implementation planning, the aging indicator should adopt the product's decay semantic color language.
- Use the muted rust / burnt terracotta semantic from `.impeccable.md` to imply "rusting knowledge" without reading as an error or alert state.
- Apply this pressure subtly, for example via the age text and/or a restrained left-border accent. Never use aggressive red warning UI.

### Visual Tone & Emotional Contract
- The queue must obey the `.impeccable.md` design contract: Danish Computation, low-anxiety atmosphere, tactile dark surfaces, and semantic color only when state meaning requires it.
- Baseline UI remains monochrome; semantic color appears only where the queue is communicating meaningful learning state, especially Passive Debt decay.
- The page should feel like a calm sanctuary and curated reading index, not a task manager or productivity inbox.

### Claude's Discretion
- Exact row/card density, spacing rhythm, and responsive breakpoints inside the 40vw left panel
- The precise typography pairing for section headers versus queue metadata
- Whether inline actions reveal on hover, stay always visible, or mix visibility by state as long as they remain subtle
- The exact aging threshold and mapping to semantic rust styling, provided it remains calm and low-anxiety

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within the Phase 7 boundary.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRIAGE-01 | User can view a Queue page in the Left Panel showing items grouped by state (Inbox, Passive Debt, Resource) | Route-backed `/app/queue` page, editorial sections in fixed order, shared `queueStore`, grouped render from active queue payload |
| TRIAGE-02 | Queue page is accessible via sidebar navigation with an unread count badge | Extend `AppSidebar` nav, derive badge from `inbox` items only, keep count in the shared queue client state |
| TRIAGE-03 | User can manually transition items between states: Archive as Resource, Mark as Read (→ Passive Debt), Crystallize (→ Chat), Delete | `PATCH /api/queue/[id]` + `DELETE /api/queue/[id]`, state-aware inline actions, explicit open question on Crystallize scope and `passive_debt -> resource` ambiguity |
| TRIAGE-04 | Items auto-advance state: new capture → Inbox; item opened/viewed → Passive Debt. Manual override always available | Existing capture route already inserts `inbox`; anchor-click auto-advance must fire only on external URL click, not on render/scroll |
| TRIAGE-05 | Passive Debt items display aging indicators showing days since capture | Use `created_at` plus `Intl.RelativeTimeFormat`, centralize rust threshold, apply semantic terracotta only after threshold |
</phase_requirements>

## Summary

Phase 7 should be implemented as a route-backed client feature, not as a new `leftPanelMode`. The cleanest fit for the current codebase is a dedicated `queueStore` in Zustand that fetches authenticated queue data from App Router route handlers and becomes the single client-side source for both the `/app/queue` page and the sidebar inbox badge. This matches the existing sidebar pattern (`fetch` in a client component), the existing typed DB/query layer, and the prior project decision that queue state must remain separate from `graphStore`.

No new dependency is required. The repo already has the necessary primitives: Next.js App Router route handlers, session-based Supabase auth helpers, typed queue query functions, Zod state validation, Framer Motion for restrained list transitions, and Tailwind semantic terracotta tokens. For human-readable aging, use the built-in `Intl.RelativeTimeFormat` rather than adding `date-fns` or another formatting library. Keep the page monochrome by default and introduce semantic rust only on Passive Debt aging, never as a general alert style.

Two planning ambiguities must be resolved before splitting implementation tasks. First, `TRIAGE-03` mentions `Crystallize (→ Chat)`, but Phase 7 context says the real Crystallize flow is Phase 8 and Phase 7 should only expose the entry point. Second, the existing forward-only state machine intentionally blocks `passive_debt -> resource`, which is the most natural reading of "Archive as Resource" after an item has been consumed. If those are not resolved up front, the plan will drift into an accidental phase-scope change.

**Primary recommendation:** Build `/app/queue` around a dedicated `queueStore` plus `GET /api/queue` and `PATCH/DELETE /api/queue/[id]`, keep the badge `inbox`-only, format age with `Intl.RelativeTimeFormat`, and do not change the queue state machine unless the planner explicitly approves that scope increase.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | repo `14.2.35` / npm latest `16.2.1` (registry modified 2026-03-20) | `/app/queue` page plus `route.ts` handlers | Existing app shell already lives in App Router; route handlers are the project’s established mutation boundary |
| React | repo `18.3.1` / npm latest `19.2.4` (registry modified 2026-03-20) | Client queue page, sidebar badge, inline actions | Matches the current app and avoids turning Phase 7 into a React upgrade |
| `@supabase/ssr` + `@supabase/supabase-js` | repo `0.8.0` + `2.95.3` / npm latest `0.9.0` + `2.99.3` (registry modified 2026-03-20) | Authenticated route handlers and typed database access | Already wired via `createServerSupabaseClient()` and `getAuthenticatedUser()` |
| Zustand | repo `5.0.11` / npm latest `5.0.12` (registry modified 2026-03-16) | Shared `queueStore` for list state, badge count, optimistic rollback | Matches existing `graphStore` pattern and avoids bringing in a second client cache layer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Framer Motion | repo `12.34.0` / npm latest `12.38.0` (registry modified 2026-03-17) | Subtle row entrance/exit and layout transitions | Use for low-amplitude section/list motion only |
| Zod | repo and npm latest `4.3.6` (registry modified 2026-01-25) | Validate `PATCH` payloads and action inputs | Reuse existing `QueueStateTransitionSchema` boundary validation |
| `Intl.RelativeTimeFormat` | Browser API, baseline across browsers since September 2020 | Locale-aware `3 days ago` labels | Use for all age strings; no new date library needed |
| Tailwind semantic tokens | local config in `tailwind.config.ts` (`semantic.terracotta`, `neural.*`) | Rust aging accents and tactile dark surfaces | Use project tokens instead of ad hoc oranges/reds |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `queueStore` + fetch | SWR or TanStack Query | Better cache tooling, but adds a new data layer the repo does not use anywhere else |
| `Intl.RelativeTimeFormat` | `date-fns` distance helpers | More utilities, but unnecessary dependency for a single calm age label |
| App Router route handlers | Direct browser Supabase writes | Simpler on paper, but breaks the project’s auth/query boundary and duplicates server validation |
| Stay on repo-pinned framework versions | Upgrade to Next 16 / React 19 first | Gains newer APIs, but turns a UI phase into a risky framework migration |

**Installation:**
```bash
# No new packages required for Phase 7.
```

**Version verification:** npm registry checked on 2026-03-22 with `npm view`. Current releases are newer than the repo on `next`, `react`, `framer-motion`, `@supabase/ssr`, `@supabase/supabase-js`, `zustand`, and `vitest`. Recommendation: keep the repo-pinned versions for Phase 7 and treat upgrades as separate work.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/(app)/app/queue/page.tsx          # Queue route entry inside the 40vw left panel
├── app/api/queue/route.ts                # GET active queue items + inbox-only count
├── app/api/queue/[id]/route.ts           # PATCH state transitions, DELETE hard delete
├── components/queue/QueuePageClient.tsx  # Main client renderer for grouped sections
├── components/queue/QueueSection.tsx     # Editorial section wrapper
├── components/queue/QueueItemRow.tsx     # Row/card with subtle inline actions
├── stores/queueStore.ts                  # Shared client state, loading, optimistic rollback
└── lib/queue/age.ts                      # Relative-time + rust-threshold helpers
```

### Pattern 1: Route-Backed Shared Queue Store
**What:** Use a dedicated `queueStore` to hold the active queue list and derive `inboxCount` from the same item array the page renders.
**When to use:** Always. The sidebar badge and the queue page must not maintain separate queue copies.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
// Source: /home/simone/projects/NeuroGraph/src/stores/graphStore.ts
import { create } from 'zustand';
import type { KnowledgeQueueItem, QueueItemState } from '@/types/database';

type QueueStore = {
  items: KnowledgeQueueItem[];
  loading: boolean;
  load: () => Promise<void>;
  transitionItem: (id: string, state: QueueItemState) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  items: [],
  loading: false,
  async load() {
    set({ loading: true });
    const res = await fetch('/api/queue', { cache: 'no-store' });
    const json = await res.json();
    set({ items: json.items, loading: false });
  },
  async transitionItem(id, state) {
    const previous = get().items;
    set({
      items: previous.map((item) => (item.id === id ? { ...item, state } : item)),
    });

    const res = await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });

    if (!res.ok) set({ items: previous });
  },
  async deleteItem(id) {
    const previous = get().items;
    set({ items: previous.filter((item) => item.id !== id) });
    const res = await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    if (!res.ok) set({ items: previous });
  },
}));
```

### Pattern 2: Dynamic Session Route Handlers
**What:** Keep all queue reads and mutations behind App Router `route.ts` handlers using `getAuthenticatedUser()` plus `queueQueries`.
**When to use:** Every queue read/write from the browser.
**Example:**
```typescript
// Source: https://nextjs.org/docs/14/app/building-your-application/routing/route-handlers
// Source: /home/simone/projects/NeuroGraph/src/lib/auth/server.ts
// Source: /home/simone/projects/NeuroGraph/src/lib/db/queueQueries.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { queueQueries } from '@/lib/db/queueQueries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, supabase, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  const items = await queueQueries.getActiveByUserId(supabase, user.id);

  return NextResponse.json({
    items,
    counts: {
      inbox: items.filter((item) => item.state === 'inbox').length,
    },
  });
}
```

### Pattern 3: Native External Link With Background Auto-Advance
**What:** Let the URL open via a real anchor, and fire the `inbox -> passive_debt` transition in the click handler without blocking navigation.
**When to use:** Only for queue items with a URL and current state `inbox`.
**Example:**
```typescript
// Source: https://nextjs.org/docs/13/app/building-your-application/routing/linking-and-navigating
// Source: https://nextjs.org/docs/pages/api-reference/functions/use-router
function QueueItemLink({
  item,
  onMarkRead,
}: {
  item: { id: string; url: string | null; state: 'inbox' | 'passive_debt' | 'resource' };
  onMarkRead: (id: string) => void;
}) {
  if (!item.url) return null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        if (item.state === 'inbox') onMarkRead(item.id);
      }}
    >
      Open source
    </a>
  );
}
```

### Pattern 4: Centralized Age + Rust Mapping
**What:** Derive the visible age from `created_at`, not `updated_at`, and compute visual rust from one shared threshold constant.
**When to use:** Passive Debt rows and nowhere else.
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
const PASSIVE_DEBT_RUST_DAYS = 7;
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function getPassiveDebtAge(createdAt: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  );

  return {
    label: days === 0 ? 'today' : rtf.format(-days, 'day'),
    isRusting: days >= PASSIVE_DEBT_RUST_DAYS,
  };
}
```

### Anti-Patterns to Avoid
- **Queue as a new `leftPanelMode`:** Phase 5 explicitly decided queue is a route, not a Zustand panel mode.
- **Separate sidebar/page queue fetch state:** Badge drift and stale counts will appear immediately.
- **Blocking external link clicks until PATCH resolves:** Async `window.open` behavior risks popup blocking and user-visible lag.
- **Using `updated_at` for the age label:** Manual triage would constantly rewrite the visible "days ago" value and break the requirement.
- **Dashboard chrome:** KPI cards, bright status pills, or alarm-red debt visuals violate the design contract.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time labels | Custom pluralization like `"${days} day(s) ago"` | `Intl.RelativeTimeFormat` | Locale-aware and already supported broadly |
| Client cache layer | A one-off ad hoc event bus between sidebar and page | Dedicated Zustand `queueStore` | Existing repo already uses Zustand; shared state is enough here |
| Browser-side queue mutations | Direct Supabase client writes from UI components | Session-authenticated App Router route handlers | Keeps validation, auth, and transition allowlist on the server |
| Transition rules | Row-local `if/else` copies of allowed moves | `VALID_TRANSITIONS` + route-level validation | Prevents UI/server drift |
| Rust colors | New bespoke orange/red palette | Existing `semantic.terracotta` token | Keeps queue aligned with `.impeccable.md` and current Tailwind config |

**Key insight:** Phase 7 is not blocked by missing libraries. It is blocked by coordination errors: duplicated queue state, duplicated transition rules, or accidental scope creep into Crystallize and state-machine redesign.

## Common Pitfalls

### Pitfall 1: Cached GET Route Causes Stale Badge Counts
**What goes wrong:** Sidebar count and queue page show stale data after captures or state transitions.
**Why it happens:** Next.js GET route handlers can cache if you leave them on default behavior.
**How to avoid:** Mark `/api/queue` dynamic (`export const dynamic = 'force-dynamic'`) and fetch with `cache: 'no-store'` on the client.
**Warning signs:** Capture succeeds but the badge stays unchanged until a hard refresh.

### Pitfall 2: Auto-Advance Fires on Render Instead of Explicit Consumption
**What goes wrong:** Inbox items silently move to Passive Debt just because the queue page rendered, scrolled, or focused.
**Why it happens:** The implementation confuses visibility with user intent.
**How to avoid:** Only fire the automatic transition from the external-link click path.
**Warning signs:** Fresh captures leave Inbox before the user opens the source.

### Pitfall 3: Popup Blocking From Async Link Handling
**What goes wrong:** Clicking a URL fails to open the article in a new tab or opens inconsistently.
**Why it happens:** The app waits for an async fetch before calling `window.open`.
**How to avoid:** Use a real anchor and run the PATCH in the background without preventing default navigation.
**Warning signs:** Works in one browser, intermittently fails in another, or only works with popup permissions relaxed.

### Pitfall 4: Age Label Uses `updated_at`
**What goes wrong:** Manual triage resets the age, so old Passive Debt looks "new" again.
**Why it happens:** `updated_at` is easier to reach, but the requirement says "days since capture."
**How to avoid:** Base aging strictly on `created_at`.
**Warning signs:** Clicking "Mark as Read" changes a week-old item to `today`.

### Pitfall 5: Archive Action Semantics Drift From the Locked Funnel
**What goes wrong:** UI offers `Archive as Resource` in states the server refuses, or a planner silently broadens the state machine.
**Why it happens:** `TRIAGE-03` language is broader than the Phase 5 transition allowlist.
**How to avoid:** Decide before implementation whether archive is inbox-only in Phase 7 or whether `passive_debt -> resource` is a deliberate scope change.
**Warning signs:** PATCH 400/500 errors only on some rows, or a last-minute schema/validation edit during UI work.

### Pitfall 6: Queue Page Becomes a Dashboard
**What goes wrong:** The interface feels like a backlog manager instead of a calm editorial queue.
**Why it happens:** Grouped states tempt a KPI layout, colored pills, and loud density.
**How to avoid:** Use editorial section headers, low-contrast cards/rows, and semantic color only for rusting Passive Debt.
**Warning signs:** The design reads like an admin inbox at first glance.

### Pitfall 7: Per-Item Concurrent Mutations Corrupt Local State
**What goes wrong:** Rapid clicks on Archive/Delete/Mark Read leave the row in the wrong state after the server responds.
**Why it happens:** The store tracks one global loading boolean instead of per-item pending state.
**How to avoid:** Track pending mutation state by item id and suppress secondary actions while a row is in flight.
**Warning signs:** Double clicks resurrect deleted rows or overwrite a later optimistic state with an earlier rollback.

## Code Examples

Verified patterns from official sources and current project code:

### Queue GET Route
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
// Source: /home/simone/projects/NeuroGraph/src/lib/auth/server.ts
// Source: /home/simone/projects/NeuroGraph/src/lib/db/queueQueries.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { queueQueries } from '@/lib/db/queueQueries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, supabase, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  const items = await queueQueries.getActiveByUserId(supabase, user.id);

  return NextResponse.json({
    items,
    counts: { inbox: items.filter((item) => item.state === 'inbox').length },
  });
}
```

### Queue Mutation Route
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
// Source: /home/simone/projects/NeuroGraph/src/lib/validation/queue.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { queueQueries } from '@/lib/db/queueQueries';
import { QueueStateTransitionSchema } from '@/lib/validation/queue';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  const parsed = QueueStateTransitionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const item = await queueQueries.getById(supabase, params.id);
  if (!item || item.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const updated = await queueQueries.updateState(supabase, item.id, item.state, parsed.data.state);
  return NextResponse.json({ item: updated });
}
```

### Calm Aging Helper
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function formatPassiveDebtAge(createdAt: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  );

  return days === 0 ? 'today' : formatter.format(-days, 'day');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/api` for JSON handlers | App Router `route.ts` handlers | Next.js 13+ | Queue endpoints should live under `src/app/api/...`, matching the rest of the repo |
| Page-local `useState` + `useEffect` fetching | Shared client store for cross-surface state | Common modern React app practice; already reflected by Zustand usage in this repo | Sidebar badge and queue page stay consistent without prop threading |
| Third-party date helper for relative strings | Built-in `Intl.RelativeTimeFormat` | Browser baseline since September 2020 | No dependency needed for calm aging labels |
| Loud productivity/dashboard backlog cues | Calm semantic state design with rust only where meaning requires it | Product/design decision locked in `.impeccable.md` + 07-CONTEXT | Queue UI must preserve sanctuary tone even when pressuring Passive Debt |

**Deprecated/outdated:**
- Adding queue as a `graphStore.leftPanelMode` value: superseded by the locked route-based queue decision.
- Direct UI-side Supabase writes for queue actions: superseded by route-handler validation and auth.
- Using generic red error UI for Passive Debt aging: superseded by semantic terracotta/rust language.

## Open Questions

1. **Does Phase 7 need a working Crystallize handoff or only the UI entry point?**
   - What we know: `TRIAGE-03` names `Crystallize (→ Chat)`, but 07-CONTEXT says the real Crystallize flow belongs to Phase 8 and Phase 7 should expose the entry point cleanly.
   - What's unclear: Whether verification for Phase 7 expects navigation into chat, or just a visible subtle affordance.
   - Recommendation: Resolve this before planning. If the requirement is literal, pull a minimal handoff into Phase 7; if not, narrow TRIAGE-03 acceptance criteria to "entry point rendered."

2. **Should `Archive as Resource` be available from Passive Debt?**
   - What we know: Phase 5 intentionally locked `resource -> passive_debt` and blocked `passive_debt -> resource`.
   - What's unclear: Whether the product intent is "archive before you read" only, or "archive after you have consumed it" as well.
   - Recommendation: Keep the existing funnel unless the user explicitly approves a state-machine change; otherwise show archive only where the server allows it.

3. **What is the Passive Debt rust threshold?**
   - What we know: 07-CONTEXT leaves the exact threshold to implementation planning.
   - What's unclear: Whether the product should start rusting after 3, 7, or 14 days.
   - Recommendation: Start with `7` days. It is calm enough to avoid immediate alarm but short enough to create ambient pressure inside a weekly learning rhythm.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.0.18` in repo (`4.1.0` current on npm), plus Playwright `1.58.2` |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npx vitest run src/lib/db/__tests__/queueQueries.test.ts src/lib/validation/__tests__/schemas.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRIAGE-01 | `/app/queue` renders grouped Inbox / Passive Debt / Resources sections in order | component integration | `npx vitest run src/components/queue/__tests__/QueuePage.test.tsx` | ❌ Wave 0 |
| TRIAGE-02 | Sidebar nav includes Queue link and inbox-only badge | component integration | `npx vitest run src/components/layout/__tests__/AppSidebar.queue.test.tsx` | ❌ Wave 0 |
| TRIAGE-03 | Inline actions mutate or delete items with optimistic rollback | route + store integration | `npx vitest run src/app/api/queue/[id]/__tests__/route.test.ts src/stores/__tests__/queueStore.test.ts` | ❌ Wave 0 |
| TRIAGE-04 | Clicking an inbox item URL auto-advances it to Passive Debt and does not fire on render | component integration | `npx vitest run src/components/queue/__tests__/QueueItemRow.test.tsx` | ❌ Wave 0 |
| TRIAGE-05 | Passive Debt age label uses days-since-capture and rust threshold styling | unit + component | `npx vitest run src/lib/queue/__tests__/age.test.ts src/components/queue/__tests__/QueueItemRow.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/stores/__tests__/queueStore.test.ts src/components/queue/__tests__/QueueItemRow.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full Vitest suite green, plus a manual click-through of `/app/queue` for external-link auto-advance behavior

### Wave 0 Gaps
- [ ] `src/app/api/queue/__tests__/route.test.ts` — covers authenticated GET list + inbox count contract
- [ ] `src/app/api/queue/[id]/__tests__/route.test.ts` — covers PATCH transition validation and DELETE ownership/auth cases
- [ ] `src/stores/__tests__/queueStore.test.ts` — covers optimistic update, rollback, pending-row locking, badge derivation
- [ ] `src/components/queue/__tests__/QueuePage.test.tsx` — covers grouped render order and empty states
- [ ] `src/components/queue/__tests__/QueueItemRow.test.tsx` — covers state-aware action visibility, external-link click behavior, age label rendering
- [ ] `src/components/layout/__tests__/AppSidebar.queue.test.tsx` — covers nav item plus inbox-only badge behavior in expanded/collapsed states
- [ ] `e2e/queue-triage.spec.ts` — end-to-end route + sidebar integration; current Playwright config points at `./e2e`, but no `e2e/` specs exist today

## Sources

### Primary (HIGH confidence)
- Next.js App Router route handlers: https://nextjs.org/docs/14/app/building-your-application/routing/route-handlers
- Next.js `route.ts` file convention: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js linking and navigation: https://nextjs.org/docs/13/app/building-your-application/routing/linking-and-navigating
- Next.js `useRouter`: https://nextjs.org/docs/app/api-reference/functions/use-router
- Supabase Next.js quickstart / SSR setup: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Motion `AnimatePresence`: https://motion.dev/docs/react-animate-presence
- MDN `Intl.RelativeTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
- Local implementation anchors: `/home/simone/projects/NeuroGraph/src/components/layout/AppSidebar.tsx`, `/home/simone/projects/NeuroGraph/src/lib/auth/server.ts`, `/home/simone/projects/NeuroGraph/src/lib/auth/supabase.ts`, `/home/simone/projects/NeuroGraph/src/lib/db/queueQueries.ts`, `/home/simone/projects/NeuroGraph/src/lib/validation/queue.ts`, `/home/simone/projects/NeuroGraph/src/stores/graphStore.ts`, `/home/simone/projects/NeuroGraph/tailwind.config.ts`

### Secondary (MEDIUM confidence)
- npm registry metadata checked 2026-03-22 via `npm view` for `next`, `react`, `framer-motion`, `@supabase/ssr`, `@supabase/supabase-js`, `zustand`, `zod`, `vitest`, `@testing-library/react`, `@playwright/test`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing repo stack is clear, and package currency was checked against the npm registry on 2026-03-22
- Architecture: MEDIUM - The route/store shape fits the current codebase and official docs, but two requirement ambiguities affect the exact plan
- Pitfalls: HIGH - Risks are grounded in locked phase decisions, current code patterns, and official Next.js/browser behavior

**Research date:** 2026-03-22
**Valid until:** 2026-04-21
