import Link from "next/link";

type Funnel = { s1: number; s2: number; s3: number; s4: number; active: number };
const STAGES: [keyof Funnel, string][] = [["s1", "등록"], ["s2", "환영"], ["s3", "교육"], ["s4", "정착"]];

/** 새가족 정착 퍼널 — 담당자·교역자용 (role-work-dashboard W2) */
export default function NewcomerFunnel({ data, base }: { data: Funnel | null; base: string }) {
  if (!data) return null;
  const total = data.s1 + data.s2 + data.s3 + data.s4;
  if (total === 0) return null;

  return (
    <Link href={`${base}/m/newcomer`} data-widget="newcomer-funnel" className="card card-hover p-5 block">
      <div className="flex items-center mb-2">
        <b className="text-[var(--color-brand-700)] mr-auto">🌱 새가족 정착</b>
        <span className="text-sm text-[var(--text-soft)]">진행 {data.active}명 · 정착 {data.s4}명</span>
      </div>
      <div className="flex gap-1.5">
        {STAGES.map(([k, label]) => {
          const n = data[k];
          const done = k === "s4";
          return (
            <div key={k} className="flex-1 text-center">
              <div className="rounded-lg py-2 font-black text-lg" style={{
                background: done ? "var(--color-positive-soft)" : n > 0 ? "var(--color-brand-100)" : "var(--surface-soft)",
                color: done ? "var(--color-positive)" : n > 0 ? "var(--color-brand-700)" : "var(--text-soft)",
              }}>{n}</div>
              <span className="text-xs text-[var(--text-soft)] mt-1 block">{label}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
