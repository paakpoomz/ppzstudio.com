import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 ต่อฐานข้อมูลผ่าน driver adapter — connection URL ไม่ได้อยู่ใน schema แล้ว
function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("ไม่พบ DATABASE_URL — ตรวจว่าไฟล์ .env มีอยู่และอ่านได้");
  }

  const adapter = new PrismaMariaDb(url, {
    // MariaDB ใช้ collation utf8mb4_unicode_ci อยู่แล้ว ไม่ต้องตั้งเพิ่ม
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

// ตอน dev Next.js reload โมดูลบ่อย ถ้าไม่เก็บไว้ใน global จะเปิด connection pool ใหม่ทุกครั้ง
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
