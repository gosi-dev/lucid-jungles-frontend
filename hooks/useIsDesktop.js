// hooks/useIsDesktop.js
//
// One breakpoint for the whole app: 1024px — the same desktop switch the jungle view
// uses in pages/[username].js. Keeping it in one place means the entity pages, the
// profile modal and the event page all flip layout at the same width instead of each
// picking its own.
//
// SSR renders the mobile branch and the client corrects on mount. The first client
// render therefore matches the server exactly (no hydration mismatch) and only the
// follow-up render knows the real width.
import { useEffect, useState } from 'react';

export const DESKTOP_MIN_WIDTH = 1024;

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    // Safari < 14 only has the deprecated addListener, so support both.
    if (mql.addEventListener) mql.addEventListener('change', sync);
    else mql.addListener(sync);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', sync);
      else mql.removeListener(sync);
    };
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
}

export default useIsDesktop;
