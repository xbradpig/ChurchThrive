"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";

type Item = { key: string; icon: string; label: string; href: string };

/** 모바일 하단 탭 바 (시니어 표준) — 몰입 화면(/check /scan)에선 미표시 */
export default function BottomNav({ isStaff, always = false }: { isStaff: boolean; always?: boolean }) {
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : ""; // 교회 경로 접두 (church-url-tenancy)
  const pathname = usePathname();
  const hidden = pathname.startsWith(`${base}/check`) || pathname.startsWith(`${base}/scan`) || pathname.startsWith("/platform");

  useEffect(() => {
    if (!hidden && (always || window.matchMedia("(max-width: 767px)").matches)) {
      document.body.classList.add("has-bottom-nav");
      return () => document.body.classList.remove("has-bottom-nav");
    }
  }, [hidden, pathname, always]);

  if (hidden) return null;

  const items: Item[] = isStaff
    ? [
        { key: "home", icon: "🏠", label: "홈", href: `${base}/home` },
        { key: "check", icon: "✅", label: "출석", href: `${base}/check` },
        { key: "members", icon: "📖", label: "명부", href: `${base}/church?tab=members` },
        { key: "menu", icon: "☰", label: "메뉴", href: `${base}/menu` },
      ]
    : [
        { key: "home", icon: "🏠", label: "홈", href: `${base}/home` },
        { key: "me", icon: "📇", label: "내 교적", href: `${base}/me` },
        { key: "menu", icon: "☰", label: "메뉴", href: `${base}/menu` },
      ];

  return (
    <nav className={`bottom-nav ${always ? "bn-always" : ""}`} data-bottom-nav>
      <div className="bottom-nav-inner">
      {items.map((it) => {
        const path = it.href.split("?")[0];
        const active = pathname === path || (path !== `${base}/home` && pathname.startsWith(path));
        return (
          <Link key={it.key} href={it.href} className={active ? "active" : ""} data-bn={it.key}>
            <span className="bn-icon">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
