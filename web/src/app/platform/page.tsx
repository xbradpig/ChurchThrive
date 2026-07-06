import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlatformConsole from "./PlatformConsole";

/**
 * 플랫폼 운영 콘솔 (ui-upgrade U4) — 교회 컨텍스트와 분리된 별도 공간 (D2)
 * 접근: platform_admins만. 교회 내부 데이터는 집계 RPC로만 (D6)
 */
export default async function PlatformPage() {
  const supabase = await createClient();
  const { data: isPa } = await supabase.rpc("is_platform_admin");
  if (!isPa) redirect("/home");

  const [{ data: overview }, { data: pending }, { data: applications }, { data: audit }] = await Promise.all([
    supabase.rpc("platform_overview"),
    supabase.rpc("platform_pending_churches"),
    supabase.rpc("platform_pending_applications"),
    supabase.rpc("platform_recent_audit", { p_limit: 100 }),
  ]);

  return <PlatformConsole overview={overview} pending={pending ?? []}
                          applications={applications ?? []} audit={audit ?? []} />;
}
