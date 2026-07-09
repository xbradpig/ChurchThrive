"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      // PKCE(스캔 안전): code가 있으면 기존 로그인 세션과 무관하게 먼저 교환 →
      // 다른 계정으로 로그인돼 있어도 '재설정 대상' 사용자로 세션이 잡힌다.
      const code = params.get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      // (implicit recovery 해시 #access_token은 createBrowserClient가 자동 감지)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요."); return; }
      setReady(true);
    })();
  }, [supabase, params]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <h1 className="text-xl font-black text-[var(--color-brand-800)] mb-2">새 비밀번호 설정</h1>
        {!ready ? (
          <p className="badge w-full justify-center py-2 mt-3"
             style={error
               ? { background: "var(--color-danger-soft)", color: "var(--color-danger)" }
               : { background: "var(--color-sand-100)", color: "var(--text-soft)" }}>
            {error ?? "확인 중…"}
          </p>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-3 mt-3">
            <input className="input" type="password" placeholder="새 비밀번호 (8자 이상)"
                   value={password} onChange={(e) => setPassword(e.target.value)}
                   required autoComplete="new-password" />
            {error && (
              <p className="badge w-full justify-center py-2"
                 style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
            )}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
