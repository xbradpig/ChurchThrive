"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify, askPrompt } from "@/components/ui/AppDialog";

type Visit = { id: string; member_id: string; status: string; visit_date: string | null; note: string | null; created_at: string };
const STATUS_LABEL: Record<string, string> = { requested: "요청됨", assigned: "배정됨", done: "완료" };

export default function VisitBoard({ canManage }: { canManage: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Visit[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [requested, setRequested] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.schema("mod_visitation").from("visits")
      .select("id, member_id, status, visit_date, note, created_at")
      .order("created_at", { ascending: false }).limit(50);
    setRows(data ?? []);
    const ids = [...new Set((data ?? []).map((v) => v.member_id))];
    if (ids.length) {
      const { data: ms } = await supabase.from("members").select("id, name, name_suffix").in("id", ids);
      setNames(Object.fromEntries((ms ?? []).map((m) => [m.id, m.name + m.name_suffix])));
    }
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function requestVisit() {
    const [{ data: mid }, { data: cid }] = await Promise.all([
      supabase.rpc("my_member_id"), supabase.rpc("my_church_id")]);
    if (!mid) return notify("교적이 연결되어 있지 않습니다.");
    const { error } = await supabase.schema("mod_visitation").from("visits")
      .insert({ member_id: mid, church_id: cid });
    if (error) return notify(error.message, "error");
    setRequested(true);
    load();
  }

  async function advance(v: Visit) {
    const next = v.status === "requested" ? "assigned" : "done";
    const patch: Record<string, unknown> = { status: next };
    if (next === "done") {
      const note = (await askPrompt({ title: "심방 기록 (담당자 등급만 열람됩니다)" }));
      if (note) patch.note = note;
      patch.visit_date = new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.schema("mod_visitation").from("visits").update(patch).eq("id", v.id);
    if (error) return notify(error.message, "error");
    load();
  }

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <div className="card p-5 flex items-center gap-3">
        {requested
          ? <p className="font-bold" style={{ color: "var(--color-positive)" }}>✓ 심방 요청이 접수되었습니다.</p>
          : <>
              <span>목사님·교역자의 심방이 필요하신가요?</span>
              <button className="btn btn-primary ml-auto" onClick={requestVisit}>🏠 심방 요청</button>
            </>}
      </div>
      {rows.length > 0 && (
        <div className="card p-5" data-widget="visit-queue">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">{canManage ? "심방 큐" : "내 요청"}</h3>
          {rows.map((v) => (
            <div key={v.id} className="py-2.5 border-t border-[var(--line)] flex items-center gap-2 flex-wrap">
              <b>{names[v.member_id] ?? "…"}</b>
              <span className="badge" style={{
                background: v.status === "done" ? "var(--color-positive-soft)" : "var(--color-caution-soft)",
                color: v.status === "done" ? "var(--color-positive)" : "var(--color-caution)" }}>
                {STATUS_LABEL[v.status]}
              </span>
              {v.visit_date && <span className="text-xs text-[var(--text-soft)]">{v.visit_date}</span>}
              {canManage && v.note && <span className="text-sm text-[var(--text-soft)] w-full">📝 {v.note}</span>}
              {canManage && v.status !== "done" && (
                <button className="btn btn-ghost !min-h-8 !py-1 text-xs ml-auto" onClick={() => advance(v)}>
                  {v.status === "requested" ? "배정" : "완료 기록"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
