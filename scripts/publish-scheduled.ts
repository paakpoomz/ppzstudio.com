/**
 * เปลี่ยนบทความที่ตั้งเวลาไว้ให้เป็นเผยแพร่เมื่อถึงเวลา
 * รันทุก 5 นาทีจาก cron
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ppzstudio.com";

async function main() {
  const due = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
    },
    select: { id: true, slug: true, title: true },
  });

  if (due.length === 0) return;

  await prisma.post.updateMany({
    where: { id: { in: due.map((p) => p.id) } },
    data: { status: "PUBLISHED" },
  });

  for (const post of due) {
    console.log(`เผยแพร่: ${post.title} → ${SITE}/blog/${post.slug}`);
  }
  console.log(`รวม ${due.length} เรื่อง`);
}

main()
  .catch((error) => {
    console.error("[publish-scheduled] ล้มเหลว:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
