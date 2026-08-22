import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, notFound, ok, unauthorized } from "@/lib/api";
import { publishPost, publishSchema, unpublishPost } from "@/server/posts";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { publishAt } = publishSchema.parse(body);

    const post = await publishPost(id, publishAt);
    if (!post) return notFound("บทความ");

    // ล้าง cache ของหน้าที่เกี่ยวข้อง เห็นผลทันทีโดยไม่ต้อง build ใหม่
    // รวม sitemap และ RSS ด้วย ไม่งั้น Google กว่าจะเห็นก็อีกชั่วโมง
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");

    return ok(post);
  });
}

/** ถอนกลับเป็นร่าง */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const post = await unpublishPost(id);

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");

    return ok(post);
  });
}
