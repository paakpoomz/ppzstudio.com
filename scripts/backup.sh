#!/usr/bin/env bash
# สำรองฐานข้อมูลและไฟล์ที่อัปโหลด — รันวันละครั้งตอนตี 3 จาก cron
set -euo pipefail

BACKUP_DIR="/home/ppzstudio.com/backups"
APP_DIR="/home/ppzstudio.com/ppzweb"
KEY_FILE="/root/.ppz-backup-key"
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

echo "▸ สำรองโค้ดพร้อมประวัติทั้งหมด"
# git bundle = ทั้ง repo และ history อยู่ในไฟล์เดียว
# กู้คืนที่ไหนก็ได้ด้วย: git clone code-xxx.bundle ppzweb
git -C "$APP_DIR" bundle create "$BACKUP_DIR/code-$STAMP.bundle" --all --quiet

echo "▸ สำรอง .env (เข้ารหัส)"
# .env มีรหัส DB และ AUTH_SECRET — เข้ารหัสก่อนเสมอ
# เพราะไฟล์สำรองมีปลายทางเป็นคลาวด์นอกเครื่อง
if [ -f "$KEY_FILE" ]; then
  gpg --symmetric --cipher-algo AES256 --batch --yes \
      --passphrase-file "$KEY_FILE" \
      -o "$BACKUP_DIR/env-$STAMP.gpg" "$ENV_FILE"
else
  echo "  ⚠ ไม่พบ $KEY_FILE — ข้ามการสำรอง .env" >&2
fi

chmod 600 "$BACKUP_DIR"/db-$STAMP.sql.gz "$BACKUP_DIR"/uploads-$STAMP.tar.gz \
          "$BACKUP_DIR"/code-$STAMP.bundle "$BACKUP_DIR"/env-$STAMP.gpg 2>/dev/null || true

echo "▸ ลบไฟล์สำรองที่เก่ากว่า $KEEP_DAYS วัน"
for pattern in 'db-*.sql.gz' 'uploads-*.tar.gz' 'code-*.bundle' 'env-*.gpg'; do
  find "$BACKUP_DIR" -name "$pattern" -mtime +$KEEP_DAYS -delete
done

echo "✓ สำรองเสร็จ:"
ls -lh "$BACKUP_DIR"/db-$STAMP.sql.gz "$BACKUP_DIR"/uploads-$STAMP.tar.gz \
       "$BACKUP_DIR"/code-$STAMP.bundle "$BACKUP_DIR"/env-$STAMP.gpg 2>/dev/null
