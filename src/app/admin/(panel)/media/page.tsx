import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/image";
import { formatThaiDate } from "@/lib/date";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage() {
  const [items, total] = await Promise.all([
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.media.count(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold">คลังรูป</h1>
      <p className="mt-1 text-sm text-text-muted">
        {total} รูป · อัปโหลดจากหน้าเขียนบทความได้เลย ระบบย่อและแปลงเป็น WebP ให้อัตโนมัติ
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-text-muted">
          ยังไม่มีรูปในคลัง — ลากรูปไปวางในหน้าเขียนบทความ แล้วรูปจะมาโผล่ที่นี่
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li
              key={m.id}
              className="overflow-hidden rounded-lg border border-line bg-surface"
            >
              <a href={mediaUrl(m.path)} target="_blank" rel="noopener">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(m.path, 400)}
                  alt={m.altText ?? m.filename}
                  loading="lazy"
                  className="aspect-[4/3] w-full bg-surface-2 object-cover"
                />
              </a>
              <div className="px-3 py-2">
                <p className="truncate text-xs" title={m.filename}>
                  {m.filename}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-text-muted tabular-nums">
                  {m.width}×{m.height} · {formatBytes(m.bytes)}
                </p>
                <p className="font-mono text-[11px] text-text-muted">
                  {formatThaiDate(m.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
