import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type AppRole } from "@/lib/roles";
import Landing from "@/components/Landing";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <Landing />;                    // 공개 랜딩

  const [{ data: role }, { data: isPa }, { data: slug }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.rpc("is_platform_admin"),
    supabase.rpc("my_church_slug"),
  ]);
  // 하브루타 총괄(플랫폼) 어드민 — 교회 무소속이면 플랫폼 콘솔로 (교회 신청 화면 X)
  if (isPa && !slug) redirect("/platform");
  redirect(ROLE_HOME[(role as AppRole) ?? "member"]);
}
