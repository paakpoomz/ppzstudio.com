import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// ขนาดที่สร้างไว้ล่วงหน้า — เสิร์ฟตรงจาก LiteSpeed ไม่ต้องแปลงตอนมีคนเข้า
const WIDTHS = [400, 800, 1600] as const;

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

export type UploadedImage = {
  path: string; // เทียบกับ UPLOAD_DIR เช่น 2026/08/ab12cd.webp
  filename: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  blurData: string;
};

function uploadRoot() {
  return process.env.UPLOAD_DIR ?? "/home/ppzstudio.com/uploads";
}

/** URL ที่เอาไปใส่ใน src ของ <img> */
export function mediaUrl(storedPath: string, width?: number): string {
  const base = process.env.UPLOAD_PUBLIC_PATH ?? "/uploads";
  if (!width) return `${base}/${storedPath}`;
  return `${base}/${storedPath.replace(/\.webp$/, `-${width}.webp`)}`;
}

/**
 * รับไฟล์ที่อัปมา → ตรวจว่าเป็นรูปจริง → แปลงใหม่เป็น WebP หลายขนาด
 *
 * การ "แปลงใหม่" สำคัญกว่าที่คิด: ไฟล์รูปที่แนบโค้ดอันตรายมาด้วย
 * (เช่น PHP ซ่อนใน EXIF) จะถูกทิ้งไปตอน sharp ถอดรหัสแล้วเข้ารหัสใหม่
 */
export async function processUpload(file: File): Promise<UploadedImage> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `ไฟล์ใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)}MB) — รับได้ไม่เกิน 10MB`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // อ่านจากเนื้อไฟล์จริง ไม่เชื่อนามสกุลหรือ Content-Type ที่ client ส่งมา
  const probe = sharp(buffer, { failOn: "error" });
  const meta = await probe.metadata().catch(() => null);

  if (!meta?.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new Error("ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ (รับ JPEG, PNG, WebP, AVIF, GIF, TIFF)");
  }
  if (!meta.width || !meta.height) {
    throw new Error("อ่านขนาดรูปไม่ได้ ไฟล์อาจเสียหาย");
  }

  const now = new Date();
  const dir = path.join(
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const id = randomBytes(8).toString("hex"); // ตั้งชื่อใหม่ ไม่ใช้ชื่อไฟล์เดิมของผู้ใช้
  const absDir = path.join(/*turbopackIgnore: true*/ uploadRoot(), dir);
  await mkdir(absDir, { recursive: true });

  // ตัวเต็ม
  const full = await sharp(buffer)
    .rotate() // หมุนตาม EXIF ก่อน แล้ว metadata จะถูกตัดทิ้งตอนเขียนใหม่
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const storedPath = path.join(dir, `${id}.webp`);
  await writeFile(path.join(/*turbopackIgnore: true*/ uploadRoot(), storedPath), full.data);

  // ขนาดย่อ — ไม่ขยายรูปที่เล็กกว่าเป้าอยู่แล้ว
  await Promise.all(
    WIDTHS.filter((w) => w < full.info.width).map(async (w) => {
      const resized = await sharp(buffer)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      await writeFile(
        path.join(/*turbopackIgnore: true*/ uploadRoot(), dir, `${id}-${w}.webp`),
        resized,
      );
    }),
  );

  // ภาพเบลอจิ๋วสำหรับใส่เป็น placeholder ระหว่างรูปจริงโหลด
  const blur = await sharp(buffer)
    .rotate()
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    path: storedPath,
    filename: file.name.slice(0, 255),
    mime: "image/webp",
    width: full.info.width,
    height: full.info.height,
    bytes: full.info.size,
    blurData: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}
