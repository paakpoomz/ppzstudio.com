import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handle, invalid, ok, unauthorized } from "@/lib/api";
import { decideDonation } from "@/server/donations";

export const dynamic = "force-dynamic";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return unauthorized();

  return handle(async () => {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);

    const donation = await decideDonation(id, parsed.data.decision, user.id);
    revalidatePath("/support");

    return ok(donation);
  });
}
