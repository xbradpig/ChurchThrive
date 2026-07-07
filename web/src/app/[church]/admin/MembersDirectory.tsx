"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppDialog } from "@/components/ui/AppDialog";
import ListSkeleton from "@/components/ui/ListSkeleton";

type Dept = { id: string; name: string };
type Row = {
  id: string; name: string; name_suffix: string; phone: string | null; position: string | null;
  status: string; member_type: string; joined: boolean; photo_url: string | null;
  departments: Dept[]; birthday: string | null;
};
type JoinReq = { id: string; applicant_name: string; email: string; note: string | null; requested_at: string };

const STATUS_LABEL: Record<string, string> = {
  active: "활동", inactive: "장기결석", moved: "전출", deceased: "소천",
};
const STATUS_COLOR: Record<string, [string, string]> = {
  active: ["var(--color-positive-soft)", "var(--color-positive)"],
  inactive: ["var(--color-caution-soft)", "var(--color-caution)"],
  moved: ["var(--surface-soft)", "var(--text-soft)"],
  deceased: ["var(--surface-soft)", "var(--text-soft)"],
};

/** 교인 명부 — 교회 관리의 중심축 (검색·필터·신규·상태·부서·가입 승인) */
export default function MembersDirectory({ canEdit }: { canEdit: boolean }) {
  const routeParams = useParams<{ church?: string }>();
  const base = routeParams.church ? `/${routeParams.church}` : ""; // 교회 경로 접두 (church-url-tenancy)
  const supabase = useMemo(() => createClient(), []);
  const { confirm, toast } = useAppDialog();
  const [rows, setRows] = useState<Row[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinReq[]>([]);
  const [q, setQ] = useState("");
  const [deptF, setDeptF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [{ data: m }, { data: d }, { data: j }] = await Promise.all([
      supabase.rpc("admin_list_members", {
        p_search: q || null, p_dept: deptF || null, p_status: statusF || null }),
      supabase.rpc("admin_list_departments"),
      supabase.rpc("admin_list_join_requests"),
    ]);
    setRows(m ?? []); setDepts(d ?? []); setJoinReqs(j ?? []); setLoaded(true);
  }, [supabase, q, deptF, statusF]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function decideJoin(r: JoinReq, ok: boolean) {
    if (ok) {
      const match = rows.find((m) => (m.name + m.name_suffix) === r.applicant_name && !m.joined);
      const proceed = await confirm({
        title: `${r.applicant_name} 님 가입 승인`,
        body: match ? `교적의 "${match.name}${match.name_suffix}" 님과 자동 연결됩니다.` : "일치하는 교적이 없어 새 교적이 만들어집니다.",
        confirmLabel: "승인",
      });
      if (!proceed) return;
      const { error } = await supabase.rpc("approve_join", { p_request: r.id, p_member_id: match?.id ?? null });
      if (error) return toast("error", error.message);
      toast("success", `${r.applicant_name} 님을 승인했습니다.`);
    } else {
      if (!(await confirm({ title: "가입 신청 거절", body: `${r.applicant_name} (${r.email})`, danger: true, confirmLabel: "거절" }))) return;
      const { error } = await supabase.rpc("reject_join", { p_request: r.id });
      if (error) return toast("error", error.message);
    }
    load();
  }

  const active = rows.filter((r) => r.status === "active").length;
  const joined = rows.filter((r) => r.joined).length;

  return (
    <div className="flex flex-col gap-4">
      {/* 가입 신청 큐 */}
      {joinReqs.length > 0 && (
        <div className="card p-4" style={{ borderColor: "var(--color-caution)" }} data-widget="join-queue">
          <b style={{ color: "var(--color-caution)" }}>🙋 가입 신청 {joinReqs.length}건</b>
          {joinReqs.map((r) => (
            <div key={r.id} className="flex items-center gap-2 flex-wrap py-2 border-t border-[var(--line)] mt-2">
              <b>{r.applicant_name}</b>
              <span className="text-sm text-[var(--text-soft)]">{r.email}{r.note && ` · ${r.note}`}</span>
              <span className="ml-auto flex gap-2">
                <button className="btn btn-positive !min-h-9 text-sm" onClick={() => decideJoin(r, true)}>승인</button>
                <button className="btn btn-danger-soft !min-h-9 text-sm" onClick={() => decideJoin(r, false)}>거절</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 요약 + 필터 */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm">
          전체 <b>{rows.length}</b> · 활동 <b style={{ color: "var(--color-positive)" }}>{active}</b> ·
          앱 사용 <b style={{ color: "var(--color-auto)" }}>{joined}</b>
        </span>
        {canEdit && (
          <button className="btn btn-primary !min-h-10 text-sm ml-auto" data-new-member
                  onClick={() => setEditing({})}>
            + 새 교인
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className="input flex-1 !min-w-40" placeholder="이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" value={deptF} onChange={(e) => setDeptF(e.target.value)}>
          <option value="">전체 부서</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input !w-auto" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* 명부 */}
      {!loaded ? <ListSkeleton rows={8} /> : (
      <div className="card divide-y divide-[var(--line)]" data-member-list>
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="avatar !w-10 !h-10 !text-sm">
              {r.photo_url ? <img src={r.photo_url} alt="" /> : r.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <b>{r.name}{r.name_suffix && <sub className="opacity-60">{r.name_suffix}</sub>}</b>
              {r.position && <span className="text-sm text-[var(--text-soft)] ml-1.5">{r.position}</span>}
              <span className="block text-xs text-[var(--text-soft)] truncate">
                {r.departments.map((d) => d.name).join(" · ") || "부서 미배정"}
                {r.phone && ` · ${r.phone}`}
              </span>
            </span>
            <span className="ml-auto flex items-center gap-1.5 shrink-0">
              {r.joined && <span className="badge" style={{ background: "var(--color-auto-soft)", color: "var(--color-auto)" }}>앱</span>}
              <span className="badge" style={{ background: STATUS_COLOR[r.status]?.[0], color: STATUS_COLOR[r.status]?.[1] }}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              <Link href={`${base}/members/${r.id}`} className="btn btn-ghost !min-h-9 !px-2.5 text-sm">교적</Link>
              {canEdit && (
                <button className="btn btn-ghost !min-h-9 !px-2.5 text-sm" onClick={() => setEditing(r)}>수정</button>
              )}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="p-8 text-center text-[var(--text-soft)]">조건에 맞는 교인이 없습니다.</p>}
      </div>
      )}

      {editing && (
        <MemberEditSheet member={editing} depts={depts}
                         onClose={(changed) => { setEditing(null); if (changed) load(); }} />
      )}
    </div>
  );
}

function MemberEditSheet({ member, depts, onClose }:
  { member: Partial<Row>; depts: Dept[]; onClose: (changed: boolean) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useAppDialog();
  const isNew = !member.id;
  const [f, setF] = useState({
    name: member.name ?? "", suffix: member.name_suffix ?? "", phone: member.phone ?? "",
    birthday: member.birthday ?? "", position: member.position ?? "", status: member.status ?? "active",
  });
  const [memberDepts, setMemberDepts] = useState<Set<string>>(new Set((member.departments ?? []).map((d) => d.id)));
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    const { data: mid, error } = await supabase.rpc("admin_upsert_member", {
      p_id: member.id ?? null, p_name: f.name, p_suffix: f.suffix,
      p_phone: f.phone || null, p_birthday: f.birthday || null,
      p_position: f.position || null, p_status: f.status,
    });
    if (error) { setBusy(false); return toast("error", error.message); }
    // 부서 배정 반영
    const before = new Set((member.departments ?? []).map((d) => d.id));
    for (const d of depts) {
      const want = memberDepts.has(d.id), had = before.has(d.id);
      if (want !== had) {
        await supabase.rpc("admin_assign_department", { p_member: mid, p_dept: d.id, p_add: want });
      }
    }
    setBusy(false);
    toast("success", isNew ? `${f.name} 님을 등록했습니다.` : "저장했습니다.");
    onClose(true);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
         style={{ background: "rgb(14 25 40 / 0.55)", backdropFilter: "blur(3px)" }}
         onClick={() => onClose(false)}>
      <div className="card w-full max-w-md p-6 pop-in max-h-[90dvh] overflow-y-auto"
           style={{ boxShadow: "var(--shadow-pop)" }} onClick={(e) => e.stopPropagation()} data-member-edit>
        <h3 className="text-lg font-black mb-4">{isNew ? "새 교인 등록" : `${member.name}${member.name_suffix ?? ""} 교적 수정`}</h3>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <label className="flex flex-col gap-1"><span className="text-sm font-bold">이름 *</span>
              <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className="flex flex-col gap-1"><span className="text-sm font-bold">구분</span>
              <input className="input" value={f.suffix} onChange={(e) => set("suffix", e.target.value)} placeholder="A/B" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-sm font-bold">연락처</span>
              <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-…" /></label>
            <label className="flex flex-col gap-1"><span className="text-sm font-bold">생년월일</span>
              <input className="input" type="date" value={f.birthday ?? ""} onChange={(e) => set("birthday", e.target.value)} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-sm font-bold">직분</span>
              <input className="input" value={f.position} onChange={(e) => set("position", e.target.value)} placeholder="집사·권사·장로…" /></label>
            <label className="flex flex-col gap-1"><span className="text-sm font-bold">상태</span>
              <select className="input" value={f.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></label>
          </div>
          <div>
            <span className="text-sm font-bold">부서</span>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {depts.map((d) => {
                const on = memberDepts.has(d.id);
                return (
                  <button key={d.id} type="button"
                          className="badge !py-1.5 !px-3 cursor-pointer"
                          style={on ? { background: "var(--color-brand-700)", color: "#fff" }
                                    : { background: "var(--surface-soft)", color: "var(--text-soft)" }}
                          onClick={() => setMemberDepts((p) => {
                            const n = new Set(p); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n;
                          })}>
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={() => onClose(false)}>취소</button>
          <button className="btn btn-primary flex-1" disabled={busy || !f.name.trim()} onClick={save}>
            {busy ? "저장 중…" : isNew ? "등록" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
