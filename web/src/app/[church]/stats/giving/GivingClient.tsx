"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";
import { Section, WeeklyBars, HBars, EmptyCard } from "../ui";

type Stats = {
  monthly: { month: string; fund: string; total: number }[];
  weekly_households: { week: string; households: number; total: number }[];
  segments: { regular: number; occasional: number; new: number; lapsed: number };
  ytd: number;
} | null;

type LedgerRow = { given_on: string; member_name: string; fund: string; amount: number; note: string | null };

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function GivingClient({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const [st, setSt] = useState<Stats>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc("stats_giving", { p_months: 12 }).then(({ data }) => {
      setSt((data ?? null) as Stats);
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <div className="card p-10 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  if (!st) return <EmptyCard icon="💝" title="재정 현황을 볼 수 없습니다"
    body="재정은 재정 담당자와 담임목사, 허가된 열람자만 볼 수 있습니다." href={`${base}/stats`} actionLabel="현황으로" />;

  const months = [...new Set(st.monthly.map((m) => m.month))].sort();
  const monthTotals = months.map((mon) => ({
    label: mon.slice(2),
    value: st.monthly.filter((m) => m.month === mon).reduce((s, m) => s + m.total, 0),
  }));
  const byFund = Object.entries(
    st.monthly.reduce<Record<string, number>>((acc, m) => {
      acc[m.fund] = (acc[m.fund] ?? 0) + m.total; return acc;
    }, {})).map(([label, cnt]) => ({ label, cnt })).sort((a, b) => b.cnt - a.cnt);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">올해 누계</p>
          <p className="text-xl font-black tabular mt-1">{won(st.ytd)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm font-bold text-[var(--text-soft)]">이번 주 헌금 가정</p>
          <p className="text-xl font-black tabular mt-1">
            {(st.weekly_households.slice(-1)[0]?.households ?? 0).toLocaleString()}가정
          </p>
        </div>
      </div>

      {/* 참여(가정 수)를 금액보다 앞세움 (detail_goal §3-4) */}
      <Section title="주간 헌금 가정 수 (13주)">
        <WeeklyBars points={st.weekly_households.map((w) => ({
          label: w.week.slice(5).replace("-", "/"), value: w.households }))} unit="가정" />
      </Section>

      <Section title="헌금 참여 세그먼트 (최근 6개월)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["정기", st.segments.regular, "매월 5개월+", "var(--color-positive)"],
            ["간헐", st.segments.occasional, "1~4개월", "var(--color-brand-700)"],
            ["신규", st.segments.new, "첫 헌금 90일 내", "var(--color-accent)"],
            ["중단", st.segments.lapsed, "최근 2개월 없음", "var(--color-danger)"],
          ] as const).map(([label, cnt, desc, color]) => (
            <div key={label} className="card p-4 text-center !shadow-none border border-[var(--line)]">
              <p className="text-sm font-bold" style={{ color }}>{label}</p>
              <p className="text-2xl font-black tabular mt-1">{cnt}가정</p>
              <p className="text-xs text-[var(--text-soft)] mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-soft)] mt-2">정기 → 중단 전환은 이탈 조기 신호일 수 있습니다.</p>
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="월별 헌금 추이 (12개월)">
          <WeeklyBars points={monthTotals} unit="원" movingAvg={false} />
        </Section>
        <Section title="펀드별 누계 (12개월)">
          <HBars items={byFund} unit="원" />
        </Section>
      </div>

      <Ledger />
      {role === "superadmin" && <SeniorPastorCard />}
    </>
  );
}

/* 개인별 명세 — viewer+ 조회 (입력·정리는 헌금 기록 모듈에서, RLS manager+) */
function Ledger() {
  const supabase = useMemo(() => createClient(), []);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400e3).toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: monthAgo, to: today });
  const [rows, setRows] = useState<LedgerRow[]>([]);

  useEffect(() => {
    supabase.rpc("giving_ledger", { p_from: range.from, p_to: range.to })
      .then(({ data }) => setRows((data ?? []) as LedgerRow[]));
  }, [supabase, range]);

  return (
    <Section title="개인별 명세"
      right={
        <div className="flex gap-2 items-center">
          <input type="date" className="input !w-auto !min-h-9 text-sm" value={range.from}
                 onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <span className="text-[var(--text-soft)]">~</span>
          <input type="date" className="input !w-auto !min-h-9 text-sm" value={range.to}
                 onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
      }>
      {rows.length === 0 ? (
        <p className="text-center py-6 text-[var(--text-soft)]">기간 내 기록이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[var(--text-soft)]">
              <th className="py-1.5 font-bold">날짜</th><th className="py-1.5 font-bold">이름</th>
              <th className="py-1.5 font-bold">구분</th><th className="py-1.5 font-bold text-right">금액</th>
            </tr></thead>
            <tbody>
              {rows.slice(0, 200).map((r, i) => (
                <tr key={i} className="border-t border-[var(--line)]">
                  <td className="py-1.5 whitespace-nowrap">{r.given_on}</td>
                  <td className="py-1.5 font-bold">{r.member_name}</td>
                  <td className="py-1.5">{r.fund}</td>
                  <td className="py-1.5 text-right tabular">{won(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 200 && <p className="text-xs text-[var(--text-soft)] mt-2">최근 200건까지 표시 — 기간을 좁혀주세요.</p>}
        </div>
      )}
      <p className="text-xs text-[var(--text-soft)] mt-3">
        합계 <b className="tabular">{won(rows.reduce((s, r) => s + r.amount, 0))}</b> · {rows.length}건 —
        입력·수정은 <b>헌금 기록</b> 모듈에서 (재정부 manager 이상)
      </p>
    </Section>
  );
}

/* 대표 교역자(담임목사) 지정 — superadmin 전용. 지정자는 재정 열람 + giving 허가 부여 가능 (D2) */
function SeniorPastorCard() {
  const supabase = useMemo(() => createClient(), []);
  const [current, setCurrent] = useState<string | null>(null);
  const [linked, setLinked] = useState<{ user_id: string; name: string; name_suffix: string }[]>([]);
  const [sel, setSel] = useState("");

  const load = useCallback(async () => {
    const [{ data: ch }, { data: m }] = await Promise.all([
      supabase.from("churches").select("senior_pastor_user_id").limit(1).maybeSingle(),
      supabase.from("members").select("user_id, name, name_suffix").not("user_id", "is", null),
    ]);
    setCurrent(ch?.senior_pastor_user_id ?? null);
    setLinked((m ?? []) as never);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function designate(uid: string | null) {
    const { error } = await supabase.rpc("set_senior_pastor", { p_user_id: uid });
    if (error) return notify(error.message, "error");
    load();
  }

  const currentName = linked.find((l) => l.user_id === current);
  return (
    <Section title="대표 교역자(담임목사) 지정">
      <p className="text-sm text-[var(--text-soft)] mb-3">
        지정된 담임목사는 재정 현황을 열람하고, 재정 열람 허가(viewer)를 다른 사람에게 부여할 수 있습니다.
        지정·해제는 모두 기록됩니다.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold">
          현재: {currentName ? `${currentName.name}${currentName.name_suffix}` : "미지정"}
        </span>
        <select className="input !w-auto !min-h-10 text-sm font-bold ml-auto" value={sel}
                onChange={(e) => setSel(e.target.value)}>
          <option value="">교인 선택 (계정 연결자)</option>
          {linked.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}{m.name_suffix}</option>)}
        </select>
        <button className="btn btn-primary !min-h-10 text-sm" disabled={!sel} onClick={() => designate(sel)}>지정</button>
        {current && (
          <button className="btn btn-danger-soft !min-h-10 text-sm" onClick={() => designate(null)}>해제</button>
        )}
      </div>
    </Section>
  );
}
