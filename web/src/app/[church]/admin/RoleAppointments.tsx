"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/roles";
import { notify, askConfirm } from "@/components/ui/AppDialog";

const APPOINT_ROLES: { value: string; label: string }[] = [
  { value: "dept_leader", label: "부서 담당" },
  { value: "checker", label: "출석 체크" },
  { value: "pastor", label: "교역자" },
  { value: "superadmin", label: "관리자" },
];
const roleLabel = (v: string) => APPOINT_ROLES.find((r) => r.value === v)?.label ?? v;

type Member = {
  id: string; name: string; name_suffix: string; status: string;
  joined: boolean; email: string | null; email_verified: boolean;
};
type Appt = {
  id: string; member_id: string; member_name: string; role: string;
  status: "pending" | "waiting_account"; note: string | null;
  requested_at: string; requester_email: string | null;
  joined: boolean; member_email: string | null; email_verified: boolean;
};

/** 교인명부 기반 담당자 임명 — 교역자 이상이 제안, 관리자가 승인 (role-appointments) */
export default function RoleAppointments({ role }: { role: AppRole }) {
  const supabase = useMemo(() => createClient(), []);
  const canDecide = role === "superadmin";
  const [appts, setAppts] = useState<Appt[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sel, setSel] = useState({ member: "", role: "dept_leader" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: a }, { data: m }] = await Promise.all([
      supabase.rpc("list_role_appointments"),
      supabase.rpc("admin_list_members", { p_search: null, p_dept: null, p_status: "active" }),
    ]);
    setAppts((a ?? []) as Appt[]);
    setMembers((m ?? []) as Member[]);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function propose() {
    if (!sel.member) return;
    setBusy(true);
    const { error } = await supabase.rpc("propose_role_appointment", {
      p_member: sel.member, p_role: sel.role, p_note: null,
    });
    setBusy(false);
    if (error) return notify(error.message, "error");
    notify(`임명을 제안했습니다. 관리자 승인 후 ${roleLabel(sel.role)} 권한이 부여됩니다.`);
    setSel((s) => ({ ...s, member: "" }));
    load();
  }

  async function decide(a: Appt, ok: boolean) {
    if (ok && !a.joined) {
      const proceed = await askConfirm({
        title: `${a.member_name} 님 ${roleLabel(a.role)} 임명 승인`,
        body: "아직 계정이 연결되지 않은 교인입니다. 승인하면 '계정 연결 대기' 상태가 되고, 본인 이메일로 가입해 교적과 연결되는 즉시 권한이 자동 부여됩니다.",
        confirmLabel: "승인",
      });
      if (!proceed) return;
    } else if (!ok) {
      if (!(await askConfirm({ title: "임명 거절", body: `${a.member_name} — ${roleLabel(a.role)}`, danger: true, confirmLabel: "거절" }))) return;
    }
    const { data, error } = await supabase.rpc("decide_role_appointment", { p_id: a.id, p_approve: ok, p_note: null });
    if (error) return notify(error.message, "error");
    if (data === "active") notify(`${a.member_name} 님에게 ${roleLabel(a.role)} 권한을 부여했습니다.`);
    else if (data === "waiting_account") notify("승인되었습니다 — 계정이 연결되면 자동으로 권한이 부여됩니다.");
    load();
  }

  async function cancel(a: Appt) {
    if (!(await askConfirm({ title: "임명 취소", body: `${a.member_name} — ${roleLabel(a.role)}`, danger: true, confirmLabel: "취소" }))) return;
    const { error } = await supabase.rpc("cancel_role_appointment", { p_id: a.id });
    if (error) return notify(error.message, "error");
    load();
  }

  const memberTag = (m: { joined: boolean; email?: string | null; email_verified?: boolean }) =>
    m.joined ? " · 앱" : m.email ? (m.email_verified ? " · ✉ 인증" : " · ✉") : "";

  return (
    <div className="card p-5" data-widget="role-appointments">
      <h3 className="font-black mb-1">📋 명부에서 담당자 임명</h3>
      <p className="text-sm text-[var(--text-soft)] mb-3">
        교인명부에서 교인을 지목해 임명하면 <b>관리자 승인 후</b> 권한이 부여됩니다.
        계정이 없는 교인은 승인 후 <b>계정 연결 시 자동 부여</b>됩니다.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <select className="input flex-1 !min-w-40 !min-h-10 text-sm font-bold" value={sel.member}
                onChange={(e) => setSel({ ...sel, member: e.target.value })}>
          <option value="">교인 선택</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}{m.name_suffix}{memberTag(m)}</option>
          ))}
        </select>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={sel.role}
                onChange={(e) => setSel({ ...sel, role: e.target.value })}>
          {APPOINT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button className="btn btn-primary !min-h-10 text-sm" disabled={busy || !sel.member} onClick={propose}>
          임명 제안
        </button>
      </div>

      {appts.length === 0 && <p className="text-sm text-[var(--text-soft)] py-2">진행 중인 임명이 없습니다.</p>}
      {appts.map((a) => (
        <div key={a.id} className="flex items-center gap-2 py-2.5 border-t border-[var(--line)] flex-wrap">
          <b>{a.member_name}</b>
          <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
            {roleLabel(a.role)}
          </span>
          {a.status === "waiting_account" ? (
            <span className="badge" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>
              계정 연결 대기
            </span>
          ) : (
            <span className="badge" style={{ background: "var(--surface-soft)", color: "var(--text-soft)" }}>
              승인 대기
            </span>
          )}
          {a.member_email && (
            <span className="text-xs text-[var(--text-soft)]">
              {a.member_email}{a.email_verified ? " ✓" : ""}
            </span>
          )}
          <span className="ml-auto flex gap-1.5">
            {canDecide && a.status === "pending" && (
              <>
                <button className="btn btn-positive !min-h-9 text-sm" onClick={() => decide(a, true)}>승인</button>
                <button className="btn btn-danger-soft !min-h-9 text-sm" onClick={() => decide(a, false)}>거절</button>
              </>
            )}
            {canDecide && a.status === "waiting_account" && (
              <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => decide(a, true)}>부여 재시도</button>
            )}
            <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => cancel(a)}>취소</button>
          </span>
        </div>
      ))}
    </div>
  );
}
