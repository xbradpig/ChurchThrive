"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** 교회 검색(church_public 최소 공개 뷰) → 가입 신청 (P0-3) */
export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}

function JoinInner() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selected, setSelected] = useState<{ name: string; slug: string } | null>(null);
  const [myName, setMyName] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // /{slug} 접근 → 비소속 리다이렉트로 온 경우 해당 교회를 미리 선택 (church-url-tenancy)
  const presetSlug = searchParams.get("church");
  useEffect(() => {
    if (!presetSlug || selected) return;
    supabase.from("church_public").select("name, slug").eq("slug", presetSlug).maybeSingle()
      .then(({ data }) => { if (data) setSelected(data); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetSlug, supabase]);

  async function search() {
    const { data } = await supabase.from("church_public").select("id, name, slug")
      .ilike("name", `%${q.trim()}%`).limit(10);
    setResults(data ?? []);
  }

  async function apply() {
    if (!selected || !myName.trim()) return setError("이름을 입력해주세요.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("request_join", { p_slug: selected.slug, p_name: myName });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 pop-in">
        <h1 className="text-xl font-black text-[var(--color-brand-800)] mb-4">교회 가입 신청</h1>
        {done ? (
          <div className="flex flex-col gap-3 text-center">
            <p className="badge w-full justify-center py-3"
               style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
              ✓ 신청이 접수되었습니다
            </p>
            <p className="text-sm text-[var(--text-soft)]">
              <b>{selected?.name}</b> 관리자가 승인하면 교회 공간이 열립니다.
            </p>
            <Link href="/home" className="btn btn-primary">확인</Link>
          </div>
        ) : selected ? (
          <div className="flex flex-col gap-3">
            <p className="badge w-full justify-center py-2"
               style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
              ⛪ {selected.name}
            </p>
            <input className="input" placeholder="성함 (교적과 대조용)" value={myName}
                   onChange={(e) => setMyName(e.target.value)} />
            {error && <p className="badge w-full justify-center py-2"
                         style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>}
            <button className="btn btn-primary" disabled={busy} onClick={apply}>
              {busy ? "신청 중…" : "가입 신청"}
            </button>
            <button className="btn btn-ghost text-sm" onClick={() => setSelected(null)}>다른 교회 찾기</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="교회 이름 검색" value={q}
                     onChange={(e) => setQ(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && search()} />
              <button className="btn btn-primary" onClick={search}>검색</button>
            </div>
            {results.map((c) => (
              <button key={c.id} onClick={() => setSelected(c)}
                      className="card p-4 flex items-center gap-3 text-left hover:shadow-[var(--shadow-card-hover)]">
                <span className="text-2xl">⛪</span>
                <span><b>{c.name}</b><span className="block text-xs text-[var(--text-soft)]">{c.slug}</span></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
