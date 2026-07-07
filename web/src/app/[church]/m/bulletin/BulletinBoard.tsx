"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Issue = { id: string; week_start: string; title: string; content_md: string; published: boolean };

function thisSunday() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export default function BulletinBoard({ canManage }: { canManage: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Issue[]>([]);
  const [form, setForm] = useState({ week: thisSunday(), title: "", content: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.schema("mod_bulletin").from("issues")
      .select("id, week_start, title, content_md, published")
      .order("week_start", { ascending: false }).limit(12);
    setRows(data ?? []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!form.title.trim() || !form.content.trim()) return;
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_bulletin").from("issues")
      .upsert({ church_id: cid, week_start: form.week, title: form.title.trim(),
                content_md: form.content, published: true },
              { onConflict: "church_id,week_start" });
    if (error) return notify(error.message, "error");
    setForm({ ...form, title: "", content: "" });
    load();
  }

  const current = rows.find((r) => r.published) ?? rows[0];

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      {canManage && (
        <div className="card p-5" data-widget="bulletin-admin">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">주보 작성·발행</h3>
          <div className="flex flex-col gap-2">
            <input className="input" type="date" value={form.week}
                   onChange={(e) => setForm({ ...form, week: e.target.value })} />
            <input className="input" placeholder="제목 (예: 7월 첫째 주 주보)" value={form.title}
                   onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input !min-h-32" placeholder="내용 (예배 순서·소식·광고)"
                      value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <button className="btn btn-primary" onClick={publish}>발행</button>
          </div>
        </div>
      )}
      {!current ? (
        <p className="text-center py-14 text-[var(--text-soft)]">발행된 주보가 없습니다.</p>
      ) : (
        <article className="card overflow-hidden">
          <div className="p-5 text-white" style={{ background: "var(--color-brand-800)" }}>
            <p className="text-sm opacity-75 font-bold">{current.week_start} 주간</p>
            <h2 className="text-xl font-black">{current.title}</h2>
          </div>
          <div className="p-5 whitespace-pre-wrap leading-relaxed">{current.content_md}</div>
        </article>
      )}
      {rows.length > 1 && (
        <div className="card p-4">
          <h3 className="font-bold text-sm text-[var(--text-soft)] mb-1">지난 주보</h3>
          {rows.slice(1).map((r) => (
            <p key={r.id} className="py-1.5 border-t border-[var(--line)] text-sm">
              <b>{r.title}</b> <span className="text-[var(--text-soft)]">{r.week_start}</span>
            </p>
          ))}
        </div>
      )}
    </main>
  );
}
