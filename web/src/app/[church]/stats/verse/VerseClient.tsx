"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Section, WeeklyBars, HBars, EmptyCard } from "../ui";

type Stats = {
  weekly: { week: string; reference: string; checked: number; target: number }[];
  by_dept: { label: string; checked: number; total: number; rate: number }[];
  streaks: { name: string; streak: number }[];
  wau: number;
  year_review: { checks: number; participants: number; assignments: number };
} | null;

export default function VerseClient() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const [st, setSt] = useState<Stats>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc("stats_verse", { p_weeks: 13 }).then(({ data }) => {
      setSt((data ?? null) as Stats);
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <div className="card p-10 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  if (!st || st.weekly.length === 0)
    return <EmptyCard icon="📖" title="암송 구절을 등록하면 현황이 쌓입니다"
      body="주차별 암송 구절을 등록하고 교인들이 체크하면 암송률·스트릭이 여기에 표시됩니다."
      href={`${base}/m/verse/admin`} actionLabel="암송 구절 등록하러 가기" />;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">주간 활동자</p>
          <p className="text-2xl font-black tabular mt-1">{st.wau}명</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">올해 참여 교인</p>
          <p className="text-2xl font-black tabular mt-1">{st.year_review.participants}명</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">올해 암송 체크</p>
          <p className="text-2xl font-black tabular mt-1">{st.year_review.checks}건</p>
        </div>
      </div>

      <Section title="주차별 암송률 (13주)">
        <WeeklyBars
          points={st.weekly.map((w) => ({
            label: w.week.slice(5).replace("-", "/"),
            value: w.target > 0 ? Math.round((w.checked / w.target) * 100) : 0,
          }))}
          unit="%" movingAvg={false} />
        <div className="mt-2 text-sm text-[var(--text-soft)]">
          {st.weekly.slice(-1).map((w) => (
            <p key={w.week}>이번 구절: <b>{w.reference}</b> — {w.checked}/{w.target}명 체크</p>
          ))}
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="부서별 참여 (이번 주)">
          <HBars items={st.by_dept.map((d) => ({ label: d.label, cnt: d.checked, total: d.total }))} rate />
        </Section>
        <Section title="연속 암송 스트릭 🔥">
          {st.streaks.length === 0 ? (
            <p className="text-center py-6 text-[var(--text-soft)]">아직 연속 기록이 없습니다.</p>
          ) : (
            <div className="flex flex-col">
              {st.streaks.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 py-2 border-t border-[var(--line)] first:border-t-0 text-sm">
                  <span className="w-6 font-black text-[var(--text-soft)]">{i + 1}</span>
                  <b className="mr-auto">{s.name}</b>
                  <span className="badge" style={{ background: "var(--color-accent-soft, var(--color-sand-100))", color: "var(--color-accent)" }}>
                    {s.streak}주 연속
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title={`${new Date().getFullYear()}년 암송 결산`}>
        <p className="text-sm leading-relaxed">
          올해 <b className="tabular">{st.year_review.assignments}개</b> 구절이 주어졌고,{" "}
          <b className="tabular">{st.year_review.participants}명</b>이{" "}
          <b className="tabular">{st.year_review.checks}번</b> 암송을 완료했습니다.
          {st.streaks[0] && <> 최장 스트릭은 <b>{st.streaks[0].name}</b>님의 <b className="tabular">{st.streaks[0].streak}주 연속</b>입니다. 🎉</>}
        </p>
      </Section>
    </>
  );
}
