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

On Node 20 the flag is required, so run the files directly:

    node --experimental-websocket scripts/verify-shell.js

Both print one `PASS`/`FAIL` line per check and exit non-zero if any check fails.

## What they cover

`verify-entities.js` — for ATTENDEES / TALENTS / EXHIBITORS at 1440px and 390px: the
segmented tabs, the desktop grid, the entity profile dialog, and where CONTACT /
VIEW PORTFOLIO / VIEW PROFILE / MESSAGE lead. Also that `?tab=` is honoured, that the
desktop layout does not overflow, and that the phone layout keeps its scroller.

`verify-shell.js` — the routes that share `components/MvpShell.jsx`: content stays inside
the 1180px desktop grid, the phone tab bar is gone above 1024px and back below it, `/chat`
lays out as two panes and a sent message really renders, every shell route renders without
throwing, and the persisted redux slice carries no plaintext password — including a legacy
blob written the way the old slice would have written it.

## Notes

- Both scripts sign in as the seeded admin (`seed@lucidcityjungles.com`), because the entity
  actions and `/chat` sit behind the session.
- `verify-shell.js` sends a real message and deletes it again, matched on the exact text of
  that run. It reaches the database through the backend's `.env`; set `BACKEND_DIR` if the
  backend is not beside this repo.
- Screenshots go to `/tmp/shot_*.png`.
- `verify-entities.js` runs against the seeded event; pass `EVENT_ID=<id>` for another one.
