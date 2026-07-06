#!/usr/bin/env node
/** 교인 사진 → Supabase Storage (photos 버킷, 교회별 경로) — Workers 배포 전제 조건 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("SUPABASE_URL / SERVICE_ROLE_KEY 필요"); process.exit(1); }
const CHUNGPA = "11111111-1111-1111-1111-111111111111";
const DIR = fileURLToPath(new URL("../web/photos-secure/", import.meta.url));

const svc = createClient(URL_, KEY);

// 1) 비공개 버킷 생성 (존재 시 무시)
const { error: be } = await svc.storage.createBucket("photos", { public: false, fileSizeLimit: 5 * 1024 * 1024 });
if (be && !/already exists/i.test(be.message)) { console.error("버킷:", be.message); process.exit(1); }
await svc.storage.updateBucket("photos", { public: false, fileSizeLimit: 5 * 1024 * 1024 });

// 2) 리사이즈(최대 600px — 백로그 원칙) 후 업로드 (idempotent — upsert)
import { execSync } from "node:child_process";
const TMP = "/tmp/churchthrive-photos";
fs.mkdirSync(TMP, { recursive: true });
const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
// 한글 키 불가 → 교인 UUID를 스토리지 키로 (표시명 → id 매핑)
const { data: members } = await svc.from("members")
  .select("id, name, name_suffix").eq("church_id", CHUNGPA);
const idByDisplay = new Map((members ?? []).map((m) => [m.name + m.name_suffix, m.id]));
let ok = 0, fail = 0, unmatched = 0;
for (const f of files) {
  const display = f.normalize("NFC").replace(/\.(jpe?g|png)$/i, "");
  const mid = idByDisplay.get(display);
  if (!mid) { unmatched++; continue; }
  const resized = path.join(TMP, f);
  execSync(`sips -Z 600 -s format jpeg ${JSON.stringify(path.join(DIR, f))} --out ${JSON.stringify(resized)} >/dev/null 2>&1`);
  const buf = fs.readFileSync(resized);
  const key = `${CHUNGPA}/${mid}.jpg`;
  const { error } = await svc.storage.from("photos").upload(key, buf, {
    contentType: f.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
    upsert: true,
  });
  error ? (fail++, console.error(f, error.message)) : ok++;
}
console.log(`✓ 업로드 ${ok}건 / 실패 ${fail}건 / 미매칭 ${unmatched}건 (키: 교회ID/교인ID.jpg)`);

// 3) 검증: 서명 URL 1건 발급
const sample = `${CHUNGPA}/${[...idByDisplay.values()][0]}.jpg`;
const { data: signed } = await svc.storage.from("photos").createSignedUrl(sample, 60);
console.log("서명 URL 발급 테스트:", signed?.signedUrl ? "✅" : "❌");
