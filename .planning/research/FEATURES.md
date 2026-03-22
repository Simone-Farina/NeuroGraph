# Feature Research

**Domain:** PKM Staging Area / Cognitive Funnel (Milestone v1.1)
**Researched:** 2026-03-22
**Confidence:** HIGH (table stakes and architecture patterns), MEDIUM (mobile capture patterns), HIGH (URL extraction libraries)

---

## Scope

This document covers the **v1.1 Staging Area milestone** specifically. It answers:
- What does a knowledge inbox/queue look like in PKM tools?
- What are table stakes vs differentiators for a staging/triage feature?
- How do mobile capture flows work (iOS Shortcuts, share sheets)?
- What does URL content extraction look like in practice?

Existing built features (not re-researched here): Socratic chat, Neurogenesis, AI Bouncer, 14-day TTL, TipTap editor, React Flow graph, 40/60 split UI.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume a "knowledge inbox" has. Missing these makes the product feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Inbox list view in Left Panel | Every PKM tool (Readwise Reader, Instapaper, Omnivore) shows a list of captured items | LOW | Replaces or tabs alongside chat list. Must fit the 40vw Left Panel constraint. |
| 4-state item lifecycle | Inbox → Resource / Passive Debt → Mastered Neuron is the canonical funnel; users expect explicit state labels | LOW | `status` enum column on `queue_items` table. Transitions are manual + auto-detected. |
| Manual triage controls | Users expect to archive, promote, delete, or snooze items from the list | LOW | Per-item action buttons. Archive = soft delete. Promote = trigger Crystallize. |
| URL capture via share sheet | Sharing a URL from Safari to any app is the expected mobile capture UX on iOS | MEDIUM | Requires a public POST endpoint accepting a bearer token. Covered in mobile capture section below. |
| Auto-fetch page title + favicon | Every read-later app (Instapaper, Pocket, Readwise Reader) shows title and site name for URLs | LOW | Fetch `<title>` and `<link rel="icon">` on ingest. Open Graph `og:title` and `og:image` are better. |
| Idempotent capture | Re-sharing a URL that is already in inbox should not create duplicates | LOW | Check URL hash on insert; return 200 with existing item if already present. |
| Queue invisible to chat AI | If captured items bleed into the Socratic AI context, users will notice "contamination" | LOW | AI isolation is architectural, not UI: queue table is never joined into conversation context. |

### Differentiators (Competitive Advantage)

Features that align with NeuroGraph's core value (Active Generative Mastery, not passive ingestion).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Crystallize" flow (URL → Socratic session) | Competitors (Readwise Reader, Recall.ai) auto-summarize and auto-generate nodes. NeuroGraph forces a Socratic session — the user must extract the insight themselves. This is the defining differentiator. | HIGH | Requires: fetch URL content (Readability.js + JSDOM), AI summary as "seed context", then open a new chat session with that context injected. |
| "Passive Debt" state with count badge | Surfaces moral pressure — you see how many items you've saved but never engaged with. Competing tools hide this. | LOW | Count query on `status = 'passive_debt'` displayed in the Left Panel tab label. |
| AI-generated triage summary on hover | On hover of a queue item, show a one-sentence AI summary without requiring full Crystallize. Lowers barrier to deciding whether to engage. | MEDIUM | Pre-generate summary on ingest using a lightweight model call. Store in `queue_items.summary` column. |
| Plain text note capture (not just URLs) | iOS Shortcut can capture selected text or a fleeting idea, not just a URL. Text notes go directly to Inbox as `type: 'note'`. | LOW | Same endpoint; `content_type` field distinguishes URL from raw text. |
| Automatic state transition: Neuron created → status = 'mastered' | When a Crystallize session produces a Neuron via Neurogenesis, the source queue item should auto-advance to "Mastered." | LOW | Hook into the existing Neurogenesis flow; on Neuron creation, update `queue_items.status` where `source_url` matches. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-summarize → auto-create Neuron | "Just pull the key points from this article into my graph." | This is exactly what Recall.ai and Readwise Reader do, and it is the Illusion of Competence. The user gets a graph full of things they never thought about. Violates the core thesis. | Crystallize provides a summary as seed context only. The user must engage Socratically to produce a Neuron. |
| Bulk import from Readwise/Pocket/Instapaper | "I have 500 saved articles, import them all." | Creates a graveyard of 500 Passive Debt items with zero mastery. The weight of unprocessed items becomes demotivating rather than generative. | Accept this consequence: NeuroGraph is a high-friction tool. If users want a graveyard, they have Readwise. Limit onboarding import to 10 items max with a warning. |
| Scheduled/automatic Crystallize reminders | "Remind me to process this on Tuesday." | Pushes the queue toward a task manager, not a knowledge tool. Blurs the cognitive model. | The Passive Debt count badge provides ambient pressure without calendar noise. |
| Full-text search across inbox | "Let me search my saved articles." | Encourages the inbox to become a reference archive, not a triage queue. Undermines the funnel model. | Items should be processed or discarded quickly. Search in the Knowledge Graph (Neurons), not in the Inbox. |
| Browser extension capture | "I want to save from Chrome/Firefox on desktop." | Significant build cost (separate extension project, Manifest V3 compliance). Redundant if the web app itself is open. | A dedicated "Add URL" text field in the Left Panel covers the desktop use case with near-zero complexity. |

---

## Feature Dependencies

```
[Personal API Key (per-user, stored in DB)]
    └──required by──> [Mobile Capture Endpoint (POST /api/queue/capture)]
                          └──required by──> [iOS Shortcut Share Sheet integration]

[Mobile Capture Endpoint]
    └──required by──> [Inbox List UI] (items must exist to display)

[URL Content Extraction (Readability.js + JSDOM + metascraper)]
    └──required by──> [Crystallize Flow]
                          └──required by──> [AI Triage Summary (pre-generated on ingest)]
                          └──enhances──>    [Socratic Chat Session (seed context injection)]

[Crystallize Flow]
    └──depends on──> [Existing Neurogenesis Flow] (produces Neurons from the chat)
    └──depends on──> [Existing Socratic Chat] (opens a new conversation with seed context)

[4-State Status Machine (Inbox → Resource / Passive Debt → Mastered)]
    └──required by──> [Inbox List UI] (status drives visual grouping and badges)
    └──enhances──>    [Passive Debt Badge] (count query on status)

[Neurogenesis Flow (existing)]
    └──enhances──> [Auto-advance queue item to Mastered] (on Neuron creation, link back to source queue item)

[graphStore.ts (existing leftPanelMode)]
    └──requires extension──> ['queue' mode added to leftPanelMode enum]
```

### Dependency Notes

- **Personal API Key requires DB schema first:** The `user_api_keys` table (or a `api_key` column on the users profile) must exist before the mobile capture endpoint can authenticate. This is a prerequisite for everything in the mobile capture chain.
- **Crystallize depends on Neurogenesis (already built):** The Crystallize flow is not a new Neurogenesis — it is a wrapper that opens an existing chat session pre-seeded with extracted content. Neurogenesis runs inside that chat as normal.
- **graphStore.ts mode must be extended:** The existing `leftPanelMode` is `'chat' | 'neuron' | 'review'`. A `'queue'` mode must be added. This is a low-risk change but touches the store and all mode-switching logic.
- **AI isolation is structural, not a feature:** The queue table must never be joined into the conversation context queries. This is an implementation constraint, not a UI feature. It should be enforced at the data layer (separate tables, no FK join in chat queries).

---

## MVP Definition

### Launch With (v1.1)

Minimum to validate the cognitive funnel concept.

- [ ] `queue_items` table with 4-state status enum (`inbox`, `resource`, `passive_debt`, `mastered`) and `content_type` (`url` | `note`) — database prerequisite for everything
- [ ] `user_api_keys` table or column — prerequisite for mobile capture
- [ ] POST `/api/queue/capture` endpoint with bearer token auth — enables iOS Shortcut
- [ ] Basic iOS Shortcut (documented, not shipped in-app) — one-tap URL send from Safari
- [ ] Inbox List UI in Left Panel (`leftPanelMode: 'queue'`) — shows items with status, title, favicon
- [ ] Manual triage: Promote to Resource, Mark as Passive Debt, Delete — basic state transitions
- [ ] "Add URL" text field in Left Panel — desktop capture fallback
- [ ] Crystallize flow: fetch URL content (Readability.js), inject as seed context into new Socratic chat session — core differentiator
- [ ] AI isolation enforcement: queue table excluded from all chat context queries

### Add After Validation (v1.x)

- [ ] Pre-generated AI triage summary on ingest — reduces decision fatigue, but requires an extra AI call per capture; validate demand first
- [ ] Passive Debt count badge on the Left Panel queue tab — ambient pressure UI; trivial once list exists
- [ ] Auto-advance queue item to Mastered when a Neuron is created from a Crystallize session — requires linking `queue_item_id` to the Neurogenesis flow
- [ ] Plain text note capture via iOS Shortcut (not just URLs) — same endpoint, `content_type: 'note'`

### Future Consideration (v2+)

- [ ] Bulk onboarding import (capped at 10 items with warning) — only if user research shows friction at onboarding
- [ ] Open Graph preview image display in inbox list — nice polish, not functional
- [ ] Queue item tagging / manual categorization — adds organizational complexity without improving the funnel mechanics

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `queue_items` DB schema + 4-state status | HIGH | LOW | P1 |
| `user_api_keys` auth | HIGH | LOW | P1 |
| POST capture endpoint (bearer token) | HIGH | LOW | P1 |
| Inbox List UI (queue mode in Left Panel) | HIGH | MEDIUM | P1 |
| Crystallize flow (URL extraction → chat seed) | HIGH | MEDIUM | P1 |
| Manual triage controls | HIGH | LOW | P1 |
| "Add URL" desktop input | MEDIUM | LOW | P1 |
| AI isolation enforcement | HIGH | LOW (structural) | P1 |
| Passive Debt count badge | MEDIUM | LOW | P2 |
| Pre-generated AI summary on ingest | MEDIUM | MEDIUM | P2 |
| Auto-advance to Mastered on Neurogenesis | MEDIUM | LOW | P2 |
| Plain text note capture | LOW | LOW | P2 |
| Open Graph preview images | LOW | LOW | P3 |
| Queue item tagging | LOW | MEDIUM | P3 |

---

## Mobile Capture: How iOS Shortcuts Works

**Confidence: MEDIUM** (based on multiple web sources; Apple Shortcuts API behavior verified against official Apple docs)

### Mechanism

iOS Shortcuts has a "Get Contents of URL" action that supports POST requests with custom headers and a JSON body. When a shortcut is added to the Share Sheet (toggle "Show in Share Sheet" in the shortcut settings), it receives the shared URL as an input variable.

A minimal capture shortcut:
1. Receives the shared URL from the Share Sheet as `Shortcut Input`
2. Runs "Get Contents of URL" with:
   - URL: `https://app.neurograph.com/api/queue/capture`
   - Method: POST
   - Headers: `Authorization: Bearer <user_api_key>`
   - Body (JSON): `{ "url": "<Shortcut Input>", "source": "ios_shortcut" }`
3. Shows a notification on success

### Security Model for the Capture Endpoint

- **Personal API key** is the auth primitive. It is a long random token (e.g., 32-byte hex via `crypto.randomBytes(32).toString('hex')`) stored hashed in the DB (bcrypt or SHA-256 HMAC).
- The endpoint is **stateless** — no session, no cookie. Each request re-validates the bearer token.
- The key is **scoped to a user** — the endpoint resolves `user_id` from the token and creates the queue item under that user.
- Key rotation: expose a "Regenerate API Key" button in user settings. Old key invalidated immediately.
- Rate limiting: apply to this endpoint (e.g., 30 requests/minute per key) to prevent abuse.

### What the Endpoint Receives

```typescript
// POST /api/queue/capture
// Authorization: Bearer <api_key>
{
  url?: string;        // for URL captures
  text?: string;       // for plain text/note captures
  title?: string;      // optional; overridden by OG title on server
  source?: string;     // "ios_shortcut" | "web_form" | "api"
}
```

### User Setup Flow

The user does not install a pre-built shortcut from the App Store (too much friction). The recommended pattern (used by Notion, Readwise, and others):
1. User copies their Personal API Key from the Settings page.
2. User opens a provided "Shortcut template" link (a `.shortcut` file or `shortcuts://` deep link) that pre-fills the endpoint URL with a placeholder `YOUR_API_KEY`.
3. User replaces the placeholder with their copied key.
4. User enables "Show in Share Sheet."

Alternatively: document the 4-step manual shortcut setup in an in-app tooltip. Most power users can do this in under 2 minutes.

---

## URL Content Extraction: Technical Approach

**Confidence: HIGH** (verified against official Mozilla Readability.js repo, metascraper npm, multiple 2025 implementation examples)

### Recommended Stack

**Metadata:** `metascraper` (npm: `metascraper`) with plugins:
- `metascraper-title` — falls back through OG title → HTML `<title>` → URL path
- `metascraper-description` — OG description → meta description
- `metascraper-image` — OG image → favicon
- `metascraper-author` — structured author extraction
- `metascraper-url` — canonical URL normalization

**Article body:** `@mozilla/readability` (npm: `@mozilla/readability`) + `jsdom` (npm: `jsdom`):
- Readability powers Firefox Reader Mode; battle-tested against real-world HTML
- Returns `title`, `byline`, `excerpt`, `content` (HTML), `textContent` (plain text), `publishedTime`
- `jsdom` provides the DOM environment Readability needs to run server-side in Node.js
- **Security note:** JSDOM must run with `runScripts: false` and `resources: 'usable'` disabled when processing untrusted URLs

### Extraction Pipeline

```
URL received
  → fetch(url) with a browser-like User-Agent header
  → html = await response.text()
  → [metascraper] extract OG metadata (title, description, image, author)
  → [jsdom + Readability] extract article body (textContent, publishedTime)
  → Store in queue_items: { og_title, og_description, og_image, extracted_text, author, published_at }
  → (optional) Run lightweight AI summary call → store in queue_items.summary
```

### What to Store in `queue_items`

```typescript
type QueueItem = {
  id: string;
  user_id: string;
  status: 'inbox' | 'resource' | 'passive_debt' | 'mastered';
  content_type: 'url' | 'note';
  url: string | null;
  raw_text: string | null;        // plain text from share, or extracted article body
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  author: string | null;
  published_at: string | null;
  summary: string | null;         // AI-pre-generated, nullable until computed
  source: string;                 // 'ios_shortcut' | 'web_form' | 'api'
  source_conversation_id: string | null; // set when Crystallize opens a chat
  created_at: string;
  updated_at: string;
};
```

### Failure Handling

- Paywalled or JS-rendered pages: Readability returns null for `textContent`. Fall back gracefully: store the OG metadata only, mark `raw_text: null`. Crystallize flow can still open a chat with just the title/description as seed context.
- Network errors: queue item is still created with `status: 'inbox'` and `raw_text: null`. Show a "content unavailable" indicator in the UI. User can still manually Crystallize (chat opens without seed content).
- Do NOT use a headless browser (Playwright/Puppeteer) for extraction. Too heavy for a per-capture server operation. Readability + JSDOM covers 80% of use cases. Accept the failure rate for paywalls and SPAs.

---

## Competitor Feature Analysis

| Feature | Readwise Reader | Recall.ai | Instapaper | NeuroGraph Approach |
|---------|-----------------|-----------|------------|---------------------|
| Inbox/queue | Yes, unified inbox | Yes, auto-organized | Yes, folder-based | Yes, 4-state funnel |
| URL capture | Browser extension + share sheet | Browser extension | Browser extension + share sheet | API key + iOS Shortcut + web form |
| Content extraction | Full article + highlights | AI summary auto-generated | Clean reader view | Readability.js text → Socratic chat seed only |
| AI processing | Ghostreader auto-summary | Auto-tag, auto-graph, auto-summarize | None (basic) | Summary on hover only; user must Crystallize |
| State transitions | Manual archive/tags | Auto-organized by AI | Manual folders | 4-state funnel with Passive Debt pressure |
| Knowledge graph output | Via integrations (Obsidian, Notion) | Auto-generated (anti-feature for us) | No | Only via Neurogenesis from Crystallize chat |
| Spaced repetition | Via Readwise sync | Basic | No | FSRS-6 on Neurons (not on queue items) |
| Core philosophy | Save more, review efficiently | Capture everything, AI organizes | Read later cleanly | Capture → mandatory active extraction |

The key competitive gap: all three competitors treat ingestion as the product. NeuroGraph treats ingestion as a liability that must be converted or discarded.

---

## Sources

- [Readwise Reader overview — Readwise Blog](https://blog.readwise.io/readwise-reading-app/)
- [Readwise Reader vs Instapaper vs Pocket 2025 — Medium/Mac O'Clock](https://medium.com/macoclock/readwise-reader-vs-instapaper-vs-pocket-which-one-wins-in-2025-2c5e182ca979)
- [Recall.ai features — getrecall.ai](https://www.getrecall.ai/)
- [Developing a PKM Workflow — The Dilettante Life](https://www.thedilettantelife.com/5-pkm-workflows/)
- [Mozilla Readability.js — GitHub](https://github.com/mozilla/readability)
- [Readability.js for RAG content cleanup — Phil Nash, Jan 2025](https://philna.sh/blog/2025/01/09/html-content-retrieval-augmented-generation-readability-js/)
- [Metascraper — metascraper.js.org](https://metascraper.js.org)
- [open-graph-scraper — npm](https://www.npmjs.com/package/open-graph-scraper)
- [iOS Shortcuts API requests — Apple Support](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios)
- [iOS Shortcuts Share Sheet — Apple Support](https://support.apple.com/guide/shortcuts/launch-a-shortcut-from-another-app-apd163eb9f95/ios)
- [Using JSON API with iOS Shortcut to update a website — trovster.com, 2024](https://www.trovster.com/blog/2024/05/using-a-json-api-and-ios-shortcut-to-update-my-website)
- [Notion API + Apple Shortcuts capture — Medium/Pythoneers](https://medium.com/pythoneers/use-notion-api-and-apple-shortcuts-to-capture-notes-in-seconds-264063a81d3d)
- [Bearer token authentication best practices 2025 — Security Boulevard](https://securityboulevard.com/2025/10/stateless-authentication-understanding-token-based-auth/)

---
*Feature research for: PKM Staging Area / Cognitive Funnel (NeuroGraph v1.1)*
*Researched: 2026-03-22*
