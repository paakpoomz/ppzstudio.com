# เรื่องที่ต้องรู้ก่อนเขียนโค้ดในโปรเจกต์นี้

## OpenLiteSpeed ตีกลับ POST/PATCH ที่ไม่มี body

เว็บนี้วิ่งผ่าน OpenLiteSpeed ที่ proxy เข้า Node — และ OLS จะตอบ **400 พร้อม body ว่าง**
ให้ request ที่เป็น `POST` หรือ `PATCH` แต่ไม่มี `Content-Length` **ตั้งแต่ยังไม่ถึง Next.js**
(ไม่มีร่องรอยใน log ของแอปเลย หาสาเหตุยาก)

```ts
// ❌ ใช้ไม่ได้ผ่าน LiteSpeed — ได้ 400
fetch("/api/admin/posts", { method: "POST" });

// ✅ ส่ง body เปล่าไปด้วยเสมอ
fetch("/api/admin/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
```

`DELETE` ที่ไม่มี body ผ่านได้ปกติ · ตรวจแล้วเมื่อ 22 ส.ค. 2569

## Next.js 16

- ไฟล์ `middleware.ts` เปลี่ยนชื่อเป็น **`proxy.ts`** และต้อง export ชื่อ `proxy`
- `params` / `searchParams` / `cookies()` / `headers()` เป็น **Promise** ต้อง `await`
- `revalidateTag(tag)` ต้องมีอาร์กิวเมนต์ที่สองเป็น cacheLife profile ·
  ใน Server Action ใช้ `updateTag(tag)` แทนจะได้ผลทันที (read-your-writes)
- route type อย่าง `PageProps<"/admin/posts">` จะยังไม่มีจนกว่าจะรัน `next build` หรือ `next dev`
  ถ้า `tsc --noEmit` ฟ้องว่า type ไม่ตรง ให้ build ก่อนแล้วเช็กใหม่

## Prisma 7

- connection URL อยู่ใน `prisma.config.ts` ไม่ใช่ `schema.prisma`
- Prisma CLI ไม่โหลด `.env` ให้เอง — `prisma.config.ts` ต้อง `import "dotenv/config"`
  และเพราะ CLI ไม่อ่าน `.env.local` เราจึงใช้ `.env` เป็นไฟล์หลัก
- ต่อฐานข้อมูลผ่าน driver adapter (`@prisma/adapter-mariadb`) ดู `src/lib/db.ts`
- `prisma migrate dev` ต้องใช้ shadow database — ผู้ใช้ `ppz_web` ไม่มีสิทธิ์ `CREATE DATABASE`
  จึงเตรียม `ppz_web_shadow` ไว้ให้แล้ว (production ใช้ `migrate deploy` ไม่ต้องใช้)

## Auth.js

- **อย่าตั้ง `NEXTAUTH_URL` ตายตัว** — ถ้าตั้งเป็น `https://ppzstudio.com`
  หน้า `dev.ppzstudio.com` จะ redirect ข้ามโดเมนไป production
  ปล่อยให้ `AUTH_TRUST_HOST=true` อ่าน host จาก request แทน

## ภาษาไทย

- สระบน/ล่างของไทยเป็น combining character ใช้เป็น object key แบบไม่ใส่ quote ไม่ได้
  (`{ ั: "a" }` esbuild จะ error) ต้องเขียน `{ "ั": "a" }`
- เวลาอ่านคำนวณจากจำนวนตัวอักษร ไม่ใช่จำนวนคำ เพราะไทยไม่มีเว้นวรรคระหว่างคำ
- `Intl.DateTimeFormat` ต้องระบุ `timeZone: "Asia/Bangkok"` ตายตัว
  ไม่งั้นเซิร์ฟเวอร์กับเบราว์เซอร์จะได้คนละค่าแล้ว React ฟ้อง hydration mismatch

## pm2 cluster + ISR cache ไม่แชร์กัน

Next เก็บ cache หน้า ISR ไว้ใน**หน่วยความจำของแต่ละ process** ซึ่งไม่แชร์กัน
พอรัน pm2 แบบ `instances: 2` เวลาเรียก `revalidatePath()` จากหลังบ้าน
instance ที่รับคำขอจะล้าง cache ให้ แต่**อีกตัวยังเสิร์ฟหน้าเก่าต่อ** —
กด "เผยแพร่" แล้วรีเฟรชสองสามครั้งจะเห็นเนื้อหาสลับไปมาระหว่างเก่ากับใหม่

แก้ด้วย `cacheMaxMemorySize: 0` ใน `next.config.ts` — ปิด cache ชั้นหน่วยความจำ
ให้ทั้งสอง instance อ่านจาก `.next/cache` บนดิสก์ซึ่งเป็นที่เดียวกันจริง
(ใช้ได้เพราะทั้งสอง instance อยู่บนเครื่องและ working directory เดียวกัน
ถ้าวันหนึ่งแยกไปคนละเครื่อง ต้องเขียน custom `cacheHandler` ที่เก็บใน Redis แทน)

## MariaDB ค้นภาษาไทยด้วย FULLTEXT ไม่ได้

MariaDB **ไม่มี ngram parser** (มีแต่ใน MySQL) และ FULLTEXT ปกติตัดคำด้วยช่องว่าง
ภาษาไทยไม่เว้นวรรคระหว่างคำจึงหาไม่เจอเลย ทดสอบแล้วบนเครื่องนี้:

```sql
MATCH(t) AGAINST('ไลฟ์' IN BOOLEAN MODE)  →  0 แถว
t LIKE '%ไลฟ์%'                            →  1 แถว  ✓
```

`src/server/content.ts` จึงใช้ `contains` (LIKE) เว็บขนาดหลักร้อยบทความเร็วพอสบาย
ถ้าวันหนึ่งช้าค่อยขยับไป Meilisearch หรือ Manticore ที่ตัดคำไทยได้

## lucide-react 1.x ตัดไอคอนแบรนด์ออกหมด

ไม่มี `Facebook`, `Youtube`, `Github` อีกแล้ว — build จะพังทันทีถ้า import
ใช้ป้ายชื่อแพลตฟอร์มเป็นข้อความแทน หรือเลือกไอคอนทั่วไปที่ความหมายใกล้เคียง
