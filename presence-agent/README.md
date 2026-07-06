# Presence Agent — 라즈베리파이 설치 가이드

교회 로비 WiFi에 접속한 등록 기기(폰/BLE 태그)를 감지해 출석을 자동 기록합니다.

## 준비물
- Raspberry Pi 4/5 (2GB 이상) + microSD 16GB+ + 전원
- 교회 로비 WiFi 공유기와 **같은 네트워크**에 유선(권장) 또는 무선 연결

## 설치 (약 15분)

```bash
# 1) OS: Raspberry Pi OS Lite 설치 후 SSH 접속
sudo apt update && sudo apt install -y arp-scan python3-pip
pip3 install bleak              # BLE 태그 감지용 (선택)

# 2) 코드 복사
scp -r presence-agent pi@<파이IP>:/home/pi/

# 3) 환경 설정
cat > /home/pi/chungpa-agent.env <<EOF
SUPABASE_URL=https://<프로젝트>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role 키>
AGENT_SALT=<임의의 긴 문자열 — 한 번 정하면 변경 금지>
BLE_ENABLED=1
EOF
chmod 600 /home/pi/chungpa-agent.env

# 4) 서비스 등록 (전원 재투입 시 자동 시작)
sudo cp /home/pi/presence-agent/chungpa-agent.service /etc/systemd/system/
sudo systemctl enable --now chungpa-agent

# 5) 기기 등록 서버 (같은 방식으로 register_server.py도 서비스 등록)
```

## 동작 원리
- 30초마다 `arp-scan`(WiFi) + BLE 광고 스캔 → MAC을 **SHA-256 해시로만** 취급
- 등록된 기기만 기록, 미등록 기기는 어떤 것도 저장하지 않음
- 세션(도착~마지막 감지)을 events.schedule_rule(요일·시간창)에 매칭해
  주일예배/수요예배/방문 등으로 자동 분류 → `attendances` upsert
- 인터넷 단절 시 로컬 SQLite 큐에 보관, 복구 시 자동 재전송

## 주의
- `AGENT_SALT`를 바꾸면 기존 등록 기기가 전부 무효화됩니다
- iOS "비공개 Wi-Fi 주소"가 **고정**(기본값)이면 정상, **회전**이면 재등록 필요
- BLE 태그는 고정 주소 방식 비콘만 사용 (갤럭시 스마트태그/에어태그 불가)
