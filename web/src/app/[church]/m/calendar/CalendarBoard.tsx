"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABEL, dday, fmtRange, type CalEvent } from "./format";

/** 다가오는 행사 목록 — 전교회 + 내 부서, 월 구분 (calendar-events-module W3) */
export default function CalendarBoard() {
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CalEvent[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [{ data }, { data: role }, { data: mgr }] = await Promise.all([
      supabase.rpc("calendar_upcoming", { p_limit: 30 }),
      supabase.rpc("my_role"),
      supabase.rpc("has_module", { p_module: "calendar", p_level: "manager" }),
    ]);
    setRows((data ?? []) as CalEvent[]);
    setCanManage(role === "superadmin" || role === "pastor" || role === "dept_leader" || !!mgr);
    setLoaded(true);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  let lastMonth = "";
  return (
    <div className="flex flex-col gap-3" data-testid="calendar-board">
      {canManage && (
        <Link href={`${base}/m/calendar/admin`} className="btn btn-ghost self-end !min-h-10 text-sm">
          📅 행사 관리
        </Link>
      )}
      {!rows.length && (
        <div className="card p-8 text-center text-[var(--text-soft)]">
          {loaded ? "예정된 행사가 없습니다." : "불러오는 중…"}
        </div>
      )}
      {rows.map((e) => {
        const month = e.starts_at.slice(0, 7);
        const header = month !== lastMonth;
        lastMonth = month;
        const d = dday(e.starts_at);
        return (
          <div key={e.id}>
            {header && (
              <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] mt-2 mb-1.5">
                {Number(month.slice(5, 7))}월
              </p>
            )}
            <div className="card p-4 flex items-center gap-3">
              <span className="badge shrink-0" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                {d === 0 ? "오늘" : d > 0 ? `D-${d}` : "진행 중"}
              </span>
              <span className="min-w-0">
                <b className="block truncate">{e.title}</b>
                <span className="block text-sm text-[var(--text-soft)] truncate">
                  {fmtRange(e)} {e.location ? `· ${e.location}` : ""}
                </span>
              </span>
              <span className="ml-auto flex flex-col items-end gap-1 shrink-0">
                <span className="badge" style={{ background: "var(--surface-soft)" }}>{CATEGORY_LABEL[e.category] ?? e.category}</span>
                {e.department_name && <span className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>{e.department_name}</span>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
