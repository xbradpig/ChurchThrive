"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppDialog } from "@/components/ui/AppDialog";

type Profile = { name: string; slug: string; denomination: string | null; pastor_name: string | null;
  contact_phone: string | null; address: string | null; intro: string | null;
  member_size: string | null; status: string; created_at: string };

/** 교회 설정 — 프로필 편집 (관리자) */
export default function ChurchSettings({ canEdit }: { canEdit: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useAppDialog();
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("get_church_profile").then(({ data }) => setP(data));
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

  return (
    <div className="flex flex-col gap-4" data-church-settings>
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-lg">교회 정보</h3>
          <span className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
            {p.status === "active" ? "승인됨" : p.status}
          </span>
          <span className="text-xs text-[var(--text-soft)] ml-auto">
            등록 {p.created_at.slice(0, 10)} · 주소 {p.slug}
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
    </div>
  );
}
