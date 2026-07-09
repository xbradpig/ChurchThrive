"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Hit = { name: string; at: string };

export default function Scanner({ events }: { events: { id: string; name: string }[] }) {
  const supabase = useMemo(() => createClient(), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const lastToken = useRef<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function start() {
      if (!("BarcodeDetector" in window)) {
        setError("이 브라우저는 카메라 QR 인식을 지원하지 않습니다. 아래에 QR 번호를 직접 입력해주세요.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // @ts-expect-error BarcodeDetector는 아직 TS lib에 없음
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) handleToken(codes[0].rawValue);
          } catch { /* 프레임 미준비 등 무시 */ }
        }, 400);
      } catch {
        setError("카메라 권한이 거부되었습니다. 아래에 QR 번호를 직접 입력해주세요.");
      }
    }
    start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleToken(token: string) {
    if (!token || token === lastToken.current) return; // 연속 중복 방지
    lastToken.current = token;
    setTimeout(() => { lastToken.current = ""; }, 3000);

    const { data, error } = await supabase.rpc("scan_checkin", {
      p_token: token.trim(), p_event_id: eventId, p_event_date: todayStr(),
    });
    if (error || !data?.ok) {
      setError(data?.error ?? error?.message ?? "인식 실패");
      setTimeout(() => setError(null), 2500);
      return;
    }
    if (navigator.vibrate) navigator.vibrate(80);
    setHits((h) => [{ name: data.name, at: new Date().toLocaleTimeString("ko-KR") }, ...h].slice(0, 30));
  }

  return (
    <main className="max-w-lg md:max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <select className="input font-bold" value={eventId} onChange={(e) => setEventId(e.target.value)}>
        {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      <div className="card overflow-hidden aspect-square relative bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <div className="absolute inset-8 border-4 border-white/60 rounded-2xl pointer-events-none" />
        {hits[0] && (
          <div className="absolute bottom-0 inset-x-0 p-4 text-center font-black text-xl text-white pop-in"
               style={{ background: "var(--color-positive)" }}>
            ✓ {hits[0].name}님 출석 완료
          </div>
        )}
      </div>

      {error && (
        <p className="badge w-full justify-center py-2" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input className="input flex-1" placeholder="QR 번호 직접 입력 (카메라 불가 시)"
               value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn btn-ghost" onClick={() => { handleToken(manual); setManual(""); }}>확인</button>
      </div>

      {hits.length > 0 && (
        <div className="card p-4">
          <h3 className="font-black text-[var(--color-brand-700)] mb-2">오늘 스캔 {hits.length}건</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {hits.map((h, i) => (
              <li key={i} className="flex justify-between">
                <b>{h.name}</b><span className="text-[var(--text-soft)]">{h.at}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
