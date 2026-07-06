import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import CheckBoard from "./CheckBoard";

export default async function CheckPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect("/me");
  const { data: enabled } = await supabase.rpc("module_enabled", { p_module: "attendance" });
  if (!enabled) redirect("/store");   // 모듈 게이트: 미설치 교회는 스토어로

  const { data: events } = await supabase
    .from("events")
    .select("id, name, category, schedule_rule, sort_order")
    .eq("active", true)
    .order("sort_order");

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader role={role as AppRole} title="출석 체크" />
      <CheckBoard events={events ?? []} />
    </div>
  );
}
