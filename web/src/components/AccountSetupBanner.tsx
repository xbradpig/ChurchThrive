import Link from "next/link";

/** 초대 간편 계정(@invite.*) 사용자에게 로그인 계정 설정을 유도하는 배너 (invite-account-setup) */
export default function AccountSetupBanner({ email }: { email?: string | null }) {
  if (!email || !email.includes("@invite.")) return null;
  return (
    <Link href="/welcome" className="card p-4 flex items-center gap-3"
          style={{ borderColor: "var(--color-caution)" }} data-widget="account-setup-banner">
      <span className="text-2xl shrink-0">🔐</span>
      <span className="min-w-0 flex-1">
        <b className="block">로그인 계정을 만들어 두세요</b>
        <span className="text-sm text-[var(--text-soft)]">
          지금은 초대 링크로만 접속돼요. 계정을 연결하면 다음에도, 다른 기기에서도 로그인할 수 있습니다.
        </span>
      </span>
      <span className="btn btn-primary !min-h-9 !px-3 text-sm shrink-0">설정하기</span>
    </Link>
  );
}
