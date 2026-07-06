import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import VerseBoard from "./VerseBoard";
import ModuleGate from "@/components/ModuleGate";

export default async function VersePage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const { data: enabled } = await supabase.rpc("module_enabled", { p_module: "verse" });

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={(role as AppRole) ?? "member"} title="말씀 암송" />
      {enabled ? <VerseBoard /> : <ModuleGate moduleName="말씀 암송" isAdmin={role === "superadmin"} />}
    </div>
  );
}
