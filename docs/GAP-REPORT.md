# Gap report — rebuild vs the originals

**Date:** 2026-11-03 · **Scope:** read-only inventory, no code changed
**Question answered:** what exists in the older copies that the rebuild does not have, and what should be ported for the MVP?

## TL;DR

1. **The rebuild is not a subset of the old client — it is a different, larger app.** 58 page files / 24 components vs 50 / 19 in the old one, and the rebuild *adds* commerce (`store/[productId]`, `cart`, `checkout`, `orders`, `favourites`), social (`feed`, `chat`, `quests`), `world`/`jungle`, and a real signup/reset flow.
2. **Most of the loud "missing pages" in the old copy are hardcoded mockups**, not features: `notifications.js`, `search.js`, `myvendors.jsx`, `vendorform.jsx`, `game-test.js`, `dreamlog.js` all render literal arrays (`"VENDOR NAME"`, `"EVENT NAME"`, `// Would save to API`). Porting them as-is would mean porting fake data.
3. **1,655 lines of the old `components/` are dead code** — no importer anywhere: `TopDownRacer.jsx` (796), `JungleMap.jsx` (363), `InviteCollaboratorsDialog.jsx` (159), `Map.jsx` (102), `Navbar.jsx` (100), `SessionCard.jsx` (72), `TicketSelectionModal.jsx` (63).
4. **The real, honest gaps are four invitation/organizer flows** — talent preview/success, vendor preview/success (+ product & portfolio attachment), event-admin talent submissions, and the TKXTS "my events" back office (list, edit, guests, talent, vendors).
5. **Two whole backend domains have zero client**: `hunt` (9 endpoints) and `portfolio` (10 endpoints). That is the largest unused surface in the project.

## Sources

| what | path | state |
|---|---|---|
| old client ("CONSOLIDATED") | `/Users/Bonzo/projects/CONSOLIDATED/client` | `lucid-jungles-consolidated`, no git, last touched 2026-06-11 |
| archive of its unique files | `/Users/Bonzo/projects/_archive/CONSOLIDATED_unique_2026-10-14` | 92 of 189 source files; `public/` assets are not in it, but all 102 are already in the rebuild |
| original static design | `/Users/Bonzo/projects/OG/original-frontend` | 73 files, `index.html` + art, 201 MB, not a git repo |
| the rebuild | `/Users/Bonzo/projects/OG/rebuilt-frontend` | HEAD `cd6d3e7`, pushed to `gosi-dev/lucid-jungles-frontend` |
| the API | `/Users/Bonzo/projects/OG/original-backend` | HEAD `cf7269c`, 25 route files, ~140 endpoints |

Method: page/component line counts (`wc -l`), importer analysis (`grep -rl`), per-client API-target grep, and reading every old-only page to separate real behaviour from mock data.

## Feature matrix

Verdicts: **parity+** rebuild is ahead · **parity** same feature · **shrunk** exists with less than the old one · **missing** no rebuild equivalent · **rebuild-only win** nothing to port.

### Entry, identity, settings

| feature | old | rebuild | verdict | notes |
|---|---|---|---|---|
| landing / map entry | `index.js` 367 | `index.js` 380 | parity+ | both drive the map shell |
| about | `about.js` 35 | `about-us.js` 609 | parity+ | old was a stub |
| login | `auth/login.js` 40 | `signin.js` 114 | parity+ | |
| signup | `auth/signup.js` 42 | `signup.js` 112 → `signup-two` 107 → `signup-three` 60 | parity+ | multi-step now |
| email verify | `auth/verify-email.js` 33 | *(none)* | **confirm** | may be folded into `signup-three`; no dedicated page |
| phone verify | `auth/phone-verification.js` 33 | *(none)* | **confirm** | same doubt |
| password reset | *(none)* | `forgot-password.js` 86, `reset-password.js` 132 | rebuild-only win | |
| settings | `settings.js` 37 | `settings.js` 126 | parity+ | |
| my profile ("you") | `you/index.js` 118 | `you/index.js` 145 | parity+ | |
| session state | `context/AuthContext.js` 55 | `hooks/useSignedIn.js` 46 + cookie session | parity | different mechanism, same job |

### The world / map

| feature | old | rebuild | verdict | notes |
|---|---|---|---|---|
| "Digital Plane" jungle map | `dreaming.js` 1056 (+ `components/Map.jsx` 102, `data/jungleMapElements.js` 259, `data/rotatePhoneAnimation.js` 136) | `jungle.js` 462 + `world.js` 123 + `JungleMapCanvas.jsx` 261 + `MapNodes.jsx` 416 + `lib/plan.js` 454 + `data/jungleMapElements.js` | **shrunk — verify parity** | old is one 1,056-line page: 77px grid, procedural jungle, entity nodes (Kura / MOJ / CCStudios / Dojo / Bonzo), SVG paths, hover cards, 70vh drawer. The rebuild splits it into components — confirm grid size, node placement and drawer height against the Figma spec before `dreaming.js` is deleted |
| immersive | `immersive.js` 282 | `immersive.js` 283 | parity | |
| unity / game embed | `game-test.js` 17 (placeholder) + dead `TopDownRacer.jsx` 796 | `UnityPlayer.jsx` 56, `status.js` 337 | rebuild-only win | the React canvas game was never wired up |

### Kura, dreams, routine

| feature | old | rebuild | verdict | notes |
|---|---|---|---|---|
| Kura home base | `kura.js` 101 | `kura.js` 1003 | parity+ | |
| dream log | `dreamlog.js` 117 (**mock**) | inside `kura.js`, real `/api/dreamlog` | rebuild-only win | old had `MOCK_DREAMS` + `// Would save to API` |
| routine | *(none)* | `/api/routine/{today,generate}` in 4 files | rebuild-only win | |
| dojo | `dojo.js` 102 | `dojo/index.js` 575 + `dojo/onboarding.js` 363 | parity+ | |
| quests | *(none)* | `quests.js` 141 + `/api/quests` | rebuild-only win | |

### Commerce (store)

| feature | old | rebuild | verdict |
|---|---|---|---|
| store front | `store.js` 98 | `store.js` 293 (with shelf ceiling, `lib/stock.js`) | parity+ |
| product detail | *(none)* | `store/[productId].js` 179 | rebuild-only win |
| cart | *(none)* | `cart.js` 218 (`MAX — ONLY n LEFT`) | rebuild-only win |
| checkout | *(none)* | `checkout.js` 311 + `CheckoutSteps.jsx` 68 | rebuild-only win |
| orders | *(none)* | `orders.js` 95 | rebuild-only win |
| favourites | *(none)* | `favourites.js` 146 + `FavouriteButton.jsx` 81 | rebuild-only win |

### Events, tickets, payment

| feature | old | rebuild | verdict | notes |
|---|---|---|---|---|
| event browse | `events/tickets.js` 608 | `events/index.js` 77 + `events/tickets.js` 484 | parity | |
| event detail | `events/[eventId].js` 589 | `events/[eventId].js` 246 | **not a regression** | old hardcoded `"FIRSTNAME LASTNAME"` talent; the rebuild fetches real ones |
| entities browser | `events/[eventId]/entities/index.js` 372 | `…/entities/index.js` 145 | **shrunk — verify** | old had TALENTS / VENDORS tabs; confirm all tabs survived |
| ticket selection | dead `TicketSelectionModal.jsx` 63 | `TicketCard.jsx` 117 + `TicketsList.jsx` 40 | parity+ | |
| event checkout | `…/checkout.js` 299 | `…/checkout.js` 244 + `payment.js` 467 | parity+ | rebuild adds a payment step |
| payment success | `…/payment-success.js` 135 | `…/payment-success.js` 206 + `ticket-confirmed.js` 72 | parity+ | |
| create event | `createevents.js` 234 | `createevents.js` 140 | parity | same form + `EventContext`; old imported `next/navigation` in a Pages-Router app (a bug) |
| **event admin: talent submissions** | `events/[eventId]/admin/talent-submissions.js` 41 | *(none)* | **missing** | genuinely absent route |

### Invitations — the honest gap

| feature | old | rebuild | verdict |
|---|---|---|---|
| invite landing | `invitation/[inviteId]/talent/index.js` 80 · `…/vendor/index.js` 21 | `invitation/[inviteId]/index.js` 60 | parity |
| talent form | `…/talent/form.js` 248 | `…/talent/form.js` 73 | **shrunk** |
| talent preview | `…/talent/preview.js` 217 | *(none)* | **missing** |
| talent success | `…/talent/success.js` 33 | *(none)* | **missing** |
| vendor form | `…/vendor/form.js` 554 (profile picture, portfolio files, product list, admin notes + `ProductForm.js` 205) | `…/vendor/form.js` 73 (posts `/api/invitations/:id/respond`) | **shrunk hard** |
| vendor preview | `…/vendor/preview.js` 240 | *(none)* | **missing** |
| vendor success | `…/vendor/success.js` 31 | *(none)* | **missing** |
| vendor self-view | `…/vendor/vendor.js` 79 | *(none)* | **missing** |

### Organizer back office (TKXTS)

| feature | old | rebuild | verdict |
|---|---|---|---|
| my events list | `tkxts/myevents/index.js` 100 | *(none)* | **missing** |
| event dashboard | `…/[eventId]/dashboard.js` 126 | `…/dashboard.js` 87 | parity |
| edit event | `…/[eventId]/edit.js` 140 | *(none)* | **missing** |
| guests | `…/[eventId]/guests.js` 44 | *(none)* | **missing** |
| talent | `…/[eventId]/talent.js` 41 | *(none)* | **missing** |
| vendors | `…/[eventId]/vendors.js` 41 | *(none)* | **missing** |
| program | `…/[eventId]/program.js` 46 | `…/program.js` 100 | parity+ |
| attendee tickets | `…/tickets.js` 111 · `mytickets/index.js` 101 | `…/tickets.js` 102 · `mytickets/index.js` 8 | parity |
| ticket detail | `mytickets/[ticketId].js` 262 | `mytickets/[ticketId].js` 69 | **shrunk** |

### Present in neither, or mock-only

| feature | old | rebuild | verdict |
|---|---|---|---|
| notifications | `notifications.js` 34 — hardcoded list, no API | *(none)*; backend has `activity.js` (1 endpoint), no notifications endpoint | **mock in old** |
| search | `search.js` 41 — hardcoded results | `SearchBar.jsx` 47 only, no results page | **mock in old** |
| my vendors | `myvendors.jsx` 37 — hardcoded list | *(none)* | **mock in old** |
| vendor application (standalone) | `vendorform.jsx` 48 — `alert()` only | *(none)*; real flow is the invitation form | **mock in old** |
| communities | `fanbases.js` 19 — stub | `fanbase/index.js` 187 + `[fanbaseId].js` 188, `/api/fanbase/*` | rebuild-only win |
| creator profile | `[username].js` 2414 | `[username].js` 3423 | parity+ |
| profile pages | `profile/[userId].js` 27 · `profile/index.js` 30 | `profile/[username].js` 214 · `profile/index.js` 1067 | parity+ |
| feed / chat | *(none)* | `feed.js` 160, `chat.js` 241 | rebuild-only win |
| homes | *(none)* | `/api/homes`, `/api/home` in 7 files | rebuild-only win |

## Backend coverage (25 route files, ~140 endpoints)

| route file | endpoints | client coverage in the rebuild |
|---|---|---|
| `store.js` | 23 | **full** — store, product, cart, favourites, checkout, orders |
| `events.js` | 15 | event browse, detail, entities, tickets, payment |
| `user.js` | 13 | profile, settings, upload-media |
| `portfolio.js` | 10 | **nothing** — only a drawer tab named "portfolio" in `[username].js` |
| `hunt.js` | 9 | **nothing — zero references anywhere** |
| `fanbase.js` | 9 | fanbase index + detail, join, my-dojo |
| `avatar.js` | 5 | referenced in 1 file (partial) |
| `dreamlog.js` | 5 | `kura.js`, `[username].js` |
| `home.js` | 5 | 7 files |
| `main.js` | 5 | 2 files |
| `feed.js` | 4 | `feed.js` |
| `tkxts.js` | 4 | tkxts pages |
| `chat.js` | 3 | `chat.js` |
| `invitations.js` | 3 | the two invite forms |
| `map.js` | 3 | 1 file |
| `quests.js` | 3 | `quests.js` |
| `routine.js` | 3 | 4 files |
| `tickets.js` | 3 | 4 files |
| `auth.js` | 2 | signin / signup |
| `activity.js` | 1 | 1 file |
| `homes.js` | 1 | 3 files |
| `kura.js` | 1 | 4 files |
| `users.js` | 1 | 3 files |
| `visit.js` | 1 | 2 files |

## What is genuinely missing — prioritised

Effort is a rough build-size, not a promise.

| # | gap | why it matters | effort | depends on |
|---|---|---|---|---|
| 1 | **Event admin: talent submissions** — `events/[eventId]/admin/talent-submissions.js` | organizers cannot review who applied; `events.js` endpoints already exist | S | — |
| 2 | **Vendor invitation: preview, success, self-view + the rich form** (profile picture, portfolio files, product list via `ProductForm.js`, admin notes) | the rebuild posts a 6-field form to `/api/invitations/:id/respond`; the old flow let a vendor build a *product catalogue* and preview their application | L | `ProductForm` port + upload endpoint (`/api/main/upload-media` exists) |
| 3 | **Talent invitation: preview + success + richer form** | 73 vs 248 lines; no preview/success steps | M | — |
| 4 | **TKXTS my-events back office** — list, edit, guests, talent, vendors | 5 routes absent; an organizer can reach a dashboard but not manage the event | M | `tkxts.js` has only 4 endpoints — may need backend work |
| 5 | **Entities browser parity** — old had TALENTS / VENDORS tabs (372 vs 145 lines) | confirm tabs survived the port before deleting the old copy | S–M | — |
| 6 | **Ticket detail parity** — 262 → 69 lines | the old page showed full purchase/QR detail | S–M | — |
| 7 | **Dreaming → jungle/world parity audit** — 1,056-line original | 77px grid, node placement, SVG paths, 70vh drawer | S verify, M to fix | Figma spec |
| 8 | **Hunt UI** (9 endpoints, zero client) | a whole backend domain is unreachable | L | API contract read |
| 9 | **Portfolio UI** (10 endpoints, zero client) | same | L | API contract read |
| 10 | **Notifications** | needs a backend endpoint first (`activity.js` is not it) | M | backend |
| 11 | **Search results page** | `SearchBar` exists but no results page or endpoint | M | backend |
| 12 | **Vendor management screen** (old `myvendors`) | only meaningful once #2 lands | S | #2 |
| 13 | **Email / phone verification** | old had dedicated pages; confirm the rebuild's `signup-three` covers it | S (confirm) | — |

## Do not port

| file | lines | why |
|---|---|---|
| `components/TopDownRacer.jsx` | 796 | **no importer**; superseded by `UnityPlayer.jsx` + `status.js` |
| `components/JungleMap.jsx` | 363 | **no importer**; superseded by `JungleMapCanvas.jsx` + `MapNodes.jsx` |
| `components/Map.jsx` | 102 | **no importer** — the only matches were the `lucide-react` `Map` icon; reference material for `MapNodes.jsx` at most |
| `components/InviteCollaboratorsDialog.jsx` | 159 | **no importer** |
| `components/Navbar.jsx` | 100 | **no importer**; superseded by `NavBar.jsx` |
| `components/SessionCard.jsx` | 72 | **no importer** |
| `components/TicketSelectionModal.jsx` | 63 | **no importer**; superseded by `TicketCard.jsx` |
| `pages/dreamlog.js` | 117 | hardcoded `MOCK_DREAMS`; the rebuild has a real dream log in `kura.js` |
| `pages/vendorform.jsx` | 48 | `alert()`-only form, no API |
| `pages/search.js` | 41 | hardcoded results |
| `pages/myvendors.jsx` | 37 | hardcoded list |
| `pages/notifications.js` | 34 | hardcoded list, no API |
| `pages/game-test.js` | 17 | placeholder screen |
| `pages/api/events.js` | 33 | fake Next API route; `next.config.js` now proxies `/api/*` to :3002 |

`components/ProductForm.js` (205) **is** worth porting — it is the product row editor inside the vendor invite form.

## Before deleting any copy

1. **GitHub is done for both repos** (2026-11-03) — but the backend `main` there is an *import commit*: the real 7-commit history lives only on the local branch `local-history-2026-11-03`, and its shallow parent chain (`18254ce…`) exists nowhere and is unrecoverable.
2. **`original-frontend` is the only copy of the original art** (`Kura.svg`, `Mide.png`, `Frames/User-base/*`, 73 files, 201 MB) and it is **not a git repo**. It must be archived, never `rm`-ed.
3. **`original-frontend/assets/roads` has mode `drw-r--r--`** (no execute bit on a directory), so `ls`/`du`/`cp` fail there. `chmod u+x` it before any copy or tar, or those SVGs are silently skipped.
4. **`_archive` holds 92 unique source files** from the old client — keep it until ports #1–#5 are finished.
5. **`UPDATED/` is not this project** (TKXTS remotes, 21 + 29 uncommitted files) — never part of this cleanup.
6. **Uncommitted work exists right now** and must be committed or stashed before any folder moves:
   - frontend: `components/MockAvatar.jsx`, `components/PlanRoom.jsx`, `pages/[username].js`, `pages/settings.js`, `scripts/README.md`, `scripts/verify-base.js`
   - backend: `src/lang/eng.json`, `src/models/homeBase.js`, `src/routes/home.js`, `src/routes/homes.js`, `src/data/` (untracked)
7. Stray tracked backups should be deleted in the rebuild: `pages/[username].js.bak` (792 lines) and `public/MOJ Frame.svg.bak`.

## Recommended order

1. **#1 event-admin talent submissions** (S) — smallest real gap, backend already supports it.
2. **#5 + #13 parity checks** (S) — entities tabs, ticket detail, email/phone verify: verify, don't rebuild.
3. **#2 vendor invitation flow** (L) — `ProductForm` + preview + success + portfolio upload; this is the biggest genuine feature difference.
4. **#3 talent invitation preview/success** (M).
5. **#4 TKXTS back office** (M) — may need backend endpoints first.
6. **#7 dreaming → jungle/world audit**, then the old client copy can go.
7. Deferred, and *new work rather than a port*: #8 hunt, #9 portfolio, #10 notifications, #11 search.

Nothing was deleted, moved or modified outside this document; the two dev servers stayed up throughout (launchd `lucid-backend` :3002, `lucid-frontend` :3003).




