import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/ui/BottomNav";

/**
 * 문법 A — "앱" 셸 (교인 공간: 홈·교적·말씀·모듈)
 * 어느 기기에서든 모바일 폭 중앙 컬럼 + 하단 탭. 사이드바 없음. (dual-grammar G1)
 */
export default async function AppFrame({ title, isStaff, children }:
  { title: string; isStaff: boolean; children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: church } = await supabase.from("churches").select("name").limit(1).maybeSingle();

  return (
    <div className="min-h-dvh flex flex-col items-center has-bottom-nav" data-frame="app">
      <header className="w-full max-w-md px-5 pt-6 pb-2">
        <p className="text-xs font-bold text-[var(--text-soft)]">✝ {church?.name ?? "ChurchThrive"}</p>
        <h1 className="text-2xl font-black text-[var(--color-brand-800)] dark:text-[var(--color-brand-200)] mt-0.5">
          {title}
        </h1>
      </header>
      <div className="w-full max-w-md px-4 flex-1">{children}</div>
      <BottomNav isStaff={isStaff} always />
    </div>
  );
}
