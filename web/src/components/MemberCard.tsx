"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Card = {
  id: string; name: string; name_suffix: string; photo_url: string | null;
  position: string; member_type: string; status: string;
  departments: { id: string; name: string }[];
  phone?: string | null; email?: string | null; email_verified?: boolean;
  birthday?: string | null; address?: string | null;
  family_note?: string | null;
  care_target?: boolean; guardian_name?: string | null; guardian_phone?: string | null;
  has_wander_device?: boolean; dementia_center_registered?: boolean;
  last_seen_at?: string | null;
  recent_attendances?: { event_date: string; event_name: string; method: string; approved: boolean }[];
};

export type EditRequest = {
  id: string; changes: Record<string, string | null>; note: string | null;
  status: "pending" | "approved" | "rejected"; decide_note: string | null; created_at: string;
};

const FIELD_LABEL: Record<string, string> = {
  name: "이름", phone: "연락처", birthday: "생년월일", address: "주소", family_note: "가족", email: "이메일",
};

export default function MemberCard({ card, editable, editRequest }:
  { card: Card; editable?: boolean; editRequest?: EditRequest | null }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: card.name, phone: card.phone ?? "", email: card.email ?? "", birthday: card.birthday ?? "",
    address: card.address ?? "", family_note: card.family_note ?? "", note: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const pending = editRequest?.status === "pending" ? editRequest : null;

  // 수정은 즉시 반영이 아니라 담당자·교역자 승인 후 반영 (member-card-self-service)
  async function submitRequest() {
    setBusy(true);
    const { error } = await supabase.rpc("request_my_card_edit", {
      p: { name: form.name, phone: form.phone, email: form.email, birthday: form.birthday || null,
           address: form.address, family_note: form.family_note },
      p_note: form.note || null,
    });
    setBusy(false);
    if (error) return notify(error.message, "error");
    setEditing(false);
    notify("수정 요청이 접수되었습니다. 담당자 승인 후 반영됩니다.");
    router.refresh();
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

      {/* 수정 요청 상태 배너 */}
      {editable && pending && (
        <div className="px-5 py-3 text-sm" style={{ background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>
          <b>⏳ 수정 요청 승인 대기 중</b> — {Object.entries(pending.changes)
            .map(([k, v]) => `${FIELD_LABEL[k] ?? k}: ${v ?? "삭제"}`).join(" · ")}
        </div>
      )}
      {editable && editRequest?.status === "rejected" && !editing && (
        <div className="px-5 py-3 text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
          최근 수정 요청이 반려되었습니다{editRequest.decide_note ? ` — ${editRequest.decide_note}` : ""}.
        </div>
      )}

      {/* 정보 (게이트 통과 항목만 서버가 내려줌) */}
      <div className="p-5 flex flex-col gap-3">
        {editing && (
          <Field label="이름"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        )}
        {"phone" in card && (
          <Field label="연락처">
            {editing ? <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              : <a href={`tel:${card.phone}`} className="font-bold text-[var(--color-brand-600)]">{card.phone || "—"}</a>}
          </Field>
        )}
        {"email" in card && (
          <Field label="이메일">
            {editing ? <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              : card.email ? (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <a href={`mailto:${card.email}`} className="font-bold text-[var(--color-brand-600)] break-all">{card.email}</a>
                  <span className="badge" style={card.email_verified
                    ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
                    : { background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>
                    {card.email_verified ? "인증됨" : "미인증"}
                  </span>
                </span>
              ) : "—"}
          </Field>
        )}
        {"birthday" in card && (
          <Field label="생년월일">
            {editing ? <input className="input" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
              : (card.birthday || "—")}
          </Field>
        )}
        {"address" in card && (
          <Field label="주소">
            {editing ? <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
              : (card.address || "—")}
          </Field>
        )}
        {"family_note" in card && (
          <Field label="가족">
            {editing ? <input className="input" value={form.family_note} onChange={(e) => set("family_note", e.target.value)} />
              : (card.family_note || "—")}
          </Field>
        )}
        {editing && (
          <Field label="요청 메모">
            <input className="input" placeholder="담당자에게 전할 말 (선택)" value={form.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
        )}

        {card.care_target && "guardian_name" in card && (
          <div className="card !shadow-none p-4" style={{ background: "var(--color-caution-soft)", borderColor: "var(--color-caution)" }}>
            <h3 className="font-black mb-2" style={{ color: "var(--color-caution)" }}>돌봄 정보</h3>
            <Field label="보호자">{card.guardian_name} {card.guardian_phone && <a className="font-bold underline" href={`tel:${card.guardian_phone}`}>{card.guardian_phone}</a>}</Field>
            <Field label="배회감지기">{card.has_wander_device ? "보유" : "미보유"} · 치매안심센터 {card.dementia_center_registered ? "등록" : "미등록"}</Field>
            {card.last_seen_at && <Field label="마지막 감지">{new Date(card.last_seen_at).toLocaleString("ko-KR")}</Field>}
          </div>
        )}

        {editable && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button className="btn btn-positive flex-1" disabled={busy} onClick={submitRequest}>
                    {busy ? "요청 중…" : "수정 요청 보내기"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>취소</button>
                </>
              ) : (
                <button className="btn btn-ghost flex-1" onClick={() => setEditing(true)}>
                  {pending ? "수정 요청 다시 작성" : "내 정보 수정 요청"}
                </button>
              )}
            </div>
            {editing && (
              <p className="text-xs text-[var(--text-soft)]">
                수정 내용은 담당자·교역자 승인 후 교적에 반영됩니다. 직분·부서 변경은 교회 담당자에게 문의해주세요.
              </p>
            )}
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
