"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES = ["등록", "환영·심방", "새가족 교육", "정착 완료"];

export default function NewcomerBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<{ id: string; name: string; name_suffix: string; created_at: string; stage: number }[]>([]);

  const load = useCallback(async () => {
    const [{ data: ms }, { data: ps }] = await Promise.all([
      supabase.from("members").select("id, name, name_suffix, created_at")
        .eq("member_type", "new_family").eq("status", "active").order("created_at", { ascending: false }),
      supabase.schema("mod_newcomer").from("progress").select("member_id, stage"),
    ]);
    const stageBy = new Map((ps ?? []).map((p) => [p.member_id, p.stage]));
    setRows((ms ?? []).map((m) => ({ ...m, stage: stageBy.get(m.id) ?? 1 })));
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function setStage(memberId: string, stage: number) {
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_newcomer").from("progress")
      .upsert({ church_id: cid, member_id: memberId, stage, updated_at: new Date().toISOString() },
              { onConflict: "church_id,member_id" });
    if (error) return alert(error.message);
    load();
  }

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <p className="text-sm text-[var(--text-soft)] px-1">
        출석 체크의 &ldquo;신규 등록&rdquo;으로 들어온 분들입니다. 단계를 탭해 정착 과정을 기록하세요.
      </p>
      {rows.length === 0 && <p className="text-center py-14 text-[var(--text-soft)]">새가족이 없습니다.</p>}
      {rows.map((m) => (
        <div key={m.id} className="card p-5" data-widget="newcomer-row">
          <div className="flex items-center gap-2">
            <b className="text-lg">{m.name}{m.name_suffix}</b>
            <span className="text-xs text-[var(--text-soft)]">{m.created_at.slice(0, 10)} 등록</span>
            {m.stage === 4 && <span className="badge ml-auto" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>정착 🎉</span>}
          </div>
          <div className="flex gap-1.5 mt-3">
            {STAGES.map((label, i) => {
              const n = i + 1;
              const on = n <= m.stage;
              return (
                <button key={n} onClick={() => setStage(m.id, n)}
                        className="flex-1 rounded-lg py-2 text-xs font-bold border-2 transition-colors"
                        style={on
                          ? { background: "var(--color-positive)", borderColor: "var(--color-positive)", color: "#fff" }
                          : { borderColor: "var(--line)", color: "var(--text-soft)" }}>
                  {n}. {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
