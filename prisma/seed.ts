import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    slug: "web-development",
    name: "พัฒนาเว็บไซต์",
    description: "บทความเรื่องการสร้างเว็บ ตั้งแต่หน้าบ้านถึงหลังบ้าน",
    sortOrder: 1,
  },
  {
    slug: "live-streaming",
    name: "ถ่ายทอดสด",
    description: "การตั้งค่า อุปกรณ์ และเทคนิคการไลฟ์ให้ภาพนิ่งเสียงชัด",
    sortOrder: 2,
  },
  {
    slug: "digital-media",
    name: "สื่อดิจิทัล",
    description: "งานตัดต่อ กราฟิก และการผลิตคอนเทนต์",
    sortOrder: 3,
  },
  {
    slug: "tips",
    name: "เคล็ดลับ",
    description: "ของเล็ก ๆ ที่ใช้ได้จริงในงานประจำวัน",
    sortOrder: 4,
  },
];

const TECHS = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "MariaDB",
  "Tailwind CSS",
  "PHP",
  "Docker",
  "Flutter",
  "Figma",
  "OBS Studio",
  "Adobe Premiere Pro",
];

const SETTINGS: Record<string, unknown> = {
  "site.title": "PPz Studio",
  "site.tagline": "สื่อดิจิทัล ถ่ายทอดสด และเว็บไซต์",
  "site.description":
    "PPz Studio รับผลิตสื่อดิจิทัล ถ่ายทอดสด (Live Streaming) และพัฒนาเว็บไซต์ครบวงจร",
  "hero.heading": "เราทำสื่อดิจิทัล ไลฟ์สตรีม และเว็บไซต์",
  "hero.subheading":
    "ตั้งแต่วางคอนเซปต์ ถ่ายทำ ถ่ายทอดสด ไปจนถึงเขียนเว็บและแอปให้ใช้งานได้จริง",
  "contact.email": "contact@ppzstudio.com",
  "contact.phone": "090-939-5300",
  "contact.response_time": "ตอบกลับภายใน 1 วันทำการ",
  "social.facebook": "",
  "social.youtube": "",
  "social.line": "",
  "stats.years": 5,
  "stats.projects": 0,
  "stats.clients": 0,
};

function slugifyTech(name: string) {
  return name
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  // ── ผู้ใช้แอดมิน ───────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL ?? "admin@ppzstudio.com";
  const existing = await prisma.user.findUnique({ where: { email } });

  let generatedPassword: string | null = null;
  if (existing) {
    console.log(`• ผู้ใช้ ${email} มีอยู่แล้ว ข้ามไป`);
  } else {
    const password =
      process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
    if (!process.env.ADMIN_PASSWORD) generatedPassword = password;

    await prisma.user.create({
      data: {
        email,
        name: "PPz Admin",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log(`• สร้างผู้ใช้แอดมิน ${email}`);
  }

  // ── หมวดหมู่บทความ ─────────────────────────────────────────────
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log(`• หมวดหมู่ ${CATEGORIES.length} หมวด`);

  // ── คลัง tech stack ────────────────────────────────────────────
  for (const name of TECHS) {
    const slug = slugifyTech(name);
    await prisma.tech.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
  }
  console.log(`• tech stack ${TECHS.length} รายการ`);

  // ── ค่าตั้งต้นของเว็บ ───────────────────────────────────────────
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},           // ไม่ทับค่าที่แก้ไว้แล้วในหลังบ้าน
      create: { key, valueJson: value as never },
    });
  }
  console.log(`• ค่าตั้งต้น ${Object.keys(SETTINGS).length} รายการ`);

  // ── redirect ของ URL เดิม ──────────────────────────────────────
  await prisma.redirect.upsert({
    where: { fromPath: "/donate" },
    update: { toPath: "/support", statusCode: 301 },
    create: { fromPath: "/donate", toPath: "/support", statusCode: 301 },
  });
  console.log("• redirect /donate → /support");

  if (generatedPassword) {
    console.log("\n" + "─".repeat(56));
    console.log("  รหัสผ่านแอดมินที่สุ่มให้ (แสดงครั้งเดียว):");
    console.log(`  อีเมล   : ${email}`);
    console.log(`  รหัสผ่าน : ${generatedPassword}`);
    console.log("  เก็บไว้ให้ดี แล้วเปลี่ยนหลังล็อกอินครั้งแรก");
    console.log("─".repeat(56) + "\n");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
