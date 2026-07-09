/**
 * POST /api/havruta/link-invited — 초대 간편 계정(@invite.*)을 하브루타 ID(포털 계정)에 연결
 * 정본 §4.1 신원 계층 통합: 포털이 이메일을 이미 인증했으므로 그 이메일을 이 계정의 실이메일로 채택.
 *
 * 두 경로:
 *  A) 포털 이메일로 기존 ChurchThrive 계정이 없음 → 가상 계정의 이메일을 포털 이메일로 교체
 *     (user_id 불변 — 교적·역할·이력 전부 보존, 세션도 그대로 유효)
 *  B) 기존 계정이 있음(과거 별도 가입) → 교적·역할을 그 계정으로 이관(병합) 후 세션 전환.
 *     단, 그 계정에 같은 교회의 다른 교적이 이미 연결돼 있으면 409로 중단(담당자 안내).
 *
 * body: { token: string }  (포털 Supabase access token)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSSRClient } from "@/lib/supabase/server";
import { verifyHavrutaToken } from "@/lib/havruta-verify";

function svc() {
  return createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function activateWaitingAppointments(admin: ReturnType<typeof svc>, userId: string) {
  const { data: members } = await admin.from("members").select("id").eq("user_id", userId);
  for (const m of members ?? []) {
    const { data: appts } = await admin.from("role_appointments")
      .select("id").eq("member_id", m.id).eq("status", "waiting_account");
    for (const a of appts ?? []) {
      await admin.rpc("try_activate_role_appointment", { p_id: a.id });
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "token 필요" }, { status: 400 });
  }

  // 1) 현재 세션이 초대 간편 계정인지 확인
  const ssr = await createSSRClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const currentEmail = (user.email ?? "").toLowerCase();
  if (!currentEmail.includes("@invite.")) {
    return NextResponse.json({ error: "이미 일반 계정입니다. 로그인 페이지의 '하브루타로 로그인'을 이용하세요." }, { status: 400 });
  }

  // 2) 포털 토큰 검증 → havruta_id + 인증된 실이메일
  let havrutaId: string, email: string | null;
  try {
    ({ havrutaId, email } = await verifyHavrutaToken(token));
  } catch {
    return NextResponse.json({ error: "유효하지 않은 하브루타 토큰" }, { status: 401 });
  }
  if (!email || email.toLowerCase().includes("@invite.")) {
    return NextResponse.json({ error: "토큰에 사용할 수 있는 이메일이 없습니다" }, { status: 400 });
  }
  email = email.toLowerCase();

  const admin = svc();

  // 3) 포털 이메일의 기존 ChurchThrive 계정 유무 (magiclink 생성 시도 — SSO 브리지와 동일 판별 기법)
  const probe = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const existing = !probe.error && probe.data?.user ? probe.data.user : null;

  if (!existing || existing.id === user.id) {
    // ── A) 가상 계정의 이메일을 포털 이메일로 교체 (동일 user_id 유지) ──
    const { error: ue } = await admin.auth.admin.updateUserById(user.id, {
      email, email_confirm: true,
      user_metadata: { ...user.user_metadata, havruta_id: havrutaId },
    });
    if (ue) return NextResponse.json({ error: "계정 이메일 교체 실패: " + ue.message }, { status: 500 });

    // 교적 이메일 동기화(트리거가 인증 처리) + havruta_id 링크
    await admin.from("members").update({ email }).eq("user_id", user.id);
    await admin.from("members").update({ havruta_id: havrutaId }).eq("user_id", user.id).is("havruta_id", null);

    // 승인 완료·계정 연결 대기 중이던 임명 활성화
    await activateWaitingAppointments(admin, user.id);

    return NextResponse.json({ ok: true, mode: "linked", email });
  }

  // ── B) 병합: 포털 이메일 계정이 이미 존재 ──
  const { data: myMembers } = await admin.from("members").select("id, church_id").eq("user_id", user.id);
  if (!myMembers || myMembers.length === 0) {
    return NextResponse.json({ error: "연결된 교적이 없습니다. 교회 담당자에게 문의해주세요." }, { status: 400 });
  }
  const { data: theirMembers } = await admin.from("members").select("id, church_id").eq("user_id", existing.id);
  const myChurches = new Set(myMembers.map((m) => m.church_id));
  if ((theirMembers ?? []).some((t) => myChurches.has(t.church_id))) {
    return NextResponse.json({
      error: "이 이메일 계정에는 이미 같은 교회의 다른 교적이 연결되어 있습니다. 교회 담당자에게 교적 정리를 요청해주세요.",
    }, { status: 409 });
  }

  // 교적 이관 (user_id 변경 트리거: 이메일 동기화·인증 + 대기 임명 자동 활성화)
  const { error: me } = await admin.from("members")
    .update({ user_id: existing.id, email }).eq("user_id", user.id);
  if (me) return NextResponse.json({ error: "교적 이관 실패: " + me.message }, { status: 500 });
  await admin.from("members").update({ havruta_id: havrutaId }).eq("user_id", existing.id).is("havruta_id", null);

  // 역할·기능 담당 이관
  const { data: roles } = await admin.from("church_roles").select("church_id, role").eq("user_id", user.id);
  for (const r of roles ?? []) {
    await admin.from("church_roles").upsert(
      { church_id: r.church_id, user_id: existing.id, role: r.role },
      { onConflict: "church_id,user_id,role" });
  }
  await admin.from("church_roles").delete().eq("user_id", user.id);

  const { data: grants } = await admin.from("module_grants").select("church_id, module, level").eq("user_id", user.id);
  for (const g of grants ?? []) {
    await admin.from("module_grants").upsert(
      { church_id: g.church_id, module: g.module, level: g.level, user_id: existing.id },
      { onConflict: "church_id,user_id,module" });
  }
  await admin.from("module_grants").delete().eq("user_id", user.id);

  await admin.from("active_church").upsert(
    { user_id: existing.id, church_id: myMembers[0].church_id }, { onConflict: "user_id" });

  // 가상 계정 정지 (참조 무결성 보존을 위해 삭제 대신 장기 밴)
  await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });

  // 세션을 실계정으로 전환 (SSO 브리지와 동일: magiclink hashed_token → verifyOtp)
  const gen = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = gen.data?.properties?.hashed_token;
  if (gen.error || !tokenHash) {
    return NextResponse.json({ error: "병합은 완료됐지만 세션 전환에 실패했습니다. 다시 로그인해주세요.", mode: "merged" }, { status: 500 });
  }
  const { error: otpErr } = await ssr.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (otpErr) {
    return NextResponse.json({ error: "병합은 완료됐지만 세션 전환에 실패했습니다. 다시 로그인해주세요.", mode: "merged" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "merged", email });
}
