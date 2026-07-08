/**
 * Cloudflare for SaaS — Custom Hostnames (custom-domain 6단계)
 * 교회별 커스텀 도메인을 프로그래매틱 발급·DCV·TLS 자동.
 * Worker secret: CF_API_TOKEN(Zone > SSL and Certificates: Edit), CF_ZONE_ID
 * 미설정이면 cfConfigured()=false → API 라우트가 "미설정" 안내 반환.
 */
const API = "https://api.cloudflare.com/client/v4";

export function cfConfigured(): boolean {
  return !!(process.env.CF_API_TOKEN && process.env.CF_ZONE_ID);
}

type DnsRecord = { type: string; name: string; value: string };
export type CustomHostname = {
  id: string;
  status: string;             // pending | active | ...
  ssl_status: string | null;  // pending_validation | active | ...
  records: DnsRecord[];       // 교회가 자기 DNS에 넣을 검증 레코드 (소유권 TXT + SSL)
};

function headers() {
  return { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, "Content-Type": "application/json" };
}
function zone() { return process.env.CF_ZONE_ID!; }

function extractRecords(r: Record<string, unknown>): DnsRecord[] {
  const out: DnsRecord[] = [];
  const ov = r.ownership_verification as { type?: string; name?: string; value?: string } | undefined;
  if (ov?.name && ov?.value) out.push({ type: (ov.type ?? "txt").toUpperCase(), name: ov.name, value: ov.value });
  const ssl = r.ssl as { validation_records?: { txt_name?: string; txt_value?: string; cname?: string; cname_target?: string }[] } | undefined;
  for (const v of ssl?.validation_records ?? []) {
    if (v.txt_name && v.txt_value) out.push({ type: "TXT", name: v.txt_name, value: v.txt_value });
    if (v.cname && v.cname_target) out.push({ type: "CNAME", name: v.cname, value: v.cname_target });
  }
  return out;
}

/** 커스텀 호스트네임 생성 → id + 교회가 넣을 DNS 검증 레코드 */
export async function createCustomHostname(hostname: string): Promise<CustomHostname | { error: string }> {
  if (!cfConfigured()) return { error: "Cloudflare 미설정" };
  const res = await fetch(`${API}/zones/${zone()}/custom_hostnames`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({ hostname, ssl: { method: "txt", type: "dv", settings: { min_tls_version: "1.2" } } }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success) return { error: j.errors?.[0]?.message ?? `CF 오류 (${res.status})` };
  const r = j.result;
  return { id: r.id, status: r.status, ssl_status: r.ssl?.status ?? null, records: extractRecords(r) };
}

export async function getCustomHostname(id: string): Promise<CustomHostname | { error: string }> {
  if (!cfConfigured()) return { error: "Cloudflare 미설정" };
  const res = await fetch(`${API}/zones/${zone()}/custom_hostnames/${id}`, { headers: headers() });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success) return { error: j.errors?.[0]?.message ?? `CF 오류 (${res.status})` };
  const r = j.result;
  return { id: r.id, status: r.status, ssl_status: r.ssl?.status ?? null, records: extractRecords(r) };
}

export async function deleteCustomHostname(id: string): Promise<boolean> {
  if (!cfConfigured()) return false;
  const res = await fetch(`${API}/zones/${zone()}/custom_hostnames/${id}`, { method: "DELETE", headers: headers() });
  return res.ok;
}

/** CF status(active) + ssl(active) → 우리 status 매핑 */
export function mapStatus(h: CustomHostname): "verifying" | "active" | "failed" {
  if (h.status === "active" && (h.ssl_status === "active" || h.ssl_status === null)) return "active";
  if (h.status === "blocked" || h.ssl_status === "validation_timed_out") return "failed";
  return "verifying";
}
