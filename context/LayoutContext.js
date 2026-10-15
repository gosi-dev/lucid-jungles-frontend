// context/LayoutContext.js
import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [activeNav, setActiveNav] = useState('WAKING');
  const [drawerView, setDrawerView] = useState('events');

  return (
    <LayoutContext.Provider
      value={{
        showBottomNav,
        setShowBottomNav,
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
