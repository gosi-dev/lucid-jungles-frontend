// hooks/useBaseLookup.js
//
// Loads a base from GET /api/homes/u/:username — the public read that turns a
// base into a social object (LUCID_JUNGLES_COMPETITIVE_ANALYSIS.md §7 #1 / #5).
//
// Same failure philosophy as useUsernameLookup: only a *definitive* answer is
// trusted. If the backend is down or answers with something we don't understand,
// we report UNKNOWN and the page renders exactly as it did before rather than
// 404-ing a real user's home.
import { useEffect, useState } from 'react';

export const BASE_LOOKUP = {
  CHECKING: 'checking', // no answer yet (or the router is not ready)
  READY: 'ready',       // we have the base
  MISSING: 'missing',   // the backend says no such user — show the 404
  UNKNOWN: 'unknown',   // we could not tell — fail open
};

// GET /api/homes/u/:username sends a machine-readable code rather than relying on
// English copy (eng.json renders USER_NOT_FOUND as an email-specific sentence, so
// the wording is not a stable contract). The message test is a fallback for a
// backend deployed before the code existed.
const isMissingBody = (body) => {
  if (!body) return false;
  if (body.data && body.data.code === 'USER_NOT_FOUND') return true;
  return /user not found/i.test(typeof body.message === 'string' ? body.message : '');
};

export function useBaseLookup(username) {
  const [state, setState] = useState({ status: BASE_LOOKUP.CHECKING, base: null });

  useEffect(() => {
    if (!username) {
      setState({ status: BASE_LOOKUP.CHECKING, base: null });
      return undefined;
    }

    let cancelled = false;
    setState({ status: BASE_LOOKUP.CHECKING, base: null });

    fetch(`/api/homes/u/${encodeURIComponent(username)}`, { credentials: 'include' })
      .then(async (response) => {
        let body = null;
        try {
          body = await response.json();
        } catch {
          body = null; // non-JSON (e.g. a proxy error page) — we cannot tell
        }

        if (response.status === 404) {
          return { status: isMissingBody(body) ? BASE_LOOKUP.MISSING : BASE_LOOKUP.UNKNOWN, base: null };
        }
        if (response.ok && body && body.data) {
          return { status: BASE_LOOKUP.READY, base: body.data };
        }
        return { status: BASE_LOOKUP.UNKNOWN, base: null };
      })
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch(() => {
        if (!cancelled) setState({ status: BASE_LOOKUP.UNKNOWN, base: null });
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return state;
}
