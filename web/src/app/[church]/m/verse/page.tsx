import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppFrame from "@/components/AppFrame";
import VerseBoard from "./VerseBoard";
import ModuleGate from "@/components/ModuleGate";

export default async function VersePage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const { data: enabled } = await supabase.rpc("module_enabled", { p_module: "verse" });

  return (
    <AppFrame title="말씀 암송" isStaff={role !== "member"}>
      {enabled ? <VerseBoard /> : <ModuleGate moduleName="말씀 암송" isAdmin={role === "superadmin"} />}
    </AppFrame>
  );
}
