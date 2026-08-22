import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, notFound, ok, unauthorized } from "@/lib/api";
import {
  getPostForEdit,
  postUpdateSchema,
  softDeletePost,
  updatePost,
} from "@/server/posts";

export const dynamic = "force-dynamic";

// Next 16: params เป็น Promise ต้อง await
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const post = await getPostForEdit(id);
    if (!post) return notFound("บทความ");
    return ok(post);
  });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const input = postUpdateSchema.parse(await request.json());
    const post = await updatePost(id, input, user.id);
    if (!post) return notFound("บทความ");
    return ok({ ...post, savedAt: new Date().toISOString() });
  });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    await softDeletePost(id);
    return ok({ deleted: true });
  });
}
