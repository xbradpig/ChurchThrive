import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";
import { MODULES } from "@/modules/registry";
import AppFrame from "@/components/AppFrame";
import LogoutButton from "@/components/LogoutButton";

/** 동적 전체 메뉴 = registry × church_modules × (역할 ∪ module_grants) — ia-menu-structure.md */
export default async function MenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: role }, { data: mods }, { data: grants }, { data: church }] = await Promise.all([
    supabase.rpc("my_role"),
    supabase.from("church_modules").select("module, enabled"),
    supabase.from("module_grants").select("module, level").eq("user_id", user.id),
    supabase.from("churches").select("name").limit(1).maybeSingle(),
  ]);
  const r = (role as AppRole) ?? "member";
  const isChurchStaff = r === "superadmin" || r === "pastor";
  const enabled = new Set((mods ?? []).filter((m) => m.enabled).map((m) => m.module));
  const myGrants = new Map((grants ?? []).map((g) => [g.module, g.level]));

  type Item = { href: string; icon: string; title: string; desc: string; admin?: boolean };
  const items: Item[] = [];

  for (const m of MODULES) {
    const installed = m.core || enabled.has(m.key);
    if (!installed) continue;
    const grant = myGrants.get(m.key);
    const canUse = m.core ? true
      : isChurchStaff || r === "dept_leader" || !!grant || (m.memberVisible ?? false);
    const canAdmin = isChurchStaff || grant === "admin";
    const canOperate = isChurchStaff || grant === "admin" || grant === "manager" || (m.key === "attendance" && r === "checker");

    if (m.key === "core") {
      items.push({ href: "/me", icon: "📇", title: "내 교적", desc: "내 정보 확인 · 수정 · 내 QR · 공개 동의" });
      continue;
    }
    if (m.key === "attendance" && canOperate) {
      items.push({ href: "/check", icon: "✅", title: "출석 체크", desc: "ㄱ~ㅎ 카드 체크 · 신규 등록" });
      items.push({ href: "/scan", icon: "📷", title: "QR 스캔", desc: "교인 QR 스캔 즉시 출석" });
    }
    if (m.key === "verse" && canUse) {
      items.push({ href: "/m/verse", icon: "📖", title: "말씀 암송", desc: "이번 주 구절 · 암송 체크" });
    }
    if (m.key === "verse" && canAdmin) {
      items.push({ href: "/m/verse/admin", icon: "📖", title: "말씀 암송 관리", desc: "구절 등록 · 암송률 현황", admin: true });
    }
  }

  const opsItems: Item[] = [];
  if (isChurchStaff || r === "dept_leader") {
    opsItems.push({ href: "/church", icon: "🏛", title: "교회 관리", desc: "명부 · 부서 · 통계 · 권한 · 설정", admin: true });
    opsItems.push({ href: "/invites", icon: "📲", title: "교인 초대", desc: "문자 링크 · QR로 앱 초대", admin: true });
  }
  if (r === "superadmin") {
    opsItems.push({ href: "/store", icon: "🏪", title: "마켓 스토어", desc: "교회 기능 설치 · 해지 · 구독", admin: true });
  }
  const { data: isPa } = await supabase.rpc("is_platform_admin");
  if (isPa) {
    opsItems.push({ href: "/platform", icon: "🛠", title: "플랫폼 운영", desc: "교회 심사 · 감사 기록 (별도 공간)", admin: true });
  }

  return (
    <AppFrame title="전체 메뉴" isStaff={r !== "member"}>
      <div className="flex flex-col gap-3">
        <p className="text-[var(--text-soft)] px-1">
          <b>{church?.name}</b> · {ROLE_LABEL[r]}
          {myGrants.size > 0 && ` · 담당 ${[...myGrants.keys()].length}개 기능`}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
        {items.map((m, i) => (
          <Link key={i} href={m.href}
                className="card p-5 flex items-center gap-4 hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <span className="text-3xl w-12 text-center">{m.icon}</span>
            <span className="min-w-0">
              <b className="text-lg text-[var(--color-brand-800)]">
                {m.title}
                {m.admin && <span className="badge ml-2" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>관리</span>}
              </b>
              <span className="block text-sm text-[var(--text-soft)]">{m.desc}</span>
            </span>
            <span className="ml-auto text-[var(--color-brand-300)] text-xl">›</span>
          </Link>
        ))}
        </div>
        {opsItems.length > 0 && (
          <>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] px-1 mt-4">
              운영 도구 — 관리 화면으로 전환
            </p>
            <div className="grid gap-3 md:grid-cols-2">
            {opsItems.map((m, i) => (
              <Link key={"ops" + i} href={m.href}
                    className="card p-5 flex items-center gap-4 hover:shadow-[var(--shadow-card-hover)] transition-shadow"
                    style={{ borderColor: "var(--color-accent)" }}>
                <span className="text-3xl w-12 text-center">{m.icon}</span>
                <span className="min-w-0">
                  <b className="text-lg text-[var(--color-brand-800)]">{m.title}</b>
                  <span className="block text-sm text-[var(--text-soft)]">{m.desc}</span>
                </span>
                <span className="ml-auto text-[var(--color-brand-300)] text-xl">›</span>
              </Link>
            ))}
            </div>
          </>
        )}
        <LogoutButton />
      </div>
    </AppFrame>
  );
}
