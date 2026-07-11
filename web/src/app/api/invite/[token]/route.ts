import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * 초대 수락 — 이메일·비밀번호 없이 어르신을 앱 사용자로
 * 절차: 토큰 검증 → 가상 이메일 계정 생성/조회 → 교적·역할 연결 → 매직링크로 즉시 로그인
 * (문자로 받은 링크 하나로 끝 — Supabase 세션은 PWA에서 장기 유지)
 */
function svc() {
  return createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const s = svc();

  const { data: inv } = await s.from("member_invites")
    .select("church_id, member_id, expires_at").eq("token", token).maybeSingle();
  if (!inv || new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: "초대가 만료되었거나 유효하지 않습니다. 교회에 다시 요청해주세요." }, { status: 400 });
  }

  const { data: member } = await s.from("members")
    .select("id, name, name_suffix, user_id").eq("id", inv.member_id).single();

  // 가상 이메일 계정 (교인당 1개, 재사용)
  const email = `m-${member!.id}@invite.havrutaproject.org`;
  let uid = member!.user_id as string | null;
  if (!uid) {
    const { data: created, error: ce } = await s.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { invited_member: member!.id },
    });
    if (ce && !/already/i.test(ce.message)) {
      return NextResponse.json({ error: ce.message }, { status: 500 });
    }
    uid = created?.user?.id
      ?? (await s.auth.admin.listUsers()).data.users.find((u) => u.email === email)?.id ?? null;
    if (!uid) return NextResponse.json({ error: "계정 생성 실패" }, { status: 500 });
    await s.from("members").update({ user_id: uid }).eq("id", member!.id);
  }
  await s.from("church_roles").upsert(
    { church_id: inv.church_id, user_id: uid, role: "member" }, { onConflict: "church_id,user_id,role" });
  await s.from("active_church").upsert({ user_id: uid, church_id: inv.church_id });
  await s.from("member_invites").update({ used_at: new Date().toISOString() }).eq("token", token);

  // 매직링크 생성 → 클라이언트가 이동하면 세션 성립
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://church-thrive.org";
  const { data: link, error: le } = await s.auth.admin.generateLink({
    type: "magiclink", email, options: { redirectTo: `${origin}/login` },   // 허용 목록 무관하게 도달 — 로그인 페이지가 토큰 수용
  });
  if (le || !link) return NextResponse.json({ error: le?.message ?? "링크 생성 실패" }, { status: 500 });
  return NextResponse.json({ action_link: link.properties.action_link, name: member!.name + member!.name_suffix });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  // 수락 페이지용 정보 (이름·교회명·유효성만)
  const { token } = await ctx.params;
  const s = svc();
  const { data: inv } = await s.from("member_invites")
    .select("church_id, member_id, expires_at").eq("token", token).maybeSingle();
  if (!inv || new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ valid: false });
  }
  const [{ data: m }, { data: c }] = await Promise.all([
    s.from("members").select("name, name_suffix").eq("id", inv.member_id).single(),
    s.from("churches").select("name").eq("id", inv.church_id).single(),
  ]);
  return NextResponse.json({ valid: true, name: m!.name + m!.name_suffix, church: c!.name });
}
