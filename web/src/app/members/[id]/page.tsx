import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import MemberCard from "@/components/MemberCard";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect("/me");

  const { data: card } = await supabase.rpc("get_member_card", { p_member_id: id });

  return (
    <div className="min-h-dvh">
      <AppHeader role={role as AppRole} title="교적카드" />
      <main className="max-w-lg mx-auto p-4">
        {card
          ? <MemberCard card={card} />
          : <div className="card p-8 text-center text-[var(--text-soft)]">열람 권한이 없거나 존재하지 않는 교인입니다.</div>}
      </main>
    </div>
  );
}
