import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "superadmin" | "pastor" | "dept_leader" | "checker" | "member";

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "수퍼관리자",
  pastor: "교역자",
  dept_leader: "부서 담당자",
  checker: "출석 담당자",
  member: "교인",
};

export const ROLE_HOME: Record<AppRole, string> = {
  superadmin: "/home",     // 위젯 홈 (운영 위젯 포함)
  pastor: "/home",
  dept_leader: "/check",   // 실무자는 작업 화면 직행 (ia-menu 원칙)
  checker: "/check",
  member: "/home",
};

export async function getMyRole(supabase: SupabaseClient): Promise<AppRole> {
  const { data } = await supabase.rpc("my_role");
  return (data as AppRole) ?? "member";
}

export const isStaffRole = (r: AppRole) => r !== "member";
