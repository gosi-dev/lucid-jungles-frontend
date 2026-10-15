// hooks/useHideBottomNav.js
import { useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';

export function useHideBottomNav(hide = true) {
  const { setShowBottomNav, setBottomNavPreference } = useLayout();

  useEffect(() => {
    setShowBottomNav(!hide);
    // Recorded so BottomNav can tell "nothing asked, use the breakpoint's rule" apart from
    // "this page asked for the bar" — the latter wins at every width, desktop included.
    setBottomNavPreference(hide ? 'hide' : 'show');
    return () => {
      setShowBottomNav(true); // Show again on unmount
      setBottomNavPreference(null);
    };
  }, [hide, setShowBottomNav, setBottomNavPreference]);
}
