"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

export function ProjectRowActions({
  id,
  isFeatured,
  isFirst,
  isLast,
}: {
  id: string;
  isFeatured: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [featured, setFeatured] = useState(isFeatured);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) startTransition(() => router.refresh());
    return res.ok;
  }

  async function toggleFeatured() {
    const next = !featured;
    setFeatured(next); // เปลี่ยนหน้าจอก่อนเลย จะได้ไม่รู้สึกหน่วง
    const okay = await patch({ isFeatured: next });
    if (!okay) setFeatured(!next); // พลาดก็คืนค่าเดิม
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={toggleFeatured}
        title={featured ? "เอาออกจากหน้าแรก" : "ปักหมุดขึ้นหน้าแรก"}
        aria-label={featured ? "เอาออกจากหน้าแรก" : "ปักหมุดขึ้นหน้าแรก"}
        aria-pressed={featured}
        className={`rounded p-1.5 transition hover:bg-surface-2 ${
          featured ? "text-amber-300" : "text-text-muted"
        }`}
      >
        <Star className={`size-4 ${featured ? "fill-current" : ""}`} />
      </button>

      <button
        type="button"
        onClick={() => void patch({ move: "up" })}
        disabled={isFirst || pending}
        title="เลื่อนขึ้น"
        aria-label="เลื่อนขึ้น"
        className="rounded p-1.5 text-text-muted transition hover:bg-surface-2 disabled:opacity-25"
      >
        <ChevronUp className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => void patch({ move: "down" })}
        disabled={isLast || pending}
        title="เลื่อนลง"
        aria-label="เลื่อนลง"
        className="rounded p-1.5 text-text-muted transition hover:bg-surface-2 disabled:opacity-25"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
