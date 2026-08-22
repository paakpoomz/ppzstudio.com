import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/site/PostGrid";
import { getCategory, listPublishedPosts } from "@/server/content";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "ไม่พบหมวดหมู่" };

  return {
    title: category.name,
    description:
      category.description ?? `บทความในหมวด ${category.name} จาก PPz Studio`,
    alternates: { canonical: `/blog/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/blog/category/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);

  const category = await getCategory(slug);
  if (!category) notFound();

  const result = await listPublishedPosts({ page, categorySlug: slug });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <nav aria-label="เส้นทาง" className="mb-4 text-sm text-text-muted">
        <Link href="/blog" className="hover:text-text">
          บทความ
        </Link>
        <span className="mx-2" aria-hidden>
          ›
        </span>
        <span className="text-text">{category.name}</span>
      </nav>

      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-text-muted">{category.description}</p>
        ) : null}
        <p className="mt-1 font-mono text-xs text-text-muted tabular-nums">
          {result.total} เรื่อง
        </p>
      </header>

      <div className="mt-8">
        <PostGrid
          posts={result.items}
          page={result.page}
          totalPages={result.totalPages}
          basePath={`/blog/category/${slug}`}
          emptyMessage={`ยังไม่มีบทความในหมวด ${category.name}`}
        />
      </div>
    </div>
  );
}
