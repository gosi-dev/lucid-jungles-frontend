// hooks/useHideBottomNav.js
import { useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';

export function useHideBottomNav(hide = true) {
  const { setShowBottomNav } = useLayout();

  useEffect(() => {
    setShowBottomNav(!hide);
    return () => setShowBottomNav(true); // Show again on unmount
  }, [hide, setShowBottomNav]);
}
