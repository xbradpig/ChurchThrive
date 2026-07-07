"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Section, WeeklyBars, HBars, EmptyCard, type WeekPoint } from "../ui";

type Stats = {
  weekly: { week: string; category: string; cnt: number }[];
  yoy: { week: string; cnt: number }[];
  by_dept: { dept: string; cnt: number }[] | null;
  method_dist: Record<string, number>;
  consistency: { weekly: number; biweekly: number; monthly: number; at_risk: number };
  funnel: { registered: number; returned_4w: number; stages: Record<string, number> } | null;
} | null;

const CAT_LABEL: Record<string, string> = { worship: "예배", education: "교육", meeting: "모임", visit: "방문", other: "기타" };
const METHOD_LABEL: Record<string, string> = {
  manual: "수동 체크", qr: "QR", nfc: "NFC", self: "자가 체크", auto_wifi: "자동(WiFi)", auto_ble: "자동(BLE)",
};

export default function AttendanceClient({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const [st, setSt] = useState<Stats>(null);
  const [cat, setCat] = useState("worship");
  const [showYoy, setShowYoy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc("stats_attendance", { p_weeks: 13 }).then(({ data }) => {
      setSt((data ?? null) as Stats);
      setLoaded(true);
    });
  }, [supabase]);

  const cats = useMemo(() => [...new Set((st?.weekly ?? []).map((w) => w.category))], [st]);
  const points: WeekPoint[] = useMemo(() => {
    const rows = (st?.weekly ?? []).filter((w) => w.category === cat);
    const yoyMap = new Map((st?.yoy ?? []).map((y) => [y.week, y.cnt]));
    return rows.map((r) => ({
      label: r.week.slice(5).replace("-", "/"),
      value: r.cnt,
      // YoY: 전년 데이터 없으면 뱃지 자체를 숨김 (0% 표시 금지 — §2-⑤)
      overlay: showYoy && cat === "worship" ? yoyMap.get(r.week) ?? null : null,
    }));
  }, [st, cat, showYoy]);

  if (!loaded) return <div className="card p-10 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  if (!st || st.weekly.length === 0)
    return <EmptyCard icon="✅" title="출석 기록을 시작하면 추이가 쌓입니다"
      body="출석 체크를 시작하면 주간 추이·부서별 현황·일관성 분석이 여기에 표시됩니다."
      href={`${base}/check`} actionLabel="출석 체크 하러 가기" />;

  const cons = st.consistency;
  const totalCons = cons.weekly + cons.biweekly + cons.monthly + cons.at_risk;
  const hasYoy = (st.yoy ?? []).length > 0;

  return (
    <>
      <Section title="주간 출석 추이 (13주)"
        right={
          <>
            {hasYoy && (
              <button className={`btn !min-h-9 text-sm ${showYoy ? "btn-positive" : "btn-ghost"}`}
                      onClick={() => setShowYoy((v) => !v)}>전년 동기</button>
            )}
            <select className="input !w-auto !min-h-9 text-sm font-bold" value={cat}
                    onChange={(e) => setCat(e.target.value)}>
              {cats.map((c) => <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>)}
            </select>
          </>
        }>
        <WeeklyBars points={points} overlayLabel={showYoy ? "전년 동기" : undefined} />
      </Section>

      {/* 출석 일관성 세그먼트 — at-risk 사전 감지 (detail_goal §3-1) */}
      <Section title="출석 일관성 (최근 13주 · 등록 교인)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["매주", cons.weekly, "11주 이상", "var(--color-positive)"],
            ["격주", cons.biweekly, "6~10주", "var(--color-brand-700)"],
            ["월 1회", cons.monthly, "2~5주", "var(--color-caution)"],
            ["이탈 위험", cons.at_risk, "1주 이하", "var(--color-danger)"],
          ] as const).map(([label, cnt, desc, color]) => (
            <div key={label} className="card p-4 text-center !shadow-none border border-[var(--line)]">
              <p className="text-sm font-bold" style={{ color }}>{label}</p>
              <p className="text-2xl font-black tabular mt-1">{cnt}명</p>
              <p className="text-xs text-[var(--text-soft)] mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        {totalCons > 0 && cons.at_risk > 0 && (
          <Link href={`${base}/church?tab=absentees`}
                className="btn btn-ghost w-full mt-3 !min-h-10 text-sm">
            이탈 위험 {cons.at_risk}명 명단 보기 → 심방 연결
          </Link>
        )}
      </Section>

      {/* 새가족 정착 퍼널 (Phase 2 — mod_newcomer 연동) */}
      {st.funnel && st.funnel.registered > 0 && (
        <Section title="새가족 정착 퍼널 (최근 180일)">
          <HBars items={[
            { label: "등록", cnt: st.funnel.registered },
            { label: "4주 내 재출석", cnt: st.funnel.returned_4w },
            { label: "환영 (2단계)", cnt: st.funnel.stages.s2 ?? 0 },
            { label: "교육 (3단계)", cnt: st.funnel.stages.s3 ?? 0 },
            { label: "정착 (4단계)", cnt: st.funnel.stages.s4 ?? 0 },
          ]} />
          <p className="text-sm text-[var(--text-soft)] mt-3">
            4주 내 재출석률 <b className="tabular">{Math.round((st.funnel.returned_4w / st.funnel.registered) * 100)}%</b>
            — 첫 방문 후 48시간 내 연락이 재방문율을 크게 높입니다.
          </p>
        </Section>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {st.by_dept && st.by_dept.length > 0 && (
          <Section title="부서별 출석 (최근 4주)">
            <HBars items={st.by_dept.map((d) => ({ label: d.dept, cnt: d.cnt }))} />
          </Section>
        )}
        <Section title="체크인 방식 (13주)">
          <HBars items={Object.entries(st.method_dist)
            .map(([k, v]) => ({ label: METHOD_LABEL[k] ?? k, cnt: v }))
            .sort((a, b) => b.cnt - a.cnt)} unit="건" />
        </Section>
      </div>

      {role === "dept_leader" && (
        <p className="text-sm text-[var(--text-soft)] text-center">부서 담당자는 담당 부서 기준으로 표시됩니다.</p>
      )}
    </>
  );
}
