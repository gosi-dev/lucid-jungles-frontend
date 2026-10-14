// hooks/useUsernameLookup.js
//
// Does the base at /[username] actually exist?
//
// pages/[username].js renders a base for *any* single-segment path, so a typo
// like /lucidjunglz used to render a full — and entirely fabricated — profile
// instead of a 404. That is bad UX, and it invites crawlers to index an
// infinite number of fake profiles.
//
// The lookup is deliberately conservative: only an explicit HTTP 404 from
// GET /api/user/u/:username means "this base doesn't exist". If we can't get a
// definitive answer — backend down, network error, a 5xx — we report UNKNOWN and
// the page renders exactly as it did before. A backend outage must never 404 a
// real user's base.
import { useEffect, useState } from 'react';

export const USER_LOOKUP = {
  CHECKING: 'checking', // no answer yet (also the state before the router is ready)
  EXISTS: 'exists',     // the API returned a profile
  MISSING: 'missing',   // the API said this user does not exist — show the 404
  UNKNOWN: 'unknown',   // we couldn't tell — fail open and render the base
};

// The exact message GET /api/user/u/:username returns when there is no such user
// (original-backend/src/controllers/user.js → getPublicProfile).
const MISSING_MESSAGE = /user not found/i;

// Pure and dependency-free, so the rule can be reasoned about and exercised on
// its own. `response` is anything exposing `ok`/`status` (a Fetch Response) and
// `body` is its already-parsed JSON, if any.
//
// The body matters. Two different failures both answer HTTP 404 on this backend:
//
//   GET /api/user/u/nobody  → { status: false, message: 'User not found' }
//   any unrouted /api path  → { status: false, error: 'And Just Like That, …' }
//
// The second is the app's catch-all (app.js `app.all('*')`). If we treated any
// 404 as "no such base", a backend deployed before this endpoint existed would
// 404 every single profile. So only the user-lookup message counts.
//
// If that message is ever reworded, this fails *open* — the guard simply stops
// firing and the page renders as it did before. It never invents a 404.
export function classifyUserLookup(response, body) {
  if (!response) return USER_LOOKUP.UNKNOWN;

  if (response.status === 404) {
    const message = body && typeof body.message === 'string' ? body.message : '';
    return MISSING_MESSAGE.test(message) ? USER_LOOKUP.MISSING : USER_LOOKUP.UNKNOWN;
  }

  if (response.ok) return USER_LOOKUP.EXISTS;
  return USER_LOOKUP.UNKNOWN;
}

export function useUsernameLookup(username) {
  const [state, setState] = useState(USER_LOOKUP.CHECKING);

  useEffect(() => {
    // router.query is empty on the first render, so there is nothing to look up
    // yet — stay in CHECKING rather than guessing.
    if (!username) {
      setState(USER_LOOKUP.CHECKING);
      return undefined;
    }

    let cancelled = false;
    setState(USER_LOOKUP.CHECKING);

    fetch(`/api/user/u/${encodeURIComponent(username)}`)
      .then(async (response) => {
        let body = null;
        try {
          body = await response.json();
        } catch {
          body = null; // non-JSON (e.g. a proxy error page) — classify as unknown
        }
        return classifyUserLookup(response, body);
      })
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch(() => {
        // Network/CORS/parse failure — we do not know, so do not 404.
        if (!cancelled) setState(USER_LOOKUP.UNKNOWN);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return state;
}

