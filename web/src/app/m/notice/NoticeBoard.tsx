"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notice = { id: string; title: string; body: string; published_at: string };

export default function NoticeBoard({ canManage }: { canManage: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Notice[]>([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.schema("mod_notice").from("notices")
      .select("id, title, body, published_at").order("published_at", { ascending: false }).limit(30);
    setRows(data ?? []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!form.title.trim() || !form.body.trim()) return;
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_notice").from("notices")
      .insert({ title: form.title.trim(), body: form.body.trim(), church_id: cid });
    if (error) return alert(error.message);
    setForm({ title: "", body: "" });
    load();
  }

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      {canManage && (
        <div className="card p-5" data-widget="notice-admin">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">공지 발행</h3>
          <div className="flex flex-col gap-2">
            <input className="input" placeholder="제목" value={form.title}
                   onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input !min-h-20" placeholder="내용" value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <button className="btn btn-primary" onClick={publish}>발행</button>
          </div>
        </div>
      )}
      {rows.length === 0 && <p className="text-center py-14 text-[var(--text-soft)]">아직 공지가 없습니다.</p>}
      {rows.map((n) => (
        <button key={n.id} className="card p-5 text-left" onClick={() => setOpen(open === n.id ? null : n.id)}>
          <div className="flex items-center gap-2">
            <b className="text-lg">{n.title}</b>
            <span className="ml-auto text-xs text-[var(--text-soft)]">{n.published_at.slice(0, 10)}</span>
          </div>
          {open === n.id && <p className="mt-3 whitespace-pre-wrap leading-relaxed">{n.body}</p>}
        </button>
      ))}
    </main>
  );
}
