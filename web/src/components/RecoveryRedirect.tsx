"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 비밀번호 재설정(recovery) 토큰이 어느 경로로 떨어지든(루트·/join 등)
 * 무조건 비번 변경 폼(/reset-password)으로 보낸다.
 * — 옛 메일이 site_url(루트)로 리다이렉트되거나, 이미 로그인된 세션 때문에
 *   /join 등으로 튕기는 문제를 방지. (로그인 상태여도 recovery면 비번 변경 우선)
 */
export default function RecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/reset-password")) return;

    // 1) URL 프래그먼트에 recovery 토큰이 있으면 즉시 이동 (해시 보존 하드 내비게이션)
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      window.location.replace("/reset-password" + window.location.hash);
      return;
    }

    // 2) supabase가 recovery 토큰을 감지하면 발생하는 이벤트로도 이동 (해시가 이미 소비된 경우 대비)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") router.replace("/reset-password");
    });
    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
