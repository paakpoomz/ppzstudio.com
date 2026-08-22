/**
 * ย้ายยอดอ่านที่สะสมใน Redis ระหว่างวัน ลงฐานข้อมูล
 * รันวันละครั้งตอนเที่ยงคืนจาก cron
 *
 * ทำแบบนี้เพราะการ UPDATE ตาราง posts ทุกครั้งที่มีคนเปิดอ่าน
 * จะทำให้ DB ทำงานหนักโดยไม่จำเป็น
 */
import "dotenv/config";
import Redis from "ioredis";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

const redis = new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379/3", {
  keyPrefix: process.env.REDIS_PREFIX ?? "ppz:",
});

async function main() {
  const pending = await redis.hgetall("views:pending");
  const entries = Object.entries(pending).filter(([, v]) => Number(v) > 0);

  if (entries.length === 0) {
    console.log("ไม่มียอดอ่านค้างอยู่");
    return;
  }

  // เอาวันที่เมื่อวานเป็นเจ้าของยอด เพราะสคริปต์รันหลังเที่ยงคืน
  const statDate = new Date();
  statDate.setDate(statDate.getDate() - 1);
  statDate.setHours(0, 0, 0, 0);

  let updated = 0;

  for (const [slug, raw] of entries) {
    const views = Number(raw);
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      // บทความถูกลบไปแล้ว ทิ้งตัวนับได้เลย
      await redis.hdel("views:pending", slug);
      continue;
    }

    await prisma.$transaction([
      prisma.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: views } },
      }),
      prisma.postStat.upsert({
        where: { postId_statDate: { postId: post.id, statDate } },
        update: { views: { increment: views } },
        create: { postId: post.id, statDate, views },
      }),
    ]);

    await redis.hdel("views:pending", slug);
    updated++;
    console.log(`${slug}: +${views}`);
  }

  console.log(`อัปเดตยอดอ่าน ${updated} บทความ`);
}

main()
  .catch((error) => {
    console.error("[flush-views] ล้มเหลว:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
