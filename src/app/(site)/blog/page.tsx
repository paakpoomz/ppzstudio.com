import type { Metadata } from "next";
import Link from "next/link";
import { PostGrid } from "@/components/site/PostGrid";
import { listCategoriesWithCounts, listPublishedPosts } from "@/server/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "บทความ",
  description:
    "บทความเรื่องการทำสื่อดิจิทัล ถ่ายทอดสด และพัฒนาเว็บไซต์ จากประสบการณ์ทำงานจริงของ PPz Studio",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [result, categories] = await Promise.all([
    listPublishedPosts({ page }),
    listCategoriesWithCounts(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          บทความ
        </h1>
        <p className="mt-2 text-text-muted">
          {result.total > 0
            ? `${result.total} เรื่อง จากงานที่ทำจริง`
            : "กำลังทยอยเขียน เร็ว ๆ นี้"}
        </p>
      </header>

      <nav aria-label="หมวดหมู่" className="mt-8 flex flex-wrap gap-2">
        <span className="rounded-full border border-primary bg-primary/10 px-3.5 py-1.5 text-sm text-primary">
          ทั้งหมด
        </span>
        {categories
          .filter((c) => c.count > 0)
          .map((c) => (
            <Link
              key={c.slug}
              href={`/blog/category/${c.slug}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-text-muted transition hover:border-primary/40 hover:text-text"
            >
              {c.name}
              <span className="ml-1.5 font-mono text-xs tabular-nums opacity-60">
                {c.count}
              </span>
            </Link>
          ))}
      </nav>

      <div className="mt-8">
        <PostGrid
          posts={result.items}
          page={result.page}
          totalPages={result.totalPages}
          basePath="/blog"
          emptyMessage="ยังไม่มีบทความเผยแพร่ กลับมาดูใหม่เร็ว ๆ นี้นะ"
        />
      </div>
    </div>
  );
}
