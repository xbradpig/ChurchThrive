"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // 서버(내부 URL)와 브라우저(공개 URL)의 호스트가 달라도 세션을 공유하도록 쿠키 이름 고정
    { cookieOptions: { name: "sb-churchthrive-auth" } }
  );
}
