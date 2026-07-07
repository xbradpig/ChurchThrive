"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Notice = { id: string; title: string; body: string; published_at: string; target_department_id: string | null };
type Dept = { id: string; name: string };
type Targets = { can_church_wide: boolean; departments: Dept[] };

export default function NoticeBoard({ canManage }: { canManage: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Notice[]>([]);
  const [deptName, setDeptName] = useState<Record<string, string>>({});
  const [targets, setTargets] = useState<Targets>({ can_church_wide: false, departments: [] });
  const [form, setForm] = useState({ title: "", body: "", target: "" }); // target: "" = 전교회
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data }, { data: t }] = await Promise.all([
      supabase.schema("mod_notice").from("notices")
        .select("id, title, body, published_at, target_department_id")
        .order("published_at", { ascending: false }).limit(30),
      supabase.rpc("notice_targets"),
    ]);
    setRows((data ?? []) as Notice[]);
    const tg = (t ?? { can_church_wide: false, departments: [] }) as Targets;
    setTargets(tg);
    setDeptName(Object.fromEntries(tg.departments.map((d) => [d.id, d.name])));
    // 전교회 불가 담당자는 기본 대상을 첫 부서로
    if (!tg.can_church_wide && tg.departments[0]) setForm((f) => f.target ? f : { ...f, target: tg.departments[0].id });
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const canPublish = canManage || targets.can_church_wide || targets.departments.length > 0;

  async function publish() {
    if (!form.title.trim() || !form.body.trim()) return;
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_notice").from("notices")
      .insert({ title: form.title.trim(), body: form.body.trim(), church_id: cid,
                target_department_id: form.target || null });
    if (error) return notify(error.message, "error");
    setForm({ title: "", body: "", target: targets.can_church_wide ? "" : (targets.departments[0]?.id ?? "") });
    load();
  }

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      {canPublish && (
        <div className="card p-5" data-widget="notice-admin">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">공지 발행</h3>
          <div className="flex flex-col gap-2">
            <input className="input" placeholder="제목" value={form.title}
                   onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input !min-h-20" placeholder="내용" value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              {targets.can_church_wide && <option value="">전교회 공지</option>}
              {targets.departments.map((d) => <option key={d.id} value={d.id}>{d.name} 부서</option>)}
            </select>
            <button className="btn btn-primary" onClick={publish}>발행</button>
          </div>
        </div>
      )}
      {rows.length === 0 && <p className="text-center py-14 text-[var(--text-soft)]">아직 공지가 없습니다.</p>}
      {rows.map((n) => (
        <button key={n.id} className="card p-5 text-left" onClick={() => setOpen(open === n.id ? null : n.id)}>
          <div className="flex items-center gap-2 flex-wrap">
            <b className="text-lg">{n.title}</b>
            {n.target_department_id && (
              <span className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
                {deptName[n.target_department_id] ?? "부서"} 공지
              </span>
            )}
            <span className="ml-auto text-xs text-[var(--text-soft)]">{n.published_at.slice(0, 10)}</span>
          </div>
          {open === n.id && <p className="mt-3 whitespace-pre-wrap leading-relaxed">{n.body}</p>}
        </button>
      ))}
    </main>
  );
}
