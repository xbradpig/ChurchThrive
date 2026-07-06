"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** 교회 등록 (SG2): 이름+주소(slug)만으로 15분 온보딩의 첫 단계 */
export default function RegisterChurchPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!name.trim()) return setError("교회 이름을 입력해주세요.");
    if (!/^[a-z0-9-]{2,32}$/.test(slug)) return setError("주소는 영문 소문자·숫자·하이픈 2~32자입니다.");
    setBusy(true);
    const { error } = await supabase.rpc("create_church", { p_name: name, p_slug: slug });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/menu");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <h1 className="text-xl font-black text-[var(--color-brand-800)] mb-1">새 교회 등록</h1>
        <p className="text-sm text-[var(--text-soft)] mb-6">
          등록하신 분이 교회 관리자가 됩니다. 기본 기능(교적·출석)이 함께 준비됩니다.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-sm">교회 이름</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="예: 은혜중앙교회" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-sm">교회 주소 (영문)</span>
            <input className="input" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())}
                   placeholder="예: grace-central" />
            <span className="text-xs text-[var(--text-soft)]">{slug || "주소"}.churchthrive.kr 로 사용됩니다</span>
          </label>
          {error && (
            <p className="badge w-full justify-center py-2"
               style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>
          )}
          <button className="btn btn-primary text-lg" disabled={busy} onClick={create}>
            {busy ? "만드는 중…" : "교회 만들기"}
          </button>
        </div>
      </div>
    </main>
  );
}
