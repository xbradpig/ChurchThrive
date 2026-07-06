"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DENOMINATIONS = [
  "대한예수교장로회(통합)", "대한예수교장로회(합동)", "대한예수교장로회(고신)",
  "한국기독교장로회", "기독교대한감리회", "기독교대한성결교회",
  "기독교한국침례회", "기독교대한하나님의성회(순복음)", "독립교회·선교단체", "기타(직접 입력)",
];
const SIZES = ["50명 미만", "50~100명", "100~300명", "300~1,000명", "1,000명 이상"];

/** 교회 등록 (심사제) — 등록 정보로 플랫폼이 확인 후 승인 */
export default function RegisterChurchPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [f, setF] = useState({
    name: "", slug: "", denomination: DENOMINATIONS[0], denomEtc: "",
    pastor: "", phone: "", address: "", size: SIZES[2], intro: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.name.trim()) return setError("교회 이름을 입력해주세요.");
    if (!/^[a-z0-9-]{2,32}$/.test(f.slug)) return setError("영문 주소는 소문자·숫자·하이픈 2~32자입니다.");
    if (!f.pastor.trim()) return setError("담임목사 성함을 입력해주세요.");
    if (!f.phone.trim()) return setError("연락처를 입력해주세요 (심사 확인용).");
    const denom = f.denomination.startsWith("기타") ? f.denomEtc.trim() : f.denomination;
    if (!denom) return setError("교단을 입력해주세요.");
    setBusy(true);
    const { error } = await supabase.rpc("create_church", {
      p_name: f.name, p_slug: f.slug, p_denomination: denom, p_pastor: f.pastor,
      p_phone: f.phone, p_address: f.address, p_size: f.size, p_intro: f.intro,
    });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/pending");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8 pop-in flex flex-col gap-3">
        <h1 className="text-xl font-black text-[var(--color-brand-800)]">교회 등록 신청</h1>
        <p className="text-sm text-[var(--text-soft)] -mt-1 mb-2">
          건강한 교회 생태계를 위해 <b>등록 정보를 확인한 뒤 승인</b>해드립니다 (보통 1일 이내).
        </p>

        <Field label="교회 이름 *">
          <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)}
                 placeholder="예: 은혜중앙교회" />
        </Field>
        <Field label="영문 주소 *">
          <input className="input" value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())}
                 placeholder="예: grace-central" />
        </Field>
        <Field label="교단 *">
          <select className="input" value={f.denomination} onChange={(e) => set("denomination", e.target.value)}>
            {DENOMINATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
          {f.denomination.startsWith("기타") && (
            <input className="input mt-1.5" value={f.denomEtc} onChange={(e) => set("denomEtc", e.target.value)}
                   placeholder="소속 교단·단체명을 입력해주세요" />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="담임목사 *">
            <input className="input" value={f.pastor} onChange={(e) => set("pastor", e.target.value)} placeholder="홍길동 목사" />
          </Field>
          <Field label="연락처 *">
            <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="02-000-0000" />
          </Field>
        </div>
        <Field label="교회 주소">
          <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="서울시 용산구 …" />
        </Field>
        <Field label="교인 수">
          <select className="input" value={f.size} onChange={(e) => set("size", e.target.value)}>
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="소개 (홈페이지·소속 노회 등 — 심사에 도움이 됩니다)">
          <textarea className="input !min-h-16" value={f.intro} onChange={(e) => set("intro", e.target.value)}
                    placeholder="예: https://example.church / ○○노회 소속" />
        </Field>

        {error && (
          <p className="badge w-full justify-center py-2"
             style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
        )}
        <button className="btn btn-primary text-lg" disabled={busy}>
          {busy ? "신청 중…" : "등록 신청"}
        </button>
        <p className="text-xs text-[var(--text-soft)] text-center">
          신청하면 승인 대기 화면으로 이동하며, 승인 즉시 모든 기능이 열립니다.
        </p>
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
