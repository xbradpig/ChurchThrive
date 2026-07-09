import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";
import AppFrame from "@/components/AppFrame";
import AccountSetupBanner from "@/components/AccountSetupBanner";
import MemberCard from "@/components/MemberCard";
import ConsentPanel from "./ConsentPanel";
import SelfCheckin from "./SelfCheckin";
import MyQR from "./MyQR";
import RegisterCard from "./RegisterCard";
import type { EditRequest } from "@/components/MemberCard";

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc("my_role");
  const { data: myMemberId } = await supabase.rpc("my_member_id");

  const card = myMemberId
    ? (await supabase.rpc("get_member_card", { p_member_id: myMemberId })).data
    : null;
  const editRequest = myMemberId
    ? ((await supabase.rpc("my_edit_request")).data as EditRequest[] | null)?.[0] ?? null
    : null;

  const { data: events } = await supabase
    .from("events").select("id, name").eq("active", true).order("sort_order");

  return (
    <AppFrame title="내 교적" isStaff={role !== "member"}>
      <AccountSetupBanner email={user?.email} />
      {!card ? (
        <RegisterCard />
      ) : (
        <>
          <SelfCheckin events={events ?? []} />
          <MemberCard card={card} editable editRequest={editRequest} />
          <MyQR memberId={myMemberId} name={`${card.name}${card.name_suffix ?? ""}`} />
          <ConsentPanel memberId={myMemberId} />
        </>
      )}
    </AppFrame>
  );
}
