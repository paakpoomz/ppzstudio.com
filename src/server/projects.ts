import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ContentStatus, ProjectKind } from "@/generated/prisma/enums";
import { slugify, uniqueSlug } from "@/lib/slug";
import { autoExcerpt, sanitizeContentHtml } from "@/lib/sanitize";

const tiptapDoc = z.object({ type: z.literal("doc") }).loose();

export const projectUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  slug: z.string().max(200).optional(),
  summary: z.string().max(400).nullish(),
  contentHtml: z.string().optional(),
  contentJson: tiptapDoc.optional(),
  kind: z.enum(ProjectKind).optional(),
  clientName: z.string().max(160).nullish(),
  myRole: z.string().max(160).nullish(),
  year: z.coerce.number().int().min(1990).max(2200).nullish(),
  liveUrl: z.union([z.url(), z.literal("")]).nullish(),
  repoUrl: z.union([z.url(), z.literal("")]).nullish(),
  coverMediaId: z.string().nullish(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  techs: z.array(z.string().min(1).max(120)).max(30).optional(),
  gallery: z
    .array(
      z.object({
        mediaId: z.string(),
        caption: z.string().max(300).nullish(),
      }),
    )
    .max(40)
    .optional(),
});

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const projectListSchema = z.object({
  status: z.enum(["ALL", ...Object.values(ContentStatus)]).default("ALL"),
  q: z.string().max(200).optional(),
});

export async function listProjectsForAdmin(
  input: z.infer<typeof projectListSchema>,
) {
  const where = {
    deletedAt: null,
    ...(input.status !== "ALL" ? { status: input.status } : {}),
    ...(input.q ? { title: { contains: input.q } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        kind: true,
        status: true,
        clientName: true,
        year: true,
        isFeatured: true,
        sortOrder: true,
        updatedAt: true,
        cover: { select: { path: true } },
        _count: { select: { gallery: true, techs: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { items, total };
}

export async function getProjectForEdit(id: string) {
  return prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      cover: true,
      techs: { include: { tech: true } },
      gallery: { orderBy: { sortOrder: "asc" }, include: { media: true } },
    },
  });
}

export async function createProjectDraft(authorId: string) {
  const slug = await uniqueSlug(
    `draft-${Date.now().toString(36)}`,
    async (s) => (await prisma.project.count({ where: { slug: s } })) > 0,
    "project",
  );

  // ผลงานใหม่ไปอยู่ท้ายสุดก่อน แล้วค่อยเลื่อนขึ้นเองทีหลัง
  const last = await prisma.project.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  // ใส่โครง 3 ท่อนไว้ให้ตั้งแต่แรก — ลูกค้าที่เข้ามาดูตัดสินใจจากท่อน "ผลลัพธ์"
  const heading = (text: string) => ({
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }],
  });
  const hint = (text: string) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  });

  const template = {
    type: "doc",
    content: [
      heading("โจทย์"),
      hint("ลูกค้าเจอปัญหาอะไร ทำไมถึงต้องทำงานชิ้นนี้"),
      heading("สิ่งที่เราทำ"),
      hint("เล่าว่าลงมือทำอะไรบ้าง ใช้วิธีไหน ตัดสินใจอะไรที่สำคัญ"),
      heading("ผลลัพธ์"),
      hint("บอกเป็นตัวเลขถ้าทำได้ เช่น ยอดเข้าชมเพิ่มกี่เท่า ลดเวลาทำงานไปกี่ชั่วโมง"),
    ],
  };

  return prisma.project.create({
    data: {
      title: "ผลงานใหม่",
      slug,
      contentHtml: "",
      contentJson: template,
      kind: ProjectKind.WEBSITE,
      status: ContentStatus.DRAFT,
      sortOrder: (last?.sortOrder ?? 0) + 10,
      authorId,
    },
    select: { id: true, slug: true, title: true },
  });
}

async function resolveTechIds(names: string[]) {
  const ids: string[] = [];

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;

    const slug =
      slugify(name) || `tech-${Buffer.from(name).toString("hex").slice(0, 12)}`;

    const tech = await prisma.tech.upsert({
      where: { slug },
      update: {},
      create: { slug, name },
      select: { id: true },
    });
    ids.push(tech.id);
  }

  return ids;
}

export async function updateProject(id: string, input: ProjectUpdateInput) {
  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, slug: true, status: true },
  });
  if (!existing) return null;

  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.clientName !== undefined) data.clientName = input.clientName || null;
  if (input.myRole !== undefined) data.myRole = input.myRole || null;
  if (input.year !== undefined) data.year = input.year ?? null;
  if (input.liveUrl !== undefined) data.liveUrl = input.liveUrl || null;
  if (input.repoUrl !== undefined) data.repoUrl = input.repoUrl || null;
  if (input.coverMediaId !== undefined)
    data.coverMediaId = input.coverMediaId || null;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  // slug ล็อกหลังเผยแพร่ เหมือนบทความ — ลิงก์ที่ส่งให้ลูกค้าไปแล้วต้องไม่พัง
  if (existing.status !== ContentStatus.PUBLISHED) {
    const source = input.slug !== undefined ? input.slug : (input.title ?? "");
    const wanted = slugify(source);
    if (wanted && wanted !== existing.slug) {
      data.slug = await uniqueSlug(
        wanted,
        async (s) =>
          (await prisma.project.count({ where: { slug: s, NOT: { id } } })) > 0,
        "project",
      );
    }
  }

  if (input.contentHtml !== undefined) {
    const clean = sanitizeContentHtml(input.contentHtml);
    data.contentHtml = clean;
    data.summary = input.summary?.trim() || autoExcerpt(clean, 180);
  } else if (input.summary !== undefined) {
    data.summary = input.summary?.trim() || null;
  }

  if (input.contentJson !== undefined)
    data.contentJson = input.contentJson as Prisma.InputJsonValue;

  const project = await prisma.project.update({
    where: { id },
    data,
    select: { id: true, slug: true, title: true, status: true, updatedAt: true },
  });

  if (input.techs !== undefined) {
    const techIds = await resolveTechIds(input.techs);
    await prisma.projectTech.deleteMany({ where: { projectId: id } });
    if (techIds.length) {
      await prisma.projectTech.createMany({
        data: techIds.map((techId) => ({ projectId: id, techId })),
      });
    }
  }

  if (input.gallery !== undefined) {
    // เขียนทับทั้งชุดตามลำดับที่ส่งมา — ง่ายกว่าไล่เทียบทีละรูป
    await prisma.projectMedia.deleteMany({ where: { projectId: id } });
    if (input.gallery.length) {
      await prisma.projectMedia.createMany({
        data: input.gallery.map((g, index) => ({
          projectId: id,
          mediaId: g.mediaId,
          caption: g.caption || null,
          sortOrder: index,
        })),
      });
    }
  }

  return project;
}

export async function publishProject(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, contentHtml: true, coverMediaId: true },
  });
  if (!project) return null;

  if (!project.contentHtml.trim()) {
    throw new Error("ผลงานยังไม่มีรายละเอียด เขียนอย่างน้อยสักย่อหน้าก่อนเผยแพร่");
  }

  return prisma.project.update({
    where: { id },
    data: { status: ContentStatus.PUBLISHED, publishedAt: new Date() },
    select: { id: true, slug: true, status: true },
  });
}

export async function unpublishProject(id: string) {
  return prisma.project.update({
    where: { id },
    data: { status: ContentStatus.DRAFT },
    select: { id: true, slug: true, status: true },
  });
}

export async function softDeleteProject(id: string) {
  return prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

/** สลับที่กับผลงานที่อยู่ติดกัน — ใช้ทำปุ่มเลื่อนขึ้น/ลงในตาราง */
export async function moveProject(id: string, direction: "up" | "down") {
  const current = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, sortOrder: true },
  });
  if (!current) return null;

  const neighbour = await prisma.project.findFirst({
    where: {
      deletedAt: null,
      sortOrder:
        direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });

  if (!neighbour) return current; // อยู่บนสุดหรือล่างสุดแล้ว

  await prisma.$transaction([
    prisma.project.update({
      where: { id: current.id },
      data: { sortOrder: neighbour.sortOrder },
    }),
    prisma.project.update({
      where: { id: neighbour.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  return { id: current.id, sortOrder: neighbour.sortOrder };
}
