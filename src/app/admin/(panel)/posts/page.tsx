import Link from "next/link";
import { adminListSchema, listPostsForAdmin } from "@/server/posts";
import { NewPostButton } from "@/components/admin/NewPostButton";
import { StatusPill } from "@/components/admin/StatusPill";
import { formatThaiDateTime } from "@/lib/date";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "SCHEDULED", label: "ตั้งเวลา" },
  { value: "PUBLISHED", label: "เผยแพร่แล้ว" },
  { value: "ARCHIVED", label: "เก็บเข้าคลัง" },
];

export default async function PostsPage({
  searchParams,
}: PageProps<"/admin/posts">) {
  // Next 16: searchParams เป็น Promise
  const raw = await searchParams;
  const input = adminListSchema.parse({
    status: raw.status ?? "ALL",
    q: raw.q,
    page: raw.page ?? 1,
  });

  const { items, total, page, hasMore } = await listPostsForAdmin(input);

  const buildHref = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status: input.status, q: input.q, page: input.page, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "ALL" && !(k === "page" && v === 1)) params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/admin/posts?${qs}` : "/admin/posts";
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">บทความ</h1>
          <p className="mt-1 text-sm text-text-muted">
            ทั้งหมด {total} เรื่อง
          </p>
        </div>
        <NewPostButton />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref({ status: f.value, page: 1 })}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              input.status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-text-muted hover:border-primary/40 hover:text-text"
            }`}
          >
            {f.label}
          </Link>
        ))}

        <form action="/admin/posts" className="ml-auto flex gap-2">
          {input.status !== "ALL" ? (
            <input type="hidden" name="status" value={input.status} />
          ) : null}
          <input
            type="search"
            name="q"
            defaultValue={input.q ?? ""}
            placeholder="ค้นหาหัวข้อหรือ slug"
            className="w-52 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg border border-line px-3 py-1.5 text-sm transition hover:border-primary/50"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-text-muted">
          {input.q
            ? `ไม่พบบทความที่ตรงกับ "${input.q}" — ลองคำอื่นหรือดูหมวดอื่นดู`
            : "ยังไม่มีบทความในกลุ่มนี้"}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {items.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/posts/${post.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 basis-full truncate font-medium sm:basis-auto">
                  {post.title}
                </span>
                {post.category ? (
                  <span className="shrink-0 text-xs text-text-muted">
                    {post.category.name}
                  </span>
                ) : null}
                <StatusPill status={post.status} />
                <span className="shrink-0 font-mono text-xs text-text-muted tabular-nums">
                  {post.viewCount} อ่าน
                </span>
                <span className="shrink-0 font-mono text-xs text-text-muted">
                  {formatThaiDateTime(post.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={buildHref({ page: page - 1 })} className="text-sm text-primary">
              ← ก่อนหน้า
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-text-muted">หน้า {page}</span>
          {hasMore ? (
            <Link href={buildHref({ page: page + 1 })} className="text-sm text-primary">
              ถัดไป →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
