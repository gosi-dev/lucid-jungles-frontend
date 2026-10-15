// components/BottomNav.jsx
import Link from "next/link";
import { useLayout } from "../context/LayoutContext";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { useActiveNav } from "../hooks/useActiveNav";
import { NAV_ITEMS } from "../utils/navItems";

// The five destinations and the route→destination mapping both come from utils/navItems.js,
// because components/DesktopNavRow.jsx renders the same list at desktop widths.
//
// It is a phone tab bar: a fixed 75px strip of five equal tabs. Stretched across a desktop
// window that is five 288px targets, which is not a desktop layout, so from 1024px up this
// bar is not rendered and the shell header carries DesktopNavRow instead. Pages that still
// want the bar at any width drive it with useHideBottomNav(false) — that request wins over
// the breakpoint, because those pages have asked for the bar as their navigation.

export default function BottomNav() {
  const { showBottomNav, bottomNavPreference } = useLayout();
  const [activeNav, setActiveNav] = useActiveNav();
  const isDesktop = useIsDesktop();

  const askedFor = bottomNavPreference === 'show';

  if (!showBottomNav || (isDesktop && !askedFor)) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 9999,
        backgroundColor: "#151413",
        borderTop: "1px solid #ABD49E",
      }}
      className="flex justify-between items-center h-[75px] shadow-lg pb-safe"
    >
      {NAV_ITEMS.map((item, index) => {
        const active = activeNav === item.name;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors duration-100 ${
              active ? "bg-[#ABD49E] text-[#151413]" : "text-[#ABD49E] hover:bg-[#ABD49E]/20"
            } ${index < NAV_ITEMS.length - 1 ? "border-r border-[#ABD49E]/30" : ""}`}
            style={{ textDecoration: "none" }}
            onClick={() => setActiveNav(item.name)}
          >
            <Icon size={18} className="mb-1" />
            <span className="text-[8px] font-medium tracking-widest">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
