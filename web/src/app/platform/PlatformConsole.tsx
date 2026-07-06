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
export default function PlatformConsole({ overview }: { overview: Overview }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState(overview.churches);

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
