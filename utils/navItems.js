// utils/navItems.js
//
// The five destinations the app navigates by, in order, with the icons the phone tab bar
// uses. One list, because it is rendered twice: components/BottomNav.jsx draws it as the
// 75px phone tab bar, components/DesktopNavRow.jsx draws it as a desktop row (the phone
// bar is not rendered from 1024px up). Two copies would drift.
import { Map, Sparkles, Dumbbell, Store, User } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'WAKING', icon: Map, href: '/' },
  { name: 'DREAMING', icon: Sparkles, href: '/profile' },
  { name: 'DOJO', icon: Dumbbell, href: '/dojo' },
  { name: 'STORE', icon: Store, href: '/store' },
  { name: 'YOU', icon: User, href: '/you' },
];

// First matching prefix wins when deriving the lit destination from the route. Routes that
// appear nowhere here (a conversation, a receipt) keep whatever was lit last, which is what
// the tab bar has always done.
const ACTIVE_BY_PREFIX = [
  ['/dojo', 'DOJO'],
  ['/store', 'STORE'],
  ['/cart', 'STORE'],
  ['/orders', 'STORE'],
  ['/profile', 'DREAMING'],
  ['/jungle', 'DREAMING'],
  ['/you', 'YOU'],
  ['/tkxts', 'YOU'],
];

export function activeNavFor(pathname) {
  if (pathname === '/') return 'WAKING';
  // A public base (/[username]) is a jungle/world view, not a nav destination.
  if (pathname === '/[username]') return 'DREAMING';
  const hit = ACTIVE_BY_PREFIX.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? hit[1] : null;
}
