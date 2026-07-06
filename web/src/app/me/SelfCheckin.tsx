"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SelfCheckin({ events }: { events: { id: string; name: string }[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [done, setDone] = useState(false);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  async function checkin() {
    const { error } = await supabase.rpc("self_checkin", { p_event_id: eventId });
    if (!error) setDone(true);
    else alert("요청에 실패했습니다: " + error.message);
  }

  if (events.length === 0) return null;

  return (
    <div className="card p-5 flex items-center gap-3 pop-in">
      {done ? (
        <p className="font-bold" style={{ color: "var(--color-positive)" }}>
          ✓ 출석 인증을 보냈습니다. 담당자 확인 후 출석이 확정됩니다.
        </p>
      ) : (
        <>
          <select className="input !w-auto font-bold" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button className="btn btn-primary flex-1 text-lg" onClick={checkin}>
            📍 오늘 출석 인증
          </button>
        </>
      )}
    </div>
  );
}
