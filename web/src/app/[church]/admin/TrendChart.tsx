"use client";

/**
 * 주간 출석 추이 — 단일 시리즈 막대 (이벤트 유형은 필터로 전환)
 * dataviz 규칙 적용: 검증된 색(#2f6fc4/#4f8ada), 4px 라운드 데이터 끝,
 * 막대 간 2px 표면 간격, 호버 툴팁, 표 보기, 텍스트는 잉크 토큰.
 */
import { useMemo, useState } from "react";

export type TrendPoint = { event_date: string; event_name: string; cnt: number };

export default function TrendChart({ data, events }: { data: TrendPoint[]; events: string[] }) {
  const [eventName, setEventName] = useState(events.includes("주일예배") ? "주일예배" : events[0] ?? "");
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(
    () => data.filter((d) => d.event_name === eventName).sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [data, eventName]
  );

  const W = 640, H = 220, PAD = { t: 16, r: 12, b: 34, l: 36 };
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const max = Math.max(10, ...points.map((p) => p.cnt));
  const barW = points.length > 0 ? Math.min(48, innerW / points.length - 2) : 0;

  const yTicks = useMemo(() => {
    const step = max <= 50 ? 10 : max <= 120 ? 25 : 50;
    const ticks = [];
    for (let v = 0; v <= max; v += step) ticks.push(v);
    return ticks;
  }, [max]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h3 className="font-black text-[var(--color-brand-700)] mr-auto">주간 출석 추이 · {eventName}</h3>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={eventName} onChange={(e) => setEventName(e.target.value)}>
          {events.map((e) => <option key={e}>{e}</option>)}
        </select>
        <button className="btn btn-ghost !min-h-10 text-sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "차트 보기" : "표 보기"}
        </button>
      </div>

      {points.length === 0 ? (
        <p className="text-center py-12 text-[var(--text-soft)]">아직 데이터가 없습니다.</p>
      ) : showTable ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[var(--text-soft)]">
            <th className="py-1.5 font-bold">날짜</th><th className="py-1.5 font-bold text-right">출석 인원</th>
          </tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.event_date} className="border-t border-[var(--line)]">
                <td className="py-1.5">{p.event_date}</td>
                <td className="py-1.5 text-right font-bold">{p.cnt}명</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img"
               aria-label={`${eventName} 주간 출석 추이`}>
            {/* 그리드 (은은하게) */}
            {yTicks.map((v) => {
              const y = PAD.t + innerH - (v / max) * innerH;
              return (
                <g key={v}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--line)" strokeWidth="1" />
                  <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-soft)">{v}</text>
                </g>
              );
            })}
            {/* 막대: 4px 라운드 상단, 기준선 고정, 간격 ≥2px */}
            {points.map((p, i) => {
              const x = PAD.l + (i + 0.5) * (innerW / points.length) - barW / 2;
              const h = Math.max(2, (p.cnt / max) * innerH);
              const y = PAD.t + innerH - h;
              const isLast = i === points.length - 1;
              return (
                <g key={p.event_date}
                   onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* 히트 타깃 (마크보다 큼) */}
                  <rect x={x - 6} y={PAD.t} width={barW + 12} height={innerH} fill="transparent" />
                  <path d={`M${x},${y + h} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + barW - 4},${y} Q${x + barW},${y} ${x + barW},${y + 4} L${x + barW},${y + h} Z`}
                        className="chart-bar" opacity={hover === null || hover === i ? 1 : 0.45} />
                  {/* 선택적 직접 라벨: 마지막 막대 + 호버 */}
                  {(isLast || hover === i) && (
                    <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">
                      {p.cnt}
                    </text>
                  )}
                  <text x={x + barW / 2} y={H - 14} textAnchor="middle" fontSize="11" fill="var(--text-soft)">
                    {p.event_date.slice(5).replace("-", "/")}
                  </text>
                </g>
              );
            })}
            {/* 기준선 */}
            <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH} y2={PAD.t + innerH} stroke="var(--text-soft)" strokeWidth="1" />
          </svg>
          <style jsx>{`
            .chart-bar { fill: #2f6fc4; transition: opacity 0.12s; }
            @media (prefers-color-scheme: dark) { .chart-bar { fill: #4f8ada; } }
          `}</style>
        </div>
      )}
    </div>
  );
}
