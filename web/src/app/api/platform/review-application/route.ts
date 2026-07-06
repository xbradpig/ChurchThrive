import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * 신청 심사 (플랫폼 운영자 세션 필요)
 * 승인: 교회 생성(RPC) → 신청자 이메일로 가입 초대 메일 → 관리자 역할 사전 바인딩
 */
export async function POST(req: NextRequest) {
  const { application_id, approve, note } = await req.json().catch(() => ({}));
  if (!application_id) return NextResponse.json({ error: "application_id 필요" }, { status: 400 });

  const session = await createClient();
  const { data: isPa } = await session.rpc("is_platform_admin");
  if (!isPa) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  if (!approve) {
    const { error } = await session.rpc("reject_application",
      { p_app: application_id, p_note: note ?? "등록 정보를 확인할 수 없습니다" });
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  }

  const { data: result, error: e1 } = await session.rpc("approve_application", { p_app: application_id });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  const svc = createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://church.havrutaproject.org";
  const email = result.email as string;

  // 가입 초대 메일 (계정이 이미 있으면 매직링크로 대체)
  let uid: string | null = null;
  const { data: invited, error: ie } = await svc.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/set-password`,
  });
  if (ie && /already/i.test(ie.message)) {
    const { data: list } = await svc.auth.admin.listUsers();
    uid = list.users.find((u) => u.email === email)?.id ?? null;
    await svc.auth.admin.generateLink({ type: "magiclink", email,
      options: { redirectTo: `${origin}/login` } });
  } else if (ie) {
    return NextResponse.json({ error: "교회는 생성됐지만 메일 발송 실패: " + ie.message }, { status: 500 });
  } else {
    uid = invited.user.id;
  }

  // 관리자 역할 사전 바인딩 — 메일 링크로 들어오는 즉시 관리자
  if (uid) {
    await svc.from("church_roles").upsert(
      { church_id: result.church_id, user_id: uid, role: "superadmin" },
      { onConflict: "church_id,user_id,role" });
    await svc.from("active_church").upsert({ user_id: uid, church_id: result.church_id });
  }
  return NextResponse.json({ ok: true, church: result.church_name });
}
