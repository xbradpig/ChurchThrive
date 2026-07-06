"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/roles";

const NAV: { href: string; label: string; roles: AppRole[] }[] = [
  { href: "/check", label: "출석 체크", roles: ["superadmin", "pastor", "dept_leader", "checker"] },
  { href: "/scan", label: "QR 스캔", roles: ["superadmin", "pastor", "dept_leader", "checker"] },
  { href: "/admin", label: "대시보드", roles: ["superadmin", "pastor", "dept_leader"] },
  { href: "/store", label: "스토어", roles: ["superadmin"] },
  { href: "/me", label: "내 교적", roles: ["superadmin", "pastor", "dept_leader", "checker", "member"] },
];

export default function AppHeader({ role, title }: { role: AppRole; title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-[var(--color-brand-900)] text-white">
      <Link href="/menu" className="flex items-center gap-2 mr-auto" title="전체 메뉴">
        <span className="text-[var(--color-accent)] font-black">✝</span>
        <h1 className="font-black text-lg">{title}</h1>
        <span className="text-xs opacity-60 font-bold border border-white/30 rounded-md px-1.5 py-0.5">메뉴</span>
      </Link>
      <nav className="flex gap-1 overflow-x-auto">
        {NAV.filter((n) => n.roles.includes(role)).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${
              pathname.startsWith(n.href) ? "bg-white/20" : "opacity-75 hover:opacity-100"
            }`}
          >
            {n.label}
          </Link>
        ))}
        <button onClick={logout} className="px-3 py-1.5 rounded-lg text-sm font-bold opacity-60 hover:opacity-100">
          나가기
        </button>
      </nav>
    </header>
  );
}
