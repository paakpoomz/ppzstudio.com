import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/db";
import { mediaUrl, processUpload } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1));
    const perPage = 40;

    const where = q ? { filename: { contains: q } } : {};

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.media.count({ where }),
    ]);

    return ok({
      items: items.map((m) => ({ ...m, url: mediaUrl(m.path) })),
      total,
      page,
      hasMore: page * perPage < total,
    });
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const form = await request.formData();
    const file = form.get("file");
    const altText = form.get("alt");

    if (!(file instanceof File)) {
      return fail("NO_FILE", "ไม่พบไฟล์ที่อัปโหลด", 400);
    }

    let processed;
    try {
      processed = await processUpload(file);
    } catch (error) {
      // ข้อความจาก processUpload บอกผู้ใช้ได้ตรง ๆ ว่าติดตรงไหน
      return fail(
        "BAD_IMAGE",
        error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ",
        400,
      );
    }

    const media = await prisma.media.create({
      data: {
        ...processed,
        altText: typeof altText === "string" && altText ? altText : null,
        uploadedById: user.id,
      },
    });

    return ok({ ...media, url: mediaUrl(media.path) }, { status: 201 });
  });
}
