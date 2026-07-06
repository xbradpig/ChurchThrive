"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CHOSUNG_GROUPS, groupByChosung, chosungOf } from "@/lib/chosung";

type EventRow = { id: string; name: string; category: string; schedule_rule: unknown; sort_order: number };
type Row = {
  member_id: string; name: string; name_suffix: string; photo_url: string | null;
  member_type: string; present: boolean; method: string | null; approved: boolean | null;
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 현재 시각으로 이벤트 자동 추정 (schedule_rule의 요일·시간창) */
function guessEvent(events: EventRow[]): string | null {
  const now = new Date();
  const dow = now.getDay();
  const hm = now.toTimeString().slice(0, 5);
  for (const e of events) {
    const r = e.schedule_rule as { dow?: number[]; start?: string; end?: string } | null;
    if (r?.dow?.includes(dow) && r.start && r.end && hm >= r.start && hm <= r.end) return e.id;
  }
  return events[0]?.id ?? null;
}

export default function CheckBoard({ events }: { events: EventRow[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [eventId, setEventId] = useState<string | null>(() => guessEvent(events));
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [activeChosung, setActiveChosung] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.rpc("get_check_list", {
      p_event_id: eventId, p_event_date: date,
    });
    if (!error && data) setRows(data as Row[]);
  }, [supabase, eventId, date]);

  useEffect(() => { load(); }, [load]);

  // Realtime: 다른 담당자의 체크가 즉시 반영
  useEffect(() => {
    const ch = supabase
      .channel("attendances-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendances" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, load]);

  async function toggle(row: Row) {
    if (!eventId) return;
    // 낙관적 UI
    setRows((rs) => rs.map((r) =>
      r.member_id === row.member_id
        ? { ...r, present: !r.present, method: !r.present ? "manual" : null, approved: true }
        : r
    ));
    const { error } = await supabase.rpc("set_attendance", {
      p_member_id: row.member_id, p_event_id: eventId, p_event_date: date,
      p_present: !row.present, p_method: "manual",
    });
    if (error) load(); // 실패 시 서버 상태로 복원
  }

  async function registerNew() {
    const name = newName.trim();
    if (!name || !eventId || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("quick_register", {
      p_name: name, p_event_id: eventId, p_event_date: date,
    });
    setBusy(false);
    if (!error) {
      setNewName("");
      setShowNew(false);
      load();
    } else {
      alert("등록에 실패했습니다: " + error.message);
    }
  }

  const filtered = useMemo(
    () => rows.filter((r) =>
      (!search || (r.name + r.name_suffix).includes(search.trim())) &&
      (!activeChosung || activeChosung === "new"
        ? true
        : chosungOf(r.name) === activeChosung)
    ),
    [rows, search, activeChosung]
  );
  const grouped = useMemo(() => groupByChosung(filtered), [filtered]);
  const presentCount = rows.filter((r) => r.present).length;
  const newcomers = filtered.filter((r) => r.member_type === "new_family");
  const pendingSelf = rows.filter((r) => r.present && r.approved === false);

  function jumpTo(g: string | null) {
    // 같은 초성을 다시 누르면 전체 보기로 복귀
    const next = activeChosung === g ? null : g;
    setActiveChosung(next);
    window.scrollTo({ top: 0 });
    if (next === "new") {
      requestAnimationFrame(() =>
        document.getElementById("grp-new")?.scrollIntoView({ block: "start" }));
    }
  }

  const eventName = events.find((e) => e.id === eventId)?.name ?? "";

  return (
    <div ref={boardRef}>
      {/* 컨트롤 바 */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <select className="input !w-auto font-bold" value={eventId ?? ""} onChange={(e) => setEventId(e.target.value)}>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          className="input flex-1 min-w-40" placeholder="이름 검색"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-ghost" onClick={() => setShowNew((v) => !v)}>＋ 신규</button>
      </div>

      {/* 신규 등록 (이름만) */}
      {showNew && (
        <div className="mx-4 mb-2 card p-4 flex gap-2 items-center pop-in">
          <input
            className="input flex-1" placeholder="새로 오신 분 이름만 입력하세요" autoFocus
            value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && registerNew()}
          />
          <button className="btn btn-positive" onClick={registerNew} disabled={busy}>
            {busy ? "등록 중…" : "등록 + 출석"}
          </button>
        </div>
      )}

      {/* 셀프 인증 승인 대기 */}
      {pendingSelf.length > 0 && (
        <div className="mx-4 mb-2 card p-3 flex items-center gap-2" style={{ borderColor: "var(--color-caution)" }}>
          <span className="badge" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>
            본인 인증 요청 {pendingSelf.length}건
          </span>
          <span className="text-sm text-[var(--text-soft)]">
            {pendingSelf.map((p) => p.name + p.name_suffix).join(", ")} — 카드를 탭하면 승인됩니다
          </span>
        </div>
      )}

      {/* 초성 인덱스 바 (필터) */}
      <div className="chosung-bar">
        <button className={`chosung-chip !min-w-fit !px-3 ${activeChosung === null ? "active" : ""}`}
                onClick={() => jumpTo(null)}>
          전체
        </button>
        {CHOSUNG_GROUPS.map((g) => (
          <button
            key={g}
            className={`chosung-chip ${activeChosung === g ? "active" : ""}`}
            onClick={() => jumpTo(g)}
          >
            {g}
          </button>
        ))}
        {newcomers.length > 0 && (
          <button className="chosung-chip !text-[var(--color-accent)]" onClick={() => jumpTo("new")}>
            신규
          </button>
        )}
      </div>

      {/* 카드 그리드 */}
      <div className="px-4 pt-3 flex flex-col gap-5">
        {newcomers.length > 0 && (
          <section id="grp-new" className="section-anchor">
            <h2 className="font-black text-lg mb-2" style={{ color: "var(--color-accent)" }}>
              🌟 신규 ({newcomers.length})
            </h2>
            <Grid rows={newcomers} onToggle={toggle} />
          </section>
        )}
        {grouped.map(([g, list]) => (
          <section key={g} id={`grp-${g}`} className="section-anchor">
            <h2 className="font-black text-lg text-[var(--color-brand-700)] mb-2">{g}</h2>
            <Grid rows={list.filter((r) => r.member_type !== "new_family")} onToggle={toggle} />
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-16 text-[var(--text-soft)]">표시할 교인이 없습니다.</p>
        )}
      </div>

      {/* 하단 통계 스트립 */}
      <div className="stat-strip">
        <span className="font-black text-lg">{eventName} · {date.slice(5).replace("-", "/")}</span>
        <span className="ml-auto font-black text-2xl" style={{ color: "#7fd6a4" }}>{presentCount}</span>
        <span className="opacity-70">/ {rows.length}명 출석</span>
      </div>
    </div>
  );
}

const METHOD_BADGE: Record<string, { label: string; cls: React.CSSProperties }> = {
  auto_wifi: { label: "자동", cls: { background: "var(--color-auto-soft)", color: "var(--color-auto)" } },
  auto_ble: { label: "자동", cls: { background: "var(--color-auto-soft)", color: "var(--color-auto)" } },
  qr: { label: "QR", cls: { background: "var(--color-accent-soft)", color: "var(--color-accent)" } },
  nfc: { label: "NFC", cls: { background: "var(--color-accent-soft)", color: "var(--color-accent)" } },
  self: { label: "본인", cls: { background: "var(--color-caution-soft)", color: "var(--color-caution)" } },
};

function Grid({ rows, onToggle }: { rows: Row[]; onToggle: (r: Row) => void }) {
  if (rows.length === 0) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {rows.map((r) => {
        const badge = r.method && r.method !== "manual" ? METHOD_BADGE[r.method] : null;
        return (
          <button key={r.member_id} className={`member-card ${r.present ? "present" : ""}`} onClick={() => onToggle(r)}>
            <span className="check-mark">✓</span>
            <span className="avatar">
              {r.photo_url ? <img src={r.photo_url} alt="" /> : r.name.charAt(0)}
            </span>
            <span className="font-bold leading-tight text-center">
              {r.name}
              {r.name_suffix && <span className="opacity-60 text-sm">{r.name_suffix}</span>}
            </span>
            {badge && <span className="badge" style={badge.cls}>{badge.label}{r.approved === false ? "?" : ""}</span>}
          </button>
        );
      })}
    </div>
  );
}
