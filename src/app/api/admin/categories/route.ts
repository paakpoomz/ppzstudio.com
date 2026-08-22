import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, invalid, ok, unauthorized } from "@/lib/api";
import {
  categoryCreateSchema,
  createCategory,
  listCategoriesForAdmin,
} from "@/server/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => ok(await listCategoriesForAdmin()));
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const parsed = categoryCreateSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);

    const category = await createCategory(parsed.data);

    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");

    return ok(category, { status: 201 });
  });
}
