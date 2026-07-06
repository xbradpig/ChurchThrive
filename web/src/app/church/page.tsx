import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import AdminTabs from "../admin/AdminTabs";

/** 교회 관리 (ui-upgrade U3 — 기존 /admin 승격, /admin은 리다이렉트 유지) */
export default async function ChurchAdminPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member" || role === "checker") redirect("/home");

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교회 관리" />
      <AdminTabs role={role as AppRole} />
    </div>
  );
}
