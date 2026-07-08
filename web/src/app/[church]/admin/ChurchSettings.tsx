"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppDialog } from "@/components/ui/AppDialog";

type Profile = { name: string; slug: string; denomination: string | null; pastor_name: string | null;
  contact_phone: string | null; address: string | null; intro: string | null;
  member_size: string | null; status: string; created_at: string;
  custom_domain: string | null; custom_domain_status: string };
type DomainState = { domain?: string; status: string; records?: { type: string; name: string; value: string }[] };

const DOMAIN_STATUS_LABEL: Record<string, string> = {
  none: "미설정", pending_dns: "DNS 설정 대기", verifying: "검증 중", active: "연결됨", failed: "실패",
};

/** 교회 설정 — 프로필 편집 (관리자) */
export default function ChurchSettings({ canEdit }: { canEdit: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const { toast, confirm } = useAppDialog();
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [dom, setDom] = useState<DomainState | null>(null);
  const [domInput, setDomInput] = useState("");
  const [domBusy, setDomBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("get_church_profile").then(({ data }) => setP(data));
    fetch("/api/custom-domain").then((r) => r.json()).then(setDom).catch(() => {});
  }, [supabase]);

  if (!p) return <div className="card p-8 text-center text-[var(--text-soft)]">불러오는 중…</div>;
  const set = (k: keyof Profile, v: string) => setP((prev) => prev ? { ...prev, [k]: v } : prev);

  async function save() {
    setBusy(true);
    const { error } = await supabase.rpc("update_church_profile", {
      p: { name: p!.name, denomination: p!.denomination, pastor_name: p!.pastor_name,
           contact_phone: p!.contact_phone, address: p!.address, intro: p!.intro },
    });
    setBusy(false);
    if (error) return toast("error", error.message);
    toast("success", "교회 정보를 저장했습니다.");
  }

  async function registerDomain() {
    if (!domInput.trim()) return;
    setDomBusy(true);
    const res = await fetch("/api/custom-domain", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domInput.trim() }),
    });
    const j = await res.json();
    setDomBusy(false);
    if (!res.ok) return toast("error", j.error ?? "등록에 실패했습니다.");
    setDom(j); setDomInput("");
    toast("success", j.note ?? "도메인이 등록되었습니다. DNS 설정 후 검증됩니다.");
  }
  async function refreshDomain() {
    const j = await fetch("/api/custom-domain").then((r) => r.json());
    setDom(j);
    if (j.status === "active") toast("success", "도메인이 연결되었습니다.");
  }
  async function removeDomain() {
    if (!(await confirm({ title: "커스텀 도메인을 해제할까요?", danger: true, confirmLabel: "해제" }))) return;
    setDomBusy(true);
    await fetch("/api/custom-domain", { method: "DELETE" });
    setDomBusy(false);
    setDom({ status: "none" });
    toast("success", "도메인을 해제했습니다.");
  }

  return (
    <div className="flex flex-col gap-4" data-church-settings>
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-lg">교회 정보</h3>
          <span className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
            {p.status === "active" ? "승인됨" : p.status}
          </span>
          <span className="text-xs text-[var(--text-soft)] ml-auto">
            등록 {p.created_at.slice(0, 10)} · 교회 주소 <b>/{p.slug}</b> (등록 시 확정 · 변경 불가)
          </span>
        </div>
        <label className="flex flex-col gap-1"><span className="text-sm font-bold">교회 이름</span>
          <input className="input" value={p.name} disabled={!canEdit} onChange={(e) => set("name", e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1"><span className="text-sm font-bold">교단</span>
            <input className="input" value={p.denomination ?? ""} disabled={!canEdit}
                   onChange={(e) => set("denomination", e.target.value)} /></label>
          <label className="flex flex-col gap-1"><span className="text-sm font-bold">담임목사</span>
            <input className="input" value={p.pastor_name ?? ""} disabled={!canEdit}
                   onChange={(e) => set("pastor_name", e.target.value)} /></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1"><span className="text-sm font-bold">대표 연락처</span>
            <input className="input" value={p.contact_phone ?? ""} disabled={!canEdit}
                   onChange={(e) => set("contact_phone", e.target.value)} /></label>
          <label className="flex flex-col gap-1"><span className="text-sm font-bold">주소</span>
            <input className="input" value={p.address ?? ""} disabled={!canEdit}
                   onChange={(e) => set("address", e.target.value)} /></label>
        </div>
        <label className="flex flex-col gap-1"><span className="text-sm font-bold">소개</span>
          <textarea className="input !min-h-20" value={p.intro ?? ""} disabled={!canEdit}
                    onChange={(e) => set("intro", e.target.value)} /></label>
        {canEdit && (
          <button className="btn btn-primary self-end" disabled={busy} onClick={save} data-save-profile>
            {busy ? "저장 중…" : "저장"}
          </button>
        )}
      </div>

      {/* 커스텀 도메인 (custom-domain 6단계 · superadmin) */}
      {canEdit && (
        <div className="card p-5 flex flex-col gap-3" data-custom-domain>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-lg">교회 도메인</h3>
            <span className="badge" style={{
              background: dom?.status === "active" ? "var(--color-positive-soft)" : "var(--surface-soft)",
              color: dom?.status === "active" ? "var(--color-positive)" : "var(--text-soft)",
            }}>{DOMAIN_STATUS_LABEL[dom?.status ?? "none"] ?? dom?.status}</span>
          </div>
          <p className="text-sm text-[var(--text-soft)]">
            교회가 보유한 도메인(예: <b>chungpa.church</b>)을 연결하면 그 주소로 우리 교회 홈이 열립니다.
            등록 후 아래 DNS 레코드를 도메인 관리 페이지에 추가하면 자동으로 인증서가 발급됩니다.
          </p>

          {(!dom || dom.status === "none") ? (
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="our-church.org" value={domInput}
                     onChange={(e) => setDomInput(e.target.value.toLowerCase())} />
              <button className="btn btn-primary" disabled={domBusy} onClick={registerDomain}>
                {domBusy ? "등록 중…" : "도메인 등록"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <b>{dom.domain}</b>
                {dom.status !== "active" && (
                  <button className="btn btn-ghost !min-h-9 text-sm" onClick={refreshDomain}>상태 새로고침</button>
                )}
                <button className="btn btn-ghost !min-h-9 text-sm text-[var(--color-danger)] ml-auto"
                        disabled={domBusy} onClick={removeDomain}>해제</button>
              </div>
              {dom.records && dom.records.length > 0 && (
                <div className="card !shadow-none p-3" style={{ background: "var(--surface-soft)" }}>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--text-soft)] mb-2">
                    도메인 DNS에 추가할 레코드
                  </p>
                  <div className="flex flex-col gap-2">
                    {dom.records.map((r, i) => (
                      <div key={i} className="text-sm break-all">
                        <span className="badge mr-2" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>{r.type}</span>
                        <code className="text-xs">{r.name}</code> → <code className="text-xs">{r.value}</code>
                      </div>
                    ))}
                    <div className="text-sm">
                      <span className="badge mr-2" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>CNAME</span>
                      <code className="text-xs">{dom.domain}</code> → <code className="text-xs">church.havrutaproject.org</code>
                    </div>
                  </div>
                </div>
              )}
              {dom.status === "pending_dns" && (
                <p className="text-sm text-[var(--color-caution)]">
                  플랫폼의 도메인 연동 설정이 준비되면 인증서 발급이 진행됩니다.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
