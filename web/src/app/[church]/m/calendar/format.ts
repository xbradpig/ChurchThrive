/** 행사 모듈 공용 타입·포맷 (서버/클라이언트 공용) */

export type CalEvent = {
  id: string; title: string; category: string;
  starts_at: string; ends_at: string | null; location: string | null;
  visibility?: string; department_id?: string | null; department_name?: string | null;
  description?: string | null;
};

export const CATEGORY_LABEL: Record<string, string> = {
  worship: "예배", education: "교육", fellowship: "친교",
  outreach: "전도·봉사", meeting: "회의", other: "기타",
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function dday(startsAt: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const s = new Date(startsAt); s.setHours(0, 0, 0, 0);
  return Math.round((s.getTime() - today.getTime()) / 864e5);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtRange(e: { starts_at: string; ends_at: string | null }): string {
  if (!e.ends_at) return fmtDate(e.starts_at);
  const s = new Date(e.starts_at), t = new Date(e.ends_at);
  const sameDay = s.toDateString() === t.toDateString();
  return sameDay
    ? `${fmtDate(e.starts_at)}~${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`
    : `${fmtDate(e.starts_at)} ~ ${fmtDate(e.ends_at)}`;
}
