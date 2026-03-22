# Phase 07 - UI Review

**Audited:** 2026-03-22
**Baseline:** `.impeccable.md` + Phase 07 context/plan contract + abstract 6-pillar standards (no `UI-SPEC.md` present)
**Screenshots:** captured at `.planning/ui-reviews/07-20260322-212314`

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Calm editorial tone is strong, but action labels hide the actual queue state changes. |
| 2. Visuals | 3/4 | The queue has a clear focal point and restrained shell badge, but repeated card chrome and header counts make it read more like a stack of widgets than a curated index. |
| 3. Color | 3/4 | Monochrome baseline is disciplined and rust is restrained, but the queue still uses generic orange utilities instead of a shared terracotta semantic. |
| 4. Typography | 2/4 | Serif/mono pairing fits the brand, but too many 9-11px utilities and three font weights make the reading hierarchy fussy inside a 40vw column. |
| 5. Spacing | 3/4 | Section and card rhythm are mostly coherent, though the shell still depends on several arbitrary utility values instead of a tighter token set. |
| 6. Experience Design | 2/4 | Loading/empty/error coverage exists, but row-level pending states and destructive safeguards are missing from the triage surface. |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Surface per-item pending and delete safety** - optimistic actions currently stay clickable with no busy state, and delete fires immediately - wire `pendingById` into `QueuePageClient`/`QueueItemCard`, disable the active row, and add either confirm-once or undo for delete.
2. **Make the action copy state-explicit** - `Mark Read` and `Archive` hide the actual Phase 07 state machine - rename them to `Mark as Read` and `Archive as Resource`, and give failed auto-advance a row-local message instead of only a page-top error.
3. **Reduce the dashboard/card feel** - repeated rounded cards plus section counts dilute the “editorial staging area” brief - flatten item treatment into lighter rows/dividers, demote or remove section counts, and consolidate the micro-type scale.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

- The core page language matches the intended emotional contract well: `Staging Area`, the calm intro copy, and the empty-state tone all reinforce a quiet editorial workspace rather than a productivity inbox. Evidence: `src/components/queue/QueuePageClient.tsx:30-46`, `src/components/queue/QueuePageClient.tsx:81-98`.
- The inline action copy is less precise than the state machine it controls. `Mark Read` actually means `move to Passive Debt`, and `Archive` actually means `Archive as Resource`, so the user intent and outcome are not fully aligned. Evidence: `src/components/queue/QueueItemCard.tsx:78-95`.
- `Delete` is terse for a destructive action and gives no consequence framing. Evidence: `src/components/queue/QueueItemCard.tsx:108-114`.

### Pillar 2: Visuals (3/4)

- The page establishes a clear focal point with a compact pretitle, serif title, and one-column section flow. Evidence: `src/components/queue/QueuePageClient.tsx:90-129`.
- The sidebar queue badge is visually restrained and disappears at zero, which supports the “Inbox Zero relief” model instead of backlog anxiety. Evidence: `src/components/layout/AppSidebar.tsx:176-187`.
- Inference from component structure and utility choices: every item is wrapped in the same rounded, shadowed card, and every section header exposes a numeric count. That combination pulls the surface toward a generic card stack/dashboard feel, which is weaker than the Phase 07 “curated index” brief. Evidence: `src/components/queue/QueueItemCard.tsx:38`, `src/components/queue/QueueSection.tsx:20-27`.

### Pillar 3: Color (3/4)

- The queue stays mostly monochrome across the shell, sections, and navigation badge, which is consistent with the Impeccable baseline. Evidence: `src/components/queue/QueuePageClient.tsx:80-103`, `src/components/queue/QueueSection.tsx:19-33`, `src/components/layout/AppSidebar.tsx:167-183`.
- Semantic color is used sparingly and only for Passive Debt aging cues, which is the right behavior. Evidence: `src/components/queue/QueueItemCard.tsx:27-31`, `src/components/queue/QueueItemCard.tsx:74`.
- The rust treatment is implemented as raw Tailwind orange (`text-orange-400/80`, `bg-orange-400/40`) rather than a stable burnt-terracotta semantic token, so it risks drifting from the rest of the product’s decay language. Evidence: `src/components/queue/QueueItemCard.tsx:29-31`, `src/components/queue/QueueItemCard.tsx:74`.
- Hardcoded hex/rgb colors were not found in the audited queue shell files.

### Pillar 4: Typography (2/4)

- The serif/mono pairing is directionally right for the Danish Computation brief: serif for knowledge/title, mono for section metadata and labels. Evidence: `src/components/queue/QueuePageClient.tsx:81-97`, `src/components/queue/QueueSection.tsx:22-27`, `src/components/queue/QueueItemCard.tsx:41-57`.
- The audited surface uses many micro sizes: `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[15px]`, `text-sm`, `text-xl`, and `text-3xl`. In a narrow reading column, that many tiny steps makes the hierarchy feel over-tuned instead of calm. Evidence: `src/components/queue/QueueItemCard.tsx:16`, `src/components/queue/QueueItemCard.tsx:41`, `src/components/queue/QueueSection.tsx:22`, `src/components/queue/QueueSection.tsx:27`, `src/components/queue/QueuePageClient.tsx:81`, `src/components/queue/QueuePageClient.tsx:92`, `src/components/queue/QueuePageClient.tsx:95`, `src/components/layout/AppSidebar.tsx:181-182`, `src/app/(app)/layout.tsx:41`, `src/app/(app)/layout.tsx:44`.
- The audited shell uses three weights (`font-medium`, `font-semibold`, `font-bold`), which exceeds the abstract audit target of keeping app typography to a tighter set.

### Pillar 5: Spacing (3/4)

- The queue page itself has solid structural rhythm: outer padding, section spacing, card padding, and action spacing are coherent and easy to follow. Evidence: `src/components/queue/QueuePageClient.tsx:90-107`, `src/components/queue/QueueSection.tsx:19-31`, `src/components/queue/QueueItemCard.tsx:38-39`, `src/components/queue/QueueItemCard.tsx:77`.
- The shell still depends on arbitrary utility values such as `w-[40vw]`, `w-[60vw]`, `tracking-[0.32em]`, `min-w-[1rem]`, and `min-w-[1.4rem]`, which makes the spacing/measure system feel less tokenized than the visual brief suggests. Evidence: `src/app/(app)/layout.tsx:33`, `src/app/(app)/layout.tsx:62`, `src/components/queue/QueuePageClient.tsx:92`, `src/components/layout/AppSidebar.tsx:181-182`.
- Arbitrary spacing values in the queue shell are limited; most of the inconsistency is in shell-level width and tracking utilities rather than random padding.

### Pillar 6: Experience Design (2/4)

- Queue hydration coverage is strong: the shell refreshes on auth readiness, focus return, and visibility return. Evidence: `src/components/queue/QueueBootstrap.tsx:12-37`.
- The page handles loading, empty, and error states without breaking the shell layout. Evidence: `src/components/queue/QueuePageClient.tsx:78-105`, `src/components/queue/QueueSection.tsx:30-35`.
- The store already tracks `pendingById`, but the UI never consumes it. As a result, triage buttons remain active during optimistic mutations, there is no disabled/busy feedback, and repeat clicks depend entirely on store guards the user cannot see. Evidence: `src/stores/queueStore.ts:13`, `src/stores/queueStore.ts:96-200`, `src/components/queue/QueuePageClient.tsx:13-21`, `src/components/queue/QueuePageClient.tsx:107-125`, `src/components/queue/QueueItemCard.tsx:77-114`.
- Delete is immediate and has no confirmation or undo path in the queue surface, which is harsher than the stated low-anxiety contract. Evidence: `src/components/queue/QueueItemCard.tsx:108-114`.
- On Inbox URL open, failures are only surfaced through the generic page-top error region while the external tab still opens, so the fallback is technically present but weakly localized to the item that failed. Evidence: `src/components/queue/QueuePageClient.tsx:51-54`, `src/components/queue/QueuePageClient.tsx:101-105`.

---

## Files Audited

- `.planning/phases/07-queue-triage-ui/07-01-SUMMARY.md`
- `.planning/phases/07-queue-triage-ui/07-02-SUMMARY.md`
- `.planning/phases/07-queue-triage-ui/07-03-SUMMARY.md`
- `.planning/phases/07-queue-triage-ui/07-01-PLAN.md`
- `.planning/phases/07-queue-triage-ui/07-02-PLAN.md`
- `.planning/phases/07-queue-triage-ui/07-03-PLAN.md`
- `.planning/phases/07-queue-triage-ui/07-CONTEXT.md`
- `.impeccable.md`
- `src/app/(app)/app/queue/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/queue/QueueBootstrap.tsx`
- `src/components/queue/QueuePageClient.tsx`
- `src/components/queue/QueueItemCard.tsx`
- `src/components/queue/QueueSection.tsx`
- `src/lib/queue/age.ts`
- `src/stores/queueStore.ts`
