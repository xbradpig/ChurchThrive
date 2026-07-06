"use client";

import { use, useEffect, useState } from "react";

/**
 * 초대 수락 (어르신 대상) — 문자로 받은 링크 하나로 시작
 * 이메일·비밀번호 없음: [시작하기] 한 번이면 로그인까지 완료
 */
export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<{ valid: boolean; name?: string; church?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invite/${token}`).then((r) => r.json()).then(setInfo).catch(() => setInfo({ valid: false }));
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/invite/${token}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setBusy(false); return setError(data.error); }
    window.location.href = data.action_link;   // 매직링크 → 세션 성립 → 홈
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 text-center flex flex-col gap-5 pop-in">
        {info === null ? (
          <p className="text-[var(--text-soft)]">확인 중…</p>
        ) : !info.valid ? (
          <>
            <span className="text-4xl">😢</span>
            <b className="text-lg">초대가 만료되었어요</b>
            <p className="text-sm text-[var(--text-soft)]">
              교회 담당자에게 초대 문자를 다시 보내달라고 요청해주세요.
            </p>
          </>
        ) : (
          <>
            <span className="text-5xl">💒</span>
            <h1 className="text-2xl font-black text-[var(--color-brand-800)]">
              {info.name} 님, 환영합니다!
            </h1>
            <p className="text-lg leading-relaxed">
              <b>{info.church}</b>에서<br />초대장을 보내드렸어요.
            </p>
            <p className="text-sm text-[var(--text-soft)]">
              아래 버튼 한 번이면 준비 끝!<br />회원가입이나 비밀번호가 필요 없습니다.
            </p>
            {error && (
              <p className="badge w-full justify-center py-2"
                 style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
            )}
            <button onClick={accept} disabled={busy}
                    className="btn btn-primary !text-xl !min-h-16 w-full">
              {busy ? "준비 중…" : "✨ 시작하기"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
