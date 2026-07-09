/**
 * 연합 이벤트 수신 유틸 — @havruta/contracts transport.ts의 수신부 미러 (의존성 0, Web Crypto).
 * ChurchThrive는 Cloudflare Workers 런타임이라 jose 없이 crypto.subtle만 사용.
 * (contracts 패키지가 레지스트리에 배포되면 이 파일을 `@havruta/contracts` import로 대체.)
 * 서명 규격은 contracts와 동일해야 함: HMAC-SHA256 hex over rawBody, 헤더 x-havruta-signature.
 */
export const SIGNATURE_HEADER = "x-havruta-signature";

const encoder = new TextEncoder();
function utf8(s: string): Uint8Array<ArrayBuffer> {
  const src = encoder.encode(s);
  const out = new Uint8Array(src.length);
  out.set(src);
  return out;
}
function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const m = hex.match(/.{1,2}/g) ?? [];
  const out = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) out[i] = parseInt(m[i], 16);
  return out;
}

export async function verifySignature(rawBody: string, signatureHex: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("HMAC", key, fromHex(signatureHex), utf8(rawBody));
  } catch {
    return false;
  }
}

export type HavrutaEnvelope = {
  event_id: string;
  type: string;
  spec_version: string;
  occurred_at: string;
  source_app: string;
  subject: { havruta_id: string };
  consent_scope: string;
  payload: unknown;
};

function isValidEnvelope(x: unknown): x is HavrutaEnvelope {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.event_id === "string" && typeof e.type === "string" &&
    typeof e.occurred_at === "string" && typeof e.source_app === "string" &&
    typeof e.subject === "object" && e.subject !== null &&
    typeof (e.subject as Record<string, unknown>).havruta_id === "string" &&
    typeof e.consent_scope === "string" && "payload" in e
  );
}

/** 수신 처리: 서명검증 → 멱등 dedup → process. 반환 status: 202/409/401/400/500 (D18). */
export async function handleIncoming(opts: {
  rawBody: string;
  signature: string | null;
  secret: string;
  isDuplicate: (eventId: string) => Promise<boolean> | boolean;
  process: (env: HavrutaEnvelope) => Promise<void> | void;
}): Promise<{ status: number; body: unknown }> {
  if (!opts.signature || !(await verifySignature(opts.rawBody, opts.signature, opts.secret))) {
    return { status: 401, body: { error: "invalid signature" } };
  }
  let env: HavrutaEnvelope;
  try {
    env = JSON.parse(opts.rawBody);
  } catch {
    return { status: 400, body: { error: "invalid json" } };
  }
  if (!isValidEnvelope(env)) return { status: 400, body: { error: "invalid envelope" } };
  if (await opts.isDuplicate(env.event_id)) return { status: 409, body: { duplicate: true } };
  try {
    await opts.process(env);
    return { status: 202, body: { accepted: true } };
  } catch {
    return { status: 500, body: { error: "processing failed" } };
  }
}
