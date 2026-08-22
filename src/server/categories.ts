import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "ต้องมีชื่อหมวดหมู่").max(120),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(400).nullish(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "ต้องมีชื่อหมวดหมู่").max(120).optional(),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(400).nullish(),
  move: z.enum(["up", "down"]).optional(),
});

/** หมวดหมู่ทั้งหมด พร้อมจำนวนบทความแยกเป็นเผยแพร่แล้ว/ทั้งหมด */
export async function listCategoriesForAdmin() {
  const [categories, published] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        sortOrder: true,
        _count: { select: { posts: { where: { deletedAt: null } } } },
      },
    }),
    prisma.post.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null, status: "PUBLISHED" },
      _count: true,
    }),
  ]);

  const publishedByCategory = new Map(
    published.map((row) => [row.categoryId, row._count]),
  );

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    sortOrder: c.sortOrder,
    postCount: c._count.posts,
    publishedCount: publishedByCategory.get(c.id) ?? 0,
  }));
}

export async function createCategory(
  input: z.infer<typeof categoryCreateSchema>,
) {
  const slug = await uniqueSlug(
    input.slug || input.name,
    async (s) => (await prisma.category.count({ where: { slug: s } })) > 0,
    "category",
  );

  // หมวดใหม่ไปต่อท้าย แล้วค่อยเลื่อนขึ้นเองทีหลัง
  const last = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description || null,
      sortOrder: (last?.sortOrder ?? 0) + 10,
    },
    select: { id: true, slug: true, name: true },
  });
}

export async function updateCategory(
  id: string,
  input: z.infer<typeof categoryUpdateSchema>,
) {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined)
    data.description = input.description || null;

  // slug ของหมวดเปลี่ยนได้ตลอด (ไม่เหมือนบทความ) เพราะเป็นหน้ารวม
  // ไม่ค่อยมีคนแชร์ลิงก์ตรง — แต่ถ้าเปลี่ยนแล้วลิงก์เก่าจะ 404
  if (input.slug !== undefined) {
    const wanted = slugify(input.slug);
    if (wanted && wanted !== existing.slug) {
      data.slug = await uniqueSlug(
        wanted,
        async (s) =>
          (await prisma.category.count({ where: { slug: s, NOT: { id } } })) > 0,
        "category",
      );
    }
  }

  return prisma.category.update({
    where: { id },
    data,
    select: { id: true, slug: true, name: true, description: true },
  });
}

/** สลับที่กับหมวดที่อยู่ติดกัน */
export async function moveCategory(id: string, direction: "up" | "down") {
  const current = await prisma.category.findUnique({
    where: { id },
    select: { id: true, sortOrder: true },
  });
  if (!current) return null;

  const neighbour = await prisma.category.findFirst({
    where: {
      sortOrder:
        direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });

  if (!neighbour) return current;

  await prisma.$transaction([
    prisma.category.update({
      where: { id: current.id },
      data: { sortOrder: neighbour.sortOrder },
    }),
    prisma.category.update({
      where: { id: neighbour.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  return { id: current.id, sortOrder: neighbour.sortOrder };
}

/**
 * ลบหมวดหมู่ — บทความในหมวดนั้นไม่ได้ถูกลบไปด้วย
 * schema ตั้ง onDelete: SetNull ไว้ บทความจะกลายเป็น "ไม่มีหมวด" แทน
 */
export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { posts: true } } },
  });
  if (!category) return null;

  await prisma.category.delete({ where: { id } });

  return { id, orphanedPosts: category._count.posts };
}
