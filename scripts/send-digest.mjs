#!/usr/bin/env node
/**
 * 장기 미출석자 통합 알림 발송 (R12)
 * cron으로 매시 실행 → notification_settings에서 (요일, 시간±30분) 일치 + enabled 사용자에게
 * 미출석 요약 웹 푸시 발송. 사용: crontab에  0 * * * *  node send-digest.mjs
 */
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const vapid = JSON.parse(fs.readFileSync(fileURLToPath(new URL("./.vapid.json", import.meta.url)), "utf8"));
webpush.setVapidDetails("mailto:admin@chungpa.local", vapid.publicKey, vapid.privateKey);

const svc = createClient(
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

const now = new Date();
const dow = now.getDay();
const nowMin = now.getHours() * 60 + now.getMinutes();

const { data: settings } = await svc.from("notification_settings")
  .select("user_id, threshold_weeks, send_dow, send_time, enabled")
  .eq("enabled", true).eq("kind", "absentee_digest").eq("send_dow", dow);

let sent = 0;
for (const s of settings ?? []) {
  const [h, m] = s.send_time.split(":").map(Number);
  if (Math.abs(h * 60 + m - nowMin) > 30) continue; // 매시 cron 기준 ±30분 창

  // 수신자 역할·부서 스코프는 absentee_list RPC의 RLS 로직과 동일하게 서비스에서 재현
  const { data: absentees } = await svc.rpc("absentee_list_for", {
    p_user_id: s.user_id, p_weeks: s.threshold_weeks,
  }).then(async (r) => r.error
    ? await svc.rpc("absentee_list", { p_weeks: s.threshold_weeks }) // 폴백(전체)
    : r);

  const list = absentees ?? [];
  if (list.length === 0) continue;
  const careCnt = list.filter((a) => a.care_target).length;

  const { data: subs } = await svc.from("push_subscriptions")
    .select("endpoint, keys_json").eq("user_id", s.user_id);

  const payload = JSON.stringify({
    title: `장기 미출석 ${list.length}명 (${s.threshold_weeks}주 이상)`,
    body: (careCnt ? `⚠️ 케어 대상 ${careCnt}명 포함 — ` : "") +
      list.slice(0, 5).map((a) => a.name + (a.name_suffix ?? "")).join(", ") +
      (list.length > 5 ? ` 외 ${list.length - 5}명` : ""),
    url: "/admin",
  });

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys_json }, payload);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await svc.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
}
console.log(`[digest] ${new Date().toISOString()} — ${sent}건 발송`);
