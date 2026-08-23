/**
 * สร้างไฟล์รูปขนาดย่อที่ยังขาดให้ครบทุกขนาด (รันซ้ำได้ ข้ามไฟล์ที่มีอยู่แล้ว)
 *
 *   pnpm tsx scripts/backfill-image-sizes.ts
 *
 * ของเดิมข้ามการสร้างขนาดที่ใหญ่กว่ารูปต้นทาง ทำให้หน้าที่ขอ -1600 ได้ 404
 * สคริปต์นี้ตามเก็บรูปที่อัปไว้ก่อนหน้านั้น
 */
import "dotenv/config";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

const WIDTHS = [400, 800, 1600];
const ROOT = process.env.UPLOAD_DIR ?? "/home/ppzstudio.com/uploads";

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const media = await prisma.media.findMany({
    select: { path: true, width: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let missingSource = 0;

  for (const m of media) {
    const source = path.join(ROOT, m.path);
    if (!(await exists(source))) {
      console.warn(`! ไม่พบไฟล์ต้นทาง ${m.path}`);
      missingSource++;
      continue;
    }

    for (const w of WIDTHS) {
      const target = path.join(ROOT, m.path.replace(/\.webp$/, `-${w}.webp`));
      if (await exists(target)) continue;

      const buffer = await sharp(source)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      await writeFile(target, buffer);
      console.log(`+ ${path.relative(ROOT, target)}  (ต้นทางกว้าง ${m.width}px)`);
      created++;
    }
  }

  console.log(
    `\nตรวจรูป ${media.length} ไฟล์ · สร้างเพิ่ม ${created} ไฟล์` +
      (missingSource ? ` · หาไฟล์ต้นทางไม่เจอ ${missingSource} ไฟล์` : ""),
  );
}

main()
  .catch((error) => {
    console.error("[backfill-image-sizes] ล้มเหลว:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
