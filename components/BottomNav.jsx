// components/BottomNav.jsx
import Link from "next/link";
import { useLayout } from "../context/LayoutContext";
import { useActiveNav } from "../hooks/useActiveNav";
import { NAV_ITEMS } from "../utils/navItems";

// The five destinations come from utils/navItems.js.
//
// This is the app's navigation at every width. f4e606a stopped rendering it from 1024px up
// ("five 288px targets is not a desktop layout") while nothing took its place, so at desktop
// the ten routes that mount MvpShell — and the / and /profile maps — rendered with no
// navigation at all. It is rendered again at every width. Full-viewport surfaces that want it
// out of the way still say so with useHideBottomNav(true).

export default function BottomNav() {
  const { showBottomNav } = useLayout();
  const [activeNav, setActiveNav] = useActiveNav();

  if (!showBottomNav) return null;

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
