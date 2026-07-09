/**
 * POST /api/havruta/webhook — 연합 이벤트 수신 (Phase 0.5)
 * 타 앱(manna 등)이 발행한 이벤트를 서명 검증·멱등 처리해 federation_events에 사본 저장 →
 * 해당 havruta_id의 교인카드 타임라인에 표시.
 * 서명: HMAC-SHA256(rawBody, HAVRUTA_WEBHOOK_SECRET), 헤더 x-havruta-signature.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { handleIncoming, SIGNATURE_HEADER } from "@/lib/havruta-transport";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER);
  const secret = process.env.HAVRUTA_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const svc = createServiceClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const result = await handleIncoming({
    rawBody,
    signature,
    secret,
    // 멱등: 이미 저장된 event_id면 중복
    isDuplicate: async (eventId) => {
      const { data } = await svc
        .from("federation_events")
        .select("event_id")
        .eq("event_id", eventId)
        .maybeSingle();
      return !!data;
    },
    // 처리: havruta_id로 교인 소속(church_id) 해석 후 사본 저장
    process: async (env) => {
      const havrutaId = env.subject.havruta_id;
      const { data: member } = await svc
        .from("members")
        .select("church_id")
        .eq("havruta_id", havrutaId)
        .maybeSingle();

      const { error } = await svc.from("federation_events").insert({
        event_id: env.event_id,
        havruta_id: havrutaId,
        source_app: env.source_app,
        type: env.type,
        payload: env.payload,
        occurred_at: env.occurred_at,
        church_id: (member as { church_id?: string } | null)?.church_id ?? null,
      });
      if (error) throw new Error(error.message); // → 500, 발행 측 재시도
    },
  });

  return NextResponse.json(result.body, { status: result.status });
}
