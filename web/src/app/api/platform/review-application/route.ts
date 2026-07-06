import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * 신청 심사 (플랫폼 운영자 세션 필요)
 * 승인: 교회 생성(RPC) → 신청자 이메일로 가입 초대 메일 → 관리자 역할 사전 바인딩
 */
/** 초대 메일 시도 → 한도 초과 시 계정만 생성하고 예비 링크 반환 (처리 자체는 실패하지 않음) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureUser(svc: any, email: string, redirect: string) {
  let uid: string | null = null, mailSent = false;
  const { data: inv, error: ie } = await svc.auth.admin.inviteUserByEmail(email, { redirectTo: redirect });
  if (!ie) { uid = inv.user.id; mailSent = true; }
  else if (/already/i.test(ie.message)) {
    const { data: list } = await svc.auth.admin.listUsers();
    uid = list.users.find((u: { email?: string; id: string }) => u.email === email)?.id ?? null;
  } else {
    const { data: created, error: ce } = await svc.auth.admin.createUser({ email, email_confirm: true });
    if (ce && !/already/i.test(ce.message)) throw new Error(ce.message);
    uid = created?.user?.id
      ?? (await svc.auth.admin.listUsers()).data.users.find((u: { email?: string; id: string }) => u.email === email)?.id ?? null;
  }
  if (!uid) throw new Error("계정 생성/확인 실패");
  const { data: link } = await svc.auth.admin.generateLink({ type: "magiclink", email,
    options: { redirectTo: redirect } });
  return { uid, mailSent, actionLink: link?.properties?.action_link ?? null };
}

const ROLE_MAP: Record<string, string> = {
  "담임목사": "superadmin", "담당 관리자": "superadmin",
  "교역자": "pastor", "부서 담당자": "dept_leader",
};

export async function POST(req: NextRequest) {
  const { application_id, approve, note, link_church_id } = await req.json().catch(() => ({}));
  if (!application_id) return NextResponse.json({ error: "application_id 필요" }, { status: 400 });

  const session = await createClient();
  const { data: isPa } = await session.rpc("is_platform_admin");
  if (!isPa) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  // 기존 교회에 담당자로 연결 (중복 교회 생성 대신 — 담당자 확인 후 사용)
  if (link_church_id) {
    const svc0 = createServiceClient(
      process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data: app } = await svc0.from("church_applications")
      .select("applicant_email, applicant_role, name").eq("id", application_id).eq("status", "pending").maybeSingle();
    if (!app) return NextResponse.json({ error: "대기 중인 신청이 아닙니다" }, { status: 400 });
    const origin0 = process.env.NEXT_PUBLIC_SITE_URL ?? "https://church.havrutaproject.org";
    let ensured;
    try { ensured = await ensureUser(svc0, app.applicant_email, `${origin0}/set-password`); }
    catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
    const uid = ensured.uid;
    const role = ROLE_MAP[app.applicant_role] ?? "superadmin";
    await svc0.from("church_roles").upsert({ church_id: link_church_id, user_id: uid, role },
      { onConflict: "church_id,user_id,role" });
    await svc0.from("active_church").upsert({ user_id: uid, church_id: link_church_id });
    await svc0.from("church_applications").update({ status: "approved", church_id: link_church_id,
      review_note: `기존 교회 연결 (${app.applicant_role} → ${role})` }).eq("id", application_id);
    await svc0.from("audit_log").insert({ action: "application_link_existing",
      target_table: "church_applications", target_id: application_id,
      after_json: { email: app.applicant_email, role }, church_id: link_church_id });
    return NextResponse.json({ ok: true, linked: true, role,
      mail_sent: ensured.mailSent, action_link: ensured.mailSent ? null : ensured.actionLink });
  }

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
  let ensured;
  try { ensured = await ensureUser(svc, email, `${origin}/set-password`); }
  catch (err) { return NextResponse.json({ error: "교회는 생성됐지만 계정 처리 실패: " + String(err) }, { status: 500 }); }
  const uid = ensured.uid;

  // 관리자 역할 사전 바인딩 — 메일 링크로 들어오는 즉시 관리자
  if (uid) {
    await svc.from("church_roles").upsert(
      { church_id: result.church_id, user_id: uid, role: "superadmin" },
      { onConflict: "church_id,user_id,role" });
    await svc.from("active_church").upsert({ user_id: uid, church_id: result.church_id });
  }
  return NextResponse.json({ ok: true, church: result.church_name,
    mail_sent: ensured.mailSent, action_link: ensured.mailSent ? null : ensured.actionLink });
}
