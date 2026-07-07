"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

export default function MyQR({ memberId, name }: { memberId: string; name: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("member_qr_tokens").select("token").eq("member_id", memberId).single()
      .then(async ({ data }) => {
        if (data?.token) {
          setDataUrl(await QRCode.toDataURL(data.token, { width: 480, margin: 2, color: { dark: "#1e3350" } }));
        }
      });
  }, [open, supabase, memberId]);

  return (
    <div className="card p-5">
      <button className="btn btn-ghost w-full text-lg" onClick={() => setOpen((v) => !v)}>
        {open ? "내 QR 닫기" : "📱 내 출석 QR 보기"}
      </button>
      {open && (
        <div className="flex flex-col items-center gap-2 pt-4 pop-in">
          {dataUrl
            ? <img src={dataUrl} alt={`${name} 출석 QR`} className="w-64 h-64 rounded-xl border" />
            : <p className="text-[var(--text-soft)] py-10">불러오는 중…</p>}
          <p className="font-black text-xl">{name}</p>
          <p className="text-sm text-[var(--text-soft)] text-center">
            예배 오실 때 이 화면을 담당자에게 보여주세요.<br />담당자가 스캔하면 바로 출석됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
