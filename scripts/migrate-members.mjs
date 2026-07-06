#!/usr/bin/env node
/**
 * 데이터 이관: BlueHill21Leader vault → ChungpaAttend DB
 *  1) 출석부 생성기 HTML의 220명 배열 (명단 정본)
 *  2) B320 교인카드 YAML (phone/birthday/role/group/status/photo)
 *  3) B332 출석명단 md (2025-11 7건)
 * idempotent: (name, name_suffix) upsert. 리포트: scripts/migration-report.md
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VAULT = "/Users/xbradpig/aretevision/dev/Havruta Project/BlueHill21Leader/BlueHill21Leader/B.CHUNGPA_CHURCH/B300.교인관리";
const GEN_HTML = path.join(VAULT, "B330.출석관리", "🌐 출석부 생성기.html");
const CARDS_DIR = path.join(VAULT, "B320.교인명부");
const ATT_DIR = path.join(VAULT, "B330.출석관리", "B332.출석데이터");
const PHOTOS_OUT = fileURLToPath(new URL("../web/photos-secure/", import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

const report = { roster: 0, cards: 0, matched: 0, cardOnly: [], rosterOnly: [], photos: 0, attFiles: 0, attRows: 0, errors: [] };

/** 이름 → (base, suffix): 김선우A → 김선우 + A */
function splitName(full) {
  const m = full.match(/^(.+?)([A-Z])$/);
  return m ? { name: m[1], suffix: m[2] } : { name: full, suffix: "" };
}

// 1) 생성기 명단 (정본)
const html = fs.readFileSync(GEN_HTML, "utf8");
const arrMatch = html.match(/const members = \[([\s\S]*?)\];/);
const roster = [...arrMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
report.roster = roster.length;

// 2) 교인카드 YAML 파싱
function parseCard(dir) {
  // macOS 파일명은 NFD — NFC로 정규화해 비교
  const files = fs.readdirSync(dir);
  const cardFile = files.find((f) => f.normalize("NFC").includes("교인카드") && f.endsWith(".md"));
  if (!cardFile) return null;
  const txt = fs.readFileSync(path.join(dir, cardFile), "utf8").normalize("NFC");
  const fm = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const y = {};
  for (const line of fm[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (kv) y[kv[1]] = kv[2].trim();
  }
  return y;
}

const STATUS_MAP = { active: "active", inactive: "inactive", "이동": "moved", "소천": "deceased" };

const cardData = new Map(); // key: 표시이름 그대로 (김선우A)
const dirNameByDisplay = new Map(); // NFC 표시 이름 → 실제(NFD) 디렉토리명
for (const entry of fs.readdirSync(CARDS_DIR, { withFileTypes: true })) {
  const display = entry.name.normalize("NFC");
  if (!entry.isDirectory() || display.startsWith("B32")) continue;
  const y = parseCard(path.join(CARDS_DIR, entry.name));
  if (y?.name) {
    cardData.set(display, y);
    dirNameByDisplay.set(display, entry.name);
    report.cards++;
  }
}

// 3) 사진 복사 → web/photos-secure/ (인증 API로만 서빙)
fs.mkdirSync(PHOTOS_OUT, { recursive: true });

// 4) members upsert (정본 = roster ∪ card)
const SAMPLE_NAMES = new Set(["홍길동"]); // vault 템플릿 샘플 — 이관 제외
const allNames = new Set([...roster, ...cardData.keys()].filter((n) => !SAMPLE_NAMES.has(n)));
report.rosterOnly = roster.filter((n) => !cardData.has(n));
report.cardOnly = [...cardData.keys()].filter((n) => !roster.includes(n));

const memberIdByDisplay = new Map();
const deptCache = new Map();
{
  const { data: depts } = await supabase.from("departments").select("id, name");
  for (const d of depts) deptCache.set(d.name, d.id);
}

for (const display of allNames) {
  const { name, suffix } = splitName(display);
  const y = cardData.get(display) ?? {};
  let photoUrl = null;
  const realDir = dirNameByDisplay.get(display);
  if (realDir) {
    const dirPath = path.join(CARDS_DIR, realDir);
    const img = fs.readdirSync(dirPath).find((f) => {
      const n = f.normalize("NFC");
      return /\.(jpe?g|png)$/i.test(n) && n.replace(/\.(jpe?g|png)$/i, "") === display;
    });
    if (img) {
      const ext = img.match(/\.(jpe?g|png)$/i)[0].toLowerCase();
      fs.copyFileSync(path.join(dirPath, img), path.join(PHOTOS_OUT, `${display}${ext}`));
      photoUrl = `/api/photos/${encodeURIComponent(display)}${ext}`;
      report.photos++;
    }
  }
  const row = {
    name, name_suffix: suffix,
    phone: y.phone || null,
    birthday: /^\d{4}-\d{2}-\d{2}$/.test(y.birthday ?? "") ? y.birthday : null,
    position: y.role || "평신도",
    status: STATUS_MAP[y.status] ?? "active",
    member_type: "registered",
    photo_url: photoUrl,
  };
  const { data, error } = await supabase
    .from("members")
    .upsert(row, { onConflict: "name,name_suffix" })
    .select("id").single();
  if (error) { report.errors.push(`${display}: ${error.message}`); continue; }
  memberIdByDisplay.set(display, data.id);
  if (cardData.has(display) && roster.includes(display)) report.matched++;

  // 부서 매핑 (교인카드 group 필드)
  const deptId = deptCache.get(y.group);
  if (deptId) {
    await supabase.from("department_members").upsert(
      { member_id: data.id, department_id: deptId },
      { onConflict: "member_id,department_id" });
  }
  // QR 토큰 발급
  await supabase.from("member_qr_tokens").upsert(
    { member_id: data.id, token: cryptoToken() }, { onConflict: "member_id", ignoreDuplicates: true });
}

function cryptoToken() {
  return [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 5) 기존 출석 기록 이관
const { data: events } = await supabase.from("events").select("id, name");
const eventByName = new Map(events.map((e) => [e.name, e.id]));

for (const f of fs.readdirSync(ATT_DIR).filter((f) => f.endsWith(".md"))) {
  const txt = fs.readFileSync(path.join(ATT_DIR, f), "utf8");
  const date = txt.match(/date:\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  const service = txt.match(/service_type:\s*(.+)/)?.[1]?.trim();
  const eventId = eventByName.get(service) ?? eventByName.get("주일예배");
  if (!date || !eventId) continue;
  report.attFiles++;
  const section = txt.match(/registered_members:([\s\S]*?)(?=\n#|\nnew_families|$)/)?.[1] ?? "";
  const rows = [];
  for (const line of section.split("\n")) {
    const m = line.match(/^\s+(.+?):\s*(true|false)/);
    if (m && m[2] === "true") {
      const id = memberIdByDisplay.get(m[1].trim());
      if (id) rows.push({ member_id: id, event_id: eventId, event_date: date, method: "manual", approved: true });
    }
  }
  if (rows.length) {
    const { error } = await supabase.from("attendances")
      .upsert(rows, { onConflict: "member_id,event_id,event_date", ignoreDuplicates: true });
    if (error) report.errors.push(`${f}: ${error.message}`);
    else report.attRows += rows.length;
  }
}

// 6) 리포트
const { count: memberCount } = await supabase.from("members").select("*", { count: "exact", head: true });
const md = `# 데이터 이관 리포트

- 실행: ${new Date().toISOString()}
- 생성기 명단(정본): ${report.roster}명
- 교인카드: ${report.cards}건 / 명단과 매칭: ${report.matched}건
- 카드에만 있음(명단 누락): ${report.cardOnly.length}건 ${report.cardOnly.length ? "→ " + report.cardOnly.join(", ") : ""}
- 명단에만 있음(카드 없음): ${report.rosterOnly.length}건 ${report.rosterOnly.length ? "→ " + report.rosterOnly.join(", ") : ""}
- 사진 이관: ${report.photos}건 (${((report.photos / report.roster) * 100).toFixed(1)}%)
- DB 최종 members: ${memberCount}명
- 출석 파일: ${report.attFiles}건 → attendances ${report.attRows}행
- 오류: ${report.errors.length}건 ${report.errors.length ? "\\n" + report.errors.join("\\n") : ""}
`;
fs.writeFileSync(fileURLToPath(new URL("./migration-report.md", import.meta.url)), md);
console.log(md);
