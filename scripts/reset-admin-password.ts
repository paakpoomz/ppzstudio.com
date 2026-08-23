/**
 * ตั้งรหัสผ่านผู้ใช้หลังบ้านใหม่ — ใช้ตอนลืมรหัส (ต้องรันบนเครื่องที่เข้าถึง .env ได้เท่านั้น)
 *
 *   pnpm tsx scripts/reset-admin-password.ts [อีเมล] [รหัสใหม่]
 *
 * ไม่ใส่รหัสใหม่ = สุ่มให้ แล้วพิมพ์ออกมาครั้งเดียว (ไม่ได้เก็บไว้ที่ไหน)
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

async function main() {
  const email = process.argv[2] ?? process.env.ADMIN_EMAIL ?? "admin@ppzstudio.com";
  const provided = process.argv[3];
  const password = provided ?? randomBytes(12).toString("base64url");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, role: true },
  });
  if (!user) throw new Error(`ไม่พบผู้ใช้ ${email}`);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });

  console.log(`ตั้งรหัสใหม่ให้ ${email} (${user.name} · ${user.role}) เรียบร้อย`);
  if (!provided) console.log(`รหัสผ่านใหม่: ${password}`);
}

main()
  .catch((error) => {
    console.error("[reset-admin-password] ล้มเหลว:", error.message ?? error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
