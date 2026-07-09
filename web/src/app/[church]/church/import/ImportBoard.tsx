"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = { name: string; suffix: string; phone: string; birthday: string; position: string; email: string };

/** 엑셀에서 복사→붙여넣기 (탭/쉼표 구분) → 미리보기 → 일괄 등록 */
export default function ImportBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<Row[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function parse() {
    const rows: Row[] = raw.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const cols = line.split(/\t|,/).map((c) => c.trim());
      const m = (cols[0] ?? "").match(/^(.+?)([A-Z])$/);
      return {
        name: m ? m[1] : cols[0] ?? "",
        suffix: m ? m[2] : "",
        phone: cols[1] ?? "", birthday: cols[2] ?? "", position: cols[3] ?? "", email: cols[4] ?? "",
      };
    }).filter((r) => r.name);
    setPreview(rows);
    setResult(null);
  }

  async function run() {
    setBusy(true);
    const { data, error } = await supabase.rpc("import_members", { p_rows: preview });
    setBusy(false);
    if (error) return setResult("❌ " + error.message);
    setResult(`✅ 등록 ${data.inserted}명 · 중복 건너뜀 ${data.skipped}명`);
    setPreview([]);
    setRaw("");
  }

  return (
    <main className="max-w-2xl md:max-w-4xl mx-auto p-4 flex flex-col gap-4">
      <div className="card p-5">
        <h3 className="font-black text-[var(--color-brand-700)] mb-1">엑셀에서 붙여넣기</h3>
        <p className="text-sm text-[var(--text-soft)] mb-3">
          열 순서: <b>이름, 전화, 생년월일(YYYY-MM-DD), 직분, 이메일</b> — 이름만 있어도 됩니다. 동명이인은 이름 끝에 A/B.
        </p>
        <textarea className="input !min-h-40 font-mono text-sm" value={raw}
                  placeholder={"김철수\t010-1234-5678\t1955-03-01\t집사\tkim@example.com\n이영희,010-2345-6789,,권사"}
                  onChange={(e) => setRaw(e.target.value)} />
        <button className="btn btn-ghost w-full mt-2" onClick={parse}>미리보기</button>
      </div>

      {preview.length > 0 && (
        <div className="card p-5">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">미리보기 — {preview.length}명</h3>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[var(--text-soft)]">
                <th className="py-1 font-bold">이름</th><th className="font-bold">전화</th>
                <th className="font-bold">생일</th><th className="font-bold">직분</th>
                <th className="font-bold">이메일</th></tr></thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--line)]">
                    <td className="py-1.5 font-bold">{r.name}{r.suffix}</td>
                    <td>{r.phone || "—"}</td><td>{r.birthday || "—"}</td><td>{r.position || "평신도"}</td>
                    <td>{r.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary w-full mt-3" disabled={busy} onClick={run}>
            {busy ? "등록 중…" : `${preview.length}명 일괄 등록`}
          </button>
        </div>
      )}
      {result && <p className="badge w-full justify-center py-3">{result}</p>}
    </main>
  );
}
