import type { NextRequest } from "next/server";
import { fail, handle, invalid, ok } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createDonation, donationCreateSchema } from "@/server/donations";
import { promptPayQrSvg } from "@/lib/promptpay";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const ip = clientIp(request.headers);

    // สร้าง QR ได้ 10 ครั้งต่อชั่วโมง — พอสำหรับคนที่กดผิดแล้วทำใหม่
    const limit = await rateLimit(`donate:${ip}`, 10, 60 * 60);
    if (!limit.allowed) {
      return fail(
        "RATE_LIMITED",
        "สร้าง QR บ่อยเกินไป ลองใหม่อีกครั้งในอีกสักครู่",
        429,
      );
    }

    const parsed = donationCreateSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);

    const donation = await createDonation(parsed.data, ip);
    const qrSvg = await promptPayQrSvg(donation.promptpayPayload!);

    return ok(
      {
        refCode: donation.refCode,
        amount: Number(donation.amount),
        qrSvg,
      },
      { status: 201 },
    );
  });
}
