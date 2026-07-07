import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import CalendarAdmin from "./CalendarAdmin";

export default async function CalendarAdminPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`; // 교회 경로 접두 (church-url-tenancy)
  const supabase = await createClient();
  const [{ data: role }, { data: canManage }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.rpc("has_module", { p_module: "calendar", p_level: "manager" }),
  ]);
  // 부서 담당자는 자기 부서 행사 등록 가능 (RLS가 최종 판정)
  const allowed = role === "superadmin" || role === "pastor" || role === "dept_leader" || !!canManage;
  if (!allowed) redirect(`${base}/m/calendar`);

  return (
    <AppFrame title="행사 관리" isStaff>
      <CalendarAdmin />
    </AppFrame>
  );
}
