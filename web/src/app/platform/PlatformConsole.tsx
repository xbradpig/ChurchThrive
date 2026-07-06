"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { notify, askConfirm, askPrompt } from "@/components/ui/AppDialog";

type Overview = {
  church_count: number; active_count: number; member_total: number; week_attendance: number;
  churches: { id: string; name: string; slug: string; status: string; created_at: string;
              member_count: number; modules: string[] }[];
};
type Pending = { id: string; name: string; slug: string; denomination: string | null;
  pastor_name: string | null; contact_phone: string | null; address: string | null;
  member_size: string | null; intro: string | null; created_at: string };
type Application = { id: string; name: string; slug: string; denomination: string;
  pastor_name: string; contact_phone: string; applicant_email: string; applicant_role: string;
  address: string | null; member_size: string | null; intro: string | null; created_at: string };
type Audit = { logged_at: string; actor_email: string; action: string;
  target_table: string; detail: Record<string, unknown> | null };

type SectionKey = "overview" | "review" | "churches" | "audit" | "system";

/** 플랫폼 운영 공간 — 교회 모드와 구분되는 자체 사이드 네비 (D2 별도 공간) */
export default function PlatformConsole({ overview, pending, applications, audit }:
  { overview: Overview; pending: Pending[]; applications: Application[]; audit: Audit[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [section, setSection] = useState<SectionKey>("overview");
  const [queue, setQueue] = useState(pending);
  const [apps, setApps] = useState(applications);
  const [rows, setRows] = useState(overview.churches);

  const reviewCount = apps.length + queue.length;
  const MENU: { key: SectionKey; icon: string; label: string; badge?: number }[] = [
    { key: "overview", icon: "📊", label: "현황" },
    { key: "review", icon: "📮", label: "등록 심사", badge: reviewCount },
    { key: "churches", icon: "⛪", label: "교회 관리" },
    { key: "audit", icon: "📋", label: "감사 기록" },
    { key: "system", icon: "🧩", label: "마켓·시스템" },
  ];

  async function linkApp(a: Application, churchId: string, churchName: string) {
    if (!(await askConfirm({ title: `${a.applicant_email} 님을 기존 "${churchName}"의 ${a.applicant_role}(으)로 연결할까요?\n(등록된 교회 연락처로 본인 확인을 마친 뒤 진행하세요)` }))) return;
    const res = await fetch("/api/platform/review-application", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: a.id, link_church_id: churchId }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error);
    if (data.mail_sent) notify(`연결 완료 (${data.role}) — 신청자에게 가입 메일을 보냈습니다.`);
    else prompt("연결 완료 — 메일 한도 초과로 발송하지 못했습니다.\n아래 가입 링크를 복사해 문자·카톡으로 전달해주세요:", data.action_link ?? "");
    setApps((q) => q.filter((x) => x.id !== a.id));
  }

  async function reviewApp(id: string, approve: boolean) {
    const note = approve ? null : ((await askPrompt({ title: "거절 사유 (신청자 확인용)" })) ?? "등록 정보를 확인할 수 없습니다");
    const res = await fetch("/api/platform/review-application", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: id, approve, note }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error);
    if (approve && data.mail_sent) notify(`승인 완료 — ${data.church} 신청자에게 가입 메일을 보냈습니다.`);
    else if (approve) prompt("승인 완료 — 메일 한도 초과로 발송하지 못했습니다.\n아래 가입 링크를 복사해 전달해주세요:", data.action_link ?? "");
    setApps((q) => q.filter((a) => a.id !== id));
  }

  async function review(id: string, approve: boolean) {
    const note = approve ? null : ((await askPrompt({ title: "거절 사유 (신청자에게 표시됩니다)" })) ?? "등록 정보를 확인할 수 없습니다");
    const { error } = await supabase.rpc("platform_set_church_status",
      { p_church: id, p_status: approve ? "active" : "rejected", p_note: note });
    if (error) return notify(error.message, "error");
    setQueue((q) => q.filter((c) => c.id !== id));
  }

  async function setStatus(id: string, status: string) {
    const next = status === "active" ? "suspended" : "active";
    const { error } = await supabase.rpc("platform_set_church_status", { p_church: id, p_status: next });
    if (error) return notify(error.message, "error");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  const OPS_BG = "linear-gradient(180deg, #431414, #2b0d0d)";

  return (
    <div className="min-h-dvh" data-testid="platform-console">
      {/* 데스크톱 사이드 네비 — 운영 전용 다크 레드 */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col text-white z-40"
             style={{ background: OPS_BG }} data-platform-nav>
        <div className="px-5 py-5">
          <p className="font-black text-lg">🛠 플랫폼 운영</p>
          <p className="text-xs mt-1" style={{ color: "#e8b4b4" }}>운영 모드 — 교회 내부 데이터 접근 불가</p>
        </div>
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {MENU.map((m) => (
            <button key={m.key} onClick={() => setSection(m.key)}
                    data-pnav={m.key} data-pnav-state={section === m.key ? "active" : "idle"}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold"
                    style={section === m.key
                      ? { background: "rgb(255 255 255 / 0.16)" }
                      : { color: "#e8c9c9" }}>
              <span>{m.icon}</span> {m.label}
              {m.badge ? (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-black"
                      style={{ background: "#ffd166", color: "#4a1414" }}>{m.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <Link href="/home" className="btn w-full !min-h-11 text-sm"
                style={{ background: "rgb(255 255 255 / 0.14)", color: "#fff" }}>
            ⛪ 교회로 돌아가기
          </Link>
        </div>
      </aside>

      {/* 모바일 상단 바 */}
      <header className="md:hidden flex items-center gap-2 px-4 py-3 text-white overflow-x-auto"
              style={{ background: OPS_BG }}>
        <span className="font-black whitespace-nowrap mr-1">🛠 운영</span>
        {MENU.map((m) => (
          <button key={m.key} onClick={() => setSection(m.key)}
                  className="px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
                  style={section === m.key ? { background: "rgb(255 255 255 / 0.2)" } : { color: "#e8c9c9" }}>
            {m.icon} {m.label}{m.badge ? ` (${m.badge})` : ""}
          </button>
        ))}
        <Link href="/home" className="ml-auto text-sm whitespace-nowrap" style={{ color: "#ffd9d9" }}>나가기</Link>
      </header>

      <main className="md:pl-60">
        <div className="max-w-4xl mx-auto p-5 flex flex-col gap-5">

          {section === "overview" && (
            <>
              <h2 className="text-xl font-black">📊 플랫폼 현황</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["등록 교회", `${overview.church_count}곳`],
                  ["활성 교회", `${overview.active_count}곳`],
                  ["전체 교인(집계)", `${overview.member_total}명`],
                  ["최근 7일 출석", `${overview.week_attendance}건`],
                ].map(([k, v]) => (
                  <div key={k} className="card p-4 text-center">
                    <p className="text-sm font-bold text-[var(--text-soft)]">{k}</p>
                    <p className="text-2xl font-black mt-1">{v}</p>
                  </div>
                ))}
              </div>
              {reviewCount > 0 && (
                <button onClick={() => setSection("review")}
                        className="card p-4 text-left flex items-center gap-3"
                        style={{ borderColor: "var(--color-caution)" }}>
                  <span className="text-2xl">📮</span>
                  <span className="font-bold">심사 대기 {reviewCount}건이 있습니다 — 등록 심사로 이동</span>
                  <span className="ml-auto">→</span>
                </button>
              )}
            </>
          )}

          {section === "review" && (
            <>
              <h2 className="text-xl font-black">📮 등록 심사</h2>
              {reviewCount === 0 && (
                <div className="card p-8 text-center text-[var(--text-soft)]">대기 중인 신청이 없습니다. ☕</div>
              )}
              {apps.length > 0 && (
                <div className="card p-5" style={{ borderColor: "var(--color-caution)" }} data-widget="application-queue">
                  <h3 className="font-black mb-3" style={{ color: "var(--color-caution)" }}>
                    신규 등록 신청 {apps.length}건 — 승인 시 가입 메일 자동 발송
                  </h3>
                  {apps.map((a) => (
                    <div key={a.id} className="py-3 border-t border-[var(--line)]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <b className="text-lg">{a.name}</b>
                        <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                          {a.denomination}
                        </span>
                        <span className="badge" style={{ background: "var(--surface-soft)" }}>{a.applicant_role}</span>
                        <span className="text-sm text-[var(--text-soft)]">{a.member_size}</span>
                        <span className="ml-auto flex gap-2">
                          <button className="btn btn-positive !min-h-9 text-sm" onClick={() => reviewApp(a.id, true)}>승인</button>
                          <button className="btn btn-danger-soft !min-h-9 text-sm" onClick={() => reviewApp(a.id, false)}>거절</button>
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-soft)] mt-1">
                        담임 {a.pastor_name} · {a.contact_phone} · ✉ {a.applicant_email}
                        {a.address && <span> · {a.address}</span>}
                        {a.intro && <span className="block">📝 {a.intro}</span>}
                      </p>
                      {(() => {
                        const match = overview.churches?.find((c) => c.name.trim() === a.name.trim());
                        return match ? (
                          <p className="mt-2 flex items-center gap-2 flex-wrap text-sm rounded-xl p-2.5"
                             style={{ background: "var(--color-caution-soft, #fef3c7)" }} data-existing-match>
                            ⚠️ 같은 이름의 교회가 이미 있습니다 — 신설 승인 대신 담당자 확인 후 연결하세요.
                            <button className="btn btn-primary !min-h-9 text-sm"
                                    onClick={() => linkApp(a, match.id, match.name)}>
                              기존 교회에 {a.applicant_role}로 연결
                            </button>
                          </p>
                        ) : null;
                      })()}
                    </div>
                  ))}
                </div>
              )}
              {queue.length > 0 && (
                <div className="card p-5" style={{ borderColor: "var(--color-caution)" }} data-widget="review-queue">
                  <h3 className="font-black mb-3" style={{ color: "var(--color-caution)" }}>
                    (구 방식) 등록 심사 대기 {queue.length}건
                  </h3>
                  {queue.map((c) => (
                    <div key={c.id} className="py-3 border-t border-[var(--line)]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <b className="text-lg">{c.name}</b>
                        <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                          {c.denomination ?? "교단 미기재"}
                        </span>
                        <span className="text-sm text-[var(--text-soft)]">{c.member_size}</span>
                        <span className="ml-auto flex gap-2">
                          <button className="btn btn-positive !min-h-9 text-sm" onClick={() => review(c.id, true)}>승인</button>
                          <button className="btn btn-danger-soft !min-h-9 text-sm" onClick={() => review(c.id, false)}>거절</button>
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-soft)] mt-1">
                        담임 {c.pastor_name ?? "—"} · {c.contact_phone ?? "—"} · {c.address || "주소 미기재"}
                        {c.intro && <span className="block">📝 {c.intro}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {section === "churches" && (
            <>
              <h2 className="text-xl font-black">⛪ 교회 관리</h2>
              <div className="card p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--text-soft)]">
                        <th className="py-2 font-bold">교회</th><th className="font-bold">주소</th>
                        <th className="font-bold text-right pr-6">교인</th><th className="font-bold">모듈</th>
                        <th className="font-bold">가입일</th><th className="font-bold text-right">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => (
                        <tr key={c.id} className="border-t border-[var(--line)]">
                          <td className="py-2.5 font-bold">{c.name}</td>
                          <td className="text-[var(--text-soft)]">{c.slug}</td>
                          <td className="text-right pr-6">{c.member_count}</td>
                          <td className="text-[var(--text-soft)]">{c.modules.join(", ") || "—"}</td>
                          <td className="text-[var(--text-soft)]">{c.created_at.slice(0, 10)}</td>
                          <td className="text-right">
                            <button onClick={() => setStatus(c.id, c.status)}
                                    className="btn !min-h-8 !py-1 text-xs"
                                    style={c.status === "active"
                                      ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
                                      : { background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
                              {c.status === "active" ? "활성" : "정지됨"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {section === "audit" && (
            <>
              <h2 className="text-xl font-black">📋 감사 기록 <span className="text-sm font-normal text-[var(--text-soft)]">최근 {audit.length}건</span></h2>
              <div className="card divide-y divide-[var(--line)]" data-widget="audit-list">
                {audit.map((a, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                    <span className="text-[var(--text-soft)] whitespace-nowrap">{a.logged_at.slice(5, 16).replace("T", " ")}</span>
                    <span className="badge shrink-0" style={{ background: "var(--surface-soft)" }}>{a.action}</span>
                    <span className="flex-1 break-all">
                      <b>{a.actor_email}</b> → {a.target_table}
                      {a.detail && <span className="text-[var(--text-soft)]"> · {JSON.stringify(a.detail).slice(0, 80)}</span>}
                    </span>
                  </div>
                ))}
                {audit.length === 0 && <p className="p-8 text-center text-[var(--text-soft)]">기록이 없습니다.</p>}
              </div>
            </>
          )}

          {section === "system" && (
            <>
              <h2 className="text-xl font-black">🧩 마켓·시스템</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="font-black text-[var(--color-brand-700)]">마켓 심사 큐</h3>
                  <p className="text-sm text-[var(--text-soft)] mt-1">파트너 모듈 제출이 없습니다. (Tier 2 개시 전)</p>
                </div>
                <div className="card p-5">
                  <h3 className="font-black text-[var(--color-brand-700)]">시스템 헬스</h3>
                  <p className="text-sm mt-1">
                    <span className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
                      DB·API 정상
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
