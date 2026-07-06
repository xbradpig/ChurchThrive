"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Item = { key: string; icon: string; label: string; href: string };

/** 모바일 하단 탭 바 (시니어 표준) — 몰입 화면(/check /scan)에선 미표시 */
export default function BottomNav({ isStaff }: { isStaff: boolean }) {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/check") || pathname.startsWith("/scan") || pathname.startsWith("/platform");

  useEffect(() => {
    if (!hidden && window.matchMedia("(max-width: 767px)").matches) {
      document.body.classList.add("has-bottom-nav");
      return () => document.body.classList.remove("has-bottom-nav");
    }
  }, [hidden, pathname]);

  if (hidden) return null;

  const items: Item[] = isStaff
    ? [
        { key: "home", icon: "🏠", label: "홈", href: "/home" },
        { key: "check", icon: "✅", label: "출석", href: "/check" },
        { key: "members", icon: "📖", label: "명부", href: "/church?tab=members" },
        { key: "menu", icon: "☰", label: "메뉴", href: "/menu" },
      ]
    : [
        { key: "home", icon: "🏠", label: "홈", href: "/home" },
        { key: "me", icon: "📇", label: "내 교적", href: "/me" },
        { key: "menu", icon: "☰", label: "메뉴", href: "/menu" },
      ];

  return (
    <nav className="bottom-nav md:hidden" data-bottom-nav>
      {items.map((it) => {
        const path = it.href.split("?")[0];
        const active = pathname === path || (path !== "/home" && pathname.startsWith(path));
        return (
          <Link key={it.key} href={it.href} className={active ? "active" : ""} data-bn={it.key}>
            <span className="bn-icon">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
