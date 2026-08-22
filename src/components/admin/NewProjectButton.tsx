"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export function NewProjectButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);

    // ต้องมี body เสมอ — OpenLiteSpeed ตีกลับ POST ที่ไม่มี Content-Length
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    if (!res.ok) {
      setBusy(false);
      setError("สร้างผลงานใหม่ไม่สำเร็จ ลองอีกครั้ง");
      return;
    }

    const draft = (await res.json()) as { id: string };
    router.push(`/admin/works/${draft.id}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={create}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        เพิ่มผลงาน
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
