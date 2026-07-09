import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StatsNav from "../StatsNav";
import NotesClient from "./NotesClient";

/** 말씀노트 현황 — 작성 여부/건수만 집계, 내용 비노출 (detail_goal §3-3 프라이버시) */
export default async function StatsNotesPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  const base = `/${church}`;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member" || role === "checker") redirect(`${base}/stats`);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="말씀노트 현황" />
      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-4">
        <StatsNav role={role} />
        <NotesClient />
      </main>
    </div>
  );
}
