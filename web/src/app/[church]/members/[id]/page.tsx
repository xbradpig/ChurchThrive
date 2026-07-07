import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";
import MemberCard from "@/components/MemberCard";
import InviteButton from "@/components/InviteButton";

export default async function MemberDetailPage({ params }: { params: Promise<{ church: string; id: string }> }) {
  const { church, id } = await params;
  const base = `/${church}`; // 교회 경로 접두 (church-url-tenancy)
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") redirect(`${base}/me`);

  const { data: card } = await supabase.rpc("get_member_card", { p_member_id: id });

  return (
    <div className="min-h-dvh md:pl-60">
      <AppHeader role={role as AppRole} title="교적카드" />
      <main className="max-w-lg mx-auto p-4">
        {card
          ? (
            <>
              <MemberCard card={card} />
              {!card.user_id && (
                <div className="mt-3">
                  <InviteButton memberId={id} memberName={card.name ?? ""} phone={card.phone} />
                </div>
              )}
            </>
          )
          : <div className="card p-8 text-center text-[var(--text-soft)]">열람 권한이 없거나 존재하지 않는 교인입니다.</div>}
      </main>
    </div>
  );
}
