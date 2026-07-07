import { createClient } from "@/lib/supabase/server";
import AppFrame from "@/components/AppFrame";
import CalendarBoard from "./CalendarBoard";
import ModuleGate from "@/components/ModuleGate";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const { data: enabled } = await supabase.rpc("module_enabled", { p_module: "calendar" });

  return (
    <AppFrame title="행사·일정" isStaff={role !== "member"}>
      {enabled ? <CalendarBoard /> : <ModuleGate moduleName="행사·일정" isAdmin={role === "superadmin"} />}
    </AppFrame>
  );
}
