# scripts/

The verification harness this rebuild is checked against. Each script drives a real Chrome
over the DevTools Protocol and measures what is on screen — widths, positions, where an
action actually navigates to, what is left in storage — so a layout claim is a measurement
rather than an impression. Screenshots are written alongside the numbers.

## Prerequisites

1. The backend on `:3002` and this app on `:3003` (`npm run dev`), with demo data in place
   (`node ../original-backend/seed.js` — idempotent).
2. A Chrome listening for the protocol:

       "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/cdp-profile about:blank

   Move the port with `CDP_PORT`.
3. Node 20 needs `--experimental-websocket` for the global `WebSocket`; Node 22+ does not.
   `scripts/cdp.js` names the flag if it is missing.

## Running

    npm run verify:entities     # entity lists + profiles: layout, actions, destinations
    npm run verify:shell        # the shell ten routes share, /chat end to end, storage
    npm run verify:profile      # the profile a VIEW PROFILE action opens
    npm run verify:base         # a base: the face, the visit counts, the knock, the plan

On Node 20 the flag is required, so run the files directly:

    node --experimental-websocket scripts/verify-shell.js

Each prints one `PASS`/`FAIL` line per check and exits non-zero if any check fails.

## What they cover

`verify-entities.js` — for ATTENDEES / TALENTS / EXHIBITORS at 1440px and 390px: the
segmented tabs, the desktop grid, the entity profile dialog, and where CONTACT /
VIEW PORTFOLIO / VIEW PROFILE / MESSAGE lead. Also that `?tab=` is honoured, that the
desktop layout does not overflow, and that the phone layout keeps its scroller.

`verify-shell.js` — the routes that share `components/MvpShell.jsx`: content stays inside
the 1180px desktop grid, the phone tab bar is on screen at **every** width — 1440, 1024 and
390 — carrying all five destinations with exactly one lit, one of them clicked through to its
route, and nothing else drawn as a second navigation beside it, `/chat` lays out as two panes
with the composer clear of the bar at the bottom of the window, every shell route renders
without throwing, and the persisted redux slice carries no plaintext password — including a
legacy blob written the way the old slice would have written it.

Two things this suite learned the hard way, worth keeping: the "is the bar there" check must
count *fixed-bottom* navs specifically, and everything else that renders as a `<nav>` has to
be counted separately as a second navigation (during the desktop-row build, counting every nav
let the row stand in for the bar and the claim passed on the wrong element); and the pane
subtraction in `pages/chat.js` has to keep the 75px bar out of the way — the check that catches
it is the composer's bottom edge against the bar's top (`composer.y + composer.h <= vh - 75`),
which is how the 140px it inherited was found to leave the composer 17px underneath it.

The width is pinned rather than the two ends of it: 1024 is where the bar used to be deleted,
so that boundary is in the loop. `/you` and `/tkxts` have no shell and no MENU of their own —
the bar is their only way out — so they are checked at 1440 and 390 for it directly.

`verify-profile.js` — the page the entity dialog's other action opens
(`pages/profile/[username].js`): the 1180px grid and the two-column split on a desktop, the
name scaling with the viewport, one column on a phone, MESSAGE present on somebody else's
profile and opening the conversation with them, and the edit link (not MESSAGE) on your own.

`verify-base.js` — a base treated as a *home* (`pages/[username].js`), at 390 and 1440. The
base used to draw a hardcoded profile — `avatar: null`, `followers: '29.7K'`, `moments: 300`,
`connections: 1279` — so every base in the jungle read identically and no arrival was ever
recorded. Three things replaced it, and each is measured here: the face
(`components/MockAvatar.jsx`, deterministic per username, with a real `profile_picture`
winning when the owner has one), the counts (FOLLOWERS / VISITS / VISITORS from
`GET /api/homes/u/:username`), and the knock (`POST /api/visit` on arrival, acknowledged in
the drawer). It also mounts the design system's status bars (`components/VitalBars.jsx`,
which was written for the drawer and had no caller until now), checks the owner sees
CUSTOMISE THIS BASE rather than CONNECT and that it opens `/home`, and that a typo still
reaches the not-found screen.

The claim worth protecting is the strongest one in the file: the digits in the drawer are
compared against a fresh `GET /api/homes/u/:username`, so a future edit that reintroduces a
computed-on-the-client number fails the suite instead of shipping.

The second half of the file is about the base being *arrangeable* rather than merely drawn:
a real mouse drag of a desk item is followed all the way into `HomeBase` (`roomLayout` keeps
the placement as JSON, `furniture` keeps the equipped ids), a reload stands the item where it
was left rather than where the default desk puts it, and a visitor dragging the same desk
changes nothing on the owner's record. Before this, the desk was component state: the
arrangement existed until the tab was closed.
The third part is about the base being a *home*: a plan view of the tier's rooms with the
desk standing inside one of them (`lib/plan.js` + `components/PlanRoom.jsx`, described in
`LJ Prod Docs/LUCID_JUNGLES_BASE_PLAN.md`). What is measured, all of it against a fresh
`GET /api/homes/u/:username`:

- the plan is drawn at the tier `HomeBase.upgradeLevel` stores, its rooms are the tier's
  rooms, and the desk (and its items) are mounted inside one of them;
- the owner's monogram avatar stands in the room; on somebody else's base the owner is at
  home and the viewer's own avatar is at the door;
- a real mouse drag of furniture is written to `roomLayout` **v2** — `version: 2`, the new
  `floor` array carrying the same x/y that is on screen, and `items` still carrying the desk
  ids, which is what keeps every v1 base (and every older reader) working;
- an illegal drop **outside the rooms is refused**: the stored layout is byte-identical
  afterwards and the item is back at its last legal position;
- a reload restores the furniture, and a visitor cannot move it or the desk;
- on `/home`, the property office lists all five tiers of the ladder with a plan drawing,
  exactly one is marked `YOU LIVE HERE` (and disabled, and matching the stored tier), the
  listing's plan names the rooms the base itself draws, moving in through the UI is recorded
  on `upgradeLevel`, the base redraws around the new tier — and then the tier is **put back**
  so the suite can run again (the same courtesy `verify-shell.js` pays its message).

Two traps this part of the suite documents, both of which made the numbers lie before they
were found. `[data-avatar]` now also matches the people the *plan* draws, so the drawer's own
face is read only from avatars outside `[data-plan-stage]`; and a draggable sprite must not be
an `<img>` that can be picked up — a native image drag swallows every later
`mousemove`/`mouseup`, which is exactly what a drag that "moved on screen and never saved"
turned out to be.



## Notes

- Both scripts sign in as the seeded admin (`seed@lucidcityjungles.com`), because the entity
  actions and `/chat` sit behind the session. `verify-base.js` needs an account that is *not*
  the base's owner — a visitor is the only one who has a visit to record and a CONNECT button
  to see.
- `verify-shell.js` sends a real message and deletes it again, matched on the exact text of
  that run. It reaches the database through the backend's `.env`; set `BACKEND_DIR` if the
  backend is not beside this repo.
- Screenshots go to `/tmp/shot_*.png`.
- `verify-entities.js` runs against the seeded event; pass `EVENT_ID=<id>` for another one.
