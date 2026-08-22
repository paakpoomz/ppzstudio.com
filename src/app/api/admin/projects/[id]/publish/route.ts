import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, notFound, ok, unauthorized } from "@/lib/api";
import { publishProject, unpublishProject } from "@/server/projects";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function revalidateWorkPages(slug: string) {
  revalidatePath("/");
  revalidatePath("/works");
  revalidatePath(`/works/${slug}`);
  // ไม่ล้าง sitemap ด้วย Google จะเห็นช้าไปอีกชั่วโมง
  revalidatePath("/sitemap.xml");
}

export async function POST(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const project = await publishProject(id);
    if (!project) return notFound("ผลงาน");

    revalidateWorkPages(project.slug);
    return ok(project);
  });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const project = await unpublishProject(id);

    revalidateWorkPages(project.slug);
    return ok(project);
  });
}
