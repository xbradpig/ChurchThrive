"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function NotificationSetup() {
  const supabase = useMemo(() => createClient(), []);
  const [subscribed, setSubscribed] = useState(false);
  const [setting, setSetting] = useState({ threshold_weeks: 2, send_dow: 1, send_time: "09:00", enabled: false });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notification_settings")
      .select("threshold_weeks, send_dow, send_time, enabled")
      .eq("user_id", user.id).eq("kind", "absentee_digest").maybeSingle();
    if (data) setSetting({ ...data, send_time: data.send_time.slice(0, 5) });
    const reg = await navigator.serviceWorker?.ready;
    setSubscribed(!!(await reg?.pushManager.getSubscription()));
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function save(next: typeof setting) {
    setSetting(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notification_settings").upsert({
      user_id: user.id, kind: "absentee_digest", ...next,
    });
  }

  async function subscribe() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return alert("알림 권한이 거부되었습니다.");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const { data: { user } } = await supabase.auth.getUser();
      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert(
        { user_id: user!.id, endpoint: json.endpoint!, keys_json: json.keys },
        { onConflict: "endpoint" });
      setSubscribed(true);
      await save({ ...setting, enabled: true });
    } catch (e) {
      alert("이 기기는 푸시를 지원하지 않습니다. (아이폰은 홈 화면에 설치 후 가능) " + e);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-black text-[var(--color-brand-700)] mb-1">미출석 통합 알림 설정</h3>
      <p className="text-sm text-[var(--text-soft)] mb-4">
        정한 요일·시간에 장기 미출석자 요약을 푸시로 받습니다. 케어 대상은 우선 표시됩니다.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={setting.threshold_weeks}
                onChange={(e) => save({ ...setting, threshold_weeks: Number(e.target.value) })}>
          {[2, 3, 4].map((w) => <option key={w} value={w}>{w}주 이상</option>)}
        </select>
        <select className="input !w-auto !min-h-10 text-sm font-bold" value={setting.send_dow}
                onChange={(e) => save({ ...setting, send_dow: Number(e.target.value) })}>
          {DOW.map((d, i) => <option key={i} value={i}>{d}요일</option>)}
        </select>
        <input className="input !w-auto !min-h-10 text-sm" type="time" value={setting.send_time}
               onChange={(e) => save({ ...setting, send_time: e.target.value })} />
        {subscribed ? (
          <button className="btn !min-h-10 text-sm ml-auto"
                  style={setting.enabled
                    ? { background: "var(--color-positive)", color: "#fff" }
                    : { background: "var(--color-sand-200)", color: "var(--text-soft)" }}
                  onClick={() => save({ ...setting, enabled: !setting.enabled })}>
            {setting.enabled ? "알림 켜짐" : "알림 꺼짐"}
          </button>
        ) : (
          <button className="btn btn-primary !min-h-10 text-sm ml-auto" onClick={subscribe}>
            🔔 이 기기에서 알림 받기
          </button>
        )}
      </div>
    </div>
  );
}
