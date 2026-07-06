import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppFrame from "@/components/AppFrame";
import MemberCard from "@/components/MemberCard";
import ConsentPanel from "./ConsentPanel";
import SelfCheckin from "./SelfCheckin";
import MyQR from "./MyQR";

export default async function MePage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  const { data: myMemberId } = await supabase.rpc("my_member_id");

  const card = myMemberId
    ? (await supabase.rpc("get_member_card", { p_member_id: myMemberId })).data
    : null;

  const { data: events } = await supabase
    .from("events").select("id, name").eq("active", true).order("sort_order");

  return (
    <AppFrame title="내 교적" isStaff={role !== "member"}>
      <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        {!card ? (
          <div className="card p-8 text-center text-[var(--text-soft)]">
            아직 교적이 연결되지 않았습니다.<br />교회 사무실에 문의해주세요.
          </div>
        ) : (
          <>
            <SelfCheckin events={events ?? []} />
            <MemberCard card={card} editable />
            <MyQR memberId={myMemberId} name={`${card.name}${card.name_suffix ?? ""}`} />
            <ConsentPanel memberId={myMemberId} />
          </>
        )}
      </main>
    </AppFrame>
  );
}
