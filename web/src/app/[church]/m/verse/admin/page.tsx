import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import VerseAdmin from "./VerseAdmin";

export default async function VerseAdminPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`; // 교회 경로 접두 (church-url-tenancy)
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const { data: canAdmin } = await supabase.rpc("has_module", { p_module: "verse", p_level: "admin" });
  if (!canAdmin) redirect(`${base}/m/verse`);   // 모듈 admin 권한 게이트 (module_grants)

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={(role as AppRole) ?? "member"} title="말씀 암송 관리" />
      <VerseAdmin />
    </div>
  );
}
