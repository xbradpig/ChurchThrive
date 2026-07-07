import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import CheckBoard from "./CheckBoard";

export default async function CheckPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`; // 교회 경로 접두 (church-url-tenancy)
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect(`${base}/me`);
  const { data: enabled } = await supabase.rpc("module_enabled", { p_module: "attendance" });
  if (!enabled) redirect(`${base}/store`);   // 모듈 게이트: 미설치 교회는 스토어로

  const { data: events } = await supabase
    .from("events")
    .select("id, name, category, schedule_rule, sort_order")
    .eq("active", true)
    .order("sort_order");

  return (
    <div className="min-h-dvh pb-24 md:pl-60">
      <AppHeader role={role as AppRole} title="출석 체크" />
      <CheckBoard events={events ?? []} />
    </div>
  );
}
