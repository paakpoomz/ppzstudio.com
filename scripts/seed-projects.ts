/**
 * ใส่ผลงานชุดแรกเข้าฐานข้อมูลเป็นฉบับร่าง (รันซ้ำได้ — อิง slug)
 *
 *   pnpm tsx scripts/seed-projects.ts
 *
 * เนื้อหาเขียนจากสิ่งที่ตรวจได้จริงบนเครื่องเท่านั้น ท่อน "ผลลัพธ์" เว้นให้เจ้าของเติมตัวเลขเอง
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

type Seed = {
  slug: string;
  title: string;
  summary: string;
  kind: "WEBSITE" | "APP" | "PROGRAM" | "MEDIA" | "LIVE_STREAM";
  year: number;
  liveUrl?: string;
  clientName?: string;
  myRole: string;
  techs: string[];
  isFeatured?: boolean;
  sections: [string, string[]][]; // [หัวข้อ, ย่อหน้า]
};

const RESULT_TODO =
  "รอเติมตัวเลขจริง เช่น จำนวนผู้ใช้ เวลาที่ประหยัดได้ หรือยอดเข้าชม";

const seeds: Seed[] = [
  {
    slug: "kruthai-app",
    title: "KruThai.app — แพลตฟอร์มเครื่องมือครูครบวงจร",
    summary:
      "แพลตฟอร์มช่วยครูไทยทำแฟ้มผลงาน ว.PA จัดการห้องเรียน เช็คชื่อด้วย QR คลังข้อสอบ และตรวจกระดาษคำตอบด้วย AI",
    kind: "APP",
    year: 2026,
    liveUrl: "https://kruthai.app",
    myRole: "ออกแบบระบบและพัฒนาเองทั้งหมด",
    isFeatured: true,
    techs: [
      "Next.js 16",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "NextAuth",
      "MinIO / S3",
      "Google Gemini",
      "Tailwind CSS",
    ],
    sections: [
      [
        "โจทย์",
        [
          "ครูไทยต้องทำแฟ้มผลงาน ว.PA ตามเกณฑ์กระทรวงศึกษาธิการ ควบคู่กับงานสอนประจำวัน ทั้งเช็คชื่อ มอบหมายงาน ออกข้อสอบ และรวมคะแนน ซึ่งกระจายอยู่คนละเครื่องมือ",
          "เป้าหมายคือรวมงานเอกสารทั้งหมดไว้ที่เดียว ให้ครูทำเสร็จได้จากมือถือเครื่องเดียว",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "สร้างแพลตฟอร์มเดียวที่ครอบคลุม e-Portfolio ว.PA, ระบบห้องเรียนและกลุ่มนักเรียน, มอบหมายงาน–ส่งงาน–ให้คะแนน, บันทึกผลการเรียนที่ export Excel ได้ และแผนการสอนที่ผูกกับแฟ้ม ว.PA รายปี",
          "ระบบเช็คชื่อด้วย QR ทำแบบ rotating QR ผูกกับ fingerprint ของอุปกรณ์ มี scan ticket และ audit log กันนักเรียนสแกนแทนกัน",
          "คลังข้อสอบและระบบสอบออนไลน์ พร้อมโหมด OMR แบบออฟไลน์ — พิมพ์กระดาษคำตอบเป็น PDF แล้วใช้มือถือถ่ายให้ AI อ่านและตรวจให้อัตโนมัติ",
          "ระบบสมาชิก Free/Pro ชำระเงินผ่าน PromptPay พร้อมระบบเครดิต AI คูปอง และหลังบ้านสำหรับผู้ดูแลระบบ",
          "เข้าสู่ระบบด้วย Google และ LINE OAuth ตั้งค่าได้จากหน้าแอดมินโดยไม่ต้องแก้ไฟล์",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "thai-sound-md",
    title: "Thai Sound MD — มาร์เก็ตเพลสเพลงและ Stems",
    summary:
      "แพลตฟอร์มซื้อขายเพลงและไฟล์ stems พร้อมระบบผสมเสียง ตะกร้าสินค้า ระบบแนะนำเพื่อน และการจ่ายเงินให้ผู้ขาย",
    kind: "APP",
    year: 2026,
    liveUrl: "https://thaisoundmd.com",
    myRole: "พัฒนาและดูแลระบบทั้ง frontend, API และงาน DevOps",
    isFeatured: true,
    techs: [
      "NestJS",
      "Next.js",
      "Turborepo",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Docker",
      "Cloudflare R2",
      "Stripe",
      "Sentry",
    ],
    sections: [
      [
        "โจทย์",
        [
          "ต้องการร้านขายเพลงออนไลน์ที่ขายได้ทั้งเพลงผสมเสร็จและไฟล์ stems แยกแทร็ก โดยไฟล์ stems ต้องไม่หลุดให้คนที่ยังไม่ได้ซื้อ",
          "ระบบเดิมอยู่บน WordPress จึงต้องย้ายผู้ใช้เก่ามาโดยไม่ให้ใครต้องตั้งรหัสผ่านใหม่",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "วางโครงเป็น Turborepo monorepo แยก NestJS REST API กับ Next.js App Router โดยให้ Next.js เป็น reverse proxy ทั้ง API และไฟล์สื่อ เบราว์เซอร์จึงเข้าถึงพอร์ตของ API ตรง ๆ ไม่ได้",
          "แยกที่เก็บไฟล์เป็นสองถัง — ไฟล์สาธารณะ (ปก พรีวิว รูปโปรไฟล์) เสิร์ฟผ่าน CDN ส่วนไฟล์ stems เต็มต้องผ่านการตรวจสิทธิ์ก่อนแล้วจึงออก signed URL ให้",
          "ย้ายที่เก็บไฟล์จาก MinIO ไป Cloudflare R2 เพื่อตัดค่า egress โดยยังเก็บข้อมูลเดิมไว้เป็น safety net ระหว่างเปลี่ยนผ่าน",
          "ระบบเข้าสู่ระบบรองรับสามทาง — รหัสผ่าน (ตรวจ hash เดิมของ WordPress ได้ด้วย), LINE และ Google",
          "ระบบแนะนำเพื่อนออกแบบให้จ่ายรางวัลเมื่อผู้ถูกแนะนำซื้อของครั้งแรกเท่านั้น เพื่อปิดช่องปั๊มบัญชีด้วยอีเมลชั่วคราว",
          "งานดูแลระบบ — Docker Compose บนเครื่องจริง, rate limit, Sentry, และสำรองฐานข้อมูลอัตโนมัติทุกคืนขึ้น R2",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "freelanceth",
    title: "FreelanceTH — เครื่องมือ All-in-One สำหรับฟรีแลนซ์ไทย",
    summary:
      "ระบบออกใบแจ้งหนี้ สัญญา และจัดการลูกค้า ที่คิดภาษีแบบไทยให้ครบ ทั้ง VAT 7% และหัก ณ ที่จ่าย 3%",
    kind: "APP",
    year: 2026,
    liveUrl: "https://freelanceth.com",
    myRole: "ออกแบบระบบและพัฒนาเองทั้งหมด",
    techs: ["Next.js", "TypeScript", "Turborepo", "Prisma", "PostgreSQL", "pm2"],
    sections: [
      [
        "โจทย์",
        [
          "ฟรีแลนซ์ไทยใช้เครื่องมือต่างประเทศออกใบแจ้งหนี้แล้วต้องมานั่งคิด VAT และภาษีหัก ณ ที่จ่ายเองทุกครั้ง เอกสารที่ได้ก็ไม่ตรงกับที่ลูกค้าไทยต้องใช้",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "ทำระบบใบแจ้งหนี้ สัญญา และทะเบียนลูกค้าไว้ในที่เดียว โดยคิด VAT 7% และหัก ณ ที่จ่าย 3% ให้ตั้งแต่ต้น",
          "วางโครงเป็น monorepo แยกส่วน API กับเว็บ รันบนเครื่องจริงด้วย pm2 และฐานข้อมูล PostgreSQL ใน Docker",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "calcal",
    title: "CalCal — แอปนับแคลอรีอาหารไทย",
    summary:
      "แอปบันทึกแคลอรีรายวันที่มีฐานข้อมูลอาหารไทยมาให้ พร้อมกราฟสรุปย้อนหลัง",
    kind: "APP",
    year: 2026,
    myRole: "ออกแบบและพัฒนาเองทั้งหมด",
    techs: [
      "Next.js 16",
      "TypeScript",
      "Prisma 7",
      "Supabase",
      "Tailwind CSS",
      "shadcn/ui",
      "Recharts",
    ],
    sections: [
      [
        "โจทย์",
        [
          "แอปนับแคลอรีทั่วไปไม่มีอาหารไทย ต้องกรอกวัตถุดิบเองทีละอย่าง จนสุดท้ายก็เลิกบันทึก",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "ทำแอปบันทึกมื้ออาหารที่มีฐานข้อมูลอาหารไทยเตรียมไว้ให้ เลือกแล้วบันทึกได้ทันที",
          "มีหน้าสรุปและกราฟย้อนหลัง ดูแนวโน้มได้ว่ากินเกินเป้าวันไหน",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "qr-food-order",
    title: "QR Food Order — ระบบสั่งอาหารผ่าน QR",
    summary:
      "ลูกค้าสแกน QR ที่โต๊ะแล้วสั่งอาหารได้เลย ใช้งานได้ทั้งบนเว็บแบบ PWA และแอป Android",
    kind: "APP",
    year: 2026,
    liveUrl: "https://app.ppzstudio.com/qrOrder/",
    myRole: "ออกแบบและพัฒนาเองทั้งหมด รวมถึงแพ็กเป็นแอป Android",
    techs: ["Vite", "TypeScript", "PWA / Workbox", "Capacitor", "Android"],
    sections: [
      [
        "โจทย์",
        [
          "ร้านอาหารอยากให้ลูกค้าสั่งเองจากโต๊ะโดยไม่ต้องติดตั้งแอป และพนักงานเห็นออร์เดอร์ทันที",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "ทำเป็น PWA ที่เปิดจากการสแกน QR ได้ทันที ทำงานต่อได้แม้สัญญาณสะดุด และติดตั้งลงหน้าจอมือถือได้",
          "แพ็กตัวเดียวกันเป็นแอป Android ด้วย Capacitor พร้อมช่องทางอัปเดตแบบ OTA และปล่อยเวอร์ชันต่อเนื่องมาถึง 1.6",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "360-ppz-studio",
    title: "360 PPz Studio — ทัวร์เสมือนจริง 360°",
    summary:
      "บริการถ่ายและทำทัวร์เสมือน 360° ให้เดินชมสถานที่ได้จากเบราว์เซอร์ รองรับ VR และฝังลงเว็บลูกค้าได้",
    kind: "MEDIA",
    year: 2026,
    liveUrl: "https://360.ppzstudio.com",
    myRole: "ถ่ายภาพ 360° จัดทำทัวร์ และติดตั้งดูแลระบบบนเซิร์ฟเวอร์",
    techs: ["PHP", "MySQL", "WebGL", "VR"],
    sections: [
      [
        "โจทย์",
        [
          "ลูกค้าอยากให้คนที่ยังไม่เคยมา เห็นสถานที่จริงได้ก่อนตัดสินใจ ภาพนิ่งอย่างเดียวไม่พอ",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "ถ่ายภาพ 360° ทั้งสถานที่ แล้วประกอบเป็นทัวร์ที่เดินจากจุดหนึ่งไปอีกจุดได้ พร้อมจุดข้อมูล แผนที่ และโหมดชมผ่านแว่น VR",
          "ติดตั้งระบบจัดการทัวร์บนเซิร์ฟเวอร์ของสตูดิโอเอง ลูกค้าจึงได้ลิงก์และโค้ดฝังไปใช้บนเว็บตัวเองได้",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "phraekaw-online",
    title: "แพร่ข่าวออนไลน์ — เว็บข่าวท้องถิ่นจังหวัดแพร่",
    summary: "เว็บข่าวของคนเมืองแพร่ ดูแลตั้งแต่ระบบหลังบ้าน ธีม ไปจนถึงความเร็วและความปลอดภัย",
    kind: "WEBSITE",
    year: 2026,
    liveUrl: "https://phraekaw.com",
    myRole: "พัฒนาและดูแลเว็บไซต์",
    techs: ["WordPress", "PHP", "MariaDB", "Redis", "OpenLiteSpeed"],
    sections: [
      [
        "โจทย์",
        [
          "เว็บข่าวท้องถิ่นต้องลงข่าวได้เร็ว รับคนอ่านพร้อมกันจำนวนมากตอนข่าวดัง และทีมงานต้องใช้หลังบ้านเป็นโดยไม่ต้องอบรมนาน",
        ],
      ],
      [
        "สิ่งที่ทำ",
        [
          "ติดตั้งและปรับแต่งเว็บข่าวบน WordPress พร้อมธีมสำหรับสำนักข่าว จัดหมวดหมู่ให้ทีมงานลงข่าวได้เอง",
          "ดูแลฝั่งเซิร์ฟเวอร์ — OpenLiteSpeed, PHP, MariaDB และ Redis object cache เพื่อให้เว็บรับผู้อ่านพร้อมกันได้",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "breast-society",
    title: "Breast Society — เว็บไซต์องค์กร",
    summary: "เว็บไซต์องค์กรบน WordPress พร้อมระบบสำรองข้อมูลและดูแลความปลอดภัยต่อเนื่อง",
    kind: "WEBSITE",
    year: 2026,
    liveUrl: "https://breastsociety.com",
    myRole: "พัฒนาและดูแลเว็บไซต์",
    techs: ["WordPress", "PHP", "MariaDB", "OpenLiteSpeed"],
    sections: [
      ["โจทย์", ["องค์กรต้องการเว็บไซต์ที่อัปเดตเนื้อหาเองได้ และมีคนดูแลเรื่องความปลอดภัยกับการสำรองข้อมูลให้"]],
      [
        "สิ่งที่ทำ",
        [
          "ติดตั้งและปรับแต่งเว็บไซต์บน WordPress ให้ทีมงานแก้เนื้อหาเองได้",
          "ตั้งระบบสำรองข้อมูล ดูแลการอัปเดต และเฝ้าระวังความปลอดภัยให้ต่อเนื่อง พร้อมไซต์ staging ไว้ทดสอบก่อนขึ้นจริง",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
  {
    slug: "make-beauty-safe",
    title: "Make Beauty Safe — เว็บไซต์องค์กร",
    summary: "เว็บไซต์องค์กรบน WordPress ดูแลทั้งเนื้อหา ความเร็ว และการสำรองข้อมูล",
    kind: "WEBSITE",
    year: 2026,
    liveUrl: "https://makebeautysafe.com",
    myRole: "พัฒนาและดูแลเว็บไซต์",
    techs: ["WordPress", "PHP", "MariaDB", "OpenLiteSpeed"],
    sections: [
      ["โจทย์", ["ต้องการเว็บไซต์ที่ให้ข้อมูลกับผู้สนใจได้ครบ และทีมงานดูแลเนื้อหาเองได้"]],
      [
        "สิ่งที่ทำ",
        [
          "ติดตั้งและปรับแต่งเว็บไซต์บน WordPress พร้อมวางโครงเนื้อหาให้ทีมงานอัปเดตเองได้",
          "ดูแลฝั่งเซิร์ฟเวอร์และระบบสำรองข้อมูลให้ต่อเนื่อง",
        ],
      ],
      ["ผลลัพธ์", [RESULT_TODO]],
    ],
  },
];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toTiptap(sections: Seed["sections"]) {
  return {
    type: "doc",
    content: sections.flatMap(([heading, paragraphs]) => [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: heading }],
      },
      ...paragraphs.map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
    ]),
  };
}

function toHtml(sections: Seed["sections"]) {
  return sections
    .map(([heading, paragraphs]) =>
      [
        `<h2>${escapeHtml(heading)}</h2>`,
        ...paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
      ].join(""),
    )
    .join("");
}

function techSlug(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `tech-${Buffer.from(name).toString("hex").slice(0, 12)}`
  );
}

async function main() {
  const author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });
  if (!author) throw new Error("ไม่พบผู้ใช้ระดับ ADMIN ในฐานข้อมูล");
  console.log(`ผู้เขียน: ${author.email}`);

  let sortOrder = 10;

  for (const seed of seeds) {
    const contentJson = toTiptap(seed.sections);
    const contentHtml = toHtml(seed.sections);

    const data = {
      title: seed.title,
      summary: seed.summary,
      contentHtml,
      contentJson,
      kind: seed.kind,
      status: "DRAFT" as const,
      clientName: seed.clientName ?? null,
      myRole: seed.myRole,
      year: seed.year,
      liveUrl: seed.liveUrl ?? null,
      isFeatured: seed.isFeatured ?? false,
      sortOrder,
    };

    const project = await prisma.project.upsert({
      where: { slug: seed.slug },
      update: data,
      create: { ...data, slug: seed.slug, authorId: author.id },
      select: { id: true, slug: true, title: true },
    });

    // เทคโนโลยี — เขียนทับของเดิมให้ตรงกับรายการในไฟล์นี้
    const techIds: string[] = [];
    for (const name of seed.techs) {
      const tech = await prisma.tech.upsert({
        where: { slug: techSlug(name) },
        update: {},
        create: { slug: techSlug(name), name },
        select: { id: true },
      });
      techIds.push(tech.id);
    }
    await prisma.projectTech.deleteMany({ where: { projectId: project.id } });
    await prisma.projectTech.createMany({
      data: techIds.map((techId) => ({ projectId: project.id, techId })),
    });

    console.log(`✓ ${project.title}  (/works/${project.slug})`);
    sortOrder += 10;
  }

  const total = await prisma.project.count({ where: { deletedAt: null } });
  console.log(`\nรวมผลงานในระบบตอนนี้ ${total} ชิ้น (ทั้งหมดเป็นฉบับร่าง)`);
}

main()
  .catch((error) => {
    console.error("[seed-projects] ล้มเหลว:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
