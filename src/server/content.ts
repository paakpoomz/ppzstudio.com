import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/enums";
import { focalPosition, mediaUrl } from "@/lib/image";

export const POSTS_PER_PAGE = 12;

// บทความที่คนทั่วไปเห็นได้: เผยแพร่แล้ว ยังไม่ถูกลบ และถึงเวลาแล้วจริง ๆ
// (เผื่อ cron ที่เปลี่ยน SCHEDULED → PUBLISHED ยังไม่ทันทำงาน)
function publicPostWhere() {
  return {
    deletedAt: null,
    status: ContentStatus.PUBLISHED,
    publishedAt: { lte: new Date() },
  };
}

const postCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  readingMinutes: true,
  viewCount: true,
  category: { select: { slug: true, name: true } },
  cover: { select: { path: true, blurData: true, altText: true, focalX: true, focalY: true } },
} as const;

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  viewCount: number;
  category: { slug: string; name: string } | null;
  coverUrl: string | null;
  coverAlt: string | null;
  coverPosition: string;
};

function toCard(p: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  viewCount: number;
  category: { slug: string; name: string } | null;
  cover: {
    path: string;
    blurData: string | null;
    altText: string | null;
    focalX: number;
    focalY: number;
  } | null;
}): PostCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    readingMinutes: p.readingMinutes,
    viewCount: p.viewCount,
    category: p.category,
    coverUrl: p.cover ? mediaUrl(p.cover.path, 800) : null,
    coverAlt: p.cover?.altText ?? null,
    coverPosition: focalPosition(p.cover),
  };
}

export async function listPublishedPosts(options: {
  page?: number;
  categorySlug?: string;
  tagSlug?: string;
  take?: number;
} = {}) {
  const page = options.page ?? 1;
  const take = options.take ?? POSTS_PER_PAGE;

  const where = {
    ...publicPostWhere(),
    ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    ...(options.tagSlug
      ? { tags: { some: { tag: { slug: options.tagSlug } } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * take,
      take,
      select: postCardSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items: rows.map(toCard),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / take)),
    hasMore: page * take < total,
  };
}

export async function getPublishedPost(slug: string) {
  const post = await prisma.post.findFirst({
    where: { slug, ...publicPostWhere() },
    include: {
      category: { select: { slug: true, name: true } },
      cover: true,
      author: { select: { name: true } },
      tags: { include: { tag: { select: { slug: true, name: true } } } },
    },
  });
  if (!post) return null;

  return {
    ...post,
    coverUrl: post.cover ? mediaUrl(post.cover.path, 1600) : null,
    coverPosition: focalPosition(post.cover),
    ogImageUrl: post.cover ? mediaUrl(post.cover.path) : null,
  };
}

/** บทความที่เกี่ยวข้อง — หมวดเดียวกันก่อน ถ้าไม่พอค่อยเติมด้วยเรื่องล่าสุด */
export async function getRelatedPosts(post: {
  id: string;
  categoryId: string | null;
}) {
  const sameCategory = post.categoryId
    ? await prisma.post.findMany({
        where: {
          ...publicPostWhere(),
          categoryId: post.categoryId,
          NOT: { id: post.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: postCardSelect,
      })
    : [];

  if (sameCategory.length >= 3) return sameCategory.map(toCard);

  const filler = await prisma.post.findMany({
    where: {
      ...publicPostWhere(),
      NOT: { id: { in: [post.id, ...sameCategory.map((p) => p.id)] } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3 - sameCategory.length,
    select: postCardSelect,
  });

  return [...sameCategory, ...filler].map(toCard);
}

export async function listCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      _count: { select: { posts: { where: publicPostWhere() } } },
    },
  });

  return categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    count: c._count.posts,
  }));
}

export async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true },
  });
}

export async function getTag(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    select: { slug: true, name: true },
  });
}

// ─────────────────────────────── ผลงาน ───────────────────────────────

function publicProjectWhere() {
  return { deletedAt: null, status: ContentStatus.PUBLISHED };
}

const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  kind: true,
  clientName: true,
  year: true,
  cover: { select: { path: true, blurData: true, altText: true, focalX: true, focalY: true } },
  techs: { select: { tech: { select: { slug: true, name: true } } } },
} as const;

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  clientName: string | null;
  year: number | null;
  coverUrl: string | null;
  coverAlt: string | null;
  coverPosition: string;
  techs: { slug: string; name: string }[];
};

function toProjectCard(p: {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  clientName: string | null;
  year: number | null;
  cover: {
    path: string;
    blurData: string | null;
    altText: string | null;
    focalX: number;
    focalY: number;
  } | null;
  techs: { tech: { slug: string; name: string } }[];
}): ProjectCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    kind: p.kind,
    clientName: p.clientName,
    year: p.year,
    coverUrl: p.cover ? mediaUrl(p.cover.path, 800) : null,
    coverAlt: p.cover?.altText ?? null,
    coverPosition: focalPosition(p.cover),
    techs: p.techs.map((t) => t.tech),
  };
}

export async function listPublishedProjects(options: {
  kind?: string;
  techSlug?: string;
  featuredOnly?: boolean;
  take?: number;
} = {}) {
  const rows = await prisma.project.findMany({
    where: {
      ...publicProjectWhere(),
      ...(options.kind ? { kind: options.kind as never } : {}),
      ...(options.featuredOnly ? { isFeatured: true } : {}),
      ...(options.techSlug
        ? { techs: { some: { tech: { slug: options.techSlug } } } }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { publishedAt: "desc" }],
    take: options.take,
    select: projectCardSelect,
  });

  return rows.map(toProjectCard);
}

export async function getPublishedProject(slug: string) {
  const project = await prisma.project.findFirst({
    where: { slug, ...publicProjectWhere() },
    include: {
      cover: true,
      techs: { include: { tech: true } },
      gallery: {
        orderBy: { sortOrder: "asc" },
        include: { media: true },
      },
    },
  });
  if (!project) return null;

  return {
    ...project,
    coverUrl: project.cover ? mediaUrl(project.cover.path, 1600) : null,
    coverPosition: focalPosition(project.cover),
    gallery: project.gallery.map((g) => ({
      id: g.id,
      caption: g.caption,
      url: mediaUrl(g.media.path, 800),
      fullUrl: mediaUrl(g.media.path),
      alt: g.media.altText ?? "",
      width: g.media.width,
      height: g.media.height,
    })),
  };
}

/** เทคที่ถูกใช้จริงในผลงานที่เผยแพร่แล้ว — ไว้ทำตัวกรอง */
export async function listUsedTechs() {
  const techs = await prisma.tech.findMany({
    where: { projects: { some: { project: publicProjectWhere() } } },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return techs;
}

// ─────────────────────────────── ตั้งค่าเว็บ ───────────────────────────────

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, unknown> = {};
  for (const row of rows) map[row.key] = row.valueJson;

  const str = (key: string, fallback = "") =>
    typeof map[key] === "string" ? (map[key] as string) : fallback;
  const num = (key: string, fallback = 0) =>
    typeof map[key] === "number" ? (map[key] as number) : fallback;

  return {
    siteTitle: str("site.title", "PPz Studio"),
    tagline: str("site.tagline"),
    description: str("site.description"),
    heroHeading: str("hero.heading"),
    heroSubheading: str("hero.subheading"),
    email: str("contact.email", "contact@ppzstudio.com"),
    phone: str("contact.phone"),
    responseTime: str("contact.response_time"),
    facebook: str("social.facebook"),
    youtube: str("social.youtube"),
    line: str("social.line"),
    years: num("stats.years"),
    projectCount: num("stats.projects"),
    clientCount: num("stats.clients"),
  };
}

export type SiteSettings = Awaited<ReturnType<typeof getSettings>>;

// ─────────────────────────────── ค้นหา ───────────────────────────────

/**
 * ค้นหาบทความและผลงาน
 *
 * ใช้ LIKE ไม่ใช่ FULLTEXT เพราะ MariaDB ไม่มี ngram parser (มีแต่ใน MySQL)
 * และ FULLTEXT ปกติตัดคำด้วยช่องว่าง — ภาษาไทยไม่เว้นวรรคระหว่างคำจึงหาไม่เจอเลย
 * ทดสอบแล้ว: MATCH…AGAINST('ไลฟ์') คืน 0 แถว ส่วน LIKE '%ไลฟ์%' คืนถูกต้อง
 *
 * เว็บขนาดหลักร้อยบทความ LIKE เร็วพอสบาย ถ้าวันหนึ่งช้าค่อยขยับไป
 * Meilisearch หรือ Manticore ที่ตัดคำไทยได้
 */
export async function searchContent(rawQuery: string) {
  const q = rawQuery.trim().slice(0, 100);
  if (q.length < 2) return { posts: [], projects: [], query: q };

  const [posts, projects] = await Promise.all([
    prisma.post.findMany({
      where: {
        ...publicPostWhere(),
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { contentHtml: { contains: q } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: postCardSelect,
    }),
    prisma.project.findMany({
      where: {
        ...publicProjectWhere(),
        OR: [
          { title: { contains: q } },
          { summary: { contains: q } },
          { clientName: { contains: q } },
          { contentHtml: { contains: q } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }],
      take: 12,
      select: projectCardSelect,
    }),
  ]);

  return {
    query: q,
    posts: posts.map(toCard),
    projects: projects.map(toProjectCard),
  };
}
