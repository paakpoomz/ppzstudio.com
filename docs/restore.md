# วิธีกู้คืนเว็บ ppzstudio.com

ทดสอบกู้คืนจริงแล้วเมื่อ 22 ส.ค. 2569 — ทั้ง 4 ไฟล์กู้ได้ครบ

## ไฟล์สำรองมีอะไรบ้าง

อยู่ที่ `/home/ppzstudio.com/backups/` สร้างใหม่ทุกคืนตี 3 เก็บ 14 วัน

| ไฟล์ | คืออะไร |
|---|---|
| `db-YYYYMMDD-HHMMSS.sql.gz` | ฐานข้อมูล `ppz_web` ทั้งก้อน |
| `uploads-*.tar.gz` | รูปที่อัปจากหลังบ้าน |
| `code-*.bundle` | โค้ดทั้งหมดพร้อมประวัติ git |
| `env-*.gpg` | `.env` ที่เข้ารหัส AES256 แล้ว |
| `vhost-ppzstudio-static.conf` | vhost ของเว็บ static เดิม (ทางย้อนกลับ) |

**passphrase ของไฟล์ `.gpg`** อยู่ที่ `/root/.ppz-backup-key` บนเครื่อง
และ**ต้องมีสำเนาใน password manager ของเจ้าของด้วย** — ถ้าเครื่องพังพร้อมกับ passphrase
ไฟล์ที่เข้ารหัสไว้ก็เปิดไม่ได้

## กู้คืนทั้งเครื่องจากศูนย์

```bash
# 1. โค้ด — bundle เป็น git repo เต็มรูปแบบ clone ได้เลย
git clone code-20260822-220546.bundle ppzweb
cd ppzweb

# 2. .env
gpg --decrypt --passphrase-file <ไฟล์ passphrase> \
    -o .env env-20260822-220546.gpg
chmod 600 .env

# 3. ฐานข้อมูล
mysql -e "CREATE DATABASE ppz_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
          CREATE DATABASE ppz_web_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
          CREATE USER 'ppz_web'@'localhost' IDENTIFIED BY '<รหัสจาก .env>';
          GRANT ALL ON ppz_web.* TO 'ppz_web'@'localhost';
          GRANT ALL ON ppz_web_shadow.* TO 'ppz_web'@'localhost';"
gunzip -c db-20260822-220546.sql.gz | mysql ppz_web

# 4. รูป
tar -xzf uploads-20260822-220546.tar.gz -C /home/ppzstudio.com/

# 5. ติดตั้งและรัน
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm build
pm2 start ecosystem.config.js && pm2 save

# 6. vhost — ดู docs/vhost-snippet.conf หรือรัน
bash scripts/switch-live.sh
```

## ถ้า .env หายไปเฉย ๆ (ไม่มีไฟล์สำรอง)

ไม่ใช่เรื่องคอขาดบาดตาย — ในนั้นมีความลับจริงแค่ 2 ค่า และสร้างใหม่ได้ทั้งคู่

```bash
# รหัส DB
mysql -e "ALTER USER 'ppz_web'@'localhost' IDENTIFIED BY '<รหัสใหม่>';"
# แล้วแก้ DATABASE_URL กับ SHADOW_DATABASE_URL ใน .env

# AUTH_SECRET
openssl rand -base64 32
# ผลข้างเคียง: คนที่ล็อกอินค้างไว้ต้องล็อกอินใหม่
```

ค่าที่เหลืออีก 11 บรรทัดไม่ใช่ความลับ ลอกจาก `.env.example` ได้เลย

## ย้อนกลับเป็นเว็บ static เดิม

```bash
bash scripts/switch-live.sh rollback
```
