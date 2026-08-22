import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DonationStatus } from "@/generated/prisma/enums";
import { buildPromptPayPayload } from "@/lib/promptpay";
import { mediaUrl } from "@/lib/image";

export const donationCreateSchema = z.object({
  name: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(400).optional().or(z.literal("")),
  amount: z.coerce
    .number()
    .min(1, "จำนวนเงินต้องอย่างน้อย 1 บาท")
    .max(200000, "จำนวนเงินสูงเกินไป — ถ้าต้องการโอนมากกว่านี้ ติดต่อเราโดยตรง"),
});

/** ตัวอักษรที่ไม่ชวนอ่านผิด — ตัด I, O, 0, 1 ออก */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRefCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * เติมเศษสตางค์ให้ยอดไม่ซ้ำกับรายการที่ยังค้างอยู่
 *
 * พร้อมเพย์ QR ไม่มีช่องแนบข้อความถึงผู้รับ จับคู่อัตโนมัติไม่ได้
 * วิธีที่ใช้กันจริงคือทำให้ยอดของแต่ละคนไม่ซ้ำ แล้วเทียบกับยอดในสลิป
 */
async function uniqueAmount(base: number) {
  const whole = Math.floor(base);

  const pending = await prisma.donation.findMany({
    where: { status: { in: [DonationStatus.PENDING, DonationStatus.CONFIRMED] } },
    select: { amount: true },
  });
  const taken = new Set(pending.map((d) => d.amount.toString()));

  // สุ่มเศษสตางค์ 1–99 แล้วเลี่ยงค่าที่ชนกับคนอื่น
  for (let attempt = 0; attempt < 60; attempt++) {
    const satang = randomInt(1, 100);
    const candidate = (whole + satang / 100).toFixed(2);
    if (!taken.has(candidate)) return Number(candidate);
  }

  // ยอดนี้คนใช้ครบทุกเศษแล้ว (แทบเป็นไปไม่ได้) — ขยับหลักบาทขึ้นหนึ่ง
  return Number((whole + 1 + randomInt(1, 100) / 100).toFixed(2));
}

export async function createDonation(
  input: z.infer<typeof donationCreateSchema>,
  sourceIp: string,
) {
  const promptPayId = process.env.PROMPTPAY_ID ?? "090-939-5300";

  const amount = await uniqueAmount(input.amount);
  const payload = buildPromptPayPayload(promptPayId, amount);

  let refCode = makeRefCode();
  for (let i = 0; i < 10; i++) {
    const clash = await prisma.donation.count({ where: { refCode } });
    if (!clash) break;
    refCode = makeRefCode();
  }

  return prisma.donation.create({
    data: {
      refCode,
      name: input.name || null,
      message: input.message || null,
      amount,
      promptpayPayload: payload,
      sourceIp: sourceIp.slice(0, 45),
    },
    select: {
      id: true,
      refCode: true,
      amount: true,
      promptpayPayload: true,
    },
  });
}

/** ผู้บริจาคกดยืนยันว่าโอนแล้ว (แนบสลิปด้วยก็ได้) */
export async function confirmDonation(refCode: string, slipMediaId?: string) {
  const donation = await prisma.donation.findUnique({
    where: { refCode },
    select: { id: true, refCode: true, status: true },
  });
  if (!donation) return null;

  // กดยืนยันซ้ำ หรือรายการถูกตรวจไปแล้ว — คืนสถานะเดิม ไม่ต้องเขียนทับ
  if (donation.status !== DonationStatus.PENDING) return donation;

  return prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: DonationStatus.CONFIRMED,
      slipMediaId: slipMediaId ?? undefined,
    },
    select: { id: true, refCode: true, status: true },
  });
}

/** รายชื่อผู้สนับสนุนที่อนุมัติแล้ว — แสดงในหน้า /support */
export async function listApprovedDonations(take = 50) {
  const rows = await prisma.donation.findMany({
    where: { status: DonationStatus.APPROVED },
    orderBy: { approvedAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      message: true,
      amount: true,
      approvedAt: true,
    },
  });

  return rows.map((d) => ({
    id: d.id,
    name: d.name || "ผู้ไม่ประสงค์ออกนาม",
    message: d.message,
    amount: Number(d.amount),
    approvedAt: d.approvedAt,
  }));
}

export async function listDonationsForAdmin() {
  const rows = await prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { slip: true, approvedBy: { select: { name: true } } },
  });

  return rows.map((d) => ({
    ...d,
    amount: Number(d.amount),
    slipUrl: d.slip ? mediaUrl(d.slip.path, 800) : null,
  }));
}

export async function decideDonation(
  id: string,
  decision: "APPROVED" | "REJECTED",
  userId: string,
) {
  return prisma.donation.update({
    where: { id },
    data: {
      status: DonationStatus[decision],
      approvedById: userId,
      approvedAt: new Date(),
    },
    select: { id: true, status: true },
  });
}
