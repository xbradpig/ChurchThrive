"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Section, WeeklyBars, EmptyCard } from "../ui";

type Stats = {
  weekly: { week: string; writers: number; notes: number }[];
  this_week_rate: { writers: number; target: number };
  streaks: { name: string; streak: number }[];
  total_notes: number;
} | null;

export default function NotesClient() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const [st, setSt] = useState<Stats>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc("stats_notes", { p_weeks: 13 }).then(({ data }) => {
      setSt((data ?? null) as Stats);
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <div className="card p-10 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  if (!st) return <EmptyCard icon="📝" title="말씀노트 모듈이 꺼져 있습니다"
    body="모듈 스토어에서 말씀노트를 설치하면 교인들이 주일 말씀 노트를 남기고, 작성 현황이 여기에 집계됩니다."
    href={`${base}/store`} actionLabel="모듈 스토어 가기" />;
  if (st.total_notes === 0)
    return <EmptyCard icon="📝" title="첫 노트를 기다리는 중입니다"
      body="교인들이 말씀노트를 쓰기 시작하면 주간 작성 현황과 연속 기록이 여기에 표시됩니다. 노트 내용은 본인만 볼 수 있습니다."
      href={`${base}/m/note`} actionLabel="내 노트 쓰러 가기" />;

  const pct = st.this_week_rate.target > 0
    ? Math.round((st.this_week_rate.writers / st.this_week_rate.target) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">이번 주 작성</p>
          <p className="text-2xl font-black tabular mt-1">{st.this_week_rate.writers}명</p>
          <p className="text-xs text-[var(--text-soft)] mt-0.5">계정 연결 교인 {st.this_week_rate.target}명 중 {pct}%</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">누적 노트</p>
          <p className="text-2xl font-black tabular mt-1">{st.total_notes}건</p>
        </div>
      </div>

      <Section title="주간 작성자 추이 (13주)">
        <WeeklyBars points={st.weekly.map((w) => ({
          label: w.week.slice(5).replace("-", "/"), value: w.writers }))} />
      </Section>

      <Section title="연속 작성 🔥">
        {st.streaks.length === 0 ? (
          <p className="text-center py-6 text-[var(--text-soft)]">아직 연속 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col">
            {st.streaks.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 py-2 border-t border-[var(--line)] first:border-t-0 text-sm">
                <span className="w-6 font-black text-[var(--text-soft)]">{i + 1}</span>
                <b className="mr-auto">{s.name}</b>
                <span className="badge" style={{ background: "var(--color-sand-100)", color: "var(--color-accent)" }}>
                  {s.streak}주 연속
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-[var(--text-soft)] mt-3">
          노트 내용은 본인만 볼 수 있습니다 — 여기에는 작성 여부만 집계됩니다.
          작성 중단은 출석 감소보다 먼저 나타나는 신호일 수 있습니다.
        </p>
      </Section>
    </>
  );
}
