"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string; week_start: string; reference: string; body: string;
  check_count: number; target_count: number;
};

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toISOString().slice(0, 10);
}

export default function VerseAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Assignment[]>([]);
  const [form, setForm] = useState({ week: nextSunday(), ref: "", body: "", guide: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("verse_current");
    setRows((data ?? []) as Assignment[]);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.ref.trim() || !form.body.trim()) return alert("장절과 본문을 입력해주세요.");
    setBusy(true);
    const { error } = await supabase.rpc("verse_create_assignment", {
      p_week_start: form.week, p_reference: form.ref.trim(),
      p_body: form.body.trim(), p_guide: form.guide.trim() || null,
    });
    setBusy(false);
    if (error) return alert(error.message);
    setForm({ week: nextSunday(), ref: "", body: "", guide: "" });
    load();
  }

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <div className="card p-5">
        <h3 className="font-black text-[var(--color-brand-700)] mb-3">이번 주 구절 등록</h3>
        <div className="flex flex-col gap-2">
          <input className="input" type="date" value={form.week}
                 onChange={(e) => setForm({ ...form, week: e.target.value })} />
          <input className="input" placeholder="장절 (예: 시편 23:1)" value={form.ref}
                 onChange={(e) => setForm({ ...form, ref: e.target.value })} />
          <textarea className="input !min-h-24" placeholder="본문" value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <input className="input" placeholder="MATCH 안내 (선택 — 질문·묵상 포인트)" value={form.guide}
                 onChange={(e) => setForm({ ...form, guide: e.target.value })} />
          <button className="btn btn-primary" disabled={busy} onClick={create}>
            {busy ? "등록 중…" : "구절 등록"}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-black text-[var(--color-brand-700)] mb-2">주차별 암송률</h3>
        {rows.length === 0 && <p className="text-[var(--text-soft)] py-6 text-center">등록된 구절이 없습니다.</p>}
        {rows.map((a) => {
          const rate = a.target_count ? Math.round((a.check_count / a.target_count) * 100) : 0;
          return (
            <div key={a.id} className="py-3 border-t border-[var(--line)]">
              <div className="flex items-center gap-2">
                <b>{a.reference}</b>
                <span className="text-sm text-[var(--text-soft)]">{a.week_start}</span>
                <span className="ml-auto font-black" style={{ color: "var(--color-positive)" }}>
                  {a.check_count}/{a.target_count}명 ({rate}%)
                </span>
              </div>
              <div className="mt-2 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-sand-200)" }}>
                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: "var(--color-positive)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
