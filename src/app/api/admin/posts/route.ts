import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, ok, unauthorized } from "@/lib/api";
import { adminListSchema, createDraft, listPostsForAdmin } from "@/server/posts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const input = adminListSchema.parse(params);
    return ok(await listPostsForAdmin(input));
  });
}

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const draft = await createDraft(user.id);
    return ok(draft, { status: 201 });
  });
}
