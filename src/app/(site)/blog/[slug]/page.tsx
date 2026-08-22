import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/enums";
import { getPublishedPost, getRelatedPosts, getSettings } from "@/server/content";
import { buildToc } from "@/lib/toc";
import { formatThaiDate } from "@/lib/date";
import { PostCard } from "@/components/site/PostCard";
import {
  CopyLinkButton,
  ReadingProgress,
  TableOfContents,
  ViewCounter,
} from "@/components/site/ArticleAside";

export const revalidate = 300;
// slug ที่ยังไม่ถูก pre-render ตอน build ให้สร้างสดครั้งแรกแล้ว cache ไว้
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: ContentStatus.PUBLISHED, deletedAt: null },
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "ไม่พบบทความ" };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.ogImageUrl ? [{ url: post.ogImageUrl }] : undefined,
    },
    twitter: {
      card: post.ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;

  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const [related, settings] = await Promise.all([
    getRelatedPosts({ id: post.id, categoryId: post.categoryId }),
    getSettings(),
  ]);

  const { html, toc } = buildToc(post.contentHtml);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ppzstudio.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt ?? undefined,
        image: post.ogImageUrl ? `${siteUrl}${post.ogImageUrl}` : undefined,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { "@type": "Person", name: post.author.name },
        publisher: { "@type": "Organization", name: settings.siteTitle },
        mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
        inLanguage: "th-TH",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "หน้าแรก", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "บทความ",
            item: `${siteUrl}/blog`,
          },
          { "@type": "ListItem", position: 3, name: post.title },
        ],
      },
    ],
  };

  return (
    <>
      <ReadingProgress />
      <ViewCounter slug={post.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-6xl px-6 py-12">
        <nav aria-label="เส้นทาง" className="mb-6 text-sm text-text-muted">
          <Link href="/blog" className="hover:text-text">
            บทความ
          </Link>
          {post.category ? (
            <>
              <span className="mx-2" aria-hidden>
                ›
              </span>
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="hover:text-text"
              >
                {post.category.name}
              </Link>
            </>
          ) : null}
        </nav>

        <header className="max-w-3xl">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-[2.75rem]">
            {post.title}
          </h1>

          <p className="mt-4 flex flex-wrap items-center gap-x-2 font-mono text-sm text-text-muted tabular-nums">
            <span>{post.author.name}</span>
            <span aria-hidden>·</span>
            {post.publishedAt ? (
              <time dateTime={post.publishedAt.toISOString()}>
                {formatThaiDate(post.publishedAt)}
              </time>
            ) : null}
            <span aria-hidden>·</span>
            <span>อ่าน {post.readingMinutes} นาที</span>
          </p>
        </header>

        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverUrl}
            alt={post.cover?.altText ?? ""}
            width={post.cover?.width}
            height={post.cover?.height}
            fetchPriority="high"
            className="mt-8 w-full rounded-xl border border-line"
          />
        ) : null}

        <div className="mt-10 gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]">
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <aside className="mt-12 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <TableOfContents items={toc} />
              <div className="mt-6">
                <CopyLinkButton />
              </div>
            </div>
          </aside>
        </div>

        {post.tags.length > 0 ? (
          <ul className="mt-12 flex flex-wrap gap-2">
            {post.tags.map(({ tag }) => (
              <li key={tag.slug}>
                <Link
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded-full border border-line px-3 py-1 text-sm text-text-muted transition hover:border-primary/40 hover:text-text"
                >
                  #{tag.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      {related.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="font-display text-xl font-semibold">อ่านต่อ</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
