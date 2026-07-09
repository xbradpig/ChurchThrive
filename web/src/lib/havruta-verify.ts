/**
 * Havruta ID(포털) 토큰 검증 — 포털 Supabase가 발급한 JWT를 JWKS로 검증해 havruta_id 추출.
 * @havruta/contracts identity.ts와 동일 로직(레지스트리 배포 시 그 패키지로 대체).
 * 정본: docs/guides/havruta-ecosystem.md §4.1
 */
import { jwtVerify, createRemoteJWKSet } from "jose";

// 포털 Supabase 프로젝트의 JWKS. 로컬 테스트는 로컬 Supabase(같은 프로젝트)로 대입.
const JWKS_URL =
  process.env.HAVRUTA_PORTAL_JWKS_URL ??
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

export type HavrutaClaims = { havrutaId: string; email: string | null };

/** 포털 토큰 검증 → havruta_id(sub) + email. 실패 시 throw. */
export async function verifyHavrutaToken(token: string): Promise<HavrutaClaims> {
  const { payload } = await jwtVerify(token, jwks);
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("token missing sub (havruta_id)");
  }
  return {
    havrutaId: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
  };
}
