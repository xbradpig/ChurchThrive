"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

export default function AccountSettingsCard({ email }: { email?: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [nextEmail, setNextEmail] = useState(email?.includes("@invite.") ? "" : email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function updateEmail() {
    const normalized = nextEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return notify("올바른 이메일을 입력해주세요.");
    if (normalized === email?.toLowerCase()) return notify("변경된 이메일이 없습니다.");

    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser(
      { email: normalized },
      { emailRedirectTo: `${window.location.origin}/login` }
    );
    setEmailBusy(false);

    if (error) return notify(error.message, "error");
    notify("확인 메일을 보냈습니다. 새 이메일에서 확인 링크를 눌러야 계정 이메일이 변경됩니다.");
  }

  async function updatePassword() {
    if (!PASSWORD_RE.test(password)) {
      return notify("비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.");
    }
    if (password !== confirmPassword) return notify("비밀번호가 일치하지 않습니다.");

    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordBusy(false);

    if (error) return notify(error.message, "error");
    setPassword("");
    setConfirmPassword("");
    notify("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
  }

  return (
    <div className="card p-5 flex flex-col gap-4 pop-in" data-widget="account-settings">
      <div>
        <h2 className="font-black text-lg text-[var(--color-brand-800)]">계정 설정</h2>
        <p className="text-sm text-[var(--text-soft)] mt-1">
          ChurchThrive 로그인과 Havruta Project 공통 계정에 함께 적용됩니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">로그인 이메일</span>
          <input
            className="input"
            type="email"
            value={nextEmail}
            onChange={(event) => setNextEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <button className="btn btn-ghost !min-h-10 text-sm" disabled={emailBusy} onClick={updateEmail}>
          {emailBusy ? "메일 발송 중…" : "이메일 변경 확인 메일 보내기"}
        </button>
        <p className="text-xs text-[var(--text-soft)]">
          교적 카드에 표시되는 이메일은 개인정보 항목이라, 위의 “내 정보 수정 요청”에서 별도로 요청하면 담당자 승인 후 반영됩니다.
        </p>
      </div>

      <div className="h-px bg-[var(--line)]" />

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">새 비밀번호</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="영문, 숫자 포함 8자 이상"
            autoComplete="new-password"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">새 비밀번호 확인</span>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="비밀번호를 다시 입력해주세요"
            autoComplete="new-password"
          />
        </label>
        <button className="btn btn-primary !min-h-10 text-sm" disabled={passwordBusy} onClick={updatePassword}>
          {passwordBusy ? "변경 중…" : "비밀번호 변경"}
        </button>
      </div>
    </div>
  );
}
