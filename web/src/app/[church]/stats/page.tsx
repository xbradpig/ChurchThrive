import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StatsNav from "./StatsNav";
import OverviewClient from "./OverviewClient";

/** 교회 현황 오버뷰 — KPI → 추세 → 이번 주 해야 할 일 (church-stats-upgrade) */
export default async function StatsPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect(`${base}/home`); // 교인은 접근 불가 (권한 매트릭스)

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교회 현황" />
      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-4" data-print-root>
        <StatsNav role={role} />
        <OverviewClient role={role} />
      </main>
    </div>
  );
}
