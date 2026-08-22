import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/enums";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ppzstudio.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, categories] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        publishedAt: { lte: new Date() },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { status: ContentStatus.PUBLISHED, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/works`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/contact`, changeFrequency: "monthly", priority: 0.7 },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE}/blog/category/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((p) => ({
      url: `${SITE}/works/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
