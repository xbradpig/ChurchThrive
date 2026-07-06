import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 교인 사진 인증 서빙 — public 정적 노출 금지 (개인정보)
 * 조건: ①로그인 ②그 사진의 교인이 내 활성 교회 소속일 것 (테넌트 격리)
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

  try {
    const buf = await readFile(path.join(process.cwd(), "photos-secure", safe));
    const ext = safe.split(".").pop()?.toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": ext === "png" ? "image/png" : "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
