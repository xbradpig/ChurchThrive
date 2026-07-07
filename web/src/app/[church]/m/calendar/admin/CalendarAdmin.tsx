"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { askConfirm, notify } from "@/components/ui/AppDialog";
import { CATEGORY_LABEL, fmtRange, type CalEvent } from "../format";

type Dept = { id: string; name: string };
type Form = {
  id: string | null; title: string; category: string; date: string; start: string; end: string;
  location: string; dept: string; visibility: string; description: string;
};

const EMPTY: Form = { id: null, title: "", category: "other", date: "", start: "10:00", end: "",
  location: "", dept: "", visibility: "member", description: "" };

/** 행사 CRUD — RLS가 권한 판정 (교역자·매니저 전체 / 부서 담당자는 자기 부서 타겟만) */
export default function CalendarAdmin() {
  const params = useParams<{ church?: string }>();
  const base = params.church ? `/${params.church}` : "";
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CalEvent[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showPast, setShowPast] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    const [{ data }, { data: d }] = await Promise.all([
      supabase.rpc("calendar_admin_list", { p_past: showPast }),
      supabase.from("departments").select("id, name").order("sort_order"),
    ]);
    setRows((data ?? []) as CalEvent[]);
    setDepts((d ?? []) as Dept[]);
  }, [supabase, showPast]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.title.trim() || !form.date || !form.start) return notify("제목과 일시를 입력해주세요.");
    setBusy(true);
    const { error } = await supabase.rpc("calendar_save", { p: {
      id: form.id, title: form.title, category: form.category,
      starts_at: `${form.date}T${form.start}:00`,
      ends_at: form.end ? `${form.date}T${form.end}:00` : null,
      location: form.location, target_department_id: form.dept || null,
      visibility: form.visibility, description: form.description,
    } });
    setBusy(false);
    if (error) return notify(error.message, "error");
    setForm(EMPTY);
    load();
  }

  async function remove(id: string) {
    if (!(await askConfirm({ title: "이 행사를 삭제할까요?" }))) return;
    const { error } = await supabase.rpc("calendar_delete", { p_id: id });
    if (error) return notify(error.message, "error");
    load();
  }

  function edit(e: CalEvent) {
    const s = new Date(e.starts_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setForm({
      id: e.id, title: e.title, category: e.category,
      date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
      start: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
      end: e.ends_at ? `${pad(new Date(e.ends_at).getHours())}:${pad(new Date(e.ends_at).getMinutes())}` : "",
      location: e.location ?? "", dept: e.department_id ?? "",
      visibility: e.visibility ?? "member", description: e.description ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyShareLink(id: string) {
    const url = `${window.location.origin}${base}/events/${id}`;
    await navigator.clipboard.writeText(url);
    notify("공유 링크를 복사했습니다.");
  }

  return (
    <div className="flex flex-col gap-4" data-testid="calendar-admin">
      {/* 등록/수정 폼 */}
      <div className="card p-5 flex flex-col gap-2.5">
        <b className="text-[var(--color-brand-700)]">{form.id ? "행사 수정" : "새 행사"}</b>
        <input className="input" placeholder="행사 이름" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <input className="input" type="time" value={form.start} onChange={(e) => set("start", e.target.value)} />
          <input className="input" type="time" value={form.end} onChange={(e) => set("end", e.target.value)} placeholder="종료(선택)" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className="input" placeholder="장소 (선택)" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={form.dept} onChange={(e) => set("dept", e.target.value)}>
            <option value="">전교회</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input" value={form.visibility} onChange={(e) => set("visibility", e.target.value)}>
            <option value="member">교인 공개</option>
            <option value="public">전체 공개 (링크 공유)</option>
          </select>
        </div>
        <textarea className="input !min-h-20" placeholder="설명 (선택)" value={form.description} onChange={(e) => set("description", e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1" disabled={busy} onClick={save}>
            {busy ? "저장 중…" : form.id ? "수정 저장" : "행사 등록"}
          </button>
          {form.id && <button className="btn btn-ghost" onClick={() => setForm(EMPTY)}>취소</button>}
        </div>
        <p className="text-xs text-[var(--text-soft)]">
          부서를 지정하면 해당 부서 교인에게만 표시됩니다. 부서 담당자는 자기 부서 행사만 등록할 수 있습니다.
        </p>
      </div>

      {/* 목록 */}
      <div className="card p-5">
        <div className="flex items-center mb-2">
          <b className="text-[var(--color-brand-700)] mr-auto">행사 목록</b>
          <label className="text-sm flex items-center gap-1.5">
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> 지난 행사 포함
          </label>
        </div>
        {!rows.length && <p className="text-sm text-[var(--text-soft)] py-2">등록된 행사가 없습니다.</p>}
        <div className="flex flex-col divide-y divide-[var(--line)]">
          {rows.map((e) => (
            <div key={e.id} className="py-2.5 flex items-center gap-2 flex-wrap">
              <span className="min-w-0 mr-auto">
                <b className="block truncate">{e.title}</b>
                <span className="block text-sm text-[var(--text-soft)]">
                  {fmtRange(e)} · {CATEGORY_LABEL[e.category] ?? e.category}
                  {e.department_name ? ` · ${e.department_name}` : " · 전교회"}
                  {e.visibility === "public" && " · 🌐 공개"}
                </span>
              </span>
              {e.visibility === "public" && (
                <button className="btn btn-ghost !min-h-9 !px-2.5 text-sm" onClick={() => copyShareLink(e.id)}>🔗 링크</button>
              )}
              <button className="btn btn-ghost !min-h-9 !px-2.5 text-sm" onClick={() => edit(e)}>수정</button>
              <button className="btn btn-ghost !min-h-9 !px-2.5 text-sm text-[var(--color-danger)]" onClick={() => remove(e.id)}>삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
