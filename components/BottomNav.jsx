// components/BottomNav.jsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useLayout } from "../context/LayoutContext";
import { useEffect } from "react";

export default function BottomNav() {
  const router = useRouter();
  const { showBottomNav, activeNav, setActiveNav } = useLayout();

  const navItems = [
    { name: "WAKING", href: "/" },
    { name: "DREAMING", href: "/profile" },
    { name: "YOU", href: "/you" },
  ];

  useEffect(() => {
    const path = router.pathname;
    if (path === "/") {
      setActiveNav("WAKING");
    } else if (path.startsWith("/profile")) {
      setActiveNav("DREAMING");
    } else if (path.startsWith("/you") || path.startsWith("/tkxts")) {
      setActiveNav("YOU");
    }
  }, [router.pathname, setActiveNav]);

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
        border: "1px solid #ABD49E",
      }}
      className="flex justify-between items-center h-[75px] shadow-lg"
    >
      {navItems.map((item, index) => {
        const active = activeNav === item.name;
        return (
          <Link
            key={item.name}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "33.333%",
              height: "100%",
              backgroundColor: active ? "#ABD49E" : "transparent",
              color: active ? "#151413" : "#ABD49E",
              borderRight: index < navItems.length - 1 ? "1px solid #ABD49E" : "none",
              textDecoration: "none",
              transition: "background-color 0.1s",
            }}
            onClick={() => setActiveNav(item.name)}
          >
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
