# Pitfalls Research

**Domain:** Cognitive MicroSaaS — Staging Area & Cognitive Funnel (v1.1 Milestone)
**Researched:** 2026-03-22
**Confidence:** HIGH (core pitfalls), MEDIUM (integration specifics)

---

## Critical Pitfalls

### Pitfall 1: The Passive Bookmark Graveyard

**What goes wrong:**
The Staging Area becomes a dumping ground. Users add URLs and ideas with zero friction, feel productive, and never Crystallize anything. The inbox fills indefinitely. The "cognitive funnel" becomes a one-way storage tank.

**Why it happens:**
Adding a capture endpoint with no friction is indistinguishable from a read-it-later app (Instapaper, Pocket). The inbox pattern is maximally easy to fill and maximally easy to ignore. Without a forcing function, items accumulate and the queue becomes psychological debt that users eventually abandon.

**How to avoid:**
- Never auto-populate UI with inline previews that simulate "having read" the content
- Show queue count as a pressure signal, not a status indicator — label it "Unprocessed" not "Saved"
- Enforce the four-state lifecycle (Inbox → Resource / Passive Debt → Mastered Neuron) with explicit state labels that carry negative connotations for stagnation ("Passive Debt" is intentionally uncomfortable)
- Consider a soft cap warning: "You have 10 unprocessed items. Consider Crystallizing before adding more."
- The Crystallize action must be the only way to make queue items feel "done" — no bulk-archive, no silent delete

**Warning signs:**
- Queue item count growing without Crystallize actions in analytics
- Users treating the API endpoint as a bookmarking service
- PRs that add "archive all" or "mark all as read" actions

**Phase to address:** Phase 1 (Data Model) — the schema must encode the lifecycle states with no ambiguity. Phase 3 (Staging Area UI) — the visual design must communicate urgency, not comfort.

---

### Pitfall 2: The AI Leaks Queue Context Into Chat

**What goes wrong:**
A URL is added to the queue. The user opens a Socratic Chat. The AI has somehow read the URL content — perhaps from a poorly-scoped RAG query or a context-building function that inadvertently joins queue items — and summarizes it without the user asking. The entire Crystallize flow is bypassed. The user "knows" what the article said because the AI told them.

**Why it happens:**
RAG functions frequently scope context broadly: "give me everything related to the current conversation topic." If queue items are indexed (even partially), they surface in retrieval. The existing `getRelevantContext()` in `src/lib/ai/rag.ts` queries Neurons by vector similarity — if queue items are accidentally embedded and stored in the same vector space, they will appear in results.

**How to avoid:**
- Queue items MUST live in a separate table (`knowledge_queue`) completely outside the vector index
- Queue items must never be passed to `embed()` on creation — embedding happens only on explicit Crystallize
- The `getRelevantContext()` function must have an explicit allowlist of sources; queue items must not be on that list
- Add a test: "Chat API receives no knowledge_queue data in system prompt" — enforce this in CI

**Warning signs:**
- AI response references article content the user hasn't explicitly discussed
- `getRelevantContext()` being modified to "also check the queue for relevant items"
- Queue items appearing in the RAG catalog injected into the system prompt

**Phase to address:** Phase 1 (Data Model) — isolation must be structural, not enforced by convention. Phase 2 (Crystallize flow) — RAG context injection must be explicitly tested for queue data absence.

---

### Pitfall 3: URL Extraction Brittleness

**What goes wrong:**
The Crystallize flow calls a URL fetch-and-extract endpoint. It works on ~60% of URLs during development (Medium, Wikipedia, clean blogs). It silently fails or returns garbage on:
- JavaScript-rendered SPAs (React apps, Next.js sites, dynamic dashboards)
- Paywalled content (NYT, WSJ, academic journals)
- PDFs served via HTTP
- URLs that require login (LinkedIn, private GitHub repos)
- Sites with aggressive anti-bot protection (Cloudflare CAPTCHA)
- Mobile-redirect URLs from iOS Share Sheet

The Crystallize flow proceeds with empty or truncated content, the AI generates a summary of essentially nothing, and the user opens the chat to find an incoherent Socratic session about a nearly blank document.

**Why it happens:**
Mozilla Readability (`@mozilla/readability` + `jsdom`) extracts static HTML reliably but cannot execute JavaScript. SPAs serve near-empty HTML shells with content injected post-load. Cheerio has the same limitation. Playwright/Puppeteer solve this but are prohibitively expensive in a serverless context (heavy RAM, cold-start time, per-invocation cost).

**How to avoid:**
- Use Mozilla Readability + `jsdom` as the first pass — it handles ~70% of use cases (static sites, blogs, news) and is lightweight
- On extraction failure (< 200 chars of body text), return a structured failure signal: `{ success: false, reason: 'insufficient_content', url }` — do NOT proceed to Crystallize
- Present the failure gracefully in the UI: "We couldn't extract content from this URL. Paste the key passage you want to explore instead." — this maintains the active extraction philosophy
- Never spin up headless Chromium in a Vercel serverless function for this; the Hobby tier has a 10s timeout and headless Chromium cold-starts in 3-5s alone
- For Vercel deployment: set `maxDuration = 15` on the extraction route; fail fast after 10s and return the partial result or failure signal
- Store the raw extracted text in `knowledge_queue.extracted_content` — do not re-fetch at Crystallize time; use what was captured

**Warning signs:**
- Crystallize sessions where the AI says "I don't have enough information about this article"
- Vercel function timeouts in logs on the extraction endpoint
- `extracted_content` field in the DB containing less than 500 characters for full articles

**Phase to address:** Phase 2 (Crystallize flow) — extraction must be treated as unreliable by design, with explicit fallback paths.

---

### Pitfall 4: Middleware-Only API Key Authentication (CVE-2025-29927)

**What goes wrong:**
The personal API key capture endpoint (`POST /api/capture`) is protected solely by a Next.js middleware check that validates the `Authorization: Bearer <key>` header. An attacker sends the `x-middleware-subrequest` header (CVE-2025-29927) and bypasses the middleware entirely, writing arbitrary items into the knowledge queue of any user whose key has been compromised — or, if the user lookup is broken, into other users' queues.

**Why it happens:**
CVE-2025-29927 (CVSS 9.1, disclosed March 2025) allows any attacker to bypass Next.js middleware by sending the internal `x-middleware-subrequest` header. It affects all Next.js versions below 14.2.25 (for the 14.x line). The existing NeuroGraph middleware at `src/middleware.ts` uses the standard Supabase session pattern — it does not handle the capture endpoint at all — but adding middleware-only auth for the new endpoint would be silently bypassed.

**How to avoid:**
- Verify the API key **inside the route handler itself** (`src/app/api/capture/route.ts`), never rely solely on middleware
- The pattern: read `Authorization` header → hash it → compare against `user_api_keys.key_hash` in Supabase → reject if no match
- Never expose the raw key in logs or error responses
- Verify the current Next.js version is >= 14.2.25 before shipping; patch if below
- Strip `x-middleware-subrequest` header at the load balancer/proxy layer as defense-in-depth

**Warning signs:**
- Any PR that moves API key validation out of the route handler and into middleware
- A test suite that only checks auth in middleware and not in the route handler directly
- Next.js version in `package.json` below 14.2.25

**Phase to address:** Phase 1 (API key system) — the route handler must own its own auth from day one.

---

### Pitfall 5: API Key Stored as Plaintext

**What goes wrong:**
The personal API key is generated with `crypto.randomUUID()` or a similar method and stored directly in `user_api_keys.key`. The database is compromised (Supabase table export, misconfigured RLS, accidental log exposure). All user keys are immediately usable by the attacker to inject queue items on behalf of any user.

**Why it happens:**
API keys feel less sensitive than passwords because they are "just for mobile capture." Developers skip hashing because the key needs to be shown to the user once (after generation) and then only verified — the pattern is identical to password hashing but the threat model is less obvious.

**How to avoid:**
- Store only the bcrypt (or argon2) hash of the key; show the plaintext key to the user exactly once at generation time
- Use a `key_prefix` (first 8 characters) stored in plaintext alongside the hash for display purposes ("sk-abc12345...") — this lets the user identify which key is which without storing the full value
- The verification flow: hash the incoming bearer token → compare with stored hash (use `bcrypt.compare()`, not `===`)
- RLS policy on `user_api_keys` must ensure users can only read/delete their own keys, and the `key_hash` column must not be readable by the client — only server-side route handlers should access it

**Warning signs:**
- `user_api_keys` table with a `key` column (plaintext)
- Client-side code that reads from `user_api_keys`
- No bcrypt/argon2 dependency in `package.json`

**Phase to address:** Phase 1 (API key system) — schema design must enforce this from the first migration.

---

### Pitfall 6: The Left Panel Mode Explosion

**What goes wrong:**
`leftPanelMode` in `graphStore.ts` currently has three values: `'chat' | 'neuron' | 'review'`. Adding Queue mode makes it four. In six months it will be five or six. Each new mode requires: a new union type value, a new render branch in `ChatPanel.tsx`, a new navigation item in `AppSidebar.tsx`, a new action in the store, and updated tests. The store becomes a pseudo-router; the sidebar becomes a tab bar; the Left Panel becomes a modal stack in disguise.

**Why it happens:**
The mode pattern is locally reasonable for 2-3 states. It does not scale. Adding a fourth mode by appending to the union is the path of least resistance, but it entangles navigation, state, and rendering in a single string value.

**How to avoid:**
- Queue mode should render as a contextual overlay or a distinct sub-panel within the existing sidebar navigation, not as a fourth tab in the main left panel
- Specifically: the Queue ("Staging Area") navigates via the `AppSidebar.tsx` nav items (a new route `/app/queue`) using the existing Link-based nav pattern — this keeps `leftPanelMode` scoped to panel content and the sidebar scoped to page-level navigation
- Do NOT add `'queue'` to the `leftPanelMode` union in `graphStore.ts`
- The existing sidebar already has Chat and Review as nav items at `/app` and `/app/review` — Queue fits naturally as `/app/queue` in the same pattern

**Warning signs:**
- A PR that adds `'queue'` to the `leftPanelMode` type in `graphStore.ts`
- The `AppSidebar.tsx` `navItems` array growing beyond 3 items with inline panel-switching logic mixed into navigation
- The `ChatPanel.tsx` component rendering queue items conditionally based on `leftPanelMode`

**Phase to address:** Phase 3 (Staging Area UI) — architecture decision must be made before building the UI component.

---

### Pitfall 7: iOS Shortcuts Silent Failure on Non-200 HTTP Status

**What goes wrong:**
The iOS Shortcut sends a URL to the capture endpoint. The API returns a 401 (expired or wrong key) or a 422 (validation error). The iOS Shortcuts "Get Contents of URL" action does not expose the HTTP status code by default — it only returns the response body. If the body is empty or not the expected format, the shortcut silently fails. The user believes their content was captured. It was not. They discover this days later when the item is not in their queue.

**Why it happens:**
iOS Shortcuts' "Get Contents of URL" action behavior: it does not check HTTP status codes; it checks the response body. If the API returns `{"error":"Unauthorized"}` with a 401, Shortcuts still "succeeded" from its own perspective and the response body is discarded unless explicitly handled. Most capture endpoint tutorials don't account for this because they test with 200 responses only.

**How to avoid:**
- Always return a JSON response body with a `success` boolean field: `{"success": true, "id": "..."}` or `{"success": false, "error": "..."}`
- Document the iOS Shortcut setup with an explicit "If [response `success`] is `false`, show notification 'Capture failed: [response `error`]'" action
- The shortcut template provided to users MUST include the error branch
- Test the Shortcut with an invalid key deliberately before shipping

**Warning signs:**
- Capture endpoint returning HTTP errors with empty bodies
- User reports that "sometimes items don't show up in the queue" with no server-side error logs
- iOS Shortcut template in documentation that only handles the happy path

**Phase to address:** Phase 2 (Capture endpoint) — the API contract must be designed for Shortcuts' limitations from the start.

---

### Pitfall 8: The Spaghetti Graph (Preserved from v1.0)

**What goes wrong:** Users create connections between Neurons haphazardly, resulting in an unreadable web where prerequisites are impossible to parse.

**Why it happens:** React Flow allows unconstrained edge creation by default.

**How to avoid:** Enforce a Strict Directed Acyclic Graph (DAG) layout. Intercept edge creation in `useEdgesState` and reject cycles. Use `dagre` or `elkjs` to auto-layout the graph so it always reads top-to-bottom or left-to-right.

**Warning signs:** Edges overlapping horizontally; circular dependencies in the DB.

**Phase to address:** Phase 2 (Core Graph & UI) and Phase 4 (Strict DAG Enforcer).

---

### Pitfall 9: Tool Call Rehydration Failure (Preserved from v1.0)

**What goes wrong:** A user refreshes the page, and the chat history fails to render the interactive "Neurogenesis" tools or selection UI correctly.

**Why it happens:** Vercel AI SDK persists tool calls as raw JSON in the DB. If the schema changes or the frontend component expects a different structure, it crashes during rehydration.

**How to avoid:** Strict `zod` schema versioning for all tools. Ensure the DB `messages` table stores raw AI SDK v6 message arrays faithfully.

**Warning signs:** Errors like "Cannot render tool XYZ" on page reload.

**Phase to address:** Phase 3 (The Socratic Chat Engine).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store raw API key in DB | Simpler verification (`===`) | Full key exposure on any DB read | Never |
| Embed queue items on capture | Enables future RAG search of queue | Queue content bleeds into chat AI context | Never — breaks core AI isolation invariant |
| Add `'queue'` to `leftPanelMode` | Fastest path to a working UI | Mode explosion, panel/router conflation | Never for this milestone |
| Use `fetch()` + Readability for all URLs including SPAs | Zero infra cost | Silent failures on ~30-40% of modern URLs | Acceptable at MVP if failures are surfaced clearly |
| Re-fetch URL at Crystallize time (not on capture) | Avoids storage of extracted text | Fetch may fail at Crystallize if URL changes or goes 404 | Never — capture the content at capture time |
| Validate API key in middleware only | Less code per route | Entire auth bypass via CVE-2025-29927 | Never |
| Show queue items to user as "saved" without state labels | Feels friendly | Trains passive behavior; queue becomes graveyard | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Mozilla Readability + jsdom | Running in a Vercel Edge Function (jsdom requires Node.js APIs not available in Edge runtime) | Use Node.js runtime (`export const runtime = 'nodejs'`) on the extraction route |
| Supabase RLS on `user_api_keys` | Forgetting that views bypass RLS by default in Postgres < 15 | Set `security_invoker = true` on any views over the keys table; verify RLS is enabled per-table |
| Supabase service role key in capture route | Using the service role client to bypass RLS during key lookup "because it's simpler" | Use a server-side client with the user's session — or use a dedicated DB function that accepts the key hash as a parameter and returns the user_id without exposing the full key row |
| iOS Shortcuts `Get Contents of URL` | Passing Authorization header value with literal "Bearer " prefix duplicated | Header value should be exactly `Bearer sk-<key>` — Shortcuts text interpolation adds no automatic prefix |
| Next.js `maxDuration` on extraction route | Setting `maxDuration = 300` (5 min) expecting it to work on Hobby tier | Hobby tier caps at 10s regardless of `maxDuration` declaration; Pro tier is required for 60s+. Design for a 10s budget. |
| Supabase `user_metadata` in RLS | Using `auth.jwt()->'user_metadata'->>'role'` in RLS policy for key auth | `user_metadata` is writable by authenticated users and cannot be trusted for authorization; use a dedicated table |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full article HTML synchronously during capture API call | iOS Shortcut timeout (default 30s but feels instant) | Run extraction synchronously but cap at 8s; return partial on timeout | Every large article on slow sites |
| Polling queue state from client every N seconds | Unnecessary Supabase reads on every page visit | Use Supabase Realtime subscription on `knowledge_queue` for the user's rows, or simple invalidation on mutation | ~50+ active users polling simultaneously |
| Re-rendering the entire queue list on every queue state change | Queue list flickers; cursor jumps | Memoize queue item rows; key by `id` not index | ~20+ items in queue |
| Too Many React Flow Nodes (preserved) | Graph panning drops to 15 FPS | `throttle` on pan/zoom, DOM-light custom nodes, memoization | ~300+ nodes |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Relying on Next.js middleware for capture endpoint auth | Complete auth bypass via CVE-2025-29927 (CVSS 9.1) | Verify API key inside the route handler; ensure Next.js >= 14.2.25 |
| Storing API key plaintext in DB | Full key compromise on DB read leak | Store bcrypt hash only; show key to user exactly once |
| `knowledge_queue` rows without `user_id` foreign key + RLS | Any authenticated user can read/write any queue item | `ALTER TABLE knowledge_queue ENABLE ROW LEVEL SECURITY` in the migration; enforce `user_id = auth.uid()` |
| Accepting any URL in the capture endpoint without validation | SSRF (Server-Side Request Forgery) — attacker sends `http://169.254.169.254/latest/meta-data/` (AWS metadata endpoint) | Validate URL scheme is `https://`; block private IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x) before fetching |
| Logging the Authorization header on capture endpoint errors | Key appears in Vercel log drain in plaintext | Never log `request.headers.get('authorization')`; log only the key prefix for debugging |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Passive Ingestion Drift (preserved) | Users paste a dump of text into chat and say "summarize it into nodes" | AI rejects: "Read it and tell me what YOU found interesting, then we'll create the node." |
| Queue as comfort (items labeled "Saved") | Users feel accomplished for adding items; never Crystallize | Label queue items "Unprocessed" or "Pending Extraction" — uncomfortable language signals the item demands action |
| Auto-preview of article content inline in queue list | User reads the article in the queue without Crystallizing | Show only title + domain + capture date; NO content preview or AI summary in the queue list |
| Adding a fourth tab to the Left Panel for Queue | Navigation feels cluttered; users aren't sure which mode is "the real app" | Queue is a sidebar nav route (`/app/queue`), not a Left Panel mode — same pattern as Chat vs Review |
| Fog of War Frustration (preserved) | Users can't see the full scope of what they are learning | Ghost Nodes show DAG shadows but blur content/titles until unlocked |
| Showing empty queue as "All done!" | Users feel no pressure to capture anything | Empty state should show a prompt: "Nothing queued. Share a URL from iOS to begin." |

---

## "Looks Done But Isn't" Checklist

- [ ] **API Key Auth:** Key is verified inside the route handler, not just middleware — test by sending a request with `x-middleware-subrequest` header and confirm it still gets a 401
- [ ] **API Key Storage:** `user_api_keys` table has `key_hash` (bcrypt), not `key` (plaintext) — verify in DB schema migration
- [ ] **AI Isolation:** Chat API system prompt construction (`getRelevantContext`) has a test asserting zero `knowledge_queue` rows appear in context
- [ ] **URL Extraction Failure Handling:** Extraction route returns `{ success: false, reason, url }` and the UI presents a fallback "paste content manually" path — not a blank Crystallize chat
- [ ] **Queue State Labels:** UI uses "Unprocessed" / "Passive Debt" language, not "Saved" / "Bookmarked"
- [ ] **iOS Shortcut Error Handling:** Shortcut template includes an explicit error branch that notifies the user when `success` is `false`
- [ ] **RLS on knowledge_queue:** `SELECT * FROM knowledge_queue` as a different authenticated user returns zero rows for another user's items
- [ ] **SSRF prevention:** Capture endpoint rejects `http://` URLs and private IP ranges; test with `http://127.0.0.1` and verify 400 response
- [ ] **Vercel timeout budget:** Extraction route tested against a slow real-world URL; confirms it returns within 10s (or surfaces a clear failure, not a gateway timeout)
- [ ] **leftPanelMode untouched:** `graphStore.ts` `leftPanelMode` type is still `'chat' | 'neuron' | 'review'` — Queue is a route, not a mode

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Queue became a passive graveyard | HIGH | Add "Passive Debt" aging labels in UI; run a migration to timestamp-sort items and highlight anything > 7 days old; send weekly digest email ("You have 12 unprocessed items") |
| Plaintext API keys discovered in DB | HIGH | Immediately revoke all keys; force re-generation; notify affected users; migrate to hashed storage |
| AI context contamination from queue | MEDIUM | Audit `getRelevantContext()` for queue joins; add missing filter; re-test; no data migration needed if queue items were never embedded |
| URL extraction producing garbage | LOW | Add content-length check post-extraction; add manual paste fallback UI — pure frontend/API change, no schema migration |
| `leftPanelMode` union grew to 5 states | MEDIUM | Extract Left Panel rendering into a dedicated component router; migrate the mode string to a proper routing solution; update all store consumers |
| CVE-2025-29927 exploited on capture endpoint | HIGH | Rotate all API keys immediately; patch Next.js; audit logs for unauthorized capture writes; inform affected users |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Passive Bookmark Graveyard | Phase 1 (Data model state machine) + Phase 3 (Queue UI) | Queue items without Crystallize events age visibly; no bulk-archive action exists |
| AI Leaks Queue Context | Phase 1 (Separate table) + Phase 2 (Crystallize flow tests) | CI test: chat API context includes zero `knowledge_queue` rows |
| URL Extraction Brittleness | Phase 2 (Crystallize flow) | Extraction route tested against 10 diverse URLs including SPAs and paywalled sites; failure path UI verified |
| Middleware-Only Auth (CVE) | Phase 1 (Capture endpoint) | Route handler auth tested in isolation without middleware; CVE header test in CI |
| Plaintext API Key Storage | Phase 1 (DB schema) | Schema review: `key_hash` column present, `key` column absent |
| Left Panel Mode Explosion | Phase 3 (Queue UI architecture decision) | `leftPanelMode` type reviewed in PR; Queue renders as `/app/queue` route |
| iOS Shortcuts Silent Failure | Phase 2 (Capture endpoint) | Shortcut template documentation includes error branch; API contract tested with 401/422 responses |
| SSRF via URL capture | Phase 2 (Capture endpoint) | Unit test: `http://127.0.0.1` and `http://169.254.169.254` return 400 |

---

## Sources

- CVE-2025-29927 Next.js Middleware Bypass: [ProjectDiscovery Analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass), [Vercel Postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass), [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-29927)
- Next.js Security Guide 2025: [TurboStarter Complete Guide](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
- Supabase API Key Management: [Makerkit Guide](https://makerkit.dev/blog/tutorials/supabase-api-key-management), [Supabase Docs: API Keys](https://supabase.com/docs/guides/api/api-keys), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Mozilla Readability: [WebcrawlerAPI Extraction Guide](https://webcrawlerapi.com/blog/how-to-extract-article-or-blogpost-content-in-js-using-readabilityjs), [mozilla/readability GitHub](https://github.com/mozilla/readability)
- Web Scraping SPA Pitfalls: [Browserless Playwright Guide](https://www.browserless.io/blog/scraping-with-playwright-a-developer-s-guide-to-scalable-undetectable-data-extraction), [Apify JS Libraries 2025](https://blog.apify.com/best-javascript-web-scraping-libraries/)
- Vercel Function Timeouts: [Vercel Limitations Docs](https://vercel.com/docs/functions/limitations), [Inngest Timeout Solutions](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)
- iOS Shortcuts API Limitations: [Apple Support: API Limitations](https://support.apple.com/guide/shortcuts/api-limitations-apd891a6c84e/ios)
- PKM Passive Collection Anti-patterns: [Capacities PKM Guide](https://capacities.io/blog/guide-to-pkm/), [TabMark PKM Bookmarks](https://tabmark.dev/blog/pkm-bookmarks/)
- Cognitive Load in UI: [Nielsen Norman Group](https://www.nngroup.com/articles/minimize-cognitive-load/), [Smashing Magazine](https://www.smashingmagazine.com/2016/09/reducing-cognitive-overload-for-a-better-user-experience/)

---

*Pitfalls research for: NeuroGraph v1.1 — Staging Area & Cognitive Funnel*
*Researched: 2026-03-22*
