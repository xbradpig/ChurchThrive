import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import Scanner from "./Scanner";

export default async function ScanPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect("/me");

  const { data: events } = await supabase
    .from("events").select("id, name").eq("active", true).order("sort_order");

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="QR 스캔" />
      <Scanner events={events ?? []} />
    </div>
  );
}
