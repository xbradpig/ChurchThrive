import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** 가입 직후 갈림길: 교회 만들기 vs 기존 교회 가입 신청 */
export default async function StartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: roles } = await supabase.from("church_roles").select("church_id").limit(1);
  if (roles?.length) redirect("/home");   // 이미 소속 있음

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xl font-black text-center text-[var(--color-brand-800)]">어떻게 시작할까요?</h1>
        <Link href="/register-church" className="card p-6 flex items-center gap-4 hover:shadow-[var(--shadow-card-hover)]">
          <span className="text-3xl">⛪</span>
          <span><b className="text-lg">새 교회 등록</b>
            <span className="block text-sm text-[var(--text-soft)]">우리 교회 공간을 만듭니다 (관리자가 됩니다)</span></span>
        </Link>
        <Link href="/join" className="card p-6 flex items-center gap-4 hover:shadow-[var(--shadow-card-hover)]">
          <span className="text-3xl">🙋</span>
          <span><b className="text-lg">기존 교회 가입</b>
            <span className="block text-sm text-[var(--text-soft)]">이미 등록된 우리 교회에 가입 신청합니다</span></span>
        </Link>
      </div>
    </main>
  );
}
