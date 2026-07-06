"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { askConfirm } from "@/components/ui/AppDialog";

const ROLES: { value: string; label: string }[] = [
  { value: "superadmin", label: "관리자" },
  { value: "pastor", label: "교역자" },
  { value: "dept_leader", label: "부서 담당" },
  { value: "checker", label: "출석 체크" },
];

type Staff = { user_id: string; email: string; role: string; granted_at: string };

/** 담당자·권한 관리 — 인수인계(후임 관리자 임명), 역할 부여/회수 */
export default function StaffManager() {
  const supabase = useMemo(() => createClient(), []);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("checker");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("list_church_staff");
    setStaff(data ?? []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.rpc("set_church_role_by_email", { p_email: email, p_role: role });
    if (error) return setMsg({ ok: false, text: error.message });
    setMsg({ ok: true, text: `${email} 님에게 ${ROLES.find((r) => r.value === role)?.label} 권한을 드렸어요.` });
    setEmail("");
    load();
  }

  async function revoke(s: Staff) {
    if (!(await askConfirm({ title: "권한 해제",
      body: `${s.email} 님의 ${ROLES.find((r) => r.value === s.role)?.label ?? s.role} 권한을 해제합니다.`,
      danger: true, confirmLabel: "해제" }))) return;
    const { error } = await supabase.rpc("remove_church_role", { p_user: s.user_id, p_role: s.role });
    if (error) return setMsg({ ok: false, text: error.message });
    load();
  }

  return (
    <div className="card p-5 mb-4" data-widget="staff">
      <h3 className="font-black mb-1">👥 담당자·권한 관리</h3>
      <p className="text-sm text-[var(--text-soft)] mb-3">
        인수인계: 후임자가 회원가입한 뒤, 이메일로 <b>관리자</b> 권한을 부여하세요.
        (마지막 관리자는 해제할 수 없습니다)
      </p>
      <form onSubmit={grant} className="flex gap-2 flex-wrap mb-3">
        <input className="input flex-1 !min-w-48" type="email" required placeholder="후임자 이메일"
               value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="input !w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button className="btn btn-primary !min-h-12">권한 부여</button>
      </form>
      {msg && (
        <p className="badge w-full justify-center py-2 mb-3"
           style={msg.ok ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
                         : { background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
          {msg.text}
        </p>
      )}
      <div className="flex flex-col divide-y divide-[var(--line)]">
        {staff.filter((s) => s.role !== "member").map((s) => (
          <div key={s.user_id + s.role} className="flex items-center gap-2 py-2.5">
            <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
              {ROLES.find((r) => r.value === s.role)?.label ?? s.role}
            </span>
            <span className="text-sm flex-1 break-all">{s.email}</span>
            <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => revoke(s)}>해제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
