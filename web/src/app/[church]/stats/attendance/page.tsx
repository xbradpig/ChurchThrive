import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StatsNav from "../StatsNav";
import AttendanceClient from "./AttendanceClient";

/** 출석 현황 — 추이·이동평균·YoY·일관성 세그먼트·새가족 퍼널 (detail_goal §3-1) */
export default async function StatsAttendancePage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect(`${base}/home`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="출석 현황" />
      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-4">
        <StatsNav role={role} />
        <AttendanceClient role={role} />
      </main>
    </div>
  );
}
