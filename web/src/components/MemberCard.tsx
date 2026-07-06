"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Card = {
  id: string; name: string; name_suffix: string; photo_url: string | null;
  position: string; member_type: string; status: string;
  departments: { id: string; name: string }[];
  phone?: string | null; birthday?: string | null; address?: string | null;
  family_note?: string | null;
  care_target?: boolean; guardian_name?: string | null; guardian_phone?: string | null;
  has_wander_device?: boolean; dementia_center_registered?: boolean;
  last_seen_at?: string | null;
  recent_attendances?: { event_date: string; event_name: string; method: string; approved: boolean }[];
};

export default function MemberCard({ card, editable }: { card: Card; editable?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(card.phone ?? "");
  const [address, setAddress] = useState(card.address ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    const { error } = await supabase.rpc("update_my_card", {
      p_phone: phone || null, p_address: address || null,
    });
    if (!error) {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      notify("저장에 실패했습니다: " + error.message, "error");
    }
  }

  const attendances = card.recent_attendances ?? [];
  const rate = useMemo(() => {
    if (attendances.length === 0) return null;
    const recentSundays = attendances.filter((a) => a.event_name === "주일예배").length;
    return recentSundays;
  }, [attendances]);

  return (
    <div className="card overflow-hidden pop-in">
      {/* 헤더 */}
      <div className="p-6 flex items-center gap-4" style={{ background: "var(--color-brand-800)" }}>
        <span className="avatar !w-20 !h-20 !text-2xl">
          {card.photo_url ? <img src={card.photo_url} alt="" /> : card.name.charAt(0)}
        </span>
        <div className="text-white">
          <h2 className="text-2xl font-black">
            {card.name}{card.name_suffix}
            {card.care_target && <span className="badge ml-2" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>케어</span>}
          </h2>
          <p className="opacity-80">{card.position} · {card.departments.map((d) => d.name).join(", ") || "소속 없음"}</p>
        </div>
      </div>

      {/* 정보 (게이트 통과 항목만 서버가 내려줌) */}
      <div className="p-5 flex flex-col gap-3">
        {"phone" in card && (
          <Field label="연락처">
            {editing ? <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              : <a href={`tel:${card.phone}`} className="font-bold text-[var(--color-brand-600)]">{card.phone || "—"}</a>}
          </Field>
        )}
        {"birthday" in card && <Field label="생년월일">{card.birthday || "—"}</Field>}
        {"address" in card && (
          <Field label="주소">
            {editing ? <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
              : (card.address || "—")}
          </Field>
        )}
        {"family_note" in card && <Field label="가족">{card.family_note || "—"}</Field>}

        {card.care_target && "guardian_name" in card && (
          <div className="card !shadow-none p-4" style={{ background: "var(--color-caution-soft)", borderColor: "var(--color-caution)" }}>
            <h3 className="font-black mb-2" style={{ color: "var(--color-caution)" }}>돌봄 정보</h3>
            <Field label="보호자">{card.guardian_name} {card.guardian_phone && <a className="font-bold underline" href={`tel:${card.guardian_phone}`}>{card.guardian_phone}</a>}</Field>
            <Field label="배회감지기">{card.has_wander_device ? "보유" : "미보유"} · 치매안심센터 {card.dementia_center_registered ? "등록" : "미등록"}</Field>
            {card.last_seen_at && <Field label="마지막 감지">{new Date(card.last_seen_at).toLocaleString("ko-KR")}</Field>}
          </div>
        )}

        {editable && (
          <div className="flex gap-2 pt-1">
            {editing ? (
              <>
                <button className="btn btn-positive flex-1" onClick={save}>저장</button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>취소</button>
              </>
            ) : (
              <button className="btn btn-ghost flex-1" onClick={() => setEditing(true)}>연락처 · 주소 수정</button>
            )}
            {saved && <span className="badge self-center" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>저장됨 ✓</span>}
          </div>
        )}
      </div>

      {/* 출석 이력 */}
      {attendances.length > 0 && (
        <div className="px-5 pb-5">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">
            최근 출석 {rate !== null && <span className="text-sm font-bold text-[var(--text-soft)]">(주일예배 {rate}회)</span>}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {attendances.slice(0, 24).map((a, i) => (
              <span key={i} className="badge" style={{
                background: a.approved ? "var(--color-positive-soft)" : "var(--color-caution-soft)",
                color: a.approved ? "var(--color-positive)" : "var(--color-caution)",
              }}>
                {a.event_date.slice(5).replace("-", "/")} {a.event_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="w-20 shrink-0 text-sm font-bold text-[var(--text-soft)]">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
