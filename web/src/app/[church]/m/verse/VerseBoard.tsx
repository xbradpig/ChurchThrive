"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Assignment = {
  id: string; week_start: string; reference: string; body: string; guide: string | null;
  checked: boolean; check_count: number; target_count: number;
};

export default function VerseBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Assignment[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("verse_current");
    setRows((data ?? []) as Assignment[]);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function check(a: Assignment) {
    const { error } = await supabase.rpc("verse_check", { p_assignment: a.id });
    if (!error) { setDone(a.id); load(); }
    else notify(error.message, "error");
  }

  const current = rows[0];
  const history = rows.slice(1);

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      {!current ? (
        <div className="card p-8 text-center text-[var(--text-soft)]">
          아직 등록된 암송 구절이 없습니다.
        </div>
      ) : (
        <div className="card overflow-hidden pop-in">
          <div className="p-6 text-white" style={{ background: "var(--color-brand-800)" }}>
            <p className="text-sm opacity-75 font-bold">{current.week_start} 주간 암송</p>
            <h2 className="text-2xl font-black" style={{ color: "var(--color-accent)" }}>{current.reference}</h2>
          </div>
          <div className="p-6">
            <p className="text-xl leading-relaxed font-bold whitespace-pre-wrap">&ldquo;{current.body}&rdquo;</p>
            {current.guide && (
              <p className="mt-4 text-sm text-[var(--text-soft)] whitespace-pre-wrap">💡 {current.guide}</p>
            )}
            <div className="mt-6 flex items-center gap-3">
              {current.checked || done === current.id ? (
                <span className="badge !text-base !py-2 !px-4"
                      style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
                  ✓ 암송 완료
                </span>
              ) : (
                <button className="btn btn-positive flex-1 text-lg" onClick={() => check(current)}>
                  📖 암송했어요
                </button>
              )}
              {current.target_count > 1 && (
                <span className="ml-auto text-sm text-[var(--text-soft)]">
                  {current.check_count}/{current.target_count}명 완료
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card p-5">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">지난 구절</h3>
          {history.map((a) => (
            <div key={a.id} className="flex items-center gap-2 py-2 border-t border-[var(--line)]">
              <b>{a.reference}</b>
              <span className="text-sm text-[var(--text-soft)]">{a.week_start}</span>
              <span className="ml-auto badge" style={a.checked
                ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
                : { background: "var(--color-sand-100)", color: "var(--text-soft)" }}>
                {a.checked ? "완료" : "미완"}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
