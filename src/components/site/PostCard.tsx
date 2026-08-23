import Link from "next/link";
import { formatThaiDate } from "@/lib/date";
import type { PostCard as PostCardData } from "@/server/content";

export function PostCard({
  post,
  featured = false,
  priority = false,
}: {
  post: PostCardData;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-xl border border-line bg-surface transition hover:border-primary/40 ${
        featured ? "sm:grid sm:grid-cols-2" : ""
      }`}
    >
      {/* ลิงก์รูปชี้ที่เดียวกับลิงก์หัวข้อข้างล่าง — ซ่อนจากโปรแกรมอ่านหน้าจอ
          และตัดออกจากลำดับ tab ไม่งั้นผู้ใช้คีย์บอร์ดต้องกด tab ผ่านลิงก์ซ้ำสองครั้ง
          และผู้ใช้ screen reader จะได้ยินแค่คำว่า "ลิงก์" ที่ไม่บอกอะไรเลย */}
      <Link
        href={`/blog/${post.slug}`}
        className="block"
        aria-hidden
        tabIndex={-1}
      >
        <div className="relative aspect-video overflow-hidden bg-surface-2">
          {post.coverUrl ? (
            // ใช้ <img> ตรง ๆ เพราะรูปถูกย่อและแปลง WebP ไว้ตั้งแต่ตอนอัปโหลดแล้ว
            // ไม่ต้องให้ next/image มาแปลงซ้ำและกิน CPU ของ Node
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverUrl}
              alt={post.coverAlt ?? ""}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              style={{ objectPosition: post.coverPosition }}
              className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10">
              <span className="font-display text-3xl font-bold text-text-muted/30">
                PPz
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className={`p-5 ${featured ? "sm:flex sm:flex-col sm:justify-center" : ""}`}>
        {post.category ? (
          <Link
            href={`/blog/category/${post.category.slug}`}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary"
          >
            {post.category.name}
          </Link>
        ) : null}

        <h3
          className={`mt-2 font-semibold leading-snug ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm text-text-muted">
            {post.excerpt}
          </p>
        ) : null}

        <p className="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-xs text-text-muted tabular-nums">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()}>
              {formatThaiDate(post.publishedAt)}
            </time>
          ) : null}
          <span aria-hidden>·</span>
          <span>อ่าน {post.readingMinutes} นาที</span>
          {post.viewCount > 0 ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.viewCount.toLocaleString("th-TH")} ครั้ง</span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
