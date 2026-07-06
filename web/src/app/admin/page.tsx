import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import AdminTabs from "./AdminTabs";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member" || role === "checker") redirect("/");

  return (
    <div className="min-h-dvh">
      <AppHeader role={role as AppRole} title="대시보드" />
      <AdminTabs role={role as AppRole} />
    </div>
  );
}
