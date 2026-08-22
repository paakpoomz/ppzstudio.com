#!/usr/bin/env bash
# deploy ppzweb — รันจากเครื่องเซิร์ฟเวอร์: bash deploy.sh
set -euo pipefail

APP_DIR="/home/ppzstudio.com/ppzweb"
cd "$APP_DIR"

echo "▸ ดึงโค้ดล่าสุด"
git pull --ff-only

echo "▸ ติดตั้ง dependencies"
pnpm install --frozen-lockfile

echo "▸ อัปเดตฐานข้อมูล"
# migrate deploy ใช้เฉพาะ migration ที่ commit ไว้แล้ว ไม่สร้างใหม่ และไม่ต้องใช้ shadow db
pnpm prisma migrate deploy

echo "▸ build"
pnpm build

echo "▸ สลับ process"
# reload = สลับทีละ instance ผู้ใช้ไม่เห็น downtime (ต่างจาก restart ที่ดับพร้อมกัน)
pm2 reload ppzweb --update-env

echo "▸ ตรวจสุขภาพ"
for i in $(seq 1 10); do
  if curl -fsS http://127.0.0.1:3004/api/health >/dev/null 2>&1; then
    echo "✓ deploy สำเร็จ: $(git rev-parse --short HEAD)"
    curl -s http://127.0.0.1:3004/api/health
    echo
    exit 0
  fi
  sleep 1
done

echo "✗ แอปไม่ตอบ /api/health หลัง deploy — ดู log ด้วย: pm2 logs ppzweb --lines 50" >&2
exit 1
