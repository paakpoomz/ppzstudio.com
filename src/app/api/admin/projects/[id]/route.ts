import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, notFound, ok, unauthorized } from "@/lib/api";
import {
  getProjectForEdit,
  moveProject,
  projectUpdateSchema,
  softDeleteProject,
  updateProject,
} from "@/server/projects";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const project = await getProjectForEdit(id);
    if (!project) return notFound("ผลงาน");
    return ok(project);
  });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const body = await request.json();

    // ปุ่มเลื่อนขึ้น/ลงในตารางใช้ endpoint เดียวกัน แต่ส่ง move มาแทน
    if (body?.move === "up" || body?.move === "down") {
      const moved = await moveProject(id, body.move);
      if (!moved) return notFound("ผลงาน");
      revalidatePath("/works");
      revalidatePath("/");
      return ok(moved);
    }

    const input = projectUpdateSchema.parse(body);
    const project = await updateProject(id, input);
    if (!project) return notFound("ผลงาน");

    return ok({ ...project, savedAt: new Date().toISOString() });
  });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    await softDeleteProject(id);
    revalidatePath("/works");
    revalidatePath("/");
    return ok({ deleted: true });
  });
}
