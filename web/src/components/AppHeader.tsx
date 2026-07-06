"use client";

/**
 * AppShell — 사이드 네비게이션 셸 (ui-upgrade U1)
 * - 데스크톱(≥768px): 좌측 사이드바 (누적 스택 + visible/disabled/hidden)
 * - 모바일: 상단 바만 (시니어 복잡도 차단 — D4). disabled 항목은 모바일 미노출
 * - 기존 AppHeader 호출부 호환 (role, title 시그니처 유지)
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FontScale from "@/components/ui/FontScale";
import BottomNav from "@/components/ui/BottomNav";
import GlobalSearch from "@/components/ui/GlobalSearch";
import { createClient } from "@/lib/supabase/client";
import { buildNav, type NavSection, type NavCtx } from "@/modules/registry";
import type { AppRole } from "@/lib/roles";

export default function AppHeader({ role, title }: { role: AppRole; title: string }) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [nav, setNav] = useState<NavSection[]>([]);
  const [churchName, setChurchName] = useState("");
  const [locked, setLocked] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: mods }, { data: grants }, { data: church }, { data: isPa }] = await Promise.all([
        supabase.from("church_modules").select("module, enabled"),
        supabase.from("module_grants").select("module, level").eq("user_id", user.id),
        supabase.from("churches").select("name").limit(1).maybeSingle(),
        supabase.rpc("is_platform_admin"),
      ]);
      const ctx: NavCtx = {
        role,
        grants: Object.fromEntries((grants ?? []).map((g) => [g.module, g.level])),
        modules: new Set((mods ?? []).filter((m) => m.enabled).map((m) => m.module)),
        isPlatformAdmin: !!isPa,
      };
      setNav(buildNav(ctx));
      setChurchName(church?.name ?? "");
    })();
  }, [supabase, role]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      {/* 모바일 상단 바 */}
      <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[var(--color-brand-900)] text-white">
        <Link href="/home" className="flex items-center gap-2 mr-auto">
          <span className="text-[var(--color-accent)] font-black">✝</span>
          <h1 className="font-black text-lg">{title}</h1>
        </Link>
        <Link href="/home" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white/10">홈</Link>
        <button onClick={logout} className="px-3 py-1.5 rounded-lg text-sm font-bold opacity-60">나가기</button>
      </header>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-40 bg-[var(--color-brand-900)] text-white"
             data-testid="sidebar">
        <Link href="/home" className="flex items-center gap-2 px-5 py-5">
          <span className="text-[var(--color-accent)] text-xl font-black">✝</span>
          <b className="text-lg">ChurchThrive</b>
        </Link>
        <p className="px-5 pb-3 text-xs opacity-60 font-bold">{churchName}</p>
        <GlobalSearch isStaff={role !== "member"}
                      navItems={nav.flatMap((s) => s.items.filter((i) => i.state === "visible")
                        .flatMap((i) => [{ label: i.label, href: i.href },
                          ...(i.sub ?? []).map((su) => ({ label: su.label, href: su.href }))]))} />
        <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-4 scroll-fade">
          {nav.map((sec) => (
            <div key={sec.group}>
              <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-wider opacity-40">{sec.group}</p>
              <div className="flex flex-col gap-0.5">
                {sec.items.map((item) =>
                  item.state === "visible" ? (
                    <div key={item.key}>
                      <Link href={item.href} data-nav={item.key} data-nav-state="visible"
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-bold text-[15px] ${
                              pathname.startsWith(item.href) && item.href !== "/home" || pathname === item.href
                                ? "bg-white/15" : "opacity-75 hover:opacity-100 hover:bg-white/5"}`}>
                        <span>{item.icon}</span>{item.label}
                      </Link>
                      {item.sub && pathname.startsWith(item.href.split("?")[0]) && (
                        <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-white/15 pl-2.5">
                          {item.sub.map((su) => {
                            const [suPath, suQuery] = su.href.split("?");
                            const suTab = new URLSearchParams(suQuery ?? "").get("tab");
                            const curTab = searchParams.get("tab") ?? "overview";
                            const isActive = suPath === pathname && (suTab ? curTab === suTab : true);
                            return (
                              <Link key={su.key} href={su.href} data-nav={su.key}
                                    data-nav-state={isActive ? "active" : "visible"}
                                    className={`px-2.5 py-1.5 rounded-md text-[13.5px] font-bold ${
                                      isActive ? "bg-white/15" : "opacity-60 hover:opacity-100 hover:bg-white/5"}`}>
                                {su.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button key={item.key} data-nav={item.key} data-nav-state="disabled"
                            onClick={() => setLocked(item.label)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-bold text-[15px] opacity-35 text-left">
                      <span>{item.icon}</span>{item.label}<span className="ml-auto text-xs">🔒</span>
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-1"><FontScale /></div>
        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-2 text-sm">
          <span className="opacity-70 font-bold mr-auto">{title}</span>
          <button onClick={logout} className="opacity-60 hover:opacity-100 font-bold">나가기</button>
        </div>
      </aside>

      {/* 모바일 하단 탭 바 */}
      <BottomNav isStaff={role !== "member"} />

      {/* 잠금 안내 시트 (disabled 탭 시) */}
      {locked && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5" onClick={() => setLocked(null)}>
          <div className="card p-6 max-w-xs w-full pop-in text-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-3xl">🔒</span>
            <p className="font-black mt-2 mb-1">{locked} 권한이 필요합니다</p>
            <p className="text-sm text-[var(--text-soft)] mb-4">교회 관리자에게 권한을 요청해주세요.</p>
            <button className="btn btn-primary w-full" onClick={() => setLocked(null)}>확인</button>
          </div>
        </div>
      )}
    </>
  );
}
