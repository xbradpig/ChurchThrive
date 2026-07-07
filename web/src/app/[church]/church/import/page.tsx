import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import ImportBoard from "./ImportBoard";

/** CSV 교인 일괄 등록 (P2 백로그 — 엑셀 위저드 v1 대체) */
export default async function ImportPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`; // 교회 경로 접두 (church-url-tenancy)
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (role !== "superadmin" && role !== "pastor") redirect(`${base}/home`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교인 일괄 등록" />
      <ImportBoard />
    </div>
  );
}
