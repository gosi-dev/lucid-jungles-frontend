// context/LayoutContext.js
import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [showBottomNav, setShowBottomNav] = useState(true);
  // null = no page has asked; 'show' / 'hide' = a page asked explicitly through
  // useHideBottomNav. The boolean above cannot express "asked for" — and the desktop
  // breakpoint in BottomNav must not overrule an explicit request — so the request is
  // kept separately.
  const [bottomNavPreference, setBottomNavPreference] = useState(null);
  const [activeNav, setActiveNav] = useState('WAKING');
  const [drawerView, setDrawerView] = useState('events');

  return (
    <LayoutContext.Provider
      value={{
        showBottomNav,
        setShowBottomNav,
        bottomNavPreference,
        setBottomNavPreference,
        activeNav,
        setActiveNav,
        drawerView,
        setDrawerView,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
