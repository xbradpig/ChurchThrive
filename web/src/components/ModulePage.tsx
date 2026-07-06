import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppFrame from "@/components/AppFrame";
import ModuleGate from "@/components/ModuleGate";

/** 모듈 페이지 공통 셸: 설치 게이트 + 권한 컨텍스트 주입 (3단 패턴의 틀) */
export default async function ModulePage({
  moduleKey, title, children,
}: { moduleKey: string; title: string; children: (ctx: { role: AppRole; canManage: boolean; isAdmin: boolean }) => React.ReactNode }) {
  const supabase = await createClient();
  const [{ data: role }, { data: enabled }, { data: canManage }, { data: canAdmin }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.rpc("module_enabled", { p_module: moduleKey }),
    supabase.rpc("has_module", { p_module: moduleKey, p_level: "manager" }),
    supabase.rpc("has_module", { p_module: moduleKey, p_level: "admin" }),
  ]);
  const r = (role as AppRole) ?? "member";

  return (
    <AppFrame title={title} isStaff={r !== "member"}>
      {enabled
        ? children({ role: r, canManage: !!canManage, isAdmin: !!canAdmin })
        : <ModuleGate moduleName={title} isAdmin={r === "superadmin"} />}
    </AppFrame>
  );
}
