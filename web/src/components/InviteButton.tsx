"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** 교인 앱 초대 (담당자 이상) — 링크 생성 → 복사 / 문자 앱으로 바로 전송 */
export default function InviteButton({ memberId, memberName, phone }:
  { memberId: string; memberName: string; phone?: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function makeInvite() {
    setError(null);
    const { data, error } = await supabase.rpc("create_member_invite", { p_member: memberId });
    if (error) return setError(error.message);
    setLink(`${window.location.origin}/invite/${data}`);
  }

  const smsBody = link
    ? encodeURIComponent(`[${memberName}님] 우리 교회 앱 초대장입니다. 아래 주소를 눌러주세요 ✝\n${link}`)
    : "";

  if (!link) {
    return (
      <div>
        <button onClick={makeInvite} className="btn btn-ghost !min-h-11 text-sm" data-invite>
          📲 앱 초대 링크 만들기
        </button>
        {error && <p className="text-sm mt-1" style={{ color: "var(--color-danger)" }}>{error}</p>}
      </div>
    );
  }
  return (
    <div className="card p-4 flex flex-col gap-2 mt-2" data-invite-link>
      <p className="text-sm font-bold">초대 링크가 준비됐어요 (7일 유효)</p>
      <code className="text-xs break-all bg-[var(--surface-soft)] p-2 rounded-lg">{link}</code>
      <div className="flex gap-2">
        <button className="btn btn-primary !min-h-11 text-sm flex-1"
                onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }}>
          {copied ? "✅ 복사됨" : "링크 복사"}
        </button>
        <a className="btn btn-ghost !min-h-11 text-sm flex-1"
           href={`sms:${phone ?? ""}${/iPhone|iPad/.test(navigator.userAgent) ? "&" : "?"}body=${smsBody}`}>
          💬 문자로 보내기
        </a>
      </div>
      <p className="text-xs text-[var(--text-soft)]">
        어르신은 문자의 링크를 눌러 <b>시작하기 버튼 한 번</b>이면 끝 — 이메일·비밀번호가 필요 없습니다.
      </p>
    </div>
  );
}
