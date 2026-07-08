import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cfConfigured, createCustomHostname, getCustomHostname, deleteCustomHostname, mapStatus } from "@/lib/cloudflare";

/**
 * 교회 커스텀 도메인 관리 (custom-domain 6단계) — superadmin 전용.
 * 인증: 쿠키 세션. 실제 DB write는 RPC(SECURITY DEFINER + superadmin 재확인)로.
 * CF 미설정 시 등록은 pending_dns까지만 저장하고 안내.
 */
async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = user ? await supabase.rpc("my_role") : { data: null };
  return { supabase, user, isAdmin: role === "superadmin" };
}

// 등록: 도메인 저장(pending_dns) → CF 설정 시 custom hostname 생성 + DNS 안내
export async function POST(req: NextRequest) {
  const { supabase, user, isAdmin } = await ctx();
  if (!user || !isAdmin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const b = await req.json().catch(() => null);
  const domain = String(b?.domain ?? "").trim().toLowerCase();
  if (!domain) return NextResponse.json({ error: "도메인을 입력해주세요." }, { status: 400 });

  const { error } = await supabase.rpc("set_custom_domain", { p_domain: domain });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!cfConfigured()) {
    return NextResponse.json({
      status: "pending_dns",
      note: "도메인이 저장되었습니다. Cloudflare 연동이 설정되면 인증서 발급이 자동 진행됩니다. (플랫폼 관리자 확인 필요)",
      records: [],
    });
  }
  const hn = await createCustomHostname(domain);
  if ("error" in hn) return NextResponse.json({ error: hn.error }, { status: 502 });
  await supabase.rpc("set_custom_domain_state", { p_status: "verifying", p_cf_id: hn.id });
  return NextResponse.json({ status: "verifying", records: hn.records });
}

// 상태 조회 + CF에서 최신 상태 폴링 → active면 반영
export async function GET() {
  const { supabase, user, isAdmin } = await ctx();
  if (!user || !isAdmin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const { data: p } = await supabase.rpc("get_church_profile");
  const prof = p as { custom_domain?: string; custom_domain_status?: string; custom_domain_cf_id?: string } | null;
  if (!prof?.custom_domain) return NextResponse.json({ status: "none" });

  let status = prof.custom_domain_status ?? "pending_dns";
  let records: unknown[] = [];
  if (prof.custom_domain_cf_id && cfConfigured() && status !== "active") {
    const hn = await getCustomHostname(prof.custom_domain_cf_id);
    if (!("error" in hn)) {
      status = mapStatus(hn);
      records = hn.records;
      await supabase.rpc("set_custom_domain_state", { p_status: status });
    }
  }
  return NextResponse.json({ domain: prof.custom_domain, status, records });
}

// 해제: CF custom hostname 삭제 + DB 초기화
export async function DELETE() {
  const { supabase, user, isAdmin } = await ctx();
  if (!user || !isAdmin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const { data: p } = await supabase.rpc("get_church_profile");
  const cfId = (p as { custom_domain_cf_id?: string } | null)?.custom_domain_cf_id;
  if (cfId && cfConfigured()) await deleteCustomHostname(cfId);
  const { error } = await supabase.rpc("clear_custom_domain");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ status: "none" });
}
