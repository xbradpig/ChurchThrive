"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const GROUPS: { key: string; label: string; desc: string }[] = [
  { key: "contact", label: "연락처", desc: "전화번호" },
  { key: "birth", label: "생년월일", desc: "생일, 나이" },
  { key: "address", label: "주소", desc: "거주지 주소" },
  { key: "family", label: "가족", desc: "가족 관계 메모" },
  { key: "pastoral", label: "돌봄 정보", desc: "심방·케어 관련 기록" },
];

export default function ConsentPanel({ memberId }: { memberId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("member_consents").select("fgroup, granted").eq("member_id", memberId)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        for (const c of data ?? []) map[c.fgroup] = c.granted;
        setConsents(map);
      });
  }, [supabase, memberId]);

  async function toggle(key: string) {
    const next = !consents[key];
    setConsents((c) => ({ ...c, [key]: next }));
    await supabase.from("member_consents").upsert(
      { member_id: memberId, fgroup: key, granted: next, updated_at: new Date().toISOString() },
      { onConflict: "member_id,fgroup" }
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">정보 공개 동의</h3>
      <p className="text-sm text-[var(--text-soft)] mb-4">
        아래 항목은 <b>내가 동의하고, 교역자가 승인한 경우에만</b> 우리 부서 담당자에게 보입니다.
        출석 정보는 기본으로 공유됩니다. 언제든 끌 수 있습니다.
      </p>
      <div className="flex flex-col gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => toggle(g.key)}
            className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors"
            style={{
              borderColor: consents[g.key] ? "var(--color-positive)" : "var(--line)",
              background: consents[g.key] ? "var(--color-positive-soft)" : "transparent",
            }}
          >
            <span
              className="w-12 h-7 rounded-full relative transition-colors shrink-0"
              style={{ background: consents[g.key] ? "var(--color-positive)" : "var(--color-sand-300)" }}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
                style={{ left: consents[g.key] ? "1.4rem" : "0.125rem" }}
              />
            </span>
            <span>
              <b>{g.label}</b>
              <span className="block text-sm text-[var(--text-soft)]">{g.desc}</span>
            </span>
            <span className="ml-auto font-black text-sm" style={{ color: consents[g.key] ? "var(--color-positive)" : "var(--text-soft)" }}>
              {consents[g.key] ? "공개" : "비공개"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
