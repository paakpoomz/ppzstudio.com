import type { NextRequest } from "next/server";
import { fail, handle, notFound, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { processUpload } from "@/lib/image";
import { confirmDonation } from "@/server/donations";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ refCode: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { refCode } = await params;
    const ip = clientIp(request.headers);

    const limit = await rateLimit(`donate-confirm:${ip}`, 20, 60 * 60);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "ยืนยันบ่อยเกินไป ลองใหม่อีกครั้งภายหลัง", 429);
    }

    // สลิปเป็นของไม่บังคับ — ส่งมาก็ดี ไม่ส่งก็ยืนยันได้
    let slipMediaId: string | undefined;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("slip");

      if (file instanceof File && file.size > 0) {
        try {
          const processed = await processUpload(file);
          const media = await prisma.media.create({
            data: { ...processed, altText: `สลิปโอนเงิน ${refCode}` },
          });
          slipMediaId = media.id;
        } catch (error) {
          return fail(
            "BAD_IMAGE",
            error instanceof Error ? error.message : "อ่านไฟล์สลิปไม่ได้",
            400,
          );
        }
      }
    }

    const result = await confirmDonation(refCode.toUpperCase(), slipMediaId);
    if (!result) return notFound("รายการสนับสนุน");

    return ok({ refCode: result.refCode, status: result.status });
  });
}
