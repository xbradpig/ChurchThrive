"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 초대 매직링크 등으로 #access_token이 붙어 도착하면 세션을 심고 홈으로
  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const p = new URLSearchParams(hash.slice(1));
      const access_token = p.get("access_token");
      const refresh_token = p.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) window.location.replace("/home");
        });
        return;
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/home");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-800)] flex items-center justify-center">
            <span className="text-[var(--color-accent)] text-3xl font-black">✝</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--color-brand-800)]">ChurchThrive</h1>
          <p className="text-[var(--text-soft)]">교회 관리 플랫폼</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-sm">이메일</span>
            <input
              className="input" type="email" value={email} autoComplete="username"
              onChange={(e) => setEmail(e.target.value)} required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-sm">비밀번호</span>
            <input
              className="input" type="password" value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} required
            />
          </label>
          {error && (
            <p className="badge w-full justify-center py-2" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary w-full text-lg" disabled={loading}>
            {loading ? "확인 중…" : "로그인"}
          </button>
          <a href="/forgot-password" className="text-center text-sm font-bold text-[var(--color-brand-600)] underline py-1">
            비밀번호를 잊으셨나요?
          </a>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-soft)]">
          교인 계정은 교회 사무실에 문의해주세요.
        </p>
        <a href="/register-intro"
           className="btn btn-ghost w-full mt-3 text-sm">
          ⛪ 우리 교회를 새로 등록하려면 — 시작하기
        </a>
      </div>
    </main>
  );
}
