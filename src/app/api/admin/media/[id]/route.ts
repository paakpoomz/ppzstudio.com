import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handle, notFound, ok, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/image";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const mediaUpdateSchema = z.object({
  altText: z.string().max(300).nullish(),
  focalX: z.coerce.number().int().min(0).max(100).optional(),
  focalY: z.coerce.number().int().min(0).max(100).optional(),
});

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const input = mediaUpdateSchema.parse(await request.json());

    const existing = await prisma.media.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return notFound("รูป");

    const media = await prisma.media.update({
      where: { id },
      data: {
        ...(input.altText !== undefined ? { altText: input.altText || null } : {}),
        ...(input.focalX !== undefined ? { focalX: input.focalX } : {}),
        ...(input.focalY !== undefined ? { focalY: input.focalY } : {}),
      },
    });

    // รูปหนึ่งใบใช้ซ้ำได้หลายที่ ล้าง cache หน้าที่แสดงรูปปกทั้งหมด
    // (หน้ารายละเอียดใช้ revalidatePath แบบ layout เพื่อกวาดทุก slug ทีเดียว)
    revalidatePath("/");
    revalidatePath("/works");
    revalidatePath("/works/[slug]", "page");
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");

    return ok({ ...media, url: mediaUrl(media.path) });
  });
}
