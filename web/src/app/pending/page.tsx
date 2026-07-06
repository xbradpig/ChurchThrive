import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** 교회 승인 대기/거절 안내 */
export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: status }, { data: church }] = await Promise.all([
    supabase.rpc("my_church_status"),
    supabase.from("churches").select("name, review_note").limit(1).maybeSingle(),
  ]);
  if (status === "active") redirect("/home");

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 text-center flex flex-col gap-4 pop-in">
        {status === "rejected" ? (
          <>
            <span className="text-4xl">🙏</span>
            <b className="text-lg">등록이 승인되지 않았습니다</b>
            <p className="text-sm text-[var(--text-soft)]">
              {church?.review_note || "등록 정보를 확인할 수 없었습니다."}<br />
              문의: hello@havrutaproject.org
            </p>
          </>
        ) : (
          <>
            <span className="text-4xl">⏳</span>
            <b className="text-lg">{church?.name} — 승인 대기 중</b>
            <p className="text-sm text-[var(--text-soft)] leading-relaxed">
              등록해주셔서 감사합니다!<br />
              건강한 교회 생태계를 위해 등록 정보를 확인하고 있습니다.<br />
              <b>보통 1일 이내</b>에 승인되며, 승인 즉시 모든 기능이 열립니다.
            </p>
          </>
        )}
        <Link href="/login" className="btn btn-ghost text-sm">다른 계정으로 로그인</Link>
      </div>
    </main>
  );
}
