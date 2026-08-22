"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenLine } from "lucide-react";

export function NewPostButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);

    // ต้องส่ง body เสมอ แม้จะไม่มีข้อมูลอะไร — OpenLiteSpeed ตีกลับ 400
    // ให้ POST/PATCH ที่ไม่มี Content-Length ตั้งแต่ยังไม่ถึง Node
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    if (!res.ok) {
      setBusy(false);
      setError("สร้างบทความใหม่ไม่สำเร็จ ลองอีกครั้ง");
      return;
    }

    const draft = (await res.json()) as { id: string };
    router.push(`/admin/posts/${draft.id}`);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={create}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PenLine className="size-4" />
        )}
        เขียนบทความใหม่
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
