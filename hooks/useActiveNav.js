// hooks/useActiveNav.js
//
// Which of the five destinations is lit, and the setter for the instant case (a tap sets it
// before the route settles). The lit destination is derived from the route so that it is
// right even on a surface that does not render the phone bar — the desktop nav row is the
// first of those, and a desktop render must not depend on BottomNav being mounted.
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLayout } from '../context/LayoutContext';
import { activeNavFor } from '../utils/navItems';

export function useActiveNav() {
  const { pathname } = useRouter();
  const { activeNav, setActiveNav } = useLayout();

  useEffect(() => {
    const derived = activeNavFor(pathname);
    if (derived) setActiveNav(derived);
  }, [pathname, setActiveNav]);

  return [activeNav, setActiveNav];
}

export default useActiveNav;
