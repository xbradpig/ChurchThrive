import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StatsNav from "../StatsNav";
import GivingClient from "./GivingClient";

/** 재정 현황 — 재정부=전체, 담임목사·허가 viewer=열람, 그 외 접근 불가 (D2 확정) */
export default async function StatsGivingPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`;
  const supabase = await createClient();
  const [{ data: role }, { data: canGiving }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.rpc("can_view_giving"),
  ]);
  if (!role || role === "member") redirect(`${base}/home`);
  // 일반 교역자 포함 — 열람 자격 없으면 집계조차 불가 (RPC도 null 반환하지만 페이지 차원에서도 차단)
  if (!canGiving) redirect(`${base}/stats`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="재정 현황" />
      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-4">
        <StatsNav role={role} />
        <GivingClient role={role} />
      </main>
    </div>
  );
}
