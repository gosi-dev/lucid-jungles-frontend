// components/BottomNav.jsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useLayout } from "../context/LayoutContext";
import { useEffect } from "react";
import { Map, Sparkles, Dumbbell, Store, User } from "lucide-react";
import { useIsDesktop } from "../hooks/useIsDesktop";

// Five destinations, ported from CONSOLIDATED/client/components/BottomNav.jsx.
// Mounted once in pages/_app.js so the bar exists on every route; routes that need
// the full viewport opt out with useHideBottomNav(true).
//
// It is a phone tab bar: a fixed 75px strip of five equal tabs. Stretched across a desktop
// window that is five 288px targets, which is not a desktop layout, so from 1024px up the
// bar is not rendered at all — the same breakpoint every other desktop branch uses. Pages
// that still want it at any width drive it with useHideBottomNav.
const NAV_ITEMS = [
  { name: "WAKING", icon: Map, href: "/" },
  { name: "DREAMING", icon: Sparkles, href: "/profile" },
  { name: "DOJO", icon: Dumbbell, href: "/dojo" },
  { name: "STORE", icon: Store, href: "/store" },
  { name: "YOU", icon: User, href: "/you" },
];

// First matching prefix wins when deriving the active tab from the route.
const ACTIVE_BY_PREFIX = [
  ["/dojo", "DOJO"],
  ["/store", "STORE"],
  ["/cart", "STORE"],
  ["/orders", "STORE"],
  ["/profile", "DREAMING"],
  ["/jungle", "DREAMING"],
  ["/you", "YOU"],
  ["/tkxts", "YOU"],
];

export default function BottomNav() {
  const router = useRouter();
  const { showBottomNav, activeNav, setActiveNav } = useLayout();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const path = router.pathname;
    if (path === "/") {
      setActiveNav("WAKING");
      return;
    }
    // A public base (/[username]) is a jungle/world view, not a nav destination.
    if (path === "/[username]") {
      setActiveNav("DREAMING");
      return;
    }
    const hit = ACTIVE_BY_PREFIX.find(([prefix]) => path.startsWith(prefix));
    if (hit) setActiveNav(hit[1]);
  }, [router.pathname, setActiveNav]);

  if (!showBottomNav || isDesktop) return null;

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
