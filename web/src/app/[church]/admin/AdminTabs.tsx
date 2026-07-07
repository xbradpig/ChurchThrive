"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/roles";
import NotificationSetup from "./NotificationSetup";
import StaffManager from "./StaffManager";
import MembersDirectory from "./MembersDirectory";
import DepartmentsPanel from "./DepartmentsPanel";
import ChurchSettings from "./ChurchSettings";
import { notify } from "@/components/ui/AppDialog";

const TABS = [
  // 현황 탭은 /stats(교회 현황)로 승격 — church-stats-upgrade
  { key: "members", label: "교인 명부" },
  { key: "departments", label: "부서" },
  { key: "absentees", label: "미출석" },
  { key: "permissions", label: "권한" },
  { key: "events", label: "이벤트" },
  { key: "export", label: "내보내기" },
  { key: "settings", label: "설정" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function AdminTabs({ role }: { role: AppRole }) {
  const routeParams = useParams<{ church?: string }>();
  const base = routeParams.church ? `/${routeParams.church}` : ""; // 교회 경로 접두 (church-url-tenancy)
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = (searchParams.get("tab") as TabKey | null) ?? "members";
  const [tab, setTabState] = useState<TabKey>(urlTab);
  useEffect(() => { setTabState(urlTab); }, [urlTab]);   // 사이드 네비 클릭 반영
  const setTab = (t: TabKey) => { setTabState(t); router.replace(`${base}/church?tab=${t}`, { scroll: false }); };
  const visibleTabs = role === "dept_leader"
    ? TABS.filter((t) => ["members", "absentees"].includes(t.key))
    : TABS;

  return (
    <main className="max-w-3xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex gap-1.5 overflow-x-auto md:hidden">
        {visibleTabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`chosung-chip !min-w-fit !px-4 ${tab === t.key ? "active" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "members" && (<><JoinQueue /><MembersDirectory canEdit={role === "superadmin" || role === "pastor"} /></>)}
      {tab === "departments" && <DepartmentsPanel />}
      {tab === "settings" && <ChurchSettings canEdit={role === "superadmin"} />}
      {tab === "absentees" && (<><NotificationSetup /><Absentees /></>)}
      {tab === "permissions" && (<><StaffManager /><LeaderQueue /><ModuleGrants /><Permissions /></>)}
      {tab === "events" && <EventsAdmin />}
      {tab === "export" && <ExportPanel />}
    </main>
  );
}

/* ---------- 교인 가입 신청 승인 큐 (P0-3) ---------- */
function JoinQueue() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<{ id: string; applicant_name: string; requested_at: string }[]>([]);
  const [unlinked, setUnlinked] = useState<{ id: string; name: string; name_suffix: string }[]>([]);
  const [linkSel, setLinkSel] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [{ data: jr }, { data: m }] = await Promise.all([
      supabase.from("join_requests").select("id, applicant_name, requested_at").eq("status", "pending"),
      supabase.from("members").select("id, name, name_suffix").is("user_id", null).eq("status", "active"),
    ]);
    setRows(jr ?? []);
    setUnlinked((m ?? []) as never);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function decide(id: string, ok: boolean) {
    const { error } = ok
      ? await supabase.rpc("approve_join", { p_request: id, p_member_id: linkSel[id] || null })
      : await supabase.rpc("reject_join", { p_request: id });
    if (error) return notify(error.message, "error");
    load();
  }

  if (rows.length === 0) return null;
  return (
    <div className="card p-5" data-widget="join-queue">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">교인 가입 신청 {rows.length}건</h3>
      <p className="text-sm text-[var(--text-soft)] mb-2">기존 교적과 연결하거나, 새 교적으로 승인하세요.</p>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2 py-2.5 border-t border-[var(--line)] flex-wrap">
          <b>{r.applicant_name}</b>
          <span className="text-xs text-[var(--text-soft)]">{r.requested_at.slice(0, 10)}</span>
          <select className="input !w-auto !min-h-9 text-sm ml-auto"
                  value={linkSel[r.id] ?? ""}
                  onChange={(e) => setLinkSel((s) => ({ ...s, [r.id]: e.target.value }))}>
            <option value="">새 교적으로 등록</option>
            {unlinked.filter((m) => m.name === r.applicant_name || (linkSel[r.id] === m.id))
              .concat(unlinked.filter((m) => m.name !== r.applicant_name)).slice(0, 50)
              .map((m) => <option key={m.id} value={m.id}>기존: {m.name}{m.name_suffix}</option>)}
          </select>
          <button className="btn btn-positive !min-h-9 text-sm" onClick={() => decide(r.id, true)}>승인</button>
          <button className="btn btn-danger-soft !min-h-9 text-sm" onClick={() => decide(r.id, false)}>거절</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- 부서 담당자 승인 큐 ---------- */
function LeaderQueue() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<{ id: string; status: string; members: { name: string } | null; departments: { name: string } | null }[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("department_leaders")
      .select("id, status, members(name), departments(name)").eq("status", "pending");
    setRows((data ?? []) as never);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function approve(id: string, ok: boolean) {
    await supabase.from("department_leaders")
      .update({ status: ok ? "approved" : "revoked", approved_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  if (rows.length === 0) return null;
  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-3">부서 담당자 승인 대기</h3>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2 py-2 border-t border-[var(--line)]">
          <span className="font-bold">{r.members?.name}</span>
          <span className="text-[var(--text-soft)]">— {r.departments?.name}</span>
          <button className="btn btn-positive !min-h-9 ml-auto text-sm" onClick={() => approve(r.id, true)}>승인</button>
          <button className="btn btn-danger-soft !min-h-9 text-sm" onClick={() => approve(r.id, false)}>거절</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- 미출석 ---------- */
function Absentees() {
  const routeParams = useParams<{ church?: string }>();
  const base = routeParams.church ? `/${routeParams.church}` : ""; // 교회 경로 접두 (church-url-tenancy)
  const supabase = useMemo(() => createClient(), []);
  const [weeks, setWeeks] = useState(2);
  const [rows, setRows] = useState<{ member_id: string; name: string; name_suffix: string; care_target: boolean; last_attended: string | null; weeks_absent: number }[]>([]);

  useEffect(() => {
    supabase.rpc("absentee_list", { p_weeks: weeks }).then(({ data }) => setRows((data ?? []) as never));
  }, [supabase, weeks]);

  const careFirst = [...rows].sort((a, b) => Number(b.care_target) - Number(a.care_target));

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-black text-[var(--color-brand-700)] mr-auto">장기 미출석 ({rows.length}명)</h3>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
          {[2, 3, 4, 8].map((w) => <option key={w} value={w}>{w}주 이상</option>)}
        </select>
      </div>
      <div className="flex flex-col">
        {careFirst.map((r) => (
          <Link key={r.member_id} href={`${base}/members/${r.member_id}`}
                className="flex items-center gap-2 py-2.5 border-t border-[var(--line)] hover:bg-[var(--color-sand-100)] rounded-lg px-2 -mx-2">
            <b>{r.name}{r.name_suffix}</b>
            {r.care_target && (
              <span className="badge" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>케어</span>
            )}
            <span className="ml-auto text-sm text-[var(--text-soft)]">
              {r.last_attended ? `마지막 출석 ${r.last_attended}` : "출석 기록 없음"}
            </span>
          </Link>
        ))}
        {rows.length === 0 && <p className="text-center py-10 text-[var(--text-soft)]">해당 기간 미출석자가 없습니다 🎉</p>}
      </div>
    </div>
  );
}

/* ---------- 기능(모듈) 담당자 임명 ---------- */
const GRANTABLE = [
  { key: "attendance", label: "출석" },
  { key: "verse", label: "말씀 암송" },
];
const LEVEL_LABEL: Record<string, string> = { admin: "관리자", manager: "운영자", viewer: "열람" };

function ModuleGrants() {
  const supabase = useMemo(() => createClient(), []);
  const [grants, setGrants] = useState<{ user_id: string; module: string; level: string }[]>([]);
  const [linked, setLinked] = useState<{ user_id: string; name: string; name_suffix: string }[]>([]);
  const [sel, setSel] = useState({ user: "", module: "verse", level: "admin" });

  const load = useCallback(async () => {
    const [{ data: g }, { data: m }] = await Promise.all([
      supabase.from("module_grants").select("user_id, module, level"),
      supabase.from("members").select("user_id, name, name_suffix").not("user_id", "is", null),
    ]);
    setGrants(g ?? []);
    setLinked((m ?? []) as never);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const nameOf = (uid: string) => {
    const m = linked.find((x) => x.user_id === uid);
    return m ? m.name + m.name_suffix : uid.slice(0, 8);
  };

  async function grant() {
    if (!sel.user) return;
    const { error } = await supabase.from("module_grants").upsert(
      { user_id: sel.user, module: sel.module, level: sel.level,
        church_id: undefined as never }, // church_id는 RLS with check + 아래 재조회로 보정
    );
    if (error) {
      // church_id not null — 직접 조회해 포함 재시도
      const { data: ch } = await supabase.from("churches").select("id").limit(1).single();
      const { error: e2 } = await supabase.from("module_grants").upsert(
        { user_id: sel.user, module: sel.module, level: sel.level, church_id: ch!.id });
      if (e2) return notify(e2.message);
    }
    load();
  }

  async function revoke(uid: string, mod: string) {
    await supabase.from("module_grants").delete().eq("user_id", uid).eq("module", mod);
    load();
  }

  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">기능 담당자 임명</h3>
      <p className="text-sm text-[var(--text-soft)] mb-3">
        임명된 담당자는 <b>해당 기능의 메뉴만</b> 추가로 보입니다. (예: 말씀 암송 관리자)
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={sel.user}
                onChange={(e) => setSel({ ...sel, user: e.target.value })}>
          <option value="">교인 선택 (계정 연결자)</option>
          {linked.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}{m.name_suffix}</option>)}
        </select>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={sel.module}
                onChange={(e) => setSel({ ...sel, module: e.target.value })}>
          {GRANTABLE.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={sel.level}
                onChange={(e) => setSel({ ...sel, level: e.target.value })}>
          {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-primary !min-h-10 text-sm" onClick={grant}>임명</button>
      </div>
      {grants.map((g, i) => (
        <div key={i} className="flex items-center gap-2 py-2 border-t border-[var(--line)] text-sm">
          <b>{nameOf(g.user_id)}</b>
          <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
            {GRANTABLE.find((x) => x.key === g.module)?.label ?? g.module} {LEVEL_LABEL[g.level]}
          </span>
          <button className="ml-auto btn btn-danger-soft !min-h-8 !py-1 text-xs"
                  onClick={() => revoke(g.user_id, g.module)}>해제</button>
        </div>
      ))}
      {grants.length === 0 && <p className="text-sm text-[var(--text-soft)] py-2">임명된 담당자가 없습니다.</p>}
    </div>
  );
}

/* ---------- 권한 매트릭스 ---------- */
const FGROUPS = [
  { key: "attendance", label: "출석 정보" }, { key: "contact", label: "연락처" },
  { key: "birth", label: "생년월일" }, { key: "address", label: "주소" },
  { key: "family", label: "가족" }, { key: "pastoral", label: "돌봄 정보" },
];

function Permissions() {
  const supabase = useMemo(() => createClient(), []);
  const [perms, setPerms] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const { data } = await supabase.from("field_permissions").select("fgroup, allowed").eq("role_scope", "dept_leader");
    const map: Record<string, boolean> = {};
    for (const p of data ?? []) map[p.fgroup] = p.allowed;
    setPerms(map);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function toggle(key: string) {
    const next = !perms[key];
    setPerms((p) => ({ ...p, [key]: next }));
    await supabase.from("field_permissions")
      .update({ allowed: next, updated_at: new Date().toISOString() })
      .eq("role_scope", "dept_leader").eq("fgroup", key);
  }

  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">부서 담당자 항목별 열람 승인</h3>
      <p className="text-sm text-[var(--text-soft)] mb-4">
        승인해도 <b>교인 본인이 동의한 항목만</b> 보입니다 (2중 게이트). 모든 변경은 기록됩니다.
      </p>
      {FGROUPS.map((g) => (
        <div key={g.key} className="flex items-center gap-3 py-2.5 border-t border-[var(--line)]">
          <b>{g.label}</b>
          <button onClick={() => toggle(g.key)}
            className="ml-auto btn !min-h-9 text-sm"
            style={perms[g.key]
              ? { background: "var(--color-positive)", color: "#fff" }
              : { background: "var(--color-sand-200)", color: "var(--text-soft)" }}>
            {perms[g.key] ? "승인됨" : "차단됨"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- 이벤트 관리 ---------- */
function EventsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<{ id: string; name: string; category: string; active: boolean }[]>([]);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("education");

  const load = useCallback(async () => {
    const { data } = await supabase.from("events").select("id, name, category, active").order("sort_order");
    setEvents(data ?? []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!newName.trim()) return;
    const { error } = await supabase.from("events").insert({ name: newName.trim(), category: newCat, sort_order: 50 });
    if (error) notify(error.message, "error");
    setNewName("");
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("events").update({ active: !active }).eq("id", id);
    load();
  }

  const CAT_LABEL: Record<string, string> = { worship: "예배", education: "교육", meeting: "모임", visit: "방문", other: "기타" };

  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">이벤트 관리</h3>
      <p className="text-sm text-[var(--text-soft)] mb-4">
        교육 프로그램·수련회 등을 추가하면 즉시 출석 체크·통계가 동작합니다.
      </p>
      <div className="flex gap-2 mb-4">
        <input className="input flex-1" placeholder="예: 제자훈련 1기" value={newName}
               onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <select className="input !w-auto" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
          {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-primary" onClick={add}>추가</button>
      </div>
      {events.map((e) => (
        <div key={e.id} className="flex items-center gap-2 py-2 border-t border-[var(--line)]">
          <b>{e.name}</b>
          <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
            {CAT_LABEL[e.category]}
          </span>
          <button className="ml-auto btn !min-h-9 text-sm"
            onClick={() => toggleActive(e.id, e.active)}
            style={e.active ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
                            : { background: "var(--color-sand-200)", color: "var(--text-soft)" }}>
            {e.active ? "사용 중" : "중지됨"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Obsidian 내보내기 ---------- */
function ExportPanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">Obsidian 출석명단 내보내기</h3>
      <p className="text-sm text-[var(--text-soft)] mb-4">
        기존 <b>B332.출석데이터</b>와 동일한 형식의 md 파일을 생성합니다.
        다운로드 후 Obsidian 폴더에 넣으면 기존 대시보드가 그대로 읽습니다.
      </p>
      <div className="flex gap-2">
        <input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <a className="btn btn-primary flex-1" href={`/api/export?date=${date}`} download>
          📥 {date} 출석명단.md 다운로드
        </a>
      </div>
    </div>
  );
}
