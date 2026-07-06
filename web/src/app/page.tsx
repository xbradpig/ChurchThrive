import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type AppRole } from "@/lib/roles";
import Landing from "@/components/Landing";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <Landing />;                    // 공개 랜딩

  const { data: role } = await supabase.rpc("my_role");
  redirect(ROLE_HOME[(role as AppRole) ?? "member"]);
}
