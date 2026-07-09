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
  // 연합 활동 타임라인 (타 앱이 발행한 수료·완독 등 — 정본 §5)
  const { data: timeline } = await supabase.rpc("member_federation_timeline", { p_member_id: id });

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
              <FederationTimeline events={(timeline ?? []) as FedEvent[]} />
            </>
          )
          : <div className="card p-8 text-center text-[var(--text-soft)]">열람 권한이 없거나 존재하지 않는 교인입니다.</div>}
      </main>
    </div>
  );
}

type FedEvent = { event_id: string; source_app: string; type: string; payload: Record<string, unknown> | null; occurred_at: string | null };

const APP_LABEL: Record<string, string> = {
  manna: "청지기 재정", family_verse: "말씀 암송", compass: "소명", bluehill: "리더십 훈련", church_thrive: "교회", portal: "하브루타",
};
const TYPE_LABEL: Record<string, string> = {
  "training.completed": "수료", "reading.completed": "완독", "diagnosis.completed": "진단 완료",
};

function FederationTimeline({ events }: { events: FedEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="card p-5 mt-3">
      <h3 className="font-black text-[var(--color-brand-700)] mb-3">연합 활동</h3>
      <div className="flex flex-col">
        {events.map((e) => (
          <div key={e.event_id} className="flex items-center gap-2 py-2.5 border-t border-[var(--line)] first:border-t-0">
            <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
              {APP_LABEL[e.source_app] ?? e.source_app}
            </span>
            <b>{TYPE_LABEL[e.type] ?? e.type}</b>
            <span className="text-sm text-[var(--text-soft)] truncate">
              {(e.payload?.title as string) ?? (e.payload?.ref_id as string) ?? ""}
            </span>
            {e.occurred_at && (
              <span className="ml-auto text-xs text-[var(--text-soft)] shrink-0">{e.occurred_at.slice(0, 10)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
