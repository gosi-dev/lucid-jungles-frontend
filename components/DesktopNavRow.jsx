// components/DesktopNavRow.jsx
//
// The five destinations as a desktop row. The phone bar (BottomNav) is not rendered from
// 1024px up — five equal 75px-tall targets are 288px each across a laptop — but the tabs
// were still the only navigation on the ten routes that mount MvpShell, so removing the bar
// without this left those pages with nothing but a back arrow. Same list, same order, same
// lit destination, desktop proportions.
//
// Renders nothing below the breakpoint; the phone keeps BottomNav exactly as it was.
import Link from 'next/link';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { useActiveNav } from '../hooks/useActiveNav';
import { NAV_ITEMS } from '../utils/navItems';

// The row itself, the space under it, and the two together — which is how much taller a
// sticky header is on a desktop than on a phone. pages/chat.js subtracts DESKTOP_NAV_H from
// the window height so its panes still fill the screen exactly.
export const NAV_ROW_H = 34;
export const NAV_GAP = 12;
export const DESKTOP_NAV_H = NAV_ROW_H + NAV_GAP;

export default function DesktopNavRow() {
  const isDesktop = useIsDesktop();
  const [activeNav, setActiveNav] = useActiveNav();

  if (!isDesktop) return null;

  return (
    <nav aria-label="Sections" style={{ display: 'flex', alignItems: 'stretch', gap: 8, height: NAV_ROW_H }}>
      {NAV_ITEMS.map((item) => {
        const active = activeNav === item.name;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={() => setActiveNav(item.name)}
            className={`flex items-center gap-1.5 h-full px-3 border text-[10px] font-medium tracking-widest transition-colors duration-100 ${
              active
                ? 'bg-[#ABD49E] text-[#151413] border-[#ABD49E]'
                : 'text-[#ABD49E] border-[#ABD49E]/30 hover:bg-[#ABD49E]/20'
            }`}
            style={{ textDecoration: 'none' }}
          >
            <Icon size={12} aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
