#!/usr/bin/env python3
"""
기기 등록 서버 (LAN 전용, 라즈베리파이에서 실행)
  교인이 교회 WiFi에 접속한 상태로 PWA에서 "이 폰 등록"을 누르면
  이 서버가 요청 IP의 ARP 테이블에서 MAC을 찾아 해시 후 Supabase에 등록.
  원본 MAC은 저장·전송하지 않음. 등록에는 PWA가 전달한 교인 식별 토큰 필요.

실행: AGENT_SALT=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 register_server.py
"""
import hashlib
import json
import os
import re
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request

SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SALT = os.environ.get("AGENT_SALT", "chungpa-attend")
PORT = int(os.environ.get("REGISTER_PORT", "8420"))


def mac_for_ip(ip: str) -> str | None:
    try:
        out = subprocess.run(["ip", "neigh", "show", ip], capture_output=True, text=True).stdout
    except FileNotFoundError:  # macOS 개발 환경
        out = subprocess.run(["arp", "-n", ip], capture_output=True, text=True).stdout
    m = re.search(r"([0-9a-fA-F]{1,2}(?::[0-9a-fA-F]{1,2}){5})", out)
    return m.group(1) if m else None


def api(path, method="GET", body=None, prefer=None):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                 "Content-Type": "application/json",
                 **({"Prefer": prefer} if prefer else {})})
    with urllib.request.urlopen(req, timeout=10) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_POST(self):
        if self.path != "/register":
            return self._send(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length))
            qr_token = body["qr_token"]            # 본인 확인: 내 QR 토큰
            label = body.get("label", "내 폰")
        except Exception:
            return self._send(400, {"ok": False, "error": "잘못된 요청"})

        rows = api(f"member_qr_tokens?select=member_id&token=eq.{qr_token}&revoked=eq.false")
        if not rows:
            return self._send(403, {"ok": False, "error": "본인 확인에 실패했습니다"})
        member_id = rows[0]["member_id"]

        ip = self.client_address[0]
        mac = mac_for_ip(ip)
        if not mac:
            return self._send(422, {"ok": False, "error": "기기를 식별하지 못했습니다. WiFi 연결을 확인해주세요."})

        h = hashlib.sha256((mac.lower() + SALT).encode()).hexdigest()
        api("devices?on_conflict=mac_hash", "POST", {
            "member_id": member_id, "device_kind": "wifi", "mac_hash": h, "label": label,
        }, prefer="resolution=merge-duplicates,return=minimal")
        self._send(200, {"ok": True})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print(f"[register] LAN 등록 서버 :{PORT}")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
