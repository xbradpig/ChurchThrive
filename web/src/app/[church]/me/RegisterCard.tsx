"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

/** 교적 미연결 사용자의 본인 교적 등록 (member-card-self-service W2) */
export default function RegisterCard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", birthday: "", address: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

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
        <h2 className="font-black text-lg">내 교적 등록</h2>
        <p className="text-sm text-[var(--text-soft)] mt-1">
          아직 교적이 연결되지 않았습니다. 아래 정보로 직접 등록하거나, 이미 교적이 있다면 교회 담당자에게 연결을 요청해주세요.
        </p>
      </div>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">이름 *</span>
        <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><span className="text-sm font-bold">연락처</span>
          <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-…" /></label>
        <label className="flex flex-col gap-1"><span className="text-sm font-bold">생년월일</span>
          <input className="input" type="date" value={f.birthday} onChange={(e) => set("birthday", e.target.value)} /></label>
      </div>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">주소</span>
        <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} /></label>
      <button className="btn btn-primary" disabled={busy} onClick={submit}>
        {busy ? "등록 중…" : "교적 등록"}
      </button>
      <p className="text-xs text-[var(--text-soft)]">
        등록 후 정보 수정은 담당자 승인을 거쳐 반영됩니다. 교적 삭제는 교회 담당자만 처리할 수 있습니다.
      </p>
    </div>
  );
}
