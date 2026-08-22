import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, invalid, notFound, ok, unauthorized } from "@/lib/api";
import {
  categoryUpdateSchema,
  deleteCategory,
  moveCategory,
  updateCategory,
} from "@/server/categories";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function revalidateBlogPages(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/category/${slug}`);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const parsed = categoryUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);

    // ปุ่มเลื่อนขึ้น/ลงใช้ endpoint เดียวกัน
    if (parsed.data.move) {
      const moved = await moveCategory(id, parsed.data.move);
      if (!moved) return notFound("หมวดหมู่");
      revalidateBlogPages();
      return ok(moved);
    }

    const category = await updateCategory(id, parsed.data);
    if (!category) return notFound("หมวดหมู่");

    revalidateBlogPages(category.slug);
    return ok(category);
  });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const result = await deleteCategory(id);
    if (!result) return notFound("หมวดหมู่");

    revalidateBlogPages();
    return ok(result);
  });
}
