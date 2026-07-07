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
  const { data: absentees, error: alErr } = await svc.rpc("absentee_list_for", {
    p_user_id: s.user_id, p_weeks: s.threshold_weeks,
  });
  if (alErr) { console.error("[digest] absentee_list_for 실패:", alErr.message); continue; }

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
/* ===== 주간 현황 다이제스트 (kind: stats_digest — church-stats-upgrade §2-④) ===== */
const { data: statSettings } = await svc.from("notification_settings")
  .select("user_id, send_dow, send_time, enabled")
  .eq("enabled", true).eq("kind", "stats_digest").eq("send_dow", dow);

for (const s of statSettings ?? []) {
  const [h, m] = s.send_time.split(":").map(Number);
  if (Math.abs(h * 60 + m - nowMin) > 30) continue;

  const { data: d, error } = await svc.rpc("stats_digest_for", { p_user_id: s.user_id });
  if (error || !d) { if (error) console.error("[stats-digest] 실패:", error.message); continue; }

  const parts = [`주일 출석 ${d.sunday_att}명`, `새가족 ${d.new_families}명`, `3주 미출석 ${d.absentees_3w}명`];
  if (d.giving_week != null) parts.push(`주간 헌금 ${Number(d.giving_week).toLocaleString("ko-KR")}원`); // 열람 자격자만

  const { data: subs } = await svc.from("push_subscriptions")
    .select("endpoint, keys_json").eq("user_id", s.user_id);
  const payload = JSON.stringify({ title: "📊 주간 교회 현황", body: parts.join(" · "), url: "/stats" });

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

/* ===== 교적 수정 요청 즉시 통지 (member-card-self-service W5) =====
   매시 실행 시 미통지(pending & notified_at null) 요청을 교회별 집계 →
   해당 교회 승인권자(superadmin/pastor)에게 발송. 발송 성공 후에만 notified_at 마킹
   (실패 시 null 유지 → 다음 크론 자동 재시도) */
const { data: editReqs } = await svc.from("member_edit_requests")
  .select("id, church_id").eq("status", "pending").is("notified_at", null);

const byChurch = new Map();
for (const r of editReqs ?? []) {
  if (!byChurch.has(r.church_id)) byChurch.set(r.church_id, []);
  byChurch.get(r.church_id).push(r.id);
}

for (const [churchId, ids] of byChurch) {
  const { data: approvers } = await svc.from("church_roles")
    .select("user_id, role").eq("church_id", churchId).in("role", ["superadmin", "pastor"]);
  const userIds = (approvers ?? []).map((a) => a.user_id);
  if (!userIds.length) continue;

  const { data: subs } = await svc.from("push_subscriptions")
    .select("endpoint, keys_json").in("user_id", userIds);
  const payload = JSON.stringify({
    title: `📇 교적 수정 요청 ${ids.length}건`,
    body: "교인이 교적 수정을 요청했습니다. 확인 후 승인해주세요.",
    url: "/church?tab=members",
  });

  let delivered = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys_json }, payload);
      sent++; delivered++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await svc.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
  // 구독자가 없으면 마킹하지 않음 — 구독 등록 후 다음 크론에서 통지
  if (delivered > 0) {
    await svc.from("member_edit_requests").update({ notified_at: new Date().toISOString() }).in("id", ids);
  }
}

console.log(`[digest] ${new Date().toISOString()} — ${sent}건 발송`);
