"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Grid3x3, TrendingUp, Zap } from "lucide-react";

const links = [
  { href: "/",         label: "Overview", icon: BarChart3  },
  { href: "/pipeline", label: "Pipeline", icon: Grid3x3    },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
];

export default function Nav() {
  const path = usePathname();

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b"
      style={{ borderColor: "var(--stripe-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center h-12 gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "#0570de" }}
          >
            <Zap size={12} className="text-white" fill="white" />
          </div>
          <span className="font-semibold text-sm hidden sm:block" style={{ color: "var(--stripe-text)" }}>
            Pipeline Intel
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium hidden sm:block"
            style={{ backgroundColor: "#f0f7ff", color: "#0570de" }}
          >
            demo
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={active ? { backgroundColor: "#f0f7ff", color: "#0570de" } : { color: "var(--stripe-muted)" }}
              >
                <Icon size={14} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right — hidden on mobile */}
        <div className="ml-auto hidden md:block">
          <span className="text-xs" style={{ color: "var(--stripe-muted)" }}>
            Mock data · 25 deals
          </span>
        </div>
      </div>
    </header>
  );
}
