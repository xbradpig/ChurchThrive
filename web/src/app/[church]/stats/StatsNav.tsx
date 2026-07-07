"use client";

/** 현황 서브페이지 탭 칩 — 사이드바 하위 메뉴와 병행 진입 경로 (detail_goal §1) */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StatsNav({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const pathname = usePathname();
  const [mods, setMods] = useState<Set<string>>(new Set());
  const [canGiving, setCanGiving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: g }] = await Promise.all([
        supabase.from("church_modules").select("module, enabled"),
        supabase.rpc("can_view_giving"),
      ]);
      setMods(new Set((m ?? []).filter((x) => x.enabled).map((x) => x.module)));
      setCanGiving(!!g);
    })();
  }, [supabase]);

  const isLeaderUp = ["superadmin", "pastor", "dept_leader"].includes(role);
  const tabs = [
    { href: `${base}/stats`, label: "오버뷰", show: true },
    { href: `${base}/stats/attendance`, label: "출석", show: true },
    { href: `${base}/stats/verse`, label: "말씀 암송", show: isLeaderUp && mods.has("verse") },
    { href: `${base}/stats/notes`, label: "말씀노트", show: isLeaderUp && mods.has("note") },
    { href: `${base}/stats/giving`, label: "재정", show: mods.has("giving") && canGiving },
    { href: `${base}/stats/members`, label: "교적", show: isLeaderUp },
  ].filter((t) => t.show);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 print:hidden" data-testid="stats-nav">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href}
              className={`chosung-chip !min-w-fit !px-4 ${pathname === t.href ? "active" : ""}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
