import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, handle, ok } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendContactNotification } from "@/lib/mail";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(160),
  email: z.email("รูปแบบอีเมลไม่ถูกต้อง").max(190),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().trim().max(80).optional().or(z.literal("")),
  budgetRange: z.string().trim().max(80).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "เล่ารายละเอียดอีกนิด อย่างน้อย 10 ตัวอักษร")
    .max(5000, "ข้อความยาวเกินไป"),
  // ช่องล่อบอต — รับค่าอะไรก็ได้ตรงนี้ แล้วไปตรวจในโค้ดแทน
  // ถ้าให้ Zod ตีตก บอตจะรู้ทันทีว่าติดที่ช่องไหน
  website: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  return handle(async () => {
    const ip = clientIp(request.headers);

    const limit = await rateLimit(`contact:${ip}`, 3, 60 * 60);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60);
      return fail(
        "RATE_LIMITED",
        `ส่งข้อความบ่อยเกินไป ลองใหม่อีกครั้งใน ${minutes} นาที — หรือส่งอีเมลหาเราตรง ๆ ได้เลย`,
        429,
      );
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "_";
        if (!fields[key]) fields[key] = issue.message;
      }
      return fail("INVALID_INPUT", "กรอกข้อมูลยังไม่ครบ", 422, fields);
    }

    const input = parsed.data;

    // บอตกรอกช่องล่อ — ตอบว่าสำเร็จไปเลย จะได้ไม่รู้ว่าโดนจับได้
    if (input.website) {
      return ok({ ok: true, refId: "—" });
    }

    // บันทึกลงฐานข้อมูลก่อนเสมอ ถ้าอีเมลล่มทีหลังข้อความก็ยังอยู่ในหลังบ้าน
    const saved = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        service: input.service || null,
        budgetRange: input.budgetRange || null,
        message: input.message,
        sourceIp: ip.slice(0, 45),
        userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
      },
      select: { id: true, createdAt: true },
    });

    const refId = saved.id.slice(-8).toUpperCase();

    try {
      await sendContactNotification({ refId, ...input });
    } catch (error) {
      // ส่งเมลไม่ผ่านไม่ใช่ความผิดของผู้ใช้ — ข้อความบันทึกไว้แล้ว
      console.error("[contact] ส่งอีเมลแจ้งเตือนไม่สำเร็จ:", error);
    }

    return ok({ ok: true, refId }, { status: 201 });
  });
}
