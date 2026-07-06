import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/** 교회 등록 신청 (계정 불필요 — 공개 폼) */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const required = ["name", "slug", "denomination", "pastor_name", "contact_phone", "applicant_email"];
  if (!b || required.some((k) => !String(b[k] ?? "").trim())) {
    return NextResponse.json({ error: "필수 항목이 비어 있습니다." }, { status: 400 });
  }
  if (!/^[a-z0-9-]{2,32}$/.test(b.slug)) {
    return NextResponse.json({ error: "영문 주소는 소문자·숫자·하이픈 2~32자입니다." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.applicant_email)) {
    return NextResponse.json({ error: "이메일 형식을 확인해주세요." }, { status: 400 });
  }
  const svc = createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  // 중복 방지: 같은 slug의 대기 신청 또는 기존 교회
  const [{ data: dupApp }, { data: dupChurch }] = await Promise.all([
    svc.from("church_applications").select("id").eq("slug", b.slug).eq("status", "pending").maybeSingle(),
    svc.from("churches").select("id").eq("slug", b.slug).maybeSingle(),
  ]);
  if (dupApp || dupChurch) {
    return NextResponse.json({ error: "이미 사용 중이거나 심사 중인 영문 주소입니다." }, { status: 409 });
  }
  const { error } = await svc.from("church_applications").insert({
    name: String(b.name).trim(), slug: b.slug,
    denomination: String(b.denomination).trim(), pastor_name: String(b.pastor_name).trim(),
    contact_phone: String(b.contact_phone).trim(), applicant_email: String(b.applicant_email).trim().toLowerCase(),
    address: b.address || null, member_size: b.member_size || null, intro: b.intro || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
