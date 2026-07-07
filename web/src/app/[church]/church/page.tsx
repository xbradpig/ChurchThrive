import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import AdminTabs from "../admin/AdminTabs";

/** 교회 관리 (ui-upgrade U3 — 기존 /admin 승격, /admin은 리다이렉트 유지) */
export default async function ChurchAdminPage({ params, searchParams }: {
  params: Promise<{ church: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { church } = await params;
  const { tab } = await searchParams;
  const base = `/${church}`; // 교회 경로 접두 (church-url-tenancy)
  if (tab === "overview") redirect(`${base}/stats`); // 현황 탭 → 교회 현황으로 승격 (church-stats-upgrade)
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member" || role === "checker") redirect(`${base}/home`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교회 관리" />
      {/* 당직 모드 — 모바일에선 자주 쓰는 과업을 카드로 먼저 (dual-grammar G3) */}
      <div className="md:hidden max-w-lg mx-auto px-4 pt-4 grid grid-cols-2 gap-2" data-duty-mode>
        {[
          ["🙋", "가입 승인", "/church?tab=members"],
          ["📲", "교인 초대", "/invites"],
          ["🔔", "미출석 확인", "/church?tab=absentees"],
          ["🔍", "교인 찾기", "/church?tab=members"],
        ].map(([icon, label, href]) => (
          <a key={label} href={href} className="card p-4 flex flex-col items-center gap-1 text-center">
            <span className="text-2xl">{icon}</span>
            <b className="text-sm">{label}</b>
          </a>
        ))}
      </div>
      <AdminTabs role={role as AppRole} />
    </div>
  );
}
