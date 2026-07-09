import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";

/**
 * 공통 셸 — 웹 기준: 데스크톱 = 사이드 네비게이션(웹), 모바일 = 하단 탭(앱)
 * (2026-07-07 사용자 확정: 웹이 기준. 앱 문법은 모바일 뷰포트에서만)
 */
export default async function AppFrame({ title, wide = false, children }:
  { title: string; isStaff?: boolean; wide?: boolean; children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const r = (role as AppRole) ?? "member";

  return (
    <div className="min-h-dvh md:pl-60" data-frame="web">
      <AppHeader role={r} title={title} />
      {/* 데스크톱은 웹 폭으로 확장 — 폰 폭(max-w-lg) 고정은 모바일 뷰포트에서만 */}
      <main className={`${wide ? "max-w-6xl" : "max-w-lg md:max-w-3xl xl:max-w-4xl"} mx-auto p-4 flex flex-col gap-4`}>{children}</main>
    </div>
  );
}
