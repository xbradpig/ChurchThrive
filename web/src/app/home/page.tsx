import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppFrame from "@/components/AppFrame";
import InstallBanner from "@/components/InstallBanner";

/** 역할별 위젯 홈 (ui-upgrade U2 — identity §6.5 조립 규칙의 v1 구현) */
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: role }, { data: church }, { data: verseEnabled }, { data: churchStatus }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.from("churches").select("name").limit(1).maybeSingle(),
    supabase.rpc("module_enabled", { p_module: "verse" }),
    supabase.rpc("my_church_status"),
  ]);
  if (churchStatus && churchStatus !== "active") redirect("/pending");   // 승인 전 사용 차단
  const { data: joinPending } = (role === "superadmin" || role === "pastor")
    ? await supabase.rpc("admin_list_join_requests") : { data: null };
  const r = (role as AppRole) ?? "member";
  const isStaffRole = r !== "member";
  const isChurchStaff = r === "superadmin" || r === "pastor";

  // 위젯 데이터 (역할별 필요한 것만)
  const [{ data: myId }, verse, absentees, pendingSelf] = await Promise.all([
    supabase.rpc("my_member_id"),
    verseEnabled ? supabase.rpc("verse_current") : Promise.resolve({ data: null }),
    isChurchStaff || r === "dept_leader" ? supabase.rpc("absentee_list", { p_weeks: 2 }) : Promise.resolve({ data: null }),
    isStaffRole ? supabase.from("attendances").select("id").eq("approved", false) : Promise.resolve({ data: null }),
  ]);
  const currentVerse = (verse.data as { reference: string; body: string; checked: boolean }[] | null)?.[0];
  const myAtt = myId
    ? (await supabase.from("attendances").select("event_date").eq("member_id", myId)
        .order("event_date", { ascending: false }).limit(4)).data
    : null;

  return (
    <AppFrame title="홈" isStaff={isStaffRole}>
      <main data-testid="widget-home" className="py-2 flex flex-col gap-4">
        <InstallBanner />
        {(joinPending?.length ?? 0) > 0 && (
          <Link href="/church?tab=members" className="card card-hover p-4 flex items-center gap-3"
                style={{ borderColor: "var(--color-caution)" }} data-widget="todo">
            <span className="text-2xl">🙋</span>
            <span className="font-bold">가입 신청 {joinPending!.length}건이 승인을 기다리고 있어요</span>
            <span className="ml-auto">→</span>
          </Link>
        )}

        {/* [담당자] 오늘 작업 바로가기 — 대형 버튼 */}
        {isStaffRole && (
          <Link href="/check" data-widget="work-shortcut"
                className="card p-6 flex items-center gap-4 !bg-[var(--color-brand-800)] text-white">
            <span className="text-4xl">✅</span>
            <span>
              <b className="text-xl">오늘 출석 체크</b>
              {(pendingSelf.data?.length ?? 0) > 0 && (
                <span className="block text-sm" style={{ color: "var(--color-accent)" }}>
                  본인 인증 대기 {pendingSelf.data!.length}건
                </span>
              )}
            </span>
            <span className="ml-auto text-2xl opacity-60">›</span>
          </Link>
        )}

        {/* [교역자·부서장] 미출석 케어 */}
        {absentees.data && (
          <Link href="/admin" data-widget="absentee" className="card p-5 flex items-center gap-3">
            <span className="text-3xl">🔔</span>
            <span>
              <b>2주 이상 미출석 {absentees.data.length}명</b>
              <span className="block text-sm text-[var(--text-soft)]">
                케어 대상 {(absentees.data as { care_target: boolean }[]).filter((a) => a.care_target).length}명 포함 — 눌러서 확인
              </span>
            </span>
          </Link>
        )}

        {/* [전원] 이번 주 말씀 */}
        {currentVerse && (
          <Link href="/m/verse" data-widget="verse" className="card overflow-hidden">
            <div className="px-5 py-3 text-white text-sm font-bold" style={{ background: "var(--color-brand-800)" }}>
              📖 이번 주 암송 — {currentVerse.reference} {currentVerse.checked && "✓"}
            </div>
            <p className="px-5 py-4 text-lg font-bold leading-relaxed">
              &ldquo;{currentVerse.body.slice(0, 60)}{currentVerse.body.length > 60 ? "…" : ""}&rdquo;
            </p>
          </Link>
        )}

        {/* [전원] 내 출석 */}
        <div className="card p-5" data-widget="my-attendance">
          <b className="text-[var(--color-brand-700)]">내 출석</b>
          {myAtt?.length ? (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {myAtt.map((a, i) => (
                <span key={i} className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
                  {a.event_date.slice(5).replace("-", "/")}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-soft)] mt-1">아직 출석 기록이 없습니다.</p>
          )}
          <Link href="/me" className="btn btn-ghost w-full mt-3 !min-h-10 text-sm">내 교적 보기</Link>
        </div>

        {/* [교회 관리자] 운영 위젯 */}
        {r === "superadmin" && (
          <Link href="/store" data-widget="store" className="card p-5 flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <span><b>마켓 스토어</b><span className="block text-sm text-[var(--text-soft)]">기능 설치·해지·구독 관리</span></span>
          </Link>
        )}
      </main>
    </AppFrame>
  );
}
