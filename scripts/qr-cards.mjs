#!/usr/bin/env node
/** 전 교인 QR 카드 인쇄용 HTML 생성 (A4, 명함 크기 8장/면) → scripts/qr-cards.html */
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const svc = createClient(
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

const { data: rows } = await svc.from("member_qr_tokens")
  .select("token, members(name, name_suffix, status)")
  .eq("revoked", false);

const active = (rows ?? []).filter((r) => r.members?.status === "active")
  .sort((a, b) => (a.members.name).localeCompare(b.members.name, "ko"));

const cards = [];
for (const r of active) {
  const qr = await QRCode.toDataURL(r.token, { width: 220, margin: 1, color: { dark: "#1e3350" } });
  cards.push(`<div class="qcard"><img src="${qr}"><b>${r.members.name}${r.members.name_suffix}</b><span>청파중앙교회 출석 QR</span></div>`);
}

const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><title>출석 QR 카드</title>
<style>
  body{font-family:-apple-system,'Malgun Gothic',sans-serif;margin:0}
  .sheet{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;padding:8mm}
  .qcard{border:1px dashed #999;border-radius:3mm;padding:4mm;text-align:center;break-inside:avoid}
  .qcard img{width:100%;max-width:38mm}
  .qcard b{display:block;font-size:14pt;color:#1e3350}
  .qcard span{font-size:8pt;color:#777}
  @media print{.qcard{border-color:#ccc}}
</style>
<div class="sheet">${cards.join("\n")}</div></html>`;

fs.writeFileSync(fileURLToPath(new URL("./qr-cards.html", import.meta.url)), html);
console.log(`✓ qr-cards.html 생성 — ${cards.length}명 (브라우저에서 열어 인쇄)`);
