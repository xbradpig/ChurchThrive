/**
 * POST /api/havruta/sso — "하브루타로 로그인" 브리지 (추가형 연합 로그인)
 * 포털(Havruta ID) 토큰을 받아 검증 → ChurchThrive 세션을 확립하고 교인과 havruta_id 링크.
 * 기존 이메일/비번 로그인은 그대로 유지(리핑 아님). 정본 §4.1.
 *
 * body: { token: string }  (포털 Supabase access token)
 * 성공 시 ChurchThrive 세션 쿠키 설정 + { ok, havruta_id, redirect }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSSRClient } from "@/lib/supabase/server";
import { verifyHavrutaToken } from "@/lib/havruta-verify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "token 필요" }, { status: 400 });
  }

  // 1) 포털 토큰 검증 → havruta_id + email
  let havrutaId: string, email: string | null;
  try {
    ({ havrutaId, email } = await verifyHavrutaToken(token));
  } catch {
    return NextResponse.json({ error: "유효하지 않은 하브루타 토큰" }, { status: 401 });
  }
  if (!email) {
    return NextResponse.json({ error: "토큰에 이메일이 없어 계정 확립 불가" }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 2) ChurchThrive auth 사용자 확보(없으면 생성) + magiclink 발급
  let gen = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (gen.error || !gen.data?.user) {
    await admin.auth.admin.createUser({ email, email_confirm: true });
    gen = await admin.auth.admin.generateLink({ type: "magiclink", email });
  }
  if (gen.error || !gen.data?.user || !gen.data.properties?.hashed_token) {
    return NextResponse.json({ error: "세션 발급 실패" }, { status: 500 });
  }
  const ctUserId = gen.data.user.id;
  const tokenHash = gen.data.properties.hashed_token;

  // 3) 세션 확립 (SSR 클라이언트 verifyOtp → ChurchThrive 쿠키 설정)
  const supabase = await createSSRClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (otpErr) {
    return NextResponse.json({ error: "세션 확립 실패: " + otpErr.message }, { status: 500 });
  }

  // 4) 교인 ↔ havruta_id 링크 (이 계정에 연결된 교인이 있으면). 다중 교회/역할은 기존대로 유지.
  await admin.from("members").update({ havruta_id: havrutaId }).eq("user_id", ctUserId).is("havruta_id", null);

  return NextResponse.json({ ok: true, havruta_id: havrutaId, redirect: "/home" });
}
