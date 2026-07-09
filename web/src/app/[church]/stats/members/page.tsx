import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StatsNav from "../StatsNav";
import MembersClient from "./MembersClient";

/** 교적 현황 — 분포·증감(audit_log)·종합 참여 (detail_goal §3-5) */
export default async function StatsMembersPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  // checker는 출석 현황까지만 (권한 매트릭스)
  if (!role || role === "member" || role === "checker") redirect(`${base}/stats`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교적 현황" />
      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-4">
        <StatsNav role={role} />
        <MembersClient role={role} />
      </main>
    </div>
  );
}
