"use client";

/**
 * 교회 현황 공용 UI — Design System v2 준수 (detail_goal §5)
 * 규칙: 모든 차트에 "표 보기" 토글 필수(어르신 가독성), 콜드스타트 §2-⑤,
 * 전년 데이터 없으면 증감 뱃지 숨김(0% 표시 금지).
 */
import Link from "next/link";
import { useMemo, useState } from "react";

/* ---------- KPI 카드: 전주 대비 증감 ▲▼ ---------- */
export function Kpi({ label, value, prev, suffix = "", warn, href }: {
  label: string; value: number | null | undefined; prev?: number | null;
  suffix?: string; warn?: boolean; href?: string;
}) {
  if (value === null || value === undefined) return null;
  const delta = prev === null || prev === undefined ? null : value - prev;
  const inner = (
    <>
      <p className="text-sm font-bold text-[var(--text-soft)]">{label}</p>
      <p className="text-2xl font-black mt-1 tabular"
         style={{ color: warn && value > 0 ? "var(--color-caution)" : "var(--text)" }}>
        {value.toLocaleString()}{suffix}
      </p>
      {delta !== null && delta !== 0 && (
        <p className="text-xs font-bold mt-0.5"
           style={{ color: delta > 0 ? "var(--color-positive)" : "var(--color-caution)" }}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toLocaleString()}{suffix} <span className="opacity-60">전주</span>
        </p>
      )}
    </>
  );
  const cls = "card p-4 text-center block";
  return href ? <Link href={href} className={`${cls} card-hover`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export function Section({ title, right, children }: {
  title: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h3 className="font-black text-[var(--color-brand-700)] mr-auto">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ---------- 주간 막대 + 4주 이동평균 라인 (TrendChart 확장) ---------- */
export type WeekPoint = { label: string; value: number; overlay?: number | null };

export function WeeklyBars({ points, unit = "명", movingAvg = true, overlayLabel }: {
  points: WeekPoint[]; unit?: string; movingAvg?: boolean; overlayLabel?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const ma = useMemo(() => points.map((_, i) => {
    if (!movingAvg || i < 3) return null; // 이동평균은 4주 차부터 (콜드스타트 규칙)
    const w = points.slice(i - 3, i + 1);
    return w.reduce((s, p) => s + p.value, 0) / 4;
  }), [points, movingAvg]);

  if (points.length === 0)
    return <p className="text-center py-10 text-[var(--text-soft)]">아직 데이터가 없습니다.</p>;

  const W = 640, H = 220, PAD = { t: 16, r: 12, b: 34, l: 36 };
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const max = Math.max(10, ...points.map((p) => Math.max(p.value, p.overlay ?? 0)));
  const barW = Math.min(48, innerW / points.length - 2);
  const xc = (i: number) => PAD.l + (i + 0.5) * (innerW / points.length);
  const yv = (v: number) => PAD.t + innerH - (v / max) * innerH;
  const yTicks = useMemo(() => {
    const step = max <= 50 ? 10 : max <= 120 ? 25 : max <= 600 ? 100 : Math.ceil(max / 5 / 100) * 100;
    const t = []; for (let v = 0; v <= max; v += step) t.push(v); return t;
  }, [max]);

  return (
    <div>
      <div className="flex justify-end -mt-1 mb-1">
        <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "차트 보기" : "표 보기"}
        </button>
      </div>
      {points.length < 4 && (
        <p className="text-sm text-[var(--text-soft)] mb-2">📈 추이가 쌓이는 중입니다 ({points.length}/4주)</p>
      )}
      {showTable ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[var(--text-soft)]">
            <th className="py-1.5 font-bold">주간</th>
            <th className="py-1.5 font-bold text-right">값</th>
            {overlayLabel && <th className="py-1.5 font-bold text-right">{overlayLabel}</th>}
          </tr></thead>
          <tbody>{points.map((p, i) => (
            <tr key={i} className="border-t border-[var(--line)]">
              <td className="py-1.5">{p.label}</td>
              <td className="py-1.5 text-right font-bold tabular">{p.value.toLocaleString()}{unit}</td>
              {overlayLabel && <td className="py-1.5 text-right tabular text-[var(--text-soft)]">
                {p.overlay != null ? `${p.overlay.toLocaleString()}${unit}` : "—"}</td>}
            </tr>))}
          </tbody>
        </table>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img" aria-label="주간 추이 차트">
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={W - PAD.r} y1={yv(v)} y2={yv(v)} stroke="var(--line)" strokeWidth="1" />
                <text x={PAD.l - 6} y={yv(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-soft)">{v}</text>
              </g>))}
            {points.map((p, i) => {
              const x = xc(i) - barW / 2;
              const h = Math.max(2, (p.value / max) * innerH);
              const y = PAD.t + innerH - h;
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={x - 6} y={PAD.t} width={barW + 12} height={innerH} fill="transparent" />
                  <path d={`M${x},${y + h} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + barW - 4},${y} Q${x + barW},${y} ${x + barW},${y + 4} L${x + barW},${y + h} Z`}
                        className="chart-bar" opacity={hover === null || hover === i ? 1 : 0.45} />
                  {p.overlay != null && (
                    <circle cx={xc(i)} cy={yv(p.overlay)} r="3.5" className="chart-yoy" />
                  )}
                  {(i === points.length - 1 || hover === i) && (
                    <text x={xc(i)} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">
                      {p.value.toLocaleString()}
                    </text>)}
                  <text x={xc(i)} y={H - 14} textAnchor="middle" fontSize="11" fill="var(--text-soft)">{p.label}</text>
                </g>);
            })}
            {movingAvg && points.length >= 4 && (
              <polyline fill="none" strokeWidth="2.5" className="chart-ma" strokeLinecap="round"
                points={ma.map((v, i) => (v == null ? null : `${xc(i)},${yv(v)}`)).filter(Boolean).join(" ")} />
            )}
            <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH} y2={PAD.t + innerH} stroke="var(--text-soft)" strokeWidth="1" />
          </svg>
          <div className="flex gap-4 mt-1 text-xs text-[var(--text-soft)] font-bold">
            <span><span className="inline-block w-3 h-3 rounded-sm align-[-2px] mr-1" style={{ background: "#2f6fc4" }} />주간 값</span>
            {movingAvg && points.length >= 4 && <span><span className="inline-block w-3 h-[3px] align-[2px] mr-1" style={{ background: "var(--color-accent)" }} />4주 이동평균</span>}
            {overlayLabel && <span><span className="inline-block w-2 h-2 rounded-full align-[0px] mr-1" style={{ background: "var(--color-positive)" }} />{overlayLabel}</span>}
          </div>
          <style jsx>{`
            .chart-bar { fill: #2f6fc4; transition: opacity 0.12s; }
            .chart-ma { stroke: var(--color-accent); }
            .chart-yoy { fill: var(--color-positive); }
            @media (prefers-color-scheme: dark) { .chart-bar { fill: #4f8ada; } }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ---------- 가로 분포 바 ---------- */
export function HBars({ items, unit = "명", rate }: {
  items: { label: string; cnt: number; total?: number }[]; unit?: string; rate?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.cnt));
  if (items.length === 0)
    return <p className="text-center py-8 text-[var(--text-soft)]">아직 데이터가 없습니다.</p>;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 font-bold truncate">{it.label}</span>
          <div className="flex-1 h-5 rounded-md bg-[var(--color-sand-100)] overflow-hidden">
            <div className="h-full rounded-md" style={{
              width: `${(it.cnt / (rate && it.total ? Math.max(it.total, 1) : max)) * 100}%`,
              background: "var(--color-brand-700)", minWidth: it.cnt > 0 ? 6 : 0 }} />
          </div>
          <span className="w-20 text-right tabular font-bold shrink-0">
            {rate && it.total != null ? `${it.cnt}/${it.total}` : `${it.cnt.toLocaleString()}${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- 빈 상태 (콜드스타트 §2-⑤: 기록 기능 바로가기) ---------- */
export function EmptyCard({ icon, title, body, href, actionLabel }: {
  icon: string; title: string; body: string; href?: string; actionLabel?: string;
}) {
  return (
    <div className="card p-10 text-center flex flex-col items-center gap-2" data-empty>
      <span className="text-4xl opacity-80">{icon}</span>
      <b className="text-lg">{title}</b>
      <p className="text-sm text-[var(--text-soft)] leading-relaxed">{body}</p>
      {href && actionLabel && (
        <Link href={href} className="btn btn-primary !min-h-11 text-sm mt-2">{actionLabel}</Link>
      )}
    </div>
  );
}
