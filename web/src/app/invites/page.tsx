import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import InviteBoard from "./InviteBoard";

/** 교인 초대 (교역자·부서장·담당자) — 미가입 교인 일괄 초대 */
export default async function InvitesPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect("/home");

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교인 초대" />
      <main className="max-w-3xl mx-auto p-4">
        <InviteBoard />
      </main>
    </div>
  );
}
