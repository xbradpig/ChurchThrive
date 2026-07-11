"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** 회원가입 → 교회 등록(flow=church) 또는 갈림길로 이어지는 온보딩 입구 */
function SignupForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const churchFlow = params.get("flow") === "church";   // 교회 등록 3단계 중 1단계
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (!data.session) {
      setError("가입 확인 메일을 확인해주세요. 이미 가입한 이메일이면 새 비밀번호로 바뀌지 않으니 로그인 화면의 비밀번호 찾기를 사용해주세요.");
      return;
    }
    router.replace(churchFlow ? "/register-church" : "/start");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-full bg-[var(--color-brand-800)] flex items-center justify-center">
            <span className="text-[var(--color-accent)] text-2xl font-black">✝</span>
          </div>
          {churchFlow ? (
            <>
              <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                교회 등록 1/3 — 계정 만들기
              </span>
              <h1 className="text-xl font-black text-[var(--color-brand-800)]">관리자 계정 만들기</h1>
              <p className="text-sm text-[var(--text-soft)] text-center">
                이 계정이 우리 교회의 관리자 계정이 됩니다.<br />
                다음 단계에서 교회 정보를 입력합니다.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-black text-[var(--color-brand-800)]">ChurchThrive 시작하기</h1>
              <p className="text-sm text-[var(--text-soft)] text-center">
                계정을 만들고 우리 교회를 등록하세요.<br />약 15분이면 교회 공간이 준비됩니다.
              </p>
            </>
          )}
        </div>
        <form onSubmit={signup} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-sm">이메일</span>
            <input className="input" type="email" value={email} autoComplete="username"
                   onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-sm">비밀번호 (8자 이상)</span>
            <input className="input" type="password" value={password} autoComplete="new-password"
                   onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && (
            <p className="badge w-full justify-center py-2"
               style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
          )}
          <button className="btn btn-primary text-lg" disabled={busy}>
            {busy ? "만드는 중…" : "계정 만들기"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-soft)]">
          이미 계정이 있으신가요? <Link href="/login" className="font-bold text-[var(--color-brand-600)] underline">로그인</Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}
