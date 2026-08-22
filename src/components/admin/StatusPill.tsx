import type { ContentStatus } from "@/generated/prisma/enums";

const STYLES: Record<ContentStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "ร่าง",
    className: "bg-surface-2 text-text-muted border-line",
  },
  SCHEDULED: {
    label: "ตั้งเวลา",
    className: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  PUBLISHED: {
    label: "เผยแพร่แล้ว",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
  ARCHIVED: {
    label: "เก็บเข้าคลัง",
    className: "bg-surface-2 text-text-muted border-line",
  },
};

export function StatusPill({ status }: { status: ContentStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${style.className}`}
    >
      {style.label}
    </span>
  );
}
