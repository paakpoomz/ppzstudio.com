import { prisma } from "@/lib/db";
import { formatThaiDateTime } from "@/lib/date";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "border-primary/40 bg-primary/10 text-primary" },
  READ: { label: "อ่านแล้ว", className: "border-line bg-surface-2 text-text-muted" },
  REPLIED: {
    label: "ตอบแล้ว",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  SPAM: { label: "สแปม", className: "border-line bg-surface-2 text-text-muted" },
};

export default async function MessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">ข้อความติดต่อ</h1>
      <p className="mt-1 text-sm text-text-muted">
        {messages.length} ข้อความล่าสุด · กด reply ในอีเมลตอบกลับได้เลย
        เพราะระบบตั้ง Reply-To เป็นอีเมลผู้ส่งไว้แล้ว
      </p>

      {messages.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-text-muted">
          ยังไม่มีใครส่งข้อความเข้ามา
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((m) => {
            const style = STATUS_LABELS[m.status] ?? STATUS_LABELS.READ;
            return (
              <li
                key={m.id}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {m.email}
                  </a>
                  {m.phone ? (
                    <span className="font-mono text-xs text-text-muted">
                      {m.phone}
                    </span>
                  ) : null}
                  <span
                    className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>

                <p className="mt-1 font-mono text-xs text-text-muted tabular-nums">
                  {formatThaiDateTime(m.createdAt)}
                  {m.service ? ` · ${m.service}` : ""}
                  {m.budgetRange ? ` · ${m.budgetRange}` : ""}
                  {` · อ้างอิง ${m.id.slice(-8).toUpperCase()}`}
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm text-text-muted">
                  {m.message}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
