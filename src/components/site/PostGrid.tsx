import Link from "next/link";
import { PostCard } from "@/components/site/PostCard";
import type { PostCard as PostCardData } from "@/server/content";

export function PostGrid({
  posts,
  page,
  totalPages,
  basePath,
  emptyMessage,
}: {
  posts: PostCardData[];
  page: number;
  totalPages: number;
  basePath: string;
  emptyMessage: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
        <p className="text-text-muted">{emptyMessage}</p>
        <Link
          href="/blog"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          ดูบทความทั้งหมด →
        </Link>
      </div>
    );
  }

  // บทความแรกของหน้าแรกได้พื้นที่ใหญ่กว่าเพื่อน
  const [first, ...rest] = posts;
  const showFeatured = page === 1 && posts.length > 2;

  const pageHref = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);

  return (
    <>
      {showFeatured ? (
        <>
          <PostCard post={first} featured priority />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} priority={i < 3} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="แบ่งหน้า"
          className="mt-10 flex items-center justify-between gap-4"
        >
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-line px-4 py-2 text-sm transition hover:border-primary/50"
            >
              ← ก่อนหน้า
            </Link>
          ) : (
            <span />
          )}

          <span className="font-mono text-xs text-text-muted tabular-nums">
            หน้า {page} จาก {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg border border-line px-4 py-2 text-sm transition hover:border-primary/50"
            >
              ถัดไป →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
