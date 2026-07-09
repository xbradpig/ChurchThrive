"use client";

/**
 * 말씀노트 — 내 노트만 (RLS: member_id = my_member_id, 스태프도 열람 불가)
 * 주간 기준 일요일 시작 (KST). detail_goal §3-3
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Note = { id: string; week_start: string; title: string | null; body_md: string; updated_at: string };

function thisSunday(): string {
  const now = new Date(Date.now() + 9 * 3600e3); // KST
  const d = new Date(now); d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

export default function NoteBoard() {
  const supabase = useMemo(() => createClient(), []);
  const week = thisSunday();
  const [mine, setMine] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // 이번 주 노트 id
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.schema("mod_note").from("notes")
      .select("id, week_start, title, body_md, updated_at")
      .order("week_start", { ascending: false }).limit(52);
    const rows = (data ?? []) as Note[];
    setMine(rows);
    const cur = rows.find((n) => n.week_start === week);
    if (cur) { setEditing(cur.id); setTitle(cur.title ?? ""); setBody(cur.body_md); }
  }, [supabase, week]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!body.trim()) return notify("노트 내용을 입력해주세요", "error");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const [{ data: mid }, { data: cid }] = await Promise.all([
      supabase.rpc("my_member_id"), supabase.rpc("my_church_id"),
    ]);
    if (!mid) { setSaving(false); return notify("교적 연결이 필요합니다", "error"); }
    const payload = { title: title.trim() || null, body_md: body.trim() };
    const { error } = editing
      ? await supabase.schema("mod_note").from("notes").update(payload).eq("id", editing)
      : await supabase.schema("mod_note").from("notes")
          .insert({ ...payload, church_id: cid, member_id: mid, week_start: week });
    setSaving(false);
    if (error) return notify(error.message, "error");
    notify("저장했습니다 ✓");
    load();
  }

  const past = mine.filter((n) => n.week_start !== week);
  const streak = useMemo(() => {
    // 이번 주부터 거슬러 연속 작성 주차
    let s = 0;
    const weeks = new Set(mine.map((n) => n.week_start));
    const d = new Date(week + "T00:00:00Z");
    while (weeks.has(d.toISOString().slice(0, 10))) { s++; d.setUTCDate(d.getUTCDate() - 7); }
    return s;
  }, [mine, week]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-black text-[var(--color-brand-700)] mr-auto">이번 주 노트 · {week}</h3>
          {streak > 0 && (
            <span className="badge" style={{ background: "var(--color-sand-100)", color: "var(--color-accent)" }}>
              🔥 {streak}주 연속
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text-soft)] mb-3">
          이 노트는 <b>나만</b> 볼 수 있습니다. 교회에는 작성 여부만 집계됩니다.
        </p>
        <input className="input mb-2" placeholder="제목 (선택) — 예: 주일 설교" value={title}
               onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input !min-h-40 leading-relaxed" placeholder="말씀을 들으며 받은 은혜를 적어보세요…"
                  value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn btn-primary w-full mt-3" onClick={save} disabled={saving}>
          {saving ? "저장 중…" : editing ? "노트 수정" : "노트 저장"}
        </button>
      </div>

      {past.length > 0 && (
        <div className="card p-5">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">지난 노트</h3>
          <div className="flex flex-col">
            {past.map((n) => (
              <details key={n.id} className="py-2 border-t border-[var(--line)]">
                <summary className="cursor-pointer font-bold text-sm flex gap-2">
                  <span className="text-[var(--text-soft)]">{n.week_start}</span>
                  {n.title ?? "말씀노트"}
                </summary>
                <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{n.body_md}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
