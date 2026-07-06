#!/bin/sh
# ChurchThrive 로컬 DB 백업 — 전체 덤프 + 7일 보존
# 사용: ./backup-db.sh   /   복원: docker exec -i supabase_db_ChungpaAttend psql -U postgres -d postgres < backups/<파일>
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$DIR/churchthrive-$STAMP.sql"
docker exec supabase_db_ChungpaAttend pg_dump -U postgres -d postgres \
  --no-owner --no-privileges > "$FILE"
gzip "$FILE"
# 7일 지난 백업 정리
find "$DIR" -name "churchthrive-*.sql.gz" -mtime +7 -delete
echo "✓ 백업 완료: $FILE.gz ($(du -h "$FILE.gz" | cut -f1))"
