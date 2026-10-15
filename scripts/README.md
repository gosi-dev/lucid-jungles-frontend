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

On Node 20 the flag is required, so run the files directly:

    node --experimental-websocket scripts/verify-shell.js

Both print one `PASS`/`FAIL` line per check and exit non-zero if any check fails.

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

## Notes

- Both scripts sign in as the seeded admin (`seed@lucidcityjungles.com`), because the entity
  actions and `/chat` sit behind the session.
- `verify-shell.js` sends a real message and deletes it again, matched on the exact text of
  that run. It reaches the database through the backend's `.env`; set `BACKEND_DIR` if the
  backend is not beside this repo.
- Screenshots go to `/tmp/shot_*.png`.
- `verify-entities.js` runs against the seeded event; pass `EVENT_ID=<id>` for another one.
