"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Candidate = {
  member_id: string;
  display_name: string;
  hint: string | null;
  name_match: boolean;
  phone_match: boolean;
  birthday_match: boolean;
  match_score: number;
};

/** 교적 미연결 사용자의 본인 교적 등록 (member-card-self-service W2) */
export default function RegisterCard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", birthday: "", address: "" });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [matchRequested, setMatchRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function compare() {
    if (!f.name.trim()) return notify("이름을 입력해주세요.");
    setBusy(true);
    const { data, error } = await supabase.rpc("my_member_match_candidates", {
      p_name: f.name.trim(),
      p_phone: f.phone.trim() || null,
      p_birthday: f.birthday || null,
    });
    setBusy(false);
    if (error) return notify(error.message, "error");
    setCandidates((data as Candidate[]) ?? []);
    setSearched(true);
  }

  async function requestMatch(candidate: Candidate) {
    setBusy(true);
    const { error } = await supabase.rpc("request_my_member_match", {
      p_member_id: candidate.member_id,
      p_name: f.name.trim(),
      p_phone: f.phone.trim() || null,
      p_birthday: f.birthday || null,
      p_note: null,
    });
    setBusy(false);
    if (error) return notify(error.message, "error");
    setMatchRequested(true);
    notify("기존 교적 연결 요청이 접수되었습니다. 담당자 승인 후 내 교적으로 표시됩니다.");
  }

  async function submit() {
    if (!f.name.trim()) return notify("이름을 입력해주세요.");
    setBusy(true);
    const { error } = await supabase.rpc("register_my_card", { p: {
      name: f.name, phone: f.phone, birthday: f.birthday || null, address: f.address,
    } });
    setBusy(false);
    if (error) return notify(error.message, "error");
    notify("교적이 등록되었습니다.");
    router.refresh();
  }

  return (
    <div className="card p-6 flex flex-col gap-3 pop-in" data-testid="register-card">
      <div>
        <h2 className="font-black text-lg">내 교적 찾기</h2>
        <p className="text-sm text-[var(--text-soft)] mt-1">
          아직 교적이 연결되지 않았습니다. 성함·연락처·생년월일을 입력하면 기존 교적과 비교해 연결 후보를 보여드립니다.
        </p>
      </div>
      {matchRequested && (
        <div className="p-3 rounded-lg text-sm"
             style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
          <b>연결 요청이 접수되었습니다.</b>
          <span className="block mt-1">
            교회 담당자가 승인하면 기존 교적이 이 계정과 연결됩니다.
          </span>
        </div>
      )}
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">이름 *</span>
        <input className="input" value={f.name}
               onChange={(e) => { set("name", e.target.value); setSearched(false); setCandidates([]); }} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><span className="text-sm font-bold">연락처</span>
          <input className="input" value={f.phone}
                 onChange={(e) => { set("phone", e.target.value); setSearched(false); setCandidates([]); }}
                 placeholder="010-…" /></label>
        <label className="flex flex-col gap-1"><span className="text-sm font-bold">생년월일</span>
          <input className="input" type="date" value={f.birthday}
                 onChange={(e) => { set("birthday", e.target.value); setSearched(false); setCandidates([]); }} /></label>
      </div>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">주소</span>
        <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} /></label>

      {!searched ? (
        <button className="btn btn-primary" disabled={busy || matchRequested} onClick={compare}>
          {busy ? "비교 중…" : "기존 교적과 비교"}
        </button>
      ) : candidates.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--text-soft)]">
            아래 후보 중 본인 교적이 있으면 연결 요청을 보내주세요. 연락처와 생년월일은 원문 없이 일치 여부만 표시됩니다.
          </p>
          {candidates.map((candidate) => (
            <div key={candidate.member_id} className="card !shadow-none p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <b>{candidate.display_name}</b>
                  {candidate.hint && (
                    <span className="block text-xs text-[var(--text-soft)]">{candidate.hint}</span>
                  )}
                </span>
                <span className="badge shrink-0" style={scoreStyle(candidate.match_score)}>
                  {scoreLabel(candidate.match_score)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <MatchBadge label="이름" on={candidate.name_match} />
                <MatchBadge label="연락처" on={candidate.phone_match} />
                <MatchBadge label="생년월일" on={candidate.birthday_match} />
              </div>
              <button className="btn btn-primary !min-h-10 text-sm" disabled={busy || matchRequested}
                      onClick={() => requestMatch(candidate)}>
                이 교적으로 연결 요청
              </button>
            </div>
          ))}
          <button className="btn btn-ghost text-sm" disabled={busy || matchRequested} onClick={() => setSearched(false)}>
            입력값 다시 확인
          </button>
          <button className="btn btn-ghost text-sm" disabled={busy || matchRequested} onClick={submit}>
            후보가 아니에요 — 새 교적으로 등록
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--text-soft)]">
            입력한 정보와 일치하는 미연결 교적을 찾지 못했습니다. 새 교적으로 등록하면 바로 내 교적으로 표시됩니다.
          </p>
          <button className="btn btn-primary" disabled={busy || matchRequested} onClick={submit}>
            {busy ? "등록 중…" : "새 교적으로 등록"}
          </button>
          <button className="btn btn-ghost text-sm" disabled={busy || matchRequested} onClick={() => setSearched(false)}>
            입력값 다시 확인
          </button>
        </div>
      )}
      <p className="text-xs text-[var(--text-soft)]">
        기존 교적 연결은 담당자 승인 후 반영됩니다. 새로 등록한 교적의 정보 수정도 담당자 승인을 거칩니다.
      </p>
    </div>
  );
}

function MatchBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <span className="badge text-xs" style={on
      ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
      : { background: "var(--surface-soft)", color: "var(--text-soft)" }}>
      {label} {on ? "일치" : "확인 필요"}
    </span>
  );
}

function scoreLabel(score: number) {
  if (score >= 95) return "강한 일치";
  if (score >= 85) return "높은 일치";
  if (score >= 60) return "이름 일치";
  return "확인 필요";
}

function scoreStyle(score: number) {
  if (score >= 85) return { background: "var(--color-positive-soft)", color: "var(--color-positive)" };
  return { background: "var(--color-caution-soft)", color: "var(--color-caution)" };
}
