import Link from "next/link";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/enums";
import { NewPostButton } from "@/components/admin/NewPostButton";
import { StatusPill } from "@/components/admin/StatusPill";
import { formatThaiDateTime } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [drafts, published, scheduled, mediaCount, newMessages, recent] =
    await Promise.all([
      prisma.post.count({ where: { status: ContentStatus.DRAFT, deletedAt: null } }),
      prisma.post.count({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
      }),
      prisma.post.count({
        where: { status: ContentStatus.SCHEDULED, deletedAt: null },
      }),
      prisma.media.count(),
      prisma.contactMessage.count({ where: { status: "NEW" } }),
      prisma.post.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      }),
    ]);

  const stats = [
    { label: "ร่างที่ค้างไว้", value: drafts, href: "/admin/posts?status=DRAFT" },
    { label: "เผยแพร่แล้ว", value: published, href: "/admin/posts?status=PUBLISHED" },
    { label: "ตั้งเวลาไว้", value: scheduled, href: "/admin/posts?status=SCHEDULED" },
    { label: "รูปในคลัง", value: mediaCount, href: "/admin/media" },
    { label: "ข้อความใหม่", value: newMessages, href: "/admin/messages" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">ภาพรวม</h1>
        <NewPostButton />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-line bg-surface px-4 py-3 transition hover:border-primary/50"
          >
            <dt className="text-sm text-text-muted">{s.label}</dt>
            <dd className="mt-1 font-mono text-2xl tabular-nums">{s.value}</dd>
          </Link>
        ))}
      </dl>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">แก้ไขล่าสุด</h2>
          <Link href="/admin/posts" className="text-sm text-primary">
            ดูทั้งหมด →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-text-muted">
            ยังไม่มีบทความ — กด &ldquo;เขียนบทความใหม่&rdquo; เพื่อเริ่มเรื่องแรก
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {recent.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1 truncate">{post.title}</span>
                  <StatusPill status={post.status} />
                  <span className="hidden font-mono text-xs text-text-muted sm:block">
                    {formatThaiDateTime(post.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
