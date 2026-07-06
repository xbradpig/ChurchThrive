"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <h1 className="text-xl font-black text-[var(--color-brand-800)] mb-2">비밀번호 재설정</h1>
        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="badge w-full justify-center py-3"
               style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
              ✓ 메일을 보냈습니다
            </p>
            <p className="text-sm text-[var(--text-soft)]">
              <b>{email}</b>로 재설정 링크를 보냈습니다. 메일함을 확인하고 링크를 눌러주세요.
            </p>
            <Link href="/login" className="btn btn-ghost">로그인으로 돌아가기</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-soft)] mb-5">
              가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
            </p>
            <form onSubmit={send} className="flex flex-col gap-3">
              <input className="input" type="email" placeholder="이메일" value={email}
                     onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
              {error && (
                <p className="badge w-full justify-center py-2"
                   style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
              )}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "보내는 중…" : "재설정 링크 보내기"}
              </button>
              <Link href="/login" className="btn btn-ghost text-sm">로그인으로 돌아가기</Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
