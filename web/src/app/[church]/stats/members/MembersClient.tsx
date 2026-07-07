"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Section, WeeklyBars, HBars, EmptyCard } from "../ui";

type Stats = {
  by_status: Record<string, number>;
  by_position: { label: string; cnt: number }[];
  by_age: { label: string; cnt: number }[];
  no_birthday: number;
  by_dept: { label: string; cnt: number }[] | null;
  monthly_reg: { month: string; cnt: number }[];
  monthly_transitions: { month: string; outflow: number; restored: number }[] | null;
  history_since: string | null;
} | null;

type Participation = {
  bands: { engaged: number; steady: number; at_risk: number };
  visit_candidates: { name: string; care: boolean }[];
  axes_avg: { att_wk: number; verse: number; note_wk: number };
} | null;

const STATUS_LABEL: Record<string, string> = { active: "재적(활동)", inactive: "장기 결석", moved: "전출", deceased: "소천" };
const AGE_LABEL: Record<string, string> = { "0_19": "19세 이하", "20_39": "20~39세", "40_59": "40~59세", "60_79": "60~79세", "80_": "80세 이상" };

export default function MembersClient({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const [st, setSt] = useState<Stats>(null);
  const [pt, setPt] = useState<Participation>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.rpc("stats_members"),
        supabase.rpc("participation_overview"),
      ]);
      setSt((s ?? null) as Stats);
      setPt((p ?? null) as Participation);
      setLoaded(true);
    })();
  }, [supabase]);

  if (!loaded) return <div className="card p-10 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  if (!st) return <EmptyCard icon="📇" title="교인을 등록하면 현황이 표시됩니다"
    body="교인 명부를 등록하면 직분·연령·부서 분포와 증감 추이가 여기에 표시됩니다."
    href={`${base}/church?tab=members`} actionLabel="교인 등록하러 가기" />;

  return (
    <>
      {/* 재적 현황판 (온맘 스타일 분포 — 국내 사용자 기대치) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(st.by_status).map(([k, v]) => (
          <div key={k} className="card p-4 text-center">
            <p className="text-sm font-bold text-[var(--text-soft)]">{STATUS_LABEL[k] ?? k}</p>
            <p className="text-2xl font-black tabular mt-1">{v}명</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="직분별 분포">
          <HBars items={st.by_position} />
        </Section>
        <Section title="연령대 분포">
          <HBars items={st.by_age.map((a) => ({ label: AGE_LABEL[a.label] ?? a.label, cnt: a.cnt }))} />
          {st.no_birthday > 0 && (
            <p className="text-xs text-[var(--text-soft)] mt-2">생년월일 미등록 {st.no_birthday}명 제외</p>
          )}
        </Section>
      </div>

      {st.by_dept && (
        <Section title="부서별 인원">
          <HBars items={st.by_dept} />
        </Section>
      )}

      <Section title="월별 등록 추이 (12개월)">
        <WeeklyBars points={st.monthly_reg.map((m) => ({ label: m.month.slice(2), value: m.cnt }))}
                    movingAvg={false} />
      </Section>

      {st.monthly_transitions && (
        <Section title="전출입 (12개월)">
          {st.monthly_transitions.length === 0 ? (
            <p className="text-center py-6 text-[var(--text-soft)]">기간 내 상태 변경 기록이 없습니다.</p>
          ) : (
            <HBars items={st.monthly_transitions.flatMap((t) => [
              { label: `${t.month.slice(2)} 전출`, cnt: t.outflow },
              ...(t.restored > 0 ? [{ label: `${t.month.slice(2)} 복귀`, cnt: t.restored }] : []),
            ])} />
          )}
          {st.history_since && (
            <p className="text-xs text-[var(--text-soft)] mt-2">
              이력 데이터: {st.history_since}부터 (그 이전 구간은 소급 불가 — 데이터 없음)
            </p>
          )}
        </Section>
      )}

      {/* 종합 참여 — 개인 점수·등급 비노출, 심방 후보만 (D3·§3-5 낙인 방지) */}
      {pt && ["superadmin", "pastor", "dept_leader"].includes(role) && (
        <Section title="종합 참여 (최근 13주 · 출석+암송+노트+훈련)">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {([
              ["활발", pt.bands.engaged, "var(--color-positive)"],
              ["보통", pt.bands.steady, "var(--color-brand-700)"],
              ["연결 필요", pt.bands.at_risk, "var(--color-danger)"],
            ] as const).map(([label, cnt, color]) => (
              <div key={label} className="card p-4 text-center !shadow-none border border-[var(--line)]">
                <p className="text-sm font-bold" style={{ color }}>{label}</p>
                <p className="text-2xl font-black tabular mt-1">{cnt}명</p>
              </div>
            ))}
          </div>
          {pt.visit_candidates.length > 0 && (
            <>
              <p className="text-sm font-bold mb-2">심방 후보 (참여 신호 없음)</p>
              <div className="flex flex-wrap gap-1.5">
                {pt.visit_candidates.map((c) => (
                  <span key={c.name} className="badge"
                        style={c.care ? { background: "var(--color-caution-soft)", color: "var(--color-caution)" }
                                      : { background: "var(--color-sand-100)", color: "var(--text)" }}>
                    {c.name}{c.care ? " · 케어" : ""}
                  </span>
                ))}
              </div>
              <Link href={`${base}/m/visitation`} className="btn btn-ghost w-full mt-3 !min-h-10 text-sm">
                심방으로 연결하기 →
              </Link>
            </>
          )}
        </Section>
      )}
    </>
  );
}
