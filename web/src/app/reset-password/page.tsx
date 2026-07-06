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
      // createBrowserClient가 URL의 code를 자동 교환하므로 세션을 먼저 확인하고,
      // 없을 때만 수동 교환을 시도한다 (이중 교환 방지)
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const code = params.get("code");
        if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => {});
        ({ data: { session } } = await supabase.auth.getSession());
      }
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
