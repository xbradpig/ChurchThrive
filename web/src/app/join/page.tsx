"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Candidate = { member_id: string; name: string; name_suffix: string | null; hint: string | null };

/** 교회 검색(church_public 최소 공개 뷰) → 명부 본인 매칭 → 가입 신청 (P0-3) */
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
  const [searched, setSearched] = useState(false);              // 명부 검색 실행 여부
  const [candidates, setCandidates] = useState<Candidate[]>([]); // 명부에서 찾은 본인 후보
  const [done, setDone] = useState(false);
  const [matched, setMatched] = useState(false);                 // 매칭 신청으로 접수됐는지
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

  function pickChurch(c: { name: string; slug: string }) {
    setSelected(c);
    setSearched(false);
    setCandidates([]);
    setError(null);
  }

  async function search() {
    const { data } = await supabase.from("church_public").select("id, name, slug")
      .ilike("name", `%${q.trim()}%`).limit(10);
    setResults(data ?? []);
  }

  // 명부(재적)에서 본인 검색 — 이름 정확 일치하는 미연결 교적만 반환
  async function findMe() {
    if (!selected || !myName.trim()) return setError("성함을 입력해주세요.");
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("join_search_roster", {
      p_slug: selected.slug, p_name: myName.trim(),
    });
    setBusy(false);
    if (error) return setError(error.message);
    setCandidates((data as Candidate[]) ?? []);
    setSearched(true);
  }

  // p_member_id 있으면 명부 매칭 신청, 없으면 신규 교인 신청
  async function apply(memberId?: string) {
    if (!selected || !myName.trim()) return setError("성함을 입력해주세요.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("request_join", {
      p_slug: selected.slug, p_name: myName.trim(), p_member_id: memberId ?? null,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setMatched(!!memberId);
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
              {matched
                ? <><b>{selected?.name}</b> 관리자가 <b>명부 매칭</b>을 확인·승인하면 기존 교적과 연결됩니다.</>
                : <><b>{selected?.name}</b> 관리자가 승인하면 교회 공간이 열립니다.</>}
            </p>
            <Link href="/home" className="btn btn-primary">확인</Link>
          </div>
        ) : selected ? (
          <div className="flex flex-col gap-3">
            <p className="badge w-full justify-center py-2"
               style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
              ⛪ {selected.name}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="font-bold text-sm">성함 <span className="font-normal text-[var(--text-soft)]">(교적과 대조용)</span></span>
              <input className="input" placeholder="홍길동" value={myName}
                     onChange={(e) => { setMyName(e.target.value); setSearched(false); }} />
            </label>
            {error && <p className="badge w-full justify-center py-2"
                         style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{error}</p>}

            {!searched ? (
              <button className="btn btn-primary" disabled={busy} onClick={findMe}>
                {busy ? "확인 중…" : "명부에서 본인 확인"}
              </button>
            ) : candidates.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[var(--text-soft)]">
                  명부에서 아래 교적을 찾았어요. 본인이 맞으면 <b>매칭 신청</b>하세요.
                </p>
                {candidates.map((c) => (
                  <div key={c.member_id}
                       className="card p-3 flex items-center justify-between gap-2">
                    <span>
                      <b>{c.name}{c.name_suffix ?? ""}</b>
                      {c.hint && <span className="block text-xs text-[var(--text-soft)]">{c.hint}</span>}
                    </span>
                    <button className="btn btn-primary text-sm shrink-0" disabled={busy}
                            onClick={() => apply(c.member_id)}>본인이에요</button>
                  </div>
                ))}
                <button className="btn btn-ghost text-sm" disabled={busy} onClick={() => apply()}>
                  명부에 제가 없어요 — 새 교인으로 신청
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[var(--text-soft)]">
                  명부에서 일치하는 교적을 찾지 못했어요. 새 교인으로 신청하면 관리자가 확인 후 등록합니다.
                </p>
                <button className="btn btn-primary" disabled={busy} onClick={() => apply()}>
                  {busy ? "신청 중…" : "새 교인으로 가입 신청"}
                </button>
                <button className="btn btn-ghost text-sm" onClick={() => setSearched(false)}>이름 다시 입력</button>
              </div>
            )}
            <button className="btn btn-ghost text-sm"
                    onClick={() => { setSelected(null); setSearched(false); setCandidates([]); setError(null); }}>
              다른 교회 찾기
            </button>
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
              <button key={c.id} onClick={() => pickChurch(c)}
                      className="card p-4 flex items-center gap-3 text-left hover:shadow-[var(--shadow-card-hover)]">
                <span className="text-2xl">⛪</span>
                <span><b>{c.name}</b><span className="block text-xs text-[var(--text-soft)]">{c.slug}</span></span>
              </button>
            ))}
          </div>
        )}

        {/* 이미 교회 계정이 있는 사람 — 로그인으로 */}
        {!done && (
          <div className="mt-6 pt-4 border-t border-[var(--line)] text-center">
            <p className="text-sm text-[var(--text-soft)]">이미 교회 계정이 있으신가요?</p>
            <Link href="/login" className="btn btn-ghost w-full mt-2 text-sm">
              🔑 교회 계정으로 로그인하기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
