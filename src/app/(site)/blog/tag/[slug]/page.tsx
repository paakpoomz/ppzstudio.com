import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/site/PostGrid";
import { getTag, listPublishedPosts } from "@/server/content";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/blog/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return { title: "ไม่พบแท็ก" };

  return {
    title: `#${tag.name}`,
    description: `บทความที่ติดแท็ก ${tag.name} จาก PPz Studio`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
    // หน้าแท็กเนื้อหาซ้ำกับหน้าหมวด ปล่อยให้ Google เก็บลิงก์ต่อได้แต่ไม่ต้อง index
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: PageProps<"/blog/tag/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);

  const tag = await getTag(slug);
  if (!tag) notFound();

  const result = await listPublishedPosts({ page, tagSlug: slug });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <nav aria-label="เส้นทาง" className="mb-4 text-sm text-text-muted">
        <Link href="/blog" className="hover:text-text">
          บทความ
        </Link>
        <span className="mx-2" aria-hidden>
          ›
        </span>
        <span className="text-text">#{tag.name}</span>
      </nav>

      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          #{tag.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-text-muted tabular-nums">
          {result.total} เรื่อง
        </p>
      </header>

      <div className="mt-8">
        <PostGrid
          posts={result.items}
          page={result.page}
          totalPages={result.totalPages}
          basePath={`/blog/tag/${slug}`}
          emptyMessage={`ยังไม่มีบทความที่ติดแท็ก ${tag.name}`}
        />
      </div>
    </div>
  );
}
