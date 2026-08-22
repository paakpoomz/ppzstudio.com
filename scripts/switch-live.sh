#!/usr/bin/env bash
# สลับ ppzstudio.com จากเว็บ static เดิม → Next.js
#
#   bash switch-live.sh          สลับไปเว็บใหม่
#   bash switch-live.sh rollback ย้อนกลับเป็นเว็บเดิม
#
# ก่อนรัน: ตรวจว่า pm2 ppzweb ทำงานอยู่ และ /api/health ตอบ ok
set -euo pipefail

VHOST=/usr/local/lsws/conf/vhosts/ppzstudio.com/vhost.conf
SAFE_COPY=/home/ppzstudio.com/backups/vhost-ppzstudio-static.conf
MODE="${1:-switch}"

check_app() {
  if ! curl -fsS --max-time 5 http://127.0.0.1:3004/api/health >/dev/null; then
    echo "✗ แอปที่พอร์ต 3004 ไม่ตอบ — ยกเลิก" >&2
    echo "  ตรวจด้วย: pm2 logs ppzweb --lines 50" >&2
    exit 1
  fi
}

verify() {
  echo "▸ ตรวจหลังสลับ"
  local fail=0
  for path in / /blog /works /contact /.well-known/acme-challenge/; do
    code=$(curl -sk -o /dev/null -w "%{http_code}" "https://127.0.0.1$path" -H "Host: ppzstudio.com" --max-time 10)
    printf "   %-34s %s\n" "$path" "$code"
    case "$path" in
      /.well-known/*) [ "$code" = "404" ] || [ "$code" = "403" ] || [ "$code" = "200" ] || fail=1 ;;
      *) [ "$code" = "200" ] || fail=1 ;;
    esac
  done
  return $fail
}

if [ "$MODE" = "rollback" ]; then
  if [ ! -f "$SAFE_COPY" ]; then
    echo "✗ ไม่พบไฟล์สำรอง $SAFE_COPY — ย้อนกลับอัตโนมัติไม่ได้" >&2
    exit 1
  fi
  echo "▸ คืน vhost.conf เดิม"
  cp "$SAFE_COPY" "$VHOST"
  chown lsadm:lsadm "$VHOST"
  systemctl restart lshttpd
  sleep 3
  echo "✓ ย้อนกลับเป็นเว็บ static เดิมแล้ว"
  curl -sk -o /dev/null -w "   หน้าแรก -> %{http_code}\n" https://127.0.0.1/ -H "Host: ppzstudio.com"
  exit 0
fi

check_app

# เก็บสำเนา vhost เดิมไว้ที่เดิมเสมอ เพื่อให้ rollback หาเจอแน่นอน
if [ ! -f "$SAFE_COPY" ]; then
  echo "▸ เก็บสำเนา vhost เดิมไว้ที่ $SAFE_COPY"
  cp "$VHOST" "$SAFE_COPY"
fi

echo "▸ เขียน vhost.conf ใหม่"
cat > "$VHOST" <<'CONF'
docRoot                   $VH_ROOT/public_html
vhDomain                  $VH_NAME
vhAliases                 www.$VH_NAME
adminEmails               contact@ppzstudio.com
enableGzip                1
enableIpGeo               1

errorlog $VH_ROOT/logs/$VH_NAME.error_log {
  useServer               0
  logLevel                WARN
  rollingSize             10M
}

accesslog $VH_ROOT/logs/$VH_NAME.access_log {
  useServer               0
  logFormat               "%h %l %u %t "%r" %>s %b "%{Referer}i" "%{User-Agent}i""
  logHeaders              5
  rollingSize             10M
  keepDays                10
  compressArchive         1
}

index  {
  useServer               0
  indexFiles              index.html
}

module cache {
  storagePath             /usr/local/lsws/cachedata/$VH_NAME
}

rewrite  {
  enable                  1
  autoLoadHtaccess        1
  rules                   <<<END_rules
RewriteCond %{HTTPS} !on
RewriteRule ^(.*)$ https://%{SERVER_NAME}%{REQUEST_URI} [R=301,L]
  END_rules
}

# ── ปลายทาง Next.js (pm2 ชื่อ ppzweb) ──
extprocessor ppzweb {
  type                    proxy
  address                 127.0.0.1:3004
  maxConns                100
  pcKeepAliveTimeout      60
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}

# ── ต่ออายุ SSL — ต้องมาก่อน context / และห้ามลบ ──
context /.well-known/acme-challenge {
  location                /usr/local/lsws/Example/html/.well-known/acme-challenge
  allowBrowse             1

  rewrite  {
    enable                0
  }
  addDefaultCharset       off
}

# ── รูปที่อัปจากหลังบ้าน — LiteSpeed เสิร์ฟตรง ไม่ผ่าน Node ──
context /uploads {
  location                /home/ppzstudio.com/uploads/
  allowBrowse             1
  extraHeaders            set Cache-Control public, max-age=31536000, immutable

  rewrite  {
    enable                0
  }
}

# ── ที่เหลือทั้งหมดเข้า Next.js ──
context / {
  type                    proxy
  handler                 ppzweb
  addDefaultCharset       off
}

vhssl  {
  keyFile                 /etc/letsencrypt/live/ppzstudio.com/privkey.pem
  certFile                /etc/letsencrypt/live/ppzstudio.com/fullchain.pem
  certChain               1
  enableECDHE             1
  renegProtection         1
  sslSessionCache         1
  enableSpdy              15
  enableStapling          1
  ocspRespMaxAge          86400
}
CONF

chown lsadm:lsadm "$VHOST"

echo "▸ restart OpenLiteSpeed"
systemctl restart lshttpd
sleep 3

if verify; then
  echo "✓ สลับเสร็จ — https://ppzstudio.com ใช้ระบบใหม่แล้ว"
else
  echo "✗ ตรวจไม่ผ่าน กำลังย้อนกลับอัตโนมัติ" >&2
  cp "$SAFE_COPY" "$VHOST"
  chown lsadm:lsadm "$VHOST"
  systemctl restart lshttpd
  echo "✓ ย้อนกลับเป็นเว็บเดิมแล้ว" >&2
  exit 1
fi
