import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import StoreBoard from "./StoreBoard";

export default async function StorePage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const { data: mods } = await supabase.from("church_modules").select("module, enabled");
  const { data: church } = await supabase.from("churches").select("name").limit(1).single();

  return (
    <div className="min-h-dvh">
      <AppHeader role={(role as AppRole) ?? "member"} title="마켓 스토어" />
      <StoreBoard
        isAdmin={role === "superadmin"}
        churchName={church?.name ?? ""}
        installed={Object.fromEntries((mods ?? []).map((m) => [m.module, m.enabled]))}
      />
    </div>
  );
}
