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
  superadmin: "/admin",
  pastor: "/admin",
  dept_leader: "/check",
  checker: "/check",
  member: "/me",
};

export async function getMyRole(supabase: SupabaseClient): Promise<AppRole> {
  const { data } = await supabase.rpc("my_role");
  return (data as AppRole) ?? "member";
}

export const isStaffRole = (r: AppRole) => r !== "member";
