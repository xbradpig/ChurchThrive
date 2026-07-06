import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import path from "node:path";

/**
 * 교인 사진 인증 서빙 (Workers 호환)
 *  ①로그인 ②그 사진의 교인이 내 활성 교회 소속 (테넌트 격리)
 *  기본: Supabase Storage 서명 URL(60초)로 302 — 파일시스템 불필요
 *  로컬 Docker: PHOTOS_LOCAL=1 이면 컨테이너 내 파일 직접 서빙 (fs 동적 import)
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const safe = path.basename(decodeURIComponent(file));   // 경로 탈출 차단

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  // 내 교회의 교인 사진인지 확인 (RLS 무관하게 명시 검증)
  const { data: churchId } = await supabase.rpc("my_church_id");
  const { data: owner } = await supabase
    .from("members")
    .select("id")
    .eq("photo_url", `/api/photos/${encodeURIComponent(safe)}`)
    .eq("church_id", churchId)
    .maybeSingle();
  if (!owner) return new NextResponse("not found", { status: 404 });

  if (process.env.PHOTOS_LOCAL === "1") {
    // 로컬 Docker: 파일시스템 서빙 (Workers 경로에서는 실행되지 않음)
    try {
      const { readFile } = await import("node:fs/promises");
      const buf = await readFile(path.join(process.cwd(), "photos-secure", safe));
      const ext = safe.split(".").pop()?.toLowerCase();
      return new NextResponse(new Uint8Array(buf), {
        headers: { "Content-Type": ext === "png" ? "image/png" : "image/jpeg",
                   "Cache-Control": "private, max-age=3600" },
      });
    } catch { return new NextResponse("not found", { status: 404 }); }
  }

  // Storage 서명 URL (키 = 교회ID/교인ID.jpg — 한글 파일명 미사용)
  const svc = createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: signed, error } = await svc.storage
    .from("photos")
    .createSignedUrl(`${churchId}/${owner.id}.jpg`, 60);
  if (error || !signed) return new NextResponse("not found", { status: 404 });
  return NextResponse.redirect(signed.signedUrl, 302);
}
