"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Overview = {
  church_count: number; active_count: number; member_total: number; week_attendance: number;
  churches: { id: string; name: string; slug: string; status: string; created_at: string;
              member_count: number; modules: string[] }[];
};

/** 별도 공간: 자체 헤더 + 운영 모드 배너 (교회 네비와 섞이지 않음 — D2) */
type Pending = { id: string; name: string; slug: string; denomination: string | null;
  pastor_name: string | null; contact_phone: string | null; address: string | null;
  member_size: string | null; intro: string | null; created_at: string };

type Application = { id: string; name: string; slug: string; denomination: string;
  pastor_name: string; contact_phone: string; applicant_email: string;
  address: string | null; member_size: string | null; intro: string | null; created_at: string };

export default function PlatformConsole({ overview, pending, applications }:
  { overview: Overview; pending: Pending[]; applications: Application[] }) {
  const [queue, setQueue] = useState(pending);
  const [apps, setApps] = useState(applications);

  async function reviewApp(id: string, approve: boolean) {
    const note = approve ? null : (prompt("거절 사유 (신청자 확인용)") ?? "등록 정보를 확인할 수 없습니다");
    const res = await fetch("/api/platform/review-application", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: id, approve, note }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    if (approve) alert(`승인 완료 — ${data.church} 신청자에게 가입 메일을 보냈습니다.`);
    setApps((q) => q.filter((a) => a.id !== id));
  }
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState(overview.churches);

  async function review(id: string, approve: boolean) {
    const note = approve ? null : (prompt("거절 사유 (신청자에게 표시됩니다)") ?? "등록 정보를 확인할 수 없습니다");
    const { error } = await supabase.rpc("platform_set_church_status",
      { p_church: id, p_status: approve ? "active" : "rejected", p_note: note });
    if (error) return alert(error.message);
    setQueue((q) => q.filter((c) => c.id !== id));
  }

  async function setStatus(id: string, status: string) {
    const next = status === "active" ? "suspended" : "active";
    const { error } = await supabase.rpc("platform_set_church_status", { p_church: id, p_status: next });
    if (error) return alert(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  return (
    <div className="min-h-dvh" data-testid="platform-console">
      {/* 운영 모드 배너 — 색상부터 교회 모드와 구분 */}
      <header className="flex items-center gap-3 px-5 py-3 text-white"
              style={{ background: "linear-gradient(90deg, #7a1f1f, #4a1414)" }}>
        <span className="text-xl">🛠</span>
        <b className="text-lg mr-2">ChurchThrive 플랫폼 운영</b>
        <span className="badge" style={{ background: "rgb(255 255 255 / 0.15)", color: "#ffd9d9" }}>
          운영 모드 — 교회 내부 데이터 접근 불가
        </span>
        <Link href="/home" className="ml-auto btn !min-h-9 text-sm"
              style={{ background: "rgb(255 255 255 / 0.15)", color: "#fff" }}>
          ⛪ 교회로 돌아가기
        </Link>
      </header>

      <main className="max-w-4xl mx-auto p-5 flex flex-col gap-5">
        {/* 현황 */}
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

        {/* 신규 신청 심사 큐 (계정 없이 접수 → 승인 시 가입 메일) */}
        {apps.length > 0 && (
          <div className="card p-5" style={{ borderColor: "var(--color-caution)" }} data-widget="application-queue">
            <h3 className="font-black mb-3" style={{ color: "var(--color-caution)" }}>
              📮 등록 신청 {apps.length}건 — 승인 시 가입 메일 자동 발송
            </h3>
            {apps.map((a) => (
              <div key={a.id} className="py-3 border-t border-[var(--line)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="text-lg">{a.name}</b>
                  <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                    {a.denomination}
                  </span>
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
              </div>
            ))}
          </div>
        )}

        {/* 교회 등록 심사 큐 */}
        {queue.length > 0 && (
          <div className="card p-5" style={{ borderColor: "var(--color-caution)" }} data-widget="review-queue">
            <h3 className="font-black mb-3" style={{ color: "var(--color-caution)" }}>
              🔍 등록 심사 대기 {queue.length}건
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

        {/* 교회 목록 */}
        <div className="card p-5">
          <h3 className="font-black text-[var(--color-brand-700)] mb-3">교회 목록</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-soft)]">
                  <th className="py-2 font-bold">교회</th><th className="font-bold">주소</th>
                  <th className="font-bold text-right">교인</th><th className="font-bold">모듈</th>
                  <th className="font-bold">가입일</th><th className="font-bold text-right">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--line)]">
                    <td className="py-2.5 font-bold">{c.name}</td>
                    <td className="text-[var(--text-soft)]">{c.slug}</td>
                    <td className="text-right">{c.member_count}</td>
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

        {/* 심사 큐 골격 + 헬스 */}
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
      </main>
    </div>
  );
}
