"use client";

import { useState } from "react";
import Link from "next/link";

const DENOMINATIONS = [
  "대한예수교장로회(통합)", "대한예수교장로회(합동)", "대한예수교장로회(고신)",
  "한국기독교장로회", "기독교대한감리회", "기독교대한성결교회",
  "기독교한국침례회", "기독교대한하나님의성회(순복음)", "독립교회·선교단체", "기타(직접 입력)",
];
const SIZES = ["50명 미만", "50~100명", "100~300명", "300~1,000명", "1,000명 이상"];

/** 교회 등록 신청 — 계정 없이 제출, 승인되면 메일로 가입 링크 발송 */
export default function ApplyPage() {
  const [f, setF] = useState({
    name: "", slug: "", denomination: DENOMINATIONS[0], denomEtc: "",
    pastor_name: "", contact_phone: "", applicant_email: "", address: "", member_size: SIZES[2], intro: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const denomination = f.denomination.startsWith("기타") ? f.denomEtc.trim() : f.denomination;
    if (!denomination) return setError("교단을 입력해주세요.");
    setBusy(true);
    const res = await fetch("/api/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, denomination, slug: f.slug.toLowerCase() }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error ?? "제출에 실패했습니다.");
    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="card w-full max-w-sm p-8 text-center flex flex-col gap-4 pop-in">
          <span className="text-4xl">📮</span>
          <b className="text-lg">신청이 접수됐습니다!</b>
          <p className="text-sm text-[var(--text-soft)] leading-relaxed">
            등록 정보를 확인한 뒤 <b>보통 1일 이내</b>에<br />
            <b>{f.applicant_email}</b>로<br />
            가입 링크가 담긴 승인 메일을 보내드립니다.
          </p>
          <Link href="/" className="btn btn-ghost text-sm">처음으로</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8 pop-in flex flex-col gap-3">
        <h1 className="text-xl font-black text-[var(--color-brand-800)]">교회 등록 신청</h1>
        <p className="text-sm text-[var(--text-soft)] -mt-1 mb-2">
          계정이 필요 없습니다 — 승인되면 <b>메일로 가입 링크</b>를 보내드려요.
        </p>
        <Field label="교회 이름 *">
          <input className="input" required value={f.name} onChange={(e) => set("name", e.target.value)}
                 placeholder="예: 은혜중앙교회" />
        </Field>
        <Field label="영문 주소 *">
          <input className="input" required value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())}
                 placeholder="예: grace-central" pattern="[a-z0-9-]{2,32}" />
        </Field>
        <Field label="교단 *">
          <select className="input" value={f.denomination} onChange={(e) => set("denomination", e.target.value)}>
            {DENOMINATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
          {f.denomination.startsWith("기타") && (
            <input className="input mt-1.5" value={f.denomEtc} onChange={(e) => set("denomEtc", e.target.value)}
                   placeholder="소속 교단·단체명" />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="담임목사 *">
            <input className="input" required value={f.pastor_name} onChange={(e) => set("pastor_name", e.target.value)} />
          </Field>
          <Field label="교회 연락처 *">
            <input className="input" required value={f.contact_phone} onChange={(e) => set("contact_phone", e.target.value)}
                   placeholder="02-000-0000" />
          </Field>
        </div>
        <Field label="담당자 이메일 * (승인 메일 수신)">
          <input className="input" type="email" required value={f.applicant_email}
                 onChange={(e) => set("applicant_email", e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="교회 주소">
          <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="교인 수">
          <select className="input" value={f.member_size} onChange={(e) => set("member_size", e.target.value)}>
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="소개 (홈페이지·소속 노회 등)">
          <textarea className="input !min-h-16" value={f.intro} onChange={(e) => set("intro", e.target.value)} />
        </Field>
        {error && (
          <p className="badge w-full justify-center py-2"
             style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
        )}
        <button className="btn btn-primary text-lg" disabled={busy}>{busy ? "제출 중…" : "신청서 제출"}</button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-bold text-sm">{label}</span>
      {children}
    </label>
  );
}
