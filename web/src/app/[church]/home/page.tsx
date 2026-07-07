import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/roles";
import AppFrame from "@/components/AppFrame";
import InstallBanner from "@/components/InstallBanner";

type Feed = {
  church_name: string | null;
  next_sunday: string;
  week_events: { name: string; category: string; rule: { dow?: number[]; start?: string } | null }[];
  notices: { id: string; title: string; created_at: string }[] | null;
  bulletin: { id: string; title: string; week_start: string } | null;
  join_pending: number | null;
  selfcheck_pending: number | null;
  visit_requested: number | null;
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 웹 홈 = 3-Zone 대시보드 (web-home-proposal) · 모바일 = 동일 위젯 1열 (웹/앱 분리 원칙) */
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: role }, { data: verseEnabled }, { data: churchStatus }, { data: feedRaw }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.rpc("module_enabled", { p_module: "verse" }),
    supabase.rpc("my_church_status"),
    supabase.rpc("home_feed"),
  ]);
  if (churchStatus && churchStatus !== "active") redirect("/pending");
  const feed = (feedRaw ?? {}) as Feed;
  const r = (role as AppRole) ?? "member";
  const isStaffRole = r !== "member";
  const isChurchStaff = r === "superadmin" || r === "pastor";

  const [{ data: myId }, verse, absentees] = await Promise.all([
    supabase.rpc("my_member_id"),
    verseEnabled ? supabase.rpc("verse_current") : Promise.resolve({ data: null }),
    isChurchStaff || r === "dept_leader" ? supabase.rpc("absentee_list", { p_weeks: 2 }) : Promise.resolve({ data: null }),
  ]);
  const currentVerse = (verse.data as { reference: string; body: string; checked: boolean }[] | null)?.[0];
  const myAtt = myId
    ? (await supabase.from("attendances").select("event_date").eq("member_id", myId)
        .order("event_date", { ascending: false }).limit(8)).data
    : null;

  const today = new Date();
  const dday = Math.max(0, Math.ceil((new Date(feed.next_sunday + "T00:00:00").getTime() - today.getTime()) / 864e5));
  const todos: { icon: string; label: string; href: string; n: number }[] = [];
  if ((feed.join_pending ?? 0) > 0) todos.push({ icon: "🙋", label: "가입 신청 승인", href: "/church?tab=members", n: feed.join_pending! });
  if ((feed.selfcheck_pending ?? 0) > 0) todos.push({ icon: "✋", label: "출석 본인 인증 확인", href: "/check", n: feed.selfcheck_pending! });
  if ((feed.visit_requested ?? 0) > 0) todos.push({ icon: "🏠", label: "심방 요청 배정", href: "/m/visitation", n: feed.visit_requested! });

  return (
    <AppFrame title="홈" isStaff={isStaffRole} wide>
      <div data-testid="widget-home" className="flex flex-col gap-4">
        <InstallBanner />

        {/* 헤더 스트립 */}
        <div className="card px-5 py-4 flex items-center gap-3 flex-wrap" data-widget="header-strip">
          <span className="font-black text-lg">
            {today.getMonth() + 1}월 {today.getDate()}일 ({DOW[today.getDay()]})
          </span>
          <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
            {dday === 0 ? "오늘은 주일 ⛪" : `주일까지 D-${dday}`}
          </span>
          {currentVerse && (
            <Link href="/m/verse" className="text-sm text-[var(--text-soft)] truncate min-w-0 flex-1 text-right hidden sm:block">
              📖 {currentVerse.reference} — &ldquo;{currentVerse.body.slice(0, 30)}…&rdquo;
            </Link>
          )}
        </div>

        {/* 12-grid: 좌(A·C·E) 8칸 · 우(B·D) 4칸 — 모바일은 자연 스택 */}
        <div className="grid md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-8 flex flex-col gap-4">

            {/* A. 해야 할 일 */}
            {todos.length > 0 && (
              <div className="card p-5" style={{ borderColor: "var(--color-caution)" }} data-widget="todo">
                <b style={{ color: "var(--color-caution)" }}>📌 지금 해야 할 일</b>
                <div className="mt-2 flex flex-col divide-y divide-[var(--line)]">
                  {todos.map((t) => (
                    <Link key={t.label} href={t.href} className="flex items-center gap-3 py-2.5">
                      <span className="text-xl">{t.icon}</span>
                      <b>{t.label}</b>
                      <span className="badge" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>{t.n}건</span>
                      <span className="ml-auto text-[var(--text-soft)]">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* C. 우리 교회의 오늘 */}
            <div className="card p-5" data-widget="church-today">
              <b className="text-[var(--color-brand-700)]">⛪ 우리 교회의 이번 주</b>
              <div className="mt-3 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] mb-1.5">예배·모임</p>
                  {feed.week_events?.length ? feed.week_events.map((e) => (
                    <p key={e.name} className="flex items-center gap-2 py-1 text-[15px]">
                      <span className="badge" style={{ background: "var(--surface-soft)" }}>
                        {(e.rule?.dow ?? []).map((d) => DOW[d]).join("·") || "—"}
                      </span>
                      <b>{e.name}</b>
                      <span className="text-sm text-[var(--text-soft)]">{e.rule?.start ?? ""}</span>
                    </p>
                  )) : <p className="text-sm text-[var(--text-soft)]">등록된 정기 모임이 없습니다.</p>}
                  {feed.bulletin && (
                    <Link href="/m/bulletin" className="btn btn-ghost !min-h-9 text-sm mt-2">
                      📰 {feed.bulletin.title} 주보 보기
                    </Link>
                  )}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] mb-1.5">공지</p>
                  {feed.notices?.length ? feed.notices.map((n) => (
                    <Link key={n.id} href="/m/notice" className="flex items-center gap-2 py-1 text-[15px]">
                      <span className="text-xs text-[var(--text-soft)] tabular">{n.created_at}</span>
                      <span className="font-bold truncate">{n.title}</span>
                    </Link>
                  )) : <p className="text-sm text-[var(--text-soft)]">새 공지가 없습니다.</p>}
                </div>
              </div>
            </div>

            {/* E. 사역 현황 (교역자·부서장·관리자) */}
            {absentees.data && (
              <Link href="/church?tab=absentees" data-widget="absentee" className="card card-hover p-5 flex items-center gap-3">
                <span className="text-3xl">🔔</span>
                <span>
                  <b>2주 이상 미출석 {absentees.data.length}명</b>
                  <span className="block text-sm text-[var(--text-soft)]">
                    케어 대상 {(absentees.data as { care_target: boolean }[]).filter((a) => a.care_target).length}명 포함 — 눌러서 확인
                  </span>
                </span>
                <span className="ml-auto text-[var(--text-soft)]">→</span>
              </Link>
            )}
          </div>

          <div className="md:col-span-4 flex flex-col gap-4">

            {/* B. 나의 신앙 */}
            {currentVerse && (
              <Link href="/m/verse" data-widget="verse" className="card card-hover overflow-hidden">
                <div className="px-5 py-3 text-white text-sm font-bold" style={{ background: "var(--color-brand-800)" }}>
                  📖 이번 주 암송 — {currentVerse.reference} {currentVerse.checked && "✓"}
                </div>
                <p className="px-5 py-4 font-bold leading-relaxed">
                  &ldquo;{currentVerse.body.slice(0, 60)}{currentVerse.body.length > 60 ? "…" : ""}&rdquo;
                </p>
              </Link>
            )}

            <div className="card p-5" data-widget="my-attendance">
              <b className="text-[var(--color-brand-700)]">내 출석</b>
              {myAtt?.length ? (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {myAtt.slice(0, 6).map((a, i) => (
                    <span key={i} className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
                      {a.event_date.slice(5).replace("-", "/")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-soft)] mt-1">아직 출석 기록이 없습니다.</p>
              )}
              <Link href="/me" className="btn btn-ghost w-full mt-3 !min-h-10 text-sm">내 교적 · 내 QR</Link>
            </div>

            {/* 연합 슬롯 (하브루타 생태계 — Phase 1 활성 예정) */}
            <div className="card p-4 opacity-70" data-widget="federation-slot">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)]">하브루타 연결</p>
              <p className="text-sm text-[var(--text-soft)] mt-1">
                말씀·재정·소명 앱과 연결되면 나의 여정 요약이 여기에 표시됩니다.
              </p>
            </div>

            {/* D. 바로 가기 (역할별) */}
            {isStaffRole && (
              <div className="card p-5" data-widget="quick-actions">
                <b className="text-[var(--color-brand-700)]">바로 가기</b>
                <div className="mt-2 flex flex-col gap-1.5">
                  <Link href="/check" data-widget="work-shortcut"
                        className="btn !justify-start !min-h-11 text-sm !bg-[var(--color-brand-800)] text-white">
                    ✅ 오늘 출석 체크
                    {(feed.selfcheck_pending ?? 0) > 0 && (
                      <span className="badge ml-auto" style={{ background: "var(--color-accent)", color: "#fff" }}>
                        인증 대기 {feed.selfcheck_pending}
                      </span>
                    )}
                  </Link>
                  <Link href="/invites" className="btn btn-ghost !justify-start !min-h-11 text-sm">📲 교인 초대</Link>
                  {isChurchStaff && (
                    <Link href="/church" className="btn btn-ghost !justify-start !min-h-11 text-sm">🏛 교회 관리</Link>
                  )}
                  {r === "superadmin" && (
                    <Link href="/store" data-widget="store" className="btn btn-ghost !justify-start !min-h-11 text-sm">
                      🏪 마켓 스토어
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
