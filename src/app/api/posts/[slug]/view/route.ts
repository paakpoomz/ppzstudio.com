import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { clientIp } from "@/lib/rate-limit";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { slug } = await params;

  try {
    // นับคนเดิมซ้ำภายใน 24 ชม. แค่ครั้งเดียว — เก็บเป็น hash ไม่เก็บ IP ตรง ๆ
    const fingerprint = createHash("sha256")
      .update(clientIp(request.headers) + (request.headers.get("user-agent") ?? ""))
      .digest("hex")
      .slice(0, 24);

    const seenKey = `view:${slug}:${fingerprint}`;
    const isNew = await redis.set(seenKey, "1", "EX", 60 * 60 * 24, "NX");

    if (isNew) {
      // สะสมใน Redis ก่อน แล้วให้ cron เขียนลง DB ทีเดียวตอนเที่ยงคืน
      await redis.hincrby("views:pending", slug, 1);
    }

    return ok({ counted: Boolean(isNew) });
  } catch (error) {
    console.error("[view] นับยอดอ่านไม่สำเร็จ:", error);
    // Redis ล่มก็แค่ไม่นับ ไม่ต้องให้ผู้อ่านเห็น error
    return ok({ counted: false });
  }
}

/** ยอดอ่านรวม = ที่บันทึกใน DB แล้ว + ที่ยังค้างใน Redis */
export async function GET(_request: NextRequest, { params }: Ctx) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { viewCount: true },
  });
  if (!post) return ok({ views: 0 });

  let pending = 0;
  try {
    pending = Number((await redis.hget("views:pending", slug)) ?? 0);
  } catch {
    // ไม่มี Redis ก็ตอบเท่าที่มีใน DB
  }

  return ok({ views: post.viewCount + pending });
}
