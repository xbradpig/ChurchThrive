"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TrendChart, { type TrendPoint } from "../admin/TrendChart";
import { Kpi, Section, EmptyCard } from "./ui";

type Overview = {
  sunday_att: number; sunday_att_prev: number; today_att: number;
  new_families: number | null; new_families_prev: number | null;
  members_active: number | null;
  verse: { reference: string; week_start: string; checked: number; target: number } | null;
  absentees_3w: number | null;
  giving_week: { total: number; households: number } | null;
  todo: { join_pending: number | null; newcomer_stall: number | null;
          selfcheck_pending: number | null; visit_requested: number | null };
} | null;

export default function OverviewClient({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const [ov, setOv] = useState<Overview>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: t }] = await Promise.all([
        supabase.rpc("stats_overview"),
        supabase.rpc("attendance_trend", { p_weeks: 13 }),
      ]);
      setOv((o ?? null) as Overview);
      setTrend((t ?? []) as TrendPoint[]);
      setLoaded(true);
    })();
  }, [supabase]);

  const eventNames = useMemo(() => [...new Set(trend.map((t) => t.event_name))], [trend]);
  const versePct = ov?.verse && ov.verse.target > 0
    ? Math.round((ov.verse.checked / ov.verse.target) * 100) : null;

  if (!loaded) return <div className="card p-10 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  if (!ov) return (
    <EmptyCard icon="📊" title="열람 권한이 없습니다"
      body="교회 현황은 교역자·부서 담당자·출석 담당자에게 제공됩니다." href={`${base}/home`} actionLabel="홈으로" />
  );

  const todos: { icon: string; label: string; cnt: number; href: string }[] = [];
  if (ov.todo.join_pending) todos.push({ icon: "🙋", label: "가입 승인 대기", cnt: ov.todo.join_pending, href: `${base}/church?tab=members` });
  if (ov.todo.newcomer_stall) todos.push({ icon: "🌱", label: "48시간 내 연락 필요한 새가족", cnt: ov.todo.newcomer_stall, href: `${base}/m/newcomer` });
  if (ov.absentees_3w) todos.push({ icon: "🔔", label: "3주 이상 미출석 — 심방 후보", cnt: ov.absentees_3w, href: `${base}/church?tab=absentees` });
  if (ov.todo.selfcheck_pending) todos.push({ icon: "✅", label: "자가 체크인 승인 대기", cnt: ov.todo.selfcheck_pending, href: `${base}/check` });
  if (ov.todo.visit_requested) todos.push({ icon: "🏠", label: "심방 요청", cnt: ov.todo.visit_requested, href: `${base}/m/visitation` });

  return (
    <>
      {/* ① KPI 스트립 (역할별 — 값 없는 카드는 렌더링 안 함) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="주일 출석" value={ov.sunday_att} prev={ov.sunday_att_prev} suffix="명" href={`${base}/stats/attendance`} />
        <Kpi label="이번 주 새가족" value={ov.new_families} prev={ov.new_families_prev} suffix="명" href={`${base}/m/newcomer`} />
        {versePct !== null && <Kpi label="이번 주 암송 참여" value={versePct} suffix="%" href={`${base}/stats/verse`} />}
        <Kpi label="심방 필요 (3주 미출석)" value={ov.absentees_3w} suffix="명" warn href={`${base}/church?tab=absentees`} />
        {ov.giving_week && (
          <Kpi label="주간 헌금 가정" value={ov.giving_week.households} suffix="가정" href={`${base}/stats/giving`} />
        )}
        <Kpi label="재적 교인" value={ov.members_active} suffix="명" href={`${base}/stats/members`} />
      </div>

      {/* ② 추세 존 — 기존 TrendChart 재사용 (13주) */}
      {trend.length > 0 ? (
        <TrendChart data={trend} events={eventNames} />
      ) : (
        <EmptyCard icon="✅" title="출석 기록을 시작하면 추이가 쌓입니다"
          body="출석 체크를 시작하면 여기에 주간 출석 추이가 표시됩니다."
          href={`${base}/check`} actionLabel="출석 체크 하러 가기" />
      )}

      {/* ③ 이번 주 해야 할 일 — 숫자에서 사람으로 (goal.md 원칙 ①②) */}
      <Section title="이번 주 해야 할 일">
        {todos.length === 0 ? (
          <p className="text-center py-6 text-[var(--text-soft)]">밀린 일이 없습니다 🎉</p>
        ) : (
          <div className="flex flex-col">
            {todos.map((t) => (
              <Link key={t.label} href={t.href}
                    className="flex items-center gap-3 py-3 border-t border-[var(--line)] first:border-t-0 hover:bg-[var(--color-sand-100)] rounded-lg px-2 -mx-2">
                <span className="text-xl">{t.icon}</span>
                <b className="mr-auto">{t.label}</b>
                <span className="badge" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>
                  {t.cnt}건
                </span>
                <span className="text-[var(--text-soft)]">›</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ④ 인쇄 보고서 + 주간 다이제스트 (Phase 3) */}
      <div className="grid md:grid-cols-2 gap-4 print:hidden">
        <Section title="당회·제직회 보고">
          <p className="text-sm text-[var(--text-soft)] mb-3">이 화면을 그대로 인쇄용 보고서로 출력합니다.</p>
          <button className="btn btn-primary w-full" onClick={() => window.print()}>🖨 주간 보고서 인쇄</button>
        </Section>
        {["superadmin", "pastor", "dept_leader"].includes(role) && <DigestCard />}
      </div>

      {/* 인쇄 스타일: 사이드바·네비·버튼 숨김 (A4 세로) */}
      <style jsx global>{`
        @media print {
          aside, header, nav, [data-testid="stats-nav"], .print\\:hidden { display: none !important; }
          .md\\:pl-60 { padding-left: 0 !important; }
          body { background: #fff; }
        }
      `}</style>
    </>
  );
}

/* 주간 현황 다이제스트 — 기존 notification_settings 재사용, kind 'stats_digest' (detail_goal §2-④) */
function DigestCard() {
  const supabase = useMemo(() => createClient(), []);
  const [s, setS] = useState({ enabled: false, send_dow: 1, send_time: "09:00" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notification_settings")
        .select("enabled, send_dow, send_time").eq("kind", "stats_digest").eq("user_id", user.id).maybeSingle();
      if (data) setS({ enabled: data.enabled, send_dow: data.send_dow, send_time: String(data.send_time).slice(0, 5) });
    })();
  }, [supabase]);

  async function save(next: typeof s) {
    setS(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notification_settings").upsert({
      user_id: user.id, kind: "stats_digest",
      enabled: next.enabled, send_dow: next.send_dow, send_time: next.send_time,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <Section title="주간 현황 다이제스트" right={saved ? <span className="text-sm text-[var(--color-positive)] font-bold">저장됨 ✓</span> : undefined}>
      <p className="text-sm text-[var(--text-soft)] mb-3">매주 정한 시각에 현황 요약을 푸시로 받습니다.</p>
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn !min-h-10 text-sm"
          style={s.enabled ? { background: "var(--color-positive)", color: "#fff" }
                           : { background: "var(--color-sand-200)", color: "var(--text-soft)" }}
          onClick={() => save({ ...s, enabled: !s.enabled })}>
          {s.enabled ? "받는 중" : "꺼짐"}
        </button>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={s.send_dow}
                onChange={(e) => save({ ...s, send_dow: Number(e.target.value) })}>
          {DOW.map((d, i) => <option key={i} value={i}>{d}요일</option>)}
        </select>
        <input type="time" className="input !w-auto !min-h-10 text-sm" value={s.send_time}
               onChange={(e) => save({ ...s, send_time: e.target.value })} />
      </div>
    </Section>
  );
}
