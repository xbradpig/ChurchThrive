import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StatsNav from "../StatsNav";
import VerseClient from "./VerseClient";

/** 말씀 암송 현황 — 암송률·부서 참여·스트릭 (detail_goal §3-2, RPC 경계 뒤 배치) */
export default async function StatsVersePage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member" || role === "checker") redirect(`${base}/stats`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="말씀 암송 현황" />
      <main className="max-w-3xl mx-auto p-4 flex flex-col gap-4">
        <StatsNav role={role} />
        <VerseClient />
      </main>
    </div>
  );
}
