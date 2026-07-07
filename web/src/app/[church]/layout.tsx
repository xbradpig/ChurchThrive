import { notFound } from "next/navigation";

/**
 * 교회 세그먼트 레이아웃 — 경로 기반 테넌시 (church-url-tenancy W3)
 * slug ↔ active_church 동기화는 미들웨어가 담당 (쿠키 set 가능 지점).
 * 여기서는 slug 형식만 검증한다.
 */
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,62}$/;

export default async function ChurchLayout({ params, children }:
  { params: Promise<{ church: string }>; children: React.ReactNode }) {
  const { church } = await params;
  if (!SLUG_RE.test(church)) notFound();
  return <>{children}</>;
}
