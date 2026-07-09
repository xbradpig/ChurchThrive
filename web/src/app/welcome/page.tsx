"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step =
  | "loading"        // 세션·상태 확인 중
  | "choose"         // 방법 선택 (하브루타 연결 / 이메일·비번 / 나중에)
  | "manual"         // 이메일·비밀번호 직접 설정 폼
  | "linking"        // 포털 토큰으로 연결 처리 중
  | "linked"         // 하브루타 연결 완료
  | "manualDone";    // 이메일·비번 설정 접수 (확인 메일 안내)

/**
 * 초대 간편 계정 → 로그인 계정 만들기 (invite-account-setup)
 * 초대 수락 직후 바로 진입 + 기존 간편 계정 사용자는 홈/내 교적 배너로 진입.
 * 권장 경로 = 하브루타 통합 로그인 연결(포털이 이메일 인증 담당), 보조 = 이메일·비밀번호 직접 설정.
 */
export default function WelcomePage() {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);
  const [linkedEmail, setLinkedEmail] = useState<string>("");
  const [f, setF] = useState({ email: "", pw: "", pw2: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 포털에서 #havruta_token으로 복귀 → 연결 API 호출
    const hash = window.location.hash;
    if (hash.includes("havruta_token")) {
      const t = new URLSearchParams(hash.slice(1)).get("havruta_token");
      window.history.replaceState(null, "", window.location.pathname);
      if (t) {
        setStep("linking");
        fetch("/api/havruta/link-invited", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: t }),
        })
          .then(async (r) => ({ ok: r.ok, j: await r.json() }))
          .then(async ({ ok, j }) => {
            if (!ok) { setError(j.error ?? "연결에 실패했습니다."); setStep("choose"); return; }
            await supabase.auth.refreshSession(); // 이메일 클레임 갱신
            setLinkedEmail(j.email ?? "");
            setStep("linked");
          })
          .catch(() => { setError("연결에 실패했습니다. 잠시 후 다시 시도해주세요."); setStep("choose"); });
        return;
      }
    }
    // 일반 진입: 간편 계정만 대상으로
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.replace("/login"); return; }
      if (!(user.email ?? "").includes("@invite.")) { window.location.replace("/home"); return; }
      setStep("choose");
    });
  }, [supabase]);

  function havrutaConnect() {
    const portal = process.env.NEXT_PUBLIC_HAVRUTA_PORTAL_URL ?? "https://havrutaproject.org";
    const back = `${window.location.origin}/welcome`;
    window.location.href = `${portal}/api/havruta/handoff?return_to=${encodeURIComponent(back)}`;
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const email = f.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("올바른 이메일을 입력해주세요.");
    if (email.includes("@invite.")) return setError("사용할 수 없는 이메일입니다.");
    if (f.pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (f.pw !== f.pw2) return setError("비밀번호가 서로 다릅니다.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email, password: f.pw });
    setBusy(false);
    if (error) return setError(error.message);
    setLinkedEmail(email);
    setStep("manualDone");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-md p-8 pop-in flex flex-col gap-4">
        {step === "loading" && <p className="text-center text-[var(--text-soft)] py-10">확인 중…</p>}
        {step === "linking" && <p className="text-center text-[var(--text-soft)] py-10">하브루타 계정과 연결하는 중…</p>}

        {step === "choose" && (
          <>
            <div className="text-center">
              <span className="text-4xl">🔐</span>
              <h1 className="text-xl font-black text-[var(--color-brand-800)] mt-2">로그인 계정을 만들어 두세요</h1>
              <p className="text-sm text-[var(--text-soft)] mt-2 leading-relaxed">
                지금은 초대 링크로만 접속할 수 있어요.<br />
                계정을 만들어 두면 <b>다음에도, 다른 기기에서도</b> 로그인할 수 있습니다.
              </p>
            </div>
            {error && (
              <p className="badge w-full justify-center py-2 whitespace-normal"
                 style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
            )}
            <button onClick={havrutaConnect} className="btn btn-primary w-full !min-h-14">
              🔗 하브루타 계정으로 연결 (권장)
            </button>
            <p className="text-xs text-[var(--text-soft)] text-center -mt-2">
              하브루타 통합 로그인 — 한 계정으로 모든 하브루타 앱을 사용합니다.
            </p>
            <button onClick={() => { setError(null); setStep("manual"); }} className="btn btn-ghost w-full">
              ✉️ 이메일·비밀번호로 직접 만들기
            </button>
            <a href="/home" className="text-center text-sm text-[var(--text-soft)] underline py-1">
              나중에 하기 — 지금은 그냥 시작
            </a>
          </>
        )}

        {step === "manual" && (
          <>
            <h1 className="text-lg font-black text-[var(--color-brand-800)] text-center">이메일·비밀번호 설정</h1>
            <form onSubmit={submitManual} className="flex flex-col gap-3">
              <input className="input" type="email" placeholder="본인 이메일" value={f.email}
                     onChange={(e) => setF({ ...f, email: e.target.value })} />
              <input className="input" type="password" placeholder="비밀번호 (8자 이상)" value={f.pw}
                     onChange={(e) => setF({ ...f, pw: e.target.value })} />
              <input className="input" type="password" placeholder="비밀번호 확인" value={f.pw2}
                     onChange={(e) => setF({ ...f, pw2: e.target.value })} />
              {error && (
                <p className="badge w-full justify-center py-2 whitespace-normal"
                   style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
              )}
              <button className="btn btn-primary w-full" disabled={busy}>{busy ? "설정 중…" : "설정하기"}</button>
              <button type="button" className="btn btn-ghost w-full" onClick={() => { setError(null); setStep("choose"); }}>뒤로</button>
            </form>
          </>
        )}

        {step === "linked" && (
          <div className="text-center flex flex-col gap-4">
            <span className="text-4xl">🎉</span>
            <h1 className="text-xl font-black text-[var(--color-brand-800)]">계정 연결 완료!</h1>
            <p className="text-sm leading-relaxed">
              이제부터 로그인 화면의 <b>&ldquo;하브루타로 로그인&rdquo;</b> 버튼으로
              {linkedEmail && <><br /><b>{linkedEmail}</b> 계정을 통해</>} 언제든 접속할 수 있습니다.
            </p>
            <a href="/home" className="btn btn-primary w-full !min-h-14">시작하기</a>
          </div>
        )}

        {step === "manualDone" && (
          <div className="text-center flex flex-col gap-4">
            <span className="text-4xl">📮</span>
            <h1 className="text-xl font-black text-[var(--color-brand-800)]">확인 메일을 보냈어요</h1>
            <p className="text-sm leading-relaxed">
              비밀번호는 저장됐습니다.<br />
              <b>{linkedEmail}</b>의 받은편지함에서 확인 링크를 누르면,<br />
              다음부터 <b>이메일 + 비밀번호</b>로 로그인할 수 있습니다.
            </p>
            <a href="/home" className="btn btn-primary w-full !min-h-14">시작하기</a>
          </div>
        )}
      </div>
    </main>
  );
}
