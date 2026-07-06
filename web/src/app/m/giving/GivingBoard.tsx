"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Rec = { id: string; member_id: string; fund: string; amount: number; given_on: string };
const FUNDS = ["십일조", "감사헌금", "주정헌금", "선교헌금", "건축헌금", "기타"];

export default function GivingBoard({ canManage }: { canManage: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Rec[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; name_suffix: string }[]>([]);
  const [form, setForm] = useState({ member: "", fund: "십일조", amount: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.schema("mod_giving").from("records")
      .select("id, member_id, fund, amount, given_on")
      .order("given_on", { ascending: false }).limit(100);
    setRows(data ?? []);
    if (canManage) {
      const { data: ms } = await supabase.from("members").select("id, name, name_suffix")
        .eq("status", "active").order("name");
      setMembers((ms ?? []) as never);
    }
  }, [supabase, canManage]);
  useEffect(() => { load(); }, [load]);

  async function record() {
    const amount = parseInt(form.amount.replace(/[^0-9]/g, ""), 10);
    if (!form.member || !amount) return alert("교인과 금액을 입력해주세요.");
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_giving").from("records")
      .insert({ church_id: cid, member_id: form.member, fund: form.fund, amount });
    if (error) return alert(error.message);
    setForm({ ...form, amount: "" });
    load();
  }

  const nameOf = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? m.name + m.name_suffix : "";
  };
  const yearTotal = rows
    .filter((r) => r.given_on.startsWith(String(new Date().getFullYear())))
    .reduce((s, r) => s + r.amount, 0);

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <p className="badge w-full justify-center py-2"
         style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
        🔒 헌금 내역은 본인과 재정 담당자만 볼 수 있습니다
      </p>

      {canManage && (
        <div className="card p-5" data-widget="giving-admin">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">헌금 기록 입력</h3>
          <div className="flex flex-wrap gap-2">
            <select className="input !w-auto flex-1" value={form.member}
                    onChange={(e) => setForm({ ...form, member: e.target.value })}>
              <option value="">교인 선택</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.name_suffix}</option>)}
            </select>
            <select className="input !w-auto" value={form.fund}
                    onChange={(e) => setForm({ ...form, fund: e.target.value })}>
              {FUNDS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <input className="input !w-32" placeholder="금액" inputMode="numeric" value={form.amount}
                   onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <button className="btn btn-primary" onClick={record}>기록</button>
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="font-black text-[var(--color-brand-700)]">{canManage ? "전체 기록" : "내 헌금"}</h3>
          <span className="ml-auto text-sm text-[var(--text-soft)]">
            올해 합계 <b style={{ color: "var(--color-positive)" }}>{yearTotal.toLocaleString()}원</b>
          </span>
        </div>
        {rows.length === 0 && <p className="text-center py-10 text-[var(--text-soft)]">기록이 없습니다.</p>}
        {rows.map((r) => (
          <div key={r.id} className="py-2 border-t border-[var(--line)] flex items-center gap-2 text-sm">
            {canManage && <b>{nameOf(r.member_id)}</b>}
            <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>{r.fund}</span>
            <span className="text-[var(--text-soft)]">{r.given_on}</span>
            <b className="ml-auto">{r.amount.toLocaleString()}원</b>
          </div>
        ))}
      </div>
    </main>
  );
}
