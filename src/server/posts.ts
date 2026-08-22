import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/enums";
import { slugify, uniqueSlug } from "@/lib/slug";
import {
  autoExcerpt,
  estimateReadingMinutes,
  sanitizeContentHtml,
} from "@/lib/sanitize";

const MAX_REVISIONS = 20;

// TipTap ส่ง doc มาเป็น JSON — เก็บทั้งก้อน ไม่ต้องรู้โครงข้างใน
const tiptapDoc = z.object({ type: z.literal("doc") }).loose();

export const postUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  slug: z.string().max(200).optional(),
  excerpt: z.string().max(400).nullish(),
  contentHtml: z.string().optional(),
  contentJson: tiptapDoc.optional(),
  categoryId: z.string().nullish(),
  coverMediaId: z.string().nullish(),
  seoTitle: z.string().max(200).nullish(),
  seoDescription: z.string().max(400).nullish(),
  tags: z.array(z.string().min(1).max(120)).max(20).optional(),
});

export type PostUpdateInput = z.infer<typeof postUpdateSchema>;

export const publishSchema = z.object({
  // ไม่ส่ง publishAt = เผยแพร่เดี๋ยวนี้ · ส่งเวลาอนาคต = ตั้งเวลา
  publishAt: z.iso.datetime().nullish(),
});

/** ตัวเลือกที่หน้า Admin ใช้ตอนแสดงรายการบทความ */
export const adminListSchema = z.object({
  status: z.enum(["ALL", ...Object.values(ContentStatus)]).default("ALL"),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const PER_PAGE = 20;

export async function listPostsForAdmin(
  input: z.infer<typeof adminListSchema>,
) {
  const where = {
    deletedAt: null,
    ...(input.status !== "ALL" ? { status: input.status } : {}),
    ...(input.q
      ? { OR: [{ title: { contains: input.q } }, { slug: { contains: input.q } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (input.page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        viewCount: true,
        readingMinutes: true,
        category: { select: { id: true, name: true } },
        cover: { select: { path: true, blurData: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items,
    total,
    page: input.page,
    perPage: PER_PAGE,
    hasMore: input.page * PER_PAGE < total,
  };
}

export async function getPostForEdit(id: string) {
  return prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      cover: true,
      tags: { include: { tag: true } },
    },
  });
}

/**
 * สร้างร่างเปล่าทันทีที่กด "เขียนบทความใหม่"
 * ต้องมี id ตั้งแต่วินาทีแรก ไม่งั้น autosave กับการอัปรูปไม่มีที่ผูก
 */
export async function createDraft(authorId: string) {
  const slug = await uniqueSlug(
    `draft-${Date.now().toString(36)}`,
    async (s) => (await prisma.post.count({ where: { slug: s } })) > 0,
  );

  return prisma.post.create({
    data: {
      title: "บทความใหม่",
      slug,
      contentHtml: "",
      contentJson: { type: "doc", content: [] },
      status: ContentStatus.DRAFT,
      authorId,
    },
    select: { id: true, slug: true, title: true },
  });
}

/** หา tag จากชื่อ ถ้ายังไม่มีก็สร้างใหม่ */
async function resolveTagIds(names: string[]) {
  const ids: string[] = [];

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;

    const slug =
      slugify(name) || `tag-${Buffer.from(name).toString("hex").slice(0, 12)}`;

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { slug, name },
      select: { id: true },
    });
    ids.push(tag.id);
  }

  return ids;
}

export async function updatePost(
  id: string,
  input: PostUpdateInput,
  userId: string,
) {
  const existing = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, slug: true, title: true, status: true },
  });
  if (!existing) return null;

  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId || null;
  if (input.coverMediaId !== undefined)
    data.coverMediaId = input.coverMediaId || null;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle || null;
  if (input.seoDescription !== undefined)
    data.seoDescription = input.seoDescription || null;

  // slug เปลี่ยนได้เฉพาะตอนยังไม่เผยแพร่ — บทความที่คนแชร์ไปแล้ว URL ต้องนิ่ง
  if (existing.status !== ContentStatus.PUBLISHED) {
    // ถ้า client ไม่ได้ส่ง slug มา แต่ส่งหัวข้อมา ให้สร้างจากหัวข้อให้
    // (กันกรณีร่างที่ยังติด slug ตั้งต้น draft-xxxx อยู่)
    const source =
      input.slug !== undefined ? input.slug : (input.title ?? "");
    const wanted = slugify(source);

    if (wanted && wanted !== existing.slug) {
      data.slug = await uniqueSlug(
        wanted,
        async (s) =>
          (await prisma.post.count({ where: { slug: s, NOT: { id } } })) > 0,
      );
    }
  }

  if (input.contentHtml !== undefined) {
    const clean = sanitizeContentHtml(input.contentHtml);
    data.contentHtml = clean;
    data.readingMinutes = estimateReadingMinutes(clean);
    // เกริ่นนำ: ใช้ที่ผู้เขียนกรอก ถ้าเว้นไว้ก็ตัดจากเนื้อหาให้
    data.excerpt = input.excerpt?.trim() || autoExcerpt(clean);
  } else if (input.excerpt !== undefined) {
    data.excerpt = input.excerpt?.trim() || null;
  }

  if (input.contentJson !== undefined)
    data.contentJson = input.contentJson as Prisma.InputJsonValue;

  const post = await prisma.post.update({
    where: { id },
    data,
    select: { id: true, slug: true, title: true, status: true, updatedAt: true },
  });

  if (input.tags !== undefined) {
    const tagIds = await resolveTagIds(input.tags);
    await prisma.postTag.deleteMany({ where: { postId: id } });
    if (tagIds.length) {
      await prisma.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId: id, tagId })),
      });
    }
  }

  // เก็บ revision ทุกครั้งที่เนื้อหาเปลี่ยน แล้วตัดให้เหลือ 20 อันล่าสุด
  if (input.contentJson !== undefined) {
    await prisma.postRevision.create({
      data: {
        postId: id,
        title: post.title,
        contentJson: input.contentJson as Prisma.InputJsonValue,
        savedById: userId,
      },
    });

    const old = await prisma.postRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
      skip: MAX_REVISIONS,
      select: { id: true },
    });
    if (old.length) {
      await prisma.postRevision.deleteMany({
        where: { id: { in: old.map((r) => r.id) } },
      });
    }
  }

  return post;
}

export async function publishPost(id: string, publishAt?: string | null) {
  const post = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, contentHtml: true },
  });
  if (!post) return null;

  if (!post.contentHtml.trim()) {
    throw new Error("บทความยังไม่มีเนื้อหา เขียนอะไรสักหน่อยก่อนเผยแพร่");
  }

  const when = publishAt ? new Date(publishAt) : new Date();
  const isFuture = when.getTime() > Date.now() + 60_000;

  return prisma.post.update({
    where: { id },
    data: {
      status: isFuture ? ContentStatus.SCHEDULED : ContentStatus.PUBLISHED,
      publishedAt: when,
    },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
}

export async function unpublishPost(id: string) {
  return prisma.post.update({
    where: { id },
    data: { status: ContentStatus.DRAFT },
    select: { id: true, slug: true, status: true },
  });
}

/** ลงถังขยะ — ยังกู้คืนได้ ไม่ได้ลบจริง */
export async function softDeletePost(id: string) {
  return prisma.post.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}
