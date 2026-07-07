import Link from "next/link";
import { dday, fmtRange } from "../m/calendar/format";

type Dept = { id: string; name: string; is_leader: boolean };
type DeptEvent = { id: string; title: string; dept: string; starts_at: string };
type DeptNotice = { id: string; title: string; dept: string; at: string };
export type DeptHome = { departments: Dept[]; events: DeptEvent[]; notices: DeptNotice[] } | null;

/** "내 부서" 홈 카드 — 부서 일정·공지 (dept-home-card W3) */
export default function DeptCard({ data, base }: { data: DeptHome; base: string }) {
  if (!data || data.departments.length === 0) return null;
  const leads = data.departments.some((d) => d.is_leader);

  return (
    <div className="card p-5" data-widget="my-dept">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <b className="text-[var(--color-brand-700)]">🧩 내 부서</b>
        {data.departments.map((d) => (
          <span key={d.id} className="badge" style={{ background: "var(--surface-soft)" }}>
            {d.name}{d.is_leader && " 담당"}
          </span>
        ))}
        {leads && (
          <Link href={`${base}/m/notice`} className="ml-auto text-sm font-bold text-[var(--text-soft)]">
            부서 공지 작성 →
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] mb-1.5">부서 일정</p>
          {data.events.length ? data.events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 py-1 text-[15px]">
              <span className="badge shrink-0" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                {dday(e.starts_at) === 0 ? "오늘" : dday(e.starts_at) > 0 ? `D-${dday(e.starts_at)}` : "진행"}
              </span>
              <b className="truncate">{e.title}</b>
              <span className="ml-auto text-xs text-[var(--text-soft)] shrink-0">{fmtRange({ starts_at: e.starts_at, ends_at: null })}</span>
            </div>
          )) : <p className="text-sm text-[var(--text-soft)]">예정된 부서 일정이 없습니다.</p>}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] mb-1.5">부서 공지</p>
          {data.notices.length ? data.notices.map((n) => (
            <Link key={n.id} href={`${base}/m/notice`} className="flex items-center gap-2 py-1 text-[15px]">
              <span className="text-xs text-[var(--text-soft)] tabular shrink-0">{n.at}</span>
              <span className="font-bold truncate">{n.title}</span>
            </Link>
          )) : <p className="text-sm text-[var(--text-soft)]">새 부서 공지가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
