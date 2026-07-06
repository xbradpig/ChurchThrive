"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** 승인 메일 링크로 도착 — 비밀번호 설정 후 바로 교회 관리 시작 */
export default function SetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const p = new URLSearchParams(hash.slice(1));
      const access_token = p.get("access_token"), refresh_token = p.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(() => setReady(true));
        return;
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError("링크가 만료되었습니다. 승인 메일의 링크를 다시 눌러주세요.");
    });
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (pw !== pw2) return setError("비밀번호가 서로 다릅니다.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.replace("/home");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <div className="text-center mb-6">
          <span className="text-4xl">🎉</span>
          <h1 className="text-xl font-black text-[var(--color-brand-800)] mt-2">교회 등록이 승인됐어요!</h1>
          <p className="text-sm text-[var(--text-soft)] mt-1">
            앞으로 사용할 비밀번호를 정하면<br />바로 교회 관리를 시작할 수 있습니다.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="input" type="password" placeholder="비밀번호 (8자 이상)"
                 value={pw} onChange={(e) => setPw(e.target.value)} disabled={!ready} />
          <input className="input" type="password" placeholder="비밀번호 확인"
                 value={pw2} onChange={(e) => setPw2(e.target.value)} disabled={!ready} />
          {error && (
            <p className="badge w-full justify-center py-2"
               style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
          )}
          <button className="btn btn-primary text-lg" disabled={!ready || busy}>
            {busy ? "저장 중…" : "시작하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
