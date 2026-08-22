#!/usr/bin/env bash
# สำรองฐานข้อมูลและไฟล์ที่อัปโหลด — รันวันละครั้งตอนตี 3 จาก cron
set -euo pipefail

BACKUP_DIR="/home/ppzstudio.com/backups"
UPLOAD_DIR="/home/ppzstudio.com/uploads"
ENV_FILE="/home/ppzstudio.com/ppzweb/.env"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# ดึงรหัสผ่านจาก .env แทนการเขียนไว้ในสคริปต์
DB_URL="$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | cut -d'"' -f2)"
DB_USER="$(sed -E 's|mysql://([^:]+):.*|\1|' <<<"$DB_URL")"
DB_PASS="$(sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|' <<<"$DB_URL")"
DB_NAME="$(sed -E 's|.*/([^?]+).*|\1|' <<<"$DB_URL")"

echo "▸ dump ฐานข้อมูล $DB_NAME"
mysqldump --single-transaction --quick --default-character-set=utf8mb4 \
  -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  | gzip -9 > "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "▸ สำรองไฟล์อัปโหลด"
tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

chmod 600 "$BACKUP_DIR/db-$STAMP.sql.gz" "$BACKUP_DIR/uploads-$STAMP.tar.gz"

echo "▸ ลบไฟล์สำรองที่เก่ากว่า $KEEP_DAYS วัน"
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +$KEEP_DAYS -delete

echo "✓ สำรองเสร็จ:"
ls -lh "$BACKUP_DIR/db-$STAMP.sql.gz" "$BACKUP_DIR/uploads-$STAMP.tar.gz"
