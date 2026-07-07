"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppDialog } from "@/components/ui/AppDialog";

type Dept = { id: string; name: string; sort_order: number; member_count: number;
  leaders: { member_id: string; name: string }[] };
type MemberLite = { id: string; name: string; name_suffix: string };

/** 부서 관리 — CRUD·부서장 지정·인원 (소통 트랙의 전제 데이터) */
export default function DepartmentsPanel() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm, promptText, toast } = useAppDialog();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [pickFor, setPickFor] = useState<Dept | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("admin_list_departments");
    setDepts(data ?? []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    const name = await promptText({ title: "새 부서 만들기", placeholder: "예: 유년부" });
    if (!name?.trim()) return;
    const { error } = await supabase.rpc("admin_save_department", { p_name: name });
    if (error) return toast("error", error.message);
    toast("success", `${name} 부서를 만들었습니다.`);
    load();
  }

  async function rename(d: Dept) {
    const name = await promptText({ title: "부서 이름 변경", defaultValue: d.name });
    if (!name?.trim() || name === d.name) return;
    const { error } = await supabase.rpc("admin_save_department", { p_id: d.id, p_name: name });
    if (error) return toast("error", error.message);
    load();
  }

  async function remove(d: Dept) {
    if (!(await confirm({ title: `${d.name} 부서 삭제`, body: "부서원이 있으면 삭제할 수 없습니다.", danger: true, confirmLabel: "삭제" }))) return;
    const { error } = await supabase.rpc("admin_delete_department", { p_id: d.id });
    if (error) return toast("error", error.message);
    toast("success", "삭제했습니다.");
    load();
  }

  async function removeLeader(d: Dept, memberId: string, name: string) {
    if (!(await confirm({ title: "부서장 해제", body: `${name} 님을 ${d.name} 부서장에서 해제할까요?`, confirmLabel: "해제" }))) return;
    const { error } = await supabase.rpc("admin_set_dept_leader", { p_dept: d.id, p_member: memberId, p_on: false });
    if (error) return toast("error", error.message);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4 flex items-center">
        <span className="text-sm text-[var(--text-soft)]">
          부서 {depts.length}개 — 부서장은 자기 부서원의 출석·(승인 시) 연락처를 볼 수 있습니다.
        </span>
        <button className="btn btn-primary !min-h-10 text-sm ml-auto" onClick={create} data-new-dept>+ 새 부서</button>
      </div>

      <div className="card divide-y divide-[var(--line)]" data-dept-list>
        {depts.map((d) => (
          <div key={d.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
            <b className="text-lg">{d.name}</b>
            <span className="badge" style={{ background: "var(--surface-soft)", color: "var(--text-soft)" }}>
              {d.member_count}명
            </span>
            <span className="flex gap-1.5 flex-wrap items-center">
              {d.leaders.map((l) => (
                <button key={l.member_id} onClick={() => removeLeader(d, l.member_id, l.name)}
                        className="badge cursor-pointer"
                        title="클릭하여 해제"
                        style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                  👑 {l.name} ✕
                </button>
              ))}
              <button className="btn btn-ghost !min-h-8 !px-2 text-xs" onClick={() => setPickFor(d)}>
                + 부서장
              </button>
            </span>
            <span className="ml-auto flex gap-1.5">
              <button className="btn btn-ghost !min-h-9 !px-2.5 text-sm" onClick={() => rename(d)}>이름</button>
              <button className="btn btn-ghost !min-h-9 !px-2.5 text-sm" style={{ color: "var(--color-danger)" }}
                      onClick={() => remove(d)}>삭제</button>
            </span>
          </div>
        ))}
        {depts.length === 0 && <p className="p-8 text-center text-[var(--text-soft)]">부서가 없습니다.</p>}
      </div>

      {pickFor && (
        <LeaderPicker dept={pickFor} onClose={(changed) => { setPickFor(null); if (changed) load(); }} />
      )}
    </div>
  );
}

function LeaderPicker({ dept, onClose }: { dept: Dept; onClose: (changed: boolean) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useAppDialog();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<MemberLite[]>([]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("admin_list_members", { p_search: q, p_status: "active" });
      setResults((data ?? []).slice(0, 8));
    }, 200);
    return () => clearTimeout(t);
  }, [q, supabase]);

  async function pick(m: MemberLite) {
    const { error } = await supabase.rpc("admin_set_dept_leader", { p_dept: dept.id, p_member: m.id, p_on: true });
    if (error) return toast("error", error.message);
    toast("success", `${m.name}${m.name_suffix} 님을 ${dept.name} 부서장으로 지정했습니다.`);
    onClose(true);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
         style={{ background: "rgb(14 25 40 / 0.55)", backdropFilter: "blur(3px)" }}
         onClick={() => onClose(false)}>
      <div className="card w-full max-w-sm p-6 pop-in" style={{ boxShadow: "var(--shadow-pop)" }}
           onClick={(e) => e.stopPropagation()} data-leader-picker>
        <h3 className="text-lg font-black mb-3">{dept.name} 부서장 지정</h3>
        <input className="input" autoFocus placeholder="교인 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-2 flex flex-col divide-y divide-[var(--line)] max-h-64 overflow-y-auto">
          {results.map((m) => (
            <button key={m.id} className="py-2.5 px-1 text-left font-bold hover:bg-[var(--surface-soft)] rounded-lg"
                    onClick={() => pick(m)}>
              {m.name}{m.name_suffix && <sub className="opacity-60">{m.name_suffix}</sub>}
            </button>
          ))}
          {q.trim() && results.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--text-soft)]">검색 결과 없음</p>
          )}
        </div>
        <button className="btn btn-ghost w-full mt-3" onClick={() => onClose(false)}>닫기</button>
      </div>
    </div>
  );
}
