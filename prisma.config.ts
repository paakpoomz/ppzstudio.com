import "dotenv/config"; // Prisma 7 ไม่โหลด .env ให้เอง ต้องโหลดเองตรงนี้
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
    // ผู้ใช้ ppz_web ไม่มีสิทธิ์ CREATE DATABASE จึงต้องเตรียม shadow db ไว้ให้ล่วงหน้า
    // (ใช้เฉพาะตอน `prisma migrate dev` — production ใช้ `migrate deploy` ที่ไม่ต้องใช้)
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
