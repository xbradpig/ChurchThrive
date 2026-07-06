#!/usr/bin/env python3
"""
ChungpaAttend Presence Agent — 라즈베리파이용
  - WiFi: arp-scan으로 같은 L2 네트워크의 기기 MAC 감지 (30초 주기)
  - BLE: bleak으로 고정 UUID 비콘 태그 광고 스캔 (폰 없는 어르신용)
  - MAC/비콘ID는 SHA-256(+salt) 해시만 취급 (원본 비저장·비전송)
  - 세션화(간격 10분 초과 시 새 세션) → 시간창 규칙으로 이벤트 분류 → attendances upsert
  - 오프라인 내성: SQLite 큐, 온라인 복구 시 재전송. systemd로 상시 실행.

설치(라즈베리파이): README.md 참조
환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AGENT_SALT
"""
import hashlib
import json
import os
import sqlite3
import subprocess
import time
import urllib.request
from datetime import datetime, date

SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SALT = os.environ.get("AGENT_SALT", "chungpa-attend")
SCAN_INTERVAL = int(os.environ.get("SCAN_INTERVAL", "30"))          # 초
SESSION_GAP = int(os.environ.get("SESSION_GAP", "600"))             # 새 세션 기준(초)
DB_PATH = os.environ.get("AGENT_DB", os.path.expanduser("~/presence-queue.db"))
BLE_ENABLED = os.environ.get("BLE_ENABLED", "1") == "1"


def mac_hash(mac: str) -> str:
    return hashlib.sha256((mac.lower().strip() + SALT).encode()).hexdigest()


def api(path: str, method: str = "GET", body=None, prefer: str | None = None):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            **({"Prefer": prefer} if prefer else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


# ---------- 감지 ----------

def scan_wifi() -> set[str]:
    """arp-scan --localnet → 감지된 MAC 해시 집합"""
    try:
        out = subprocess.run(
            ["arp-scan", "--localnet", "--quiet", "--ignoredups"],
            capture_output=True, text=True, timeout=25,
        ).stdout
    except Exception:
        return set()
    hashes = set()
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and ":" in parts[1]:
            hashes.add(mac_hash(parts[1]))
    return hashes


def scan_ble() -> set[str]:
    """BLE 광고 스캔 (bleak) — 고정 주소 비콘 태그"""
    if not BLE_ENABLED:
        return set()
    try:
        import asyncio
        from bleak import BleakScanner  # type: ignore

        async def _scan():
            devices = await BleakScanner.discover(timeout=8.0)
            return {mac_hash(d.address) for d in devices}

        return asyncio.run(_scan())
    except Exception:
        return set()


# ---------- 로컬 큐 (오프라인 내성) ----------

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("""create table if not exists sessions (
        hash text, first_seen text, last_seen text, synced integer default 0,
        primary key (hash, first_seen))""")
    db.commit()
    return db


def record_sightings(db, hashes: set[str]):
    now = datetime.now().isoformat(timespec="seconds")
    for h in hashes:
        row = db.execute(
            "select first_seen, last_seen from sessions where hash=? order by first_seen desc limit 1",
            (h,),
        ).fetchone()
        if row:
            gap = (datetime.fromisoformat(now) - datetime.fromisoformat(row[1])).total_seconds()
            if gap <= SESSION_GAP:
                db.execute("update sessions set last_seen=?, synced=0 where hash=? and first_seen=?",
                           (now, h, row[0]))
                continue
        db.execute("insert or replace into sessions (hash, first_seen, last_seen, synced) values (?,?,?,0)",
                   (h, now, now))
    db.commit()


# ---------- 동기화 + 출석 기록 ----------

_devices_cache: dict[str, dict] = {}
_devices_cache_at = 0.0
_events_cache: list[dict] = []


def registered_devices() -> dict[str, dict]:
    global _devices_cache, _devices_cache_at
    if time.time() - _devices_cache_at > 300:
        rows = api("devices?select=id,member_id,mac_hash,device_kind&active=eq.true")
        _devices_cache = {r["mac_hash"]: r for r in rows}
        _devices_cache_at = time.time()
    return _devices_cache


def active_events() -> list[dict]:
    global _events_cache
    if not _events_cache:
        _events_cache = api("events?select=id,name,category,schedule_rule&active=eq.true")
    return _events_cache


def classify(ts: datetime) -> dict | None:
    """세션 시각 → schedule_rule(요일·시간창) 매칭, 미매칭 시 '방문'"""
    dow = (ts.weekday() + 1) % 7  # python 월=0 → JS/규칙 일=0 체계로
    hm = ts.strftime("%H:%M")
    fallback = None
    for e in active_events():
        rule = e.get("schedule_rule")
        if not rule:
            if e["name"] == "방문":
                fallback = e
            continue
        if dow in rule.get("dow", []) and rule.get("start", "") <= hm <= rule.get("end", "~"):
            return e
    return fallback


def sync(db):
    devices = registered_devices()
    rows = db.execute("select hash, first_seen, last_seen from sessions where synced=0").fetchall()
    for h, first_seen, last_seen in rows:
        dev = devices.get(h)
        if not dev:
            # 미등록 기기: 어떤 것도 기록하지 않음 (개인정보 원칙)
            db.execute("update sessions set synced=1 where hash=? and first_seen=?", (h, first_seen))
            continue
        ts = datetime.fromisoformat(first_seen)
        event = classify(ts)
        if not event:
            db.execute("update sessions set synced=1 where hash=? and first_seen=?", (h, first_seen))
            continue
        method = "auto_ble" if dev["device_kind"] == "ble_beacon" else "auto_wifi"
        try:
            api("presence_events", "POST", {
                "device_id": dev["id"], "first_seen": first_seen, "last_seen": last_seen,
            }, prefer="return=minimal")
            api("attendances?on_conflict=member_id,event_id,event_date", "POST", {
                "member_id": dev["member_id"], "event_id": event["id"],
                "event_date": ts.date().isoformat(), "checked_in_at": first_seen,
                "method": method, "approved": True,
            }, prefer="resolution=ignore-duplicates,return=minimal")
            api(f"devices?id=eq.{dev['id']}", "PATCH", {"last_seen_at": last_seen},
                prefer="return=minimal")
            db.execute("update sessions set synced=1 where hash=? and first_seen=?", (h, first_seen))
        except Exception as exc:  # 오프라인 등 — 큐 유지, 다음 주기 재시도
            print(f"[sync] 보류 ({exc})")
            break
    db.commit()


def main():
    print(f"[agent] 시작 — 스캔 주기 {SCAN_INTERVAL}s, BLE {'on' if BLE_ENABLED else 'off'}")
    db = init_db()
    while True:
        t0 = time.time()
        seen = scan_wifi() | scan_ble()
        record_sightings(db, seen)
        sync(db)
        elapsed = time.time() - t0
        time.sleep(max(1, SCAN_INTERVAL - elapsed))


if __name__ == "__main__":
    main()
