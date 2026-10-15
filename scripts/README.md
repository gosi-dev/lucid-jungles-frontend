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
the 1180px desktop grid, the phone tab bar is gone above 1024px and replaced by the desktop
nav row in the header (the same five destinations, starting on the content grid at x=162,
exactly one lit, and one of them clicked through to its route), the bar takes over again
below the breakpoint at 1024/390, `/chat` lays out as two panes with the composer still
inside the window now that the header is taller, every shell route renders without throwing,
and the persisted redux slice carries no plaintext password — including a legacy blob written
the way the old slice would have written it.

Two things this suite learned the hard way, worth keeping: the "tab bar is gone" check counts
only *fixed-bottom* navs (the desktop row is also a `<nav>`, so counting every nav would let
the row satisfy the claim), and a shell-header height change belongs in `pages/chat.js`'s
subtraction (`DESKTOP_NAV_H` from `components/DesktopNavRow.jsx`) or the composer ends up
below the fold — the check that catches it is `docHeight <= 902` at 1440x900.

The breakpoint is pinned in both directions. The width sets the *default* (from 1024px up the
bar is not rendered), but a page that asked for the bar with `useHideBottomNav(false)` keeps
it at any width: `/you` and `/tkxts` ask, and they have no other navigation, so letting the
breakpoint overrule the request left both routes with no way out. Those two are checked at
1440 and 390 with `/home` next to them — nothing asked, so the default must still apply — so
the exception cannot quietly turn into the rule.

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
