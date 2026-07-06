"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";

type Row = { member_id: string; name: string; name_suffix: string; phone: string | null;
  joined: boolean; invited: boolean; invite_token: string | null };

/** 교인 초대 보드 — 미가입 교인 검색·선택 → 일괄 링크 생성 → 문자/카톡 전달 */
export default function InviteBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [qr, setQr] = useState<{ name: string; dataUrl: string } | null>(null);

  async function showQr(r: Row) {
    let token = r.invite_token;
    if (!token) {
      const { data, error } = await supabase.rpc("create_member_invite", { p_member: r.member_id });
      if (error) return alert(error.message);
      token = data as string;
      load();
    }
    const dataUrl = await QRCode.toDataURL(linkOf(token), { width: 560, margin: 2 });
    setQr({ name: r.name + r.name_suffix, dataUrl });
  }

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("invite_board");
    setRows(data ?? []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => (r.name + r.name_suffix).includes(q.trim()));
  const notJoined = filtered.filter((r) => !r.joined);
  const joinedCount = rows.filter((r) => r.joined).length;

  function linkOf(token: string) { return `${window.location.origin}/invite/${token}`; }
  function smsHref(r: Row, link: string) {
    const body = encodeURIComponent(`[${r.name}${r.name_suffix}님] 우리 교회 앱 초대장입니다. 아래 주소를 눌러주세요 ✝\n${link}`);
    const sep = /iPhone|iPad/.test(navigator.userAgent) ? "&" : "?";
    return `sms:${r.phone ?? ""}${sep}body=${body}`;
  }

  async function inviteOne(r: Row) {
    const { data: token, error } = await supabase.rpc("create_member_invite", { p_member: r.member_id });
    if (error) return alert(error.message);
    await navigator.clipboard.writeText(linkOf(token)).catch(() => {});
    setCopied(r.member_id);
    setTimeout(() => setCopied(null), 2000);
    load();
    return token as string;
  }

  async function inviteSelected() {
    setBusy(true);
    const lines: string[] = [];
    for (const id of sel) {
      const r = rows.find((x) => x.member_id === id);
      if (!r || r.joined) continue;
      const { data: token, error } = await supabase.rpc("create_member_invite", { p_member: id });
      if (!error) lines.push(`${r.name}${r.name_suffix}: ${linkOf(token)}`);
    }
    setBulk(lines.join("\n"));
    setBusy(false);
    setSel(new Set());
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      {qr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
             style={{ background: "rgba(15,23,42,.75)" }} onClick={() => setQr(null)}>
          <div className="card p-8 text-center flex flex-col items-center gap-4 max-w-sm w-full"
               onClick={(e) => e.stopPropagation()} data-qr-modal>
            <b className="text-2xl">{qr.name} 님 초대장</b>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt="초대 QR" className="w-full rounded-2xl" data-qr-img />
            <p className="text-[var(--text-soft)] leading-relaxed">
              어르신 폰의 <b>카메라</b>로 이 화면을 비추면<br />초대장이 열립니다 📷
            </p>
            <button className="btn btn-primary w-full" onClick={() => setQr(null)}>닫기</button>
          </div>
        </div>
      )}
      <div className="card p-4">
        <p className="text-sm text-[var(--text-soft)]">
          가입 완료 <b className="text-[var(--color-positive)]">{joinedCount}명</b> ·
          미가입 <b>{rows.length - joinedCount}명</b> — 초대 링크는 7일간 유효하며,
          어르신은 링크 하나로 <b>이메일·비밀번호 없이</b> 시작합니다.
        </p>
      </div>

      <div className="flex gap-2">
        <input className="input flex-1" placeholder="이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary !min-h-12 whitespace-nowrap" disabled={sel.size === 0 || busy}
                onClick={inviteSelected} data-bulk-invite>
          {busy ? "생성 중…" : `선택 ${sel.size}명 링크 만들기`}
        </button>
      </div>

      {bulk !== null && (
        <div className="card p-4 flex flex-col gap-2" data-bulk-result>
          <b className="text-sm">일괄 초대 링크 — 복사해서 문자·카톡으로 나눠 보내세요</b>
          <textarea className="input !min-h-32 text-xs font-mono" readOnly value={bulk} />
          <button className="btn btn-primary !min-h-11 text-sm"
                  onClick={async () => { await navigator.clipboard.writeText(bulk); alert("복사됐습니다"); }}>
            전체 복사
          </button>
        </div>
      )}

      <div className="card divide-y divide-[var(--line)]" data-invite-list>
        {notJoined.map((r) => (
          <div key={r.member_id} className="flex items-center gap-3 px-4 py-3">
            <input type="checkbox" className="w-5 h-5 accent-[var(--color-brand-700)]"
                   checked={sel.has(r.member_id)}
                   onChange={(e) => setSel((p) => { const n = new Set(p); e.target.checked ? n.add(r.member_id) : n.delete(r.member_id); return n; })} />
            <span className="flex-1 font-bold">{r.name}{r.name_suffix && <sub>{r.name_suffix}</sub>}</span>
            {r.invited && <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>초대장 있음</span>}
            <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => inviteOne(r)}>
              {copied === r.member_id ? "✅ 복사됨" : "🔗 링크"}
            </button>
            <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => showQr(r)} data-qr-btn>
              📱 QR
            </button>
            {r.invite_token && r.phone && (
              <a className="btn btn-ghost !min-h-9 text-sm" href={smsHref(r, linkOf(r.invite_token))}>💬</a>
            )}
          </div>
        ))}
        {notJoined.length === 0 && (
          <p className="p-8 text-center text-[var(--text-soft)]">
            {q ? "검색 결과가 없습니다." : "🎉 모든 교인이 가입을 마쳤습니다!"}
          </p>
        )}
      </div>
    </div>
  );
}
