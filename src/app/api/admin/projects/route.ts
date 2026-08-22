import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, ok, unauthorized } from "@/lib/api";
import {
  createProjectDraft,
  listProjectsForAdmin,
  projectListSchema,
} from "@/server/projects";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const input = projectListSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return ok(await listProjectsForAdmin(input));
  });
}

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const draft = await createProjectDraft(user.id);
    return ok(draft, { status: 201 });
  });
}
